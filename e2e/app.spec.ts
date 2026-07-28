import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

test("demo class completes the diagnostic and reteach flow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /See what your class actually misunderstands/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load demo class" }).click();
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Analyze class/i }).click();
  await expect(
    page.getByRole("heading", { name: /revealing a pattern/i }),
  ).toBeVisible();
  await expect(page.getByText("Rule-grounded demo")).toBeVisible();
  await expect(page.getByText("Misconception map")).toBeVisible();
  const topMisconceptionCard = page
    .getByText("Top misconception")
    .locator("..")
    .locator("..");
  await expect(topMisconceptionCard).toContainText("3");
  await expect(topMisconceptionCard).toContainText(
    "Heavier = more force",
  );

  await page.getByRole("button", { name: /Maya/i }).click();
  const feedback = page.getByLabel(/Feedback draft/i);
  await expect(feedback).toBeVisible();
  await feedback.fill(
    "You connected force to mass. Now compare the two forces in one interaction.",
  );
  await page.getByRole("button", { name: "Approve draft" }).click();
  await expect(
    page.getByRole("button", { name: /Feedback approved locally/i }),
  ).toBeVisible();

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export feedback/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(
    "misconception-radar-collision-feedback.csv",
  );
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const exportedCsv = await readFile(downloadPath!, "utf8");
  expect(exportedCsv.charCodeAt(0)).toBe(0xfeff);
  expect(exportedCsv).toContain(
    "You connected force to mass. Now compare the two forces in one interaction.",
  );
  expect(
    exportedCsv
      .split(/\r?\n/)
      .find((row) => row.includes('"Maya"')),
  ).toContain('"true"');

  await page
    .getByRole("button", { name: /Generate 5-minute plan/i })
    .click();
  await expect(page.getByText("Learning objective")).toBeVisible();
  await expect(page.getByText("Exit ticket", { exact: true })).toBeVisible();
});

test("a valid CSV stays anonymous through analysis and teacher review", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "class.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "student_id,student_name,response",
        'S-10,Ada,"The truck exerts more force because it has much more mass."',
        'S-11,Ben,"They exert equal forces in opposite directions on each other."',
      ].join("\n"),
    ),
  });

  await expect(page.getByText("Ada", { exact: true })).toBeVisible();
  await expect(page.getByText("Responses ready")).toBeVisible();
  await expect(
    page.getByText("The truck exerts more force because"),
  ).toBeVisible();

  const analyzeRequestPromise = page.waitForRequest("**/api/analyze");
  await page.getByRole("button", { name: /Analyze class/i }).click();
  const analyzeRequest = await analyzeRequestPromise;
  expect(analyzeRequest.postDataJSON()).toEqual({
    templateId: "collision",
    submissions: [
      {
        studentId: "S-10",
        response:
          "The truck exerts more force because it has much more mass.",
      },
      {
        studentId: "S-11",
        response:
          "They exert equal forces in opposite directions on each other.",
      },
    ],
  });

  await expect(page.getByText("Misconception map")).toBeVisible();
  await page.getByRole("button", { name: /Ada/i }).click();
  const studentPanel = page.getByRole("complementary");
  await expect(studentPanel.getByText("Original response")).toBeVisible();
  await expect(
    studentPanel
      .getByText(
        /The truck exerts more force because it has much more mass\./,
      )
      .first(),
  ).toBeVisible();
  await expect(
    studentPanel.getByText(/Evidence: “The truck exerts more force/i),
  ).toBeVisible();

  const feedback = page.getByLabel(/Feedback draft/i);
  await feedback.fill(
    "Compare the two forces in this single interaction, then explain the different accelerations.",
  );
  await page.getByRole("button", { name: "Approve draft" }).click();
  await expect(
    page.getByRole("button", { name: /Feedback approved locally/i }),
  ).toBeVisible();
});

test("a teacher can define and analyze a custom exit ticket", async ({
  page,
}) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: /Custom exit ticket/i })
    .click();

  const analyzeButton = page.getByRole("button", {
    name: /Analyze class/i,
  });
  await expect(
    page.getByText("Build your exit ticket"),
  ).toBeVisible();
  await expect(analyzeButton).toBeDisabled();

  await page
    .getByLabel("Assignment title")
    .fill("Energy transfer");
  await page
    .getByLabel("Question", { exact: true })
    .fill("A cart rolls down a ramp. Explain how its energy changes.");
  await page
    .getByLabel("Reference answer")
    .fill(
      "Gravitational potential energy decreases while kinetic energy increases; total energy is conserved.",
    );

  const lookFors = [
    "Identifies gravitational potential energy",
    "Identifies kinetic energy",
    "Describes an energy transfer",
    "States that total energy is conserved",
  ];
  for (const [index, lookFor] of lookFors.entries()) {
    await page.getByLabel(`Look-for ${index + 1}`).fill(lookFor);
  }

  const incorrectIdeas = [
    "Energy disappears as the cart moves",
    "The cart creates new energy",
    "Only kinetic energy exists on the ramp",
  ];
  for (const [index, incorrectIdea] of incorrectIdeas.entries()) {
    await page
      .getByLabel(`Common incorrect idea ${index + 1}`)
      .fill(incorrectIdea);
  }

  await expect(page.getByText("Ready", { exact: true })).toBeVisible();
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "custom-class.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "student_id,student_name,response",
        'C-01,Ada,"The cart speeds up because its energy disappears as it moves."',
      ].join("\n"),
    ),
  });

  const analyzeRequestPromise = page.waitForRequest("**/api/analyze");
  await analyzeButton.click();
  const requestBody = (
    await analyzeRequestPromise
  ).postDataJSON() as {
    templateId: string;
    customTemplate: { title: string };
    submissions: Array<Record<string, string>>;
  };

  expect(requestBody.templateId).toBe("custom");
  expect(requestBody.customTemplate.title).toBe("Energy transfer");
  expect(requestBody.submissions).toEqual([
    {
      studentId: "C-01",
      response:
        "The cart speeds up because its energy disappears as it moves.",
    },
  ]);
  expect(JSON.stringify(requestBody)).not.toContain("Ada");

  await expect(page.getByText("Misconception map")).toBeVisible();
  await expect(
    page.getByText("Energy disappears as the cart moves").first(),
  ).toBeVisible();
  await expect(page.getByText("Review", { exact: true }).first()).toBeVisible();
});

test("an invalid CSV reports actionable errors and preserves setup", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(["id,name,answer", "1,Ada,Answer"].join("\n")),
  });

  await expect(
    page.getByRole("alert").filter({ hasText: "Check the CSV" }),
  ).toContainText("Missing required columns");
  await expect(
    page.getByRole("heading", { name: "Add class responses" }),
  ).toBeVisible();
});

test("sample snapshot is explicitly labeled", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Use sample snapshot" })
    .click();

  await expect(page.getByText("Sample snapshot", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/This is not a live model result/i),
  ).toBeVisible();
});

test("an analysis outage preserves responses and offers the labeled fallback", async ({
  page,
}) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "The analysis service is unavailable. Your responses are still in the browser.",
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Load demo class" }).click();
  await page.getByRole("button", { name: /Analyze class/i }).click();

  const alert = page
    .getByRole("alert")
    .filter({ hasText: "Analysis paused" });
  await expect(alert).toContainText("Analysis paused");
  await expect(alert).toContainText(
    "Your responses are still in the browser",
  );
  await expect(page.getByText("Responses ready")).toBeVisible();
  await expect(page.getByText("Maya", { exact: true })).toBeVisible();

  await alert
    .getByRole("button", {
      name: "Use the clearly labeled sample snapshot",
    })
    .click();
  await expect(page.getByText("Sample snapshot", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/This is not a live model result/i),
  ).toBeVisible();
});

test("the core demo remains usable at a 390px mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /See what your class actually misunderstands/i,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "Load demo class" }).click();
  await expect(page.getByText("Responses ready")).toBeVisible();
  await page.getByRole("button", { name: /Analyze class/i }).click();

  await expect(page.getByText("Misconception map")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Generate 5-minute plan/i }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
