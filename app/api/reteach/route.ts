import { NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  reteachModelOutputSchema,
  reteachRequestSchema,
} from "@/lib/domain/schemas";
import { getTemplate } from "@/lib/domain/templates";
import { getAnalysisProvider } from "@/lib/providers";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();

  try {
    const payload = reteachRequestSchema.parse(await request.json());
    const template =
      payload.templateId === "custom"
        ? payload.customTemplate!
        : getTemplate(payload.templateId);
    const misconception = template.misconceptions.find(
      (item) => item.id === payload.misconceptionId,
    );

    if (!misconception) {
      return NextResponse.json(
        {
          error: "That misconception is not part of this assignment.",
          requestId,
        },
        { status: 400 },
      );
    }

    const provider = await getAnalysisProvider();
    const rawPlan = await provider.generateReteach(
      template,
      misconception,
      payload.representativeResponses,
    );
    const plan = reteachModelOutputSchema.parse(rawPlan);
    const durationMs = Math.round(performance.now() - startedAt);

    console.info(
      JSON.stringify({
        event: "reteach_plan_completed",
        requestId,
        provider: provider.kind,
        misconceptionId: misconception.id,
        durationMs,
      }),
    );

    return NextResponse.json({
      ...plan,
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
    console.error(
      JSON.stringify({
        event: "reteach_plan_failed",
        requestId,
        errorType: error instanceof ZodError ? "validation" : "provider",
        durationMs,
      }),
    );

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "The reteach request could not be validated.",
          details: error.issues.map((issue) => issue.message),
          requestId,
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        error: "The reteach plan could not be generated right now.",
        requestId,
      },
      { status: 503 },
    );
  }
}
