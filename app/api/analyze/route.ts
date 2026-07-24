import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  AnalysisIntegrityError,
  buildClassSummary,
  validateStudentAnalyses,
} from "@/lib/domain/analysis";
import { analyzeRequestSchema } from "@/lib/domain/schemas";
import { getTemplate } from "@/lib/domain/templates";
import { getAnalysisProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 150_000) {
      return NextResponse.json(
        {
          error: "Request too large.",
          requestId,
        },
        { status: 413 },
      );
    }

    const payload = analyzeRequestSchema.parse(await request.json());
    const template = getTemplate(payload.templateId);
    const provider = await getAnalysisProvider();
    const rawAnalyses = await provider.analyze(
      template,
      payload.submissions,
    );
    const students = validateStudentAnalyses(
      template,
      payload.submissions,
      rawAnalyses,
    );
    const summary = buildClassSummary(template, students);
    const durationMs = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        event: "class_analysis_completed",
        requestId,
        provider: provider.kind,
        rowCount: payload.submissions.length,
        durationMs,
      }),
    );

    return NextResponse.json({
      students,
      summary,
      metadata: {
        provider: provider.kind,
        model: provider.model,
        durationMs,
        requestId,
        isSampleSnapshot: false,
      },
    });
  } catch (error) {
    const durationMs = Math.round(performance.now() - startedAt);
    const errorType =
      error instanceof ZodError
        ? "validation"
        : error instanceof AnalysisIntegrityError
          ? "integrity"
          : "provider";

    console.error(
      JSON.stringify({
        event: "class_analysis_failed",
        requestId,
        errorType,
        durationMs,
      }),
    );

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Check the submitted class data and try again.",
          details: error.issues.map((issue) => issue.message),
          requestId,
        },
        { status: 400 },
      );
    }

    if (error instanceof AnalysisIntegrityError) {
      return NextResponse.json(
        {
          error:
            "The analysis failed an evidence check. No feedback was returned.",
          requestId,
        },
        { status: 502 },
      );
    }

    return NextResponse.json(
      {
        error:
          "The analysis service is unavailable. Your responses are still in the browser.",
        requestId,
      },
      { status: 503 },
    );
  }
}
