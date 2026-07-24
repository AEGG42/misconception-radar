import { NextResponse } from "next/server";

import {
  buildClassSummary,
  validateStudentAnalyses,
} from "@/lib/domain/analysis";
import { anonymizeRecords } from "@/lib/domain/csv";
import { getDemoClass } from "@/lib/domain/demo-data";
import { sampleRequestSchema } from "@/lib/domain/schemas";
import { getTemplate } from "@/lib/domain/templates";
import { DeterministicAnalysisProvider } from "@/lib/providers/deterministic-provider";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const payload = sampleRequestSchema.parse(await request.json());
    const template = getTemplate(payload.templateId);
    const submissions = anonymizeRecords(
      getDemoClass(payload.templateId),
    );
    const provider = new DeterministicAnalysisProvider();
    const rawAnalyses = await provider.analyze(template, submissions);
    const students = validateStudentAnalyses(
      template,
      submissions,
      rawAnalyses,
    );
    const durationMs = Math.round(performance.now() - startedAt);

    return NextResponse.json({
      students,
      summary: buildClassSummary(template, students),
      metadata: {
        provider: "sample-snapshot",
        model: "fixed-synthetic-snapshot-v1",
        durationMs,
        requestId,
        isSampleSnapshot: true,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: "The sample snapshot could not be loaded.",
        requestId,
      },
      { status: 500 },
    );
  }
}
