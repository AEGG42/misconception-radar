const defaultProductionUrl =
  "https://misconception-radar-july-ai-2026.aegg42.chatgpt.site";
const configuredUrl =
  process.env.PRODUCTION_URL?.trim() || defaultProductionUrl;
const expectedProvider = process.env.EXPECTED_PROVIDER?.trim();

let baseUrl;
try {
  const parsed = new URL(configuredUrl);
  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Only HTTP(S) production URLs are supported.");
  }
  parsed.pathname = parsed.pathname.replace(/\/+$/, "");
  baseUrl = parsed.toString().replace(/\/$/, "");
} catch (error) {
  throw new Error(
    `Invalid PRODUCTION_URL: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

async function request(pathname, options = {}) {
  const response = await fetch(`${baseUrl}${pathname}`, {
    ...options,
    signal: AbortSignal.timeout(60_000),
  });
  const body = await response.text();

  if (!response.ok) {
    throw new Error(
      `${options.method ?? "GET"} ${pathname} returned ${response.status}: ${body.slice(0, 240)}`,
    );
  }

  return { response, body };
}

function parseJson(body, pathname) {
  try {
    return JSON.parse(body);
  } catch {
    throw new Error(`${pathname} did not return valid JSON.`);
  }
}

const homepage = await request("/");
if (!homepage.body.includes("Misconception Radar")) {
  throw new Error("The production homepage is missing the product name.");
}

const analysisRequest = {
  templateId: "collision",
  submissions: [
    {
      studentId: "PRODUCTION-SMOKE-01",
      response:
        "The forces are equal in magnitude and opposite in direction because they are one interaction.",
    },
  ],
};
const analysisResult = await request("/api/analyze", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(analysisRequest),
});
const analysis = parseJson(analysisResult.body, "/api/analyze");

if (analysis.students?.length !== 1) {
  throw new Error("The analysis endpoint did not return exactly one student.");
}
if (!analysis.students[0]?.evidenceQuotes?.length) {
  throw new Error("The analysis endpoint returned no evidence quote.");
}
if (JSON.stringify(analysis).includes("studentName")) {
  throw new Error("The anonymous analysis response exposed a student name field.");
}
if (
  expectedProvider &&
  analysis.metadata?.provider !== expectedProvider
) {
  throw new Error(
    `Expected provider ${expectedProvider}, received ${analysis.metadata?.provider ?? "unknown"}.`,
  );
}

const reteachRequest = {
  templateId: "collision",
  misconceptionId: "heavier-more-force",
  representativeResponses: [
    "The truck exerts more force because it has more mass.",
  ],
};
const reteachResult = await request("/api/reteach", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(reteachRequest),
});
const reteach = parseJson(reteachResult.body, "/api/reteach");

if (reteach.misconceptionId !== reteachRequest.misconceptionId) {
  throw new Error("The reteach endpoint returned the wrong misconception.");
}
if (reteach.steps?.length !== 3 || !reteach.exitTicket) {
  throw new Error("The reteach endpoint returned an incomplete plan.");
}
if (reteach.metadata?.provider !== analysis.metadata?.provider) {
  throw new Error("The analysis and reteach endpoints used different providers.");
}

console.log(
  JSON.stringify(
    {
      productionUrl: baseUrl,
      homepageStatus: homepage.response.status,
      analyzeStatus: analysisResult.response.status,
      reteachStatus: reteachResult.response.status,
      provider: analysis.metadata.provider,
      studentCount: analysis.students.length,
      evidenceCount: analysis.students[0].evidenceQuotes.length,
      reteachStepCount: reteach.steps.length,
    },
    null,
    2,
  ),
);
