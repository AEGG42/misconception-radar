import { z } from "zod";

export const templateIdSchema = z.enum([
  "collision",
  "book-at-rest",
  "elevator",
]);

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
    submissions: z
      .array(anonymousSubmissionSchema)
      .min(1, "Add at least one student response.")
      .max(20, "This demo supports up to 20 responses at a time."),
  })
  .superRefine(({ submissions }, ctx) => {
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

export const reteachRequestSchema = z.object({
  templateId: templateIdSchema,
  misconceptionId: z.string().min(1).max(80),
  representativeResponses: z
    .array(z.string().trim().min(1).max(1000))
    .min(1)
    .max(3),
});

export const sampleRequestSchema = z.object({
  templateId: z.literal("collision"),
});
