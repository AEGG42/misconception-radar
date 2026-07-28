import { z } from "zod";

export const builtInTemplateIdSchema = z.enum([
  "collision",
  "book-at-rest",
  "elevator",
]);

export const templateIdSchema = z.union([
  builtInTemplateIdSchema,
  z.literal("custom"),
]);

const rubricCriterionInputSchema = z.object({
  id: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  description: z.string().trim().min(1).max(320),
  points: z.literal(1),
});

const misconceptionInputSchema = z.object({
  id: z.string().trim().min(1).max(80),
  shortLabel: z.string().trim().min(1).max(48),
  label: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(420),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
  reteachMove: z.string().trim().min(1).max(420),
});

export const customAssignmentTemplateSchema = z
  .object({
    id: z.literal("custom"),
    eyebrow: z.string().trim().min(1).max(80),
    title: z.string().trim().min(1).max(120),
    question: z.string().trim().min(1).max(1200),
    referenceAnswer: z.string().trim().min(1).max(1600),
    teacherNote: z.string().trim().max(500),
    rubric: z.array(rubricCriterionInputSchema).length(4),
    misconceptions: z
      .array(misconceptionInputSchema)
      .min(2)
      .max(5),
  })
  .superRefine((template, ctx) => {
    const rubricIds = template.rubric.map((item) => item.id);
    if (new Set(rubricIds).size !== rubricIds.length) {
      ctx.addIssue({
        code: "custom",
        message: "Rubric criterion IDs must be unique.",
        path: ["rubric"],
      });
    }

    const misconceptionIds = template.misconceptions.map(
      (item) => item.id,
    );
    if (
      new Set(misconceptionIds).size !== misconceptionIds.length
    ) {
      ctx.addIssue({
        code: "custom",
        message: "Misconception IDs must be unique.",
        path: ["misconceptions"],
      });
    }
  });

export const anonymousSubmissionSchema = z.object({
  studentId: z
    .string()
    .trim()
    .min(1, "Student ID is required.")
    .max(64, "Student ID must be 64 characters or fewer."),
  response: z
    .string()
    .trim()
    .min(1, "Every student needs a response.")
    .max(1000, "Responses must be 1,000 characters or fewer."),
});

export const analyzeRequestSchema = z
  .object({
    templateId: templateIdSchema,
    customTemplate: customAssignmentTemplateSchema.optional(),
    submissions: z
      .array(anonymousSubmissionSchema)
      .min(1, "Add at least one student response.")
      .max(20, "This demo supports up to 20 responses at a time."),
  })
  .superRefine(({ templateId, customTemplate, submissions }, ctx) => {
    if (templateId === "custom" && !customTemplate) {
      ctx.addIssue({
        code: "custom",
        message: "A complete custom assignment is required.",
        path: ["customTemplate"],
      });
    }
    if (templateId !== "custom" && customTemplate) {
      ctx.addIssue({
        code: "custom",
        message: "Custom assignment data is only allowed for a custom template.",
        path: ["customTemplate"],
      });
    }

    const seen = new Set<string>();
    submissions.forEach((submission, index) => {
      const normalizedId = submission.studentId.toLowerCase();
      if (seen.has(normalizedId)) {
        ctx.addIssue({
          code: "custom",
          message: `Duplicate student ID: ${submission.studentId}`,
          path: ["submissions", index, "studentId"],
        });
      }
      seen.add(normalizedId);
    });
  });

export const rubricBreakdownSchema = z.object({
  criterionId: z.string().min(1),
  label: z.string().min(1).max(120),
  earned: z.number().int().min(0).max(1),
  max: z.literal(1),
  reason: z.string().min(1).max(320),
});

export const studentAnalysisSchema = z.object({
  studentId: z.string().min(1).max(64),
  primaryMisconceptionId: z.string().min(1).nullable(),
  secondaryMisconceptionIds: z.array(z.string().min(1)).max(3),
  rubricScore: z.number().int().min(0).max(4),
  rubricBreakdown: z.array(rubricBreakdownSchema).length(4),
  evidenceQuotes: z.array(z.string().min(1).max(260)).max(3),
  confidence: z.enum(["high", "medium", "low"]),
  needsReview: z.boolean(),
  feedbackDraft: z.string().min(1).max(700),
  probingQuestion: z.string().min(1).max(320),
});

export const modelAnalysisSchema = z.object({
  students: z.array(studentAnalysisSchema).min(1).max(20),
});

export const reteachStepSchema = z.object({
  minute: z.string().min(1).max(24),
  title: z.string().min(1).max(80),
  teacherMove: z.string().min(1).max(420),
  studentMove: z.string().min(1).max(320),
});

export const reteachModelOutputSchema = z.object({
  misconceptionId: z.string().min(1),
  objective: z.string().min(1).max(280),
  openingLine: z.string().min(1).max(280),
  steps: z.array(reteachStepSchema).length(3),
  exitTicket: z.string().min(1).max(420),
  answerKey: z.string().min(1).max(420),
  lookFor: z.string().min(1).max(320),
});

export const reteachRequestSchema = z
  .object({
    templateId: templateIdSchema,
    customTemplate: customAssignmentTemplateSchema.optional(),
    misconceptionId: z.string().min(1).max(80),
    representativeResponses: z
      .array(z.string().trim().min(1).max(1000))
      .min(1)
      .max(3),
  })
  .superRefine(({ templateId, customTemplate }, ctx) => {
    if (templateId === "custom" && !customTemplate) {
      ctx.addIssue({
        code: "custom",
        message: "A complete custom assignment is required.",
        path: ["customTemplate"],
      });
    }
    if (templateId !== "custom" && customTemplate) {
      ctx.addIssue({
        code: "custom",
        message: "Custom assignment data is only allowed for a custom template.",
        path: ["customTemplate"],
      });
    }
  });

export const sampleRequestSchema = z.object({
  templateId: z.literal("collision"),
});
