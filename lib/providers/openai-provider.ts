import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";

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

export class OpenAIAnalysisProvider implements AnalysisProvider {
  readonly kind = "openai" as const;
  readonly model = process.env.OPENAI_MODEL || "gpt-5.6-terra";

  private readonly client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: 45_000,
    maxRetries: 0,
  });

  async analyze(
    template: AssignmentTemplate,
    submissions: AnonymousSubmission[],
  ): Promise<StudentAnalysis[]> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.client.responses.parse({
          model: this.model,
          input: [
            { role: "system", content: ANALYSIS_SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify(
                buildAnalysisInput(template, submissions),
              ),
            },
          ],
          text: {
            format: zodTextFormat(modelAnalysisSchema, "class_analysis"),
          },
        });

        if (!response.output_parsed) {
          throw new Error("The model did not return a parsed analysis.");
        }
        return response.output_parsed.students;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("The live analysis provider failed.");
  }

  async generateReteach(
    template: AssignmentTemplate,
    misconception: MisconceptionDefinition,
    representativeResponses: string[],
  ): Promise<Omit<ReteachPlan, "metadata">> {
    let lastError: unknown;

    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const response = await this.client.responses.parse({
          model: this.model,
          input: [
            { role: "system", content: RETEACH_SYSTEM_PROMPT },
            {
              role: "user",
              content: JSON.stringify(
                buildReteachInput(
                  template,
                  misconception,
                  representativeResponses,
                ),
              ),
            },
          ],
          text: {
            format: zodTextFormat(
              reteachModelOutputSchema,
              "reteach_plan",
            ),
          },
        });

        if (!response.output_parsed) {
          throw new Error("The model did not return a parsed reteach plan.");
        }
        return response.output_parsed;
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("The live reteach provider failed.");
  }
}
