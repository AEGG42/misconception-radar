import OpenAI from "openai";
import { z } from "zod";

import {
  modelAnalysisSchema,
  reteachModelOutputSchema,
} from "@/lib/domain/schemas";
import type {
  AnalysisProvider,
  AnonymousSubmission,
  AssignmentTemplate,
  MisconceptionDefinition,
  ReteachPlan,
  StudentAnalysis,
} from "@/lib/domain/types";
import {
  ANALYSIS_SYSTEM_PROMPT,
  buildAnalysisInput,
  buildReteachInput,
  RETEACH_SYSTEM_PROMPT,
} from "@/lib/providers/provider-prompts";

const DEEPSEEK_BASE_URL = "https://api.deepseek.com";

const ANALYSIS_EXAMPLE = {
  students: [
    {
      studentId: "S-01",
      primaryMisconceptionId: null,
      secondaryMisconceptionIds: [],
      rubricScore: 4,
      rubricBreakdown: [
        {
          criterionId: "criterion-1",
          label: "Criterion label",
          earned: 1,
          max: 1,
          reason: "Brief evidence-based reason.",
        },
        {
          criterionId: "criterion-2",
          label: "Criterion label",
          earned: 1,
          max: 1,
          reason: "Brief evidence-based reason.",
        },
        {
          criterionId: "criterion-3",
          label: "Criterion label",
          earned: 1,
          max: 1,
          reason: "Brief evidence-based reason.",
        },
        {
          criterionId: "criterion-4",
          label: "Criterion label",
          earned: 1,
          max: 1,
          reason: "Brief evidence-based reason.",
        },
      ],
      evidenceQuotes: ["Exact quote copied from the response."],
      confidence: "high",
      needsReview: false,
      feedbackDraft: "One productive element and one next step.",
      probingQuestion: "One concise question?",
    },
  ],
};

const RETEACH_EXAMPLE = {
  misconceptionId: "supplied-misconception-id",
  objective: "Observable learning objective.",
  openingLine: "Short teacher opening.",
  steps: [
    {
      minute: "0:00–1:00",
      title: "Surface",
      teacherMove: "Teacher action.",
      studentMove: "Student action.",
    },
    {
      minute: "1:00–3:30",
      title: "Rebuild",
      teacherMove: "Teacher action.",
      studentMove: "Student action.",
    },
    {
      minute: "3:30–5:00",
      title: "Commit",
      teacherMove: "Teacher action.",
      studentMove: "Student action.",
    },
  ],
  exitTicket: "A short exit-ticket prompt.",
  answerKey: "A concise answer key.",
  lookFor: "What the teacher should look for.",
};

function jsonInstructions<T>(
  schemaName: string,
  schema: z.ZodType<T>,
  example: unknown,
) {
  return `Return JSON only. The response must be one JSON object matching the supplied format.

JSON schema name: ${schemaName}
JSON schema:
${JSON.stringify(z.toJSONSchema(schema))}

Example JSON shape:
${JSON.stringify(example)}

Use the real IDs, labels, evidence, and content from the user payload rather than copying example values.`;
}

export class DeepSeekAnalysisProvider implements AnalysisProvider {
  readonly kind = "deepseek" as const;
  readonly model =
    process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  private readonly client: OpenAI;

  constructor(client?: OpenAI) {
    this.client =
      client ??
      new OpenAI({
        apiKey: process.env.DEEPSEEK_API_KEY,
        baseURL: DEEPSEEK_BASE_URL,
        timeout: 45_000,
        maxRetries: 0,
      });
  }

  private async requestJson<T>(
    systemPrompt: string,
    input: unknown,
    schemaName: string,
    schema: z.ZodType<T>,
    example: unknown,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const request = {
          model: this.model,
          messages: [
            {
              role: "system" as const,
              content: `${systemPrompt}\n\n${jsonInstructions(
                schemaName,
                schema,
                example,
              )}`,
            },
            {
              role: "user" as const,
              content: JSON.stringify(input),
            },
          ],
          response_format: { type: "json_object" as const },
          max_tokens: 8_000,
          temperature: 0,
          thinking: { type: "disabled" as const },
        };
        const response =
          await this.client.chat.completions.create(request);
        const content = response.choices[0]?.message.content;

        if (!content) {
          throw new Error("DeepSeek returned empty JSON content.");
        }

        return schema.parse(JSON.parse(content));
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("The DeepSeek provider failed.");
  }

  async analyze(
    template: AssignmentTemplate,
    submissions: AnonymousSubmission[],
  ): Promise<StudentAnalysis[]> {
    const result = await this.requestJson(
      ANALYSIS_SYSTEM_PROMPT,
      buildAnalysisInput(template, submissions),
      "class_analysis",
      modelAnalysisSchema,
      ANALYSIS_EXAMPLE,
    );
    return result.students;
  }

  async generateReteach(
    template: AssignmentTemplate,
    misconception: MisconceptionDefinition,
    representativeResponses: string[],
  ): Promise<Omit<ReteachPlan, "metadata">> {
    return this.requestJson(
      RETEACH_SYSTEM_PROMPT,
      buildReteachInput(
        template,
        misconception,
        representativeResponses,
      ),
      "reteach_plan",
      reteachModelOutputSchema,
      RETEACH_EXAMPLE,
    );
  }
}
