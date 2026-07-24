import { studentAnalysisSchema } from "@/lib/domain/schemas";
import type {
  AnonymousSubmission,
  AssignmentTemplate,
  ClassSummary,
  StudentAnalysis,
} from "@/lib/domain/types";

export class AnalysisIntegrityError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AnalysisIntegrityError";
  }
}

function normalizeForComparison(value: string): string {
  return value
    .normalize("NFKC")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function quoteExistsInResponse(
  quote: string,
  response: string,
): boolean {
  return normalizeForComparison(response).includes(
    normalizeForComparison(quote),
  );
}

export function validateStudentAnalyses(
  template: AssignmentTemplate,
  submissions: AnonymousSubmission[],
  rawAnalyses: unknown[],
): StudentAnalysis[] {
  if (rawAnalyses.length !== submissions.length) {
    throw new AnalysisIntegrityError(
      "The analysis did not return exactly one result for each student.",
    );
  }

  const responseById = new Map(
    submissions.map((submission) => [
      submission.studentId,
      submission.response,
    ]),
  );
  const allowedMisconceptions = new Set(
    template.misconceptions.map((item) => item.id),
  );
  const seen = new Set<string>();

  return rawAnalyses.map((rawAnalysis) => {
    const parsed = studentAnalysisSchema.parse(rawAnalysis);
    const response = responseById.get(parsed.studentId);

    if (!response) {
      throw new AnalysisIntegrityError(
        `Unknown student ID returned: ${parsed.studentId}`,
      );
    }
    if (seen.has(parsed.studentId)) {
      throw new AnalysisIntegrityError(
        `Duplicate student ID returned: ${parsed.studentId}`,
      );
    }
    seen.add(parsed.studentId);

    const misconceptionIds = [
      parsed.primaryMisconceptionId,
      ...parsed.secondaryMisconceptionIds,
    ].filter((id): id is string => Boolean(id));

    misconceptionIds.forEach((id) => {
      if (!allowedMisconceptions.has(id)) {
        throw new AnalysisIntegrityError(
          `Unknown misconception ID returned: ${id}`,
        );
      }
    });

    parsed.evidenceQuotes.forEach((quote) => {
      if (!quoteExistsInResponse(quote, response)) {
        throw new AnalysisIntegrityError(
          `Evidence for ${parsed.studentId} was not found in the original response.`,
        );
      }
    });

    const rubricCriterionIds = new Set(
      template.rubric.map((criterion) => criterion.id),
    );
    if (
      parsed.rubricBreakdown.some(
        (item) => !rubricCriterionIds.has(item.criterionId),
      )
    ) {
      throw new AnalysisIntegrityError(
        `The analysis returned an unknown rubric criterion for ${parsed.studentId}.`,
      );
    }

    const earnedScore = parsed.rubricBreakdown.reduce(
      (total, item) => total + item.earned,
      0,
    );
    if (earnedScore !== parsed.rubricScore) {
      throw new AnalysisIntegrityError(
        `Rubric score mismatch for ${parsed.studentId}.`,
      );
    }

    return parsed;
  });
}

export function buildClassSummary(
  template: AssignmentTemplate,
  analyses: StudentAnalysis[],
): ClassSummary {
  const countById = new Map<
    string,
    { count: number; studentIds: string[] }
  >(
    template.misconceptions.map((misconception) => [
      misconception.id,
      { count: 0, studentIds: [] },
    ]),
  );

  analyses.forEach((analysis) => {
    if (!analysis.primaryMisconceptionId) {
      return;
    }
    const item = countById.get(analysis.primaryMisconceptionId);
    if (item) {
      item.count += 1;
      item.studentIds.push(analysis.studentId);
    }
  });

  const misconceptionCounts = template.misconceptions
    .map((misconception) => ({
      id: misconception.id,
      label: misconception.label,
      shortLabel: misconception.shortLabel,
      color: misconception.color,
      count: countById.get(misconception.id)?.count ?? 0,
      studentIds: countById.get(misconception.id)?.studentIds ?? [],
    }))
    .sort((a, b) => b.count - a.count);

  const averageScore =
    analyses.length === 0
      ? 0
      : analyses.reduce((total, analysis) => total + analysis.rubricScore, 0) /
        analyses.length;
  const mastered = analyses.filter(
    (analysis) => analysis.rubricScore >= 3,
  ).length;
  const topMisconception = misconceptionCounts.find(
    (misconception) => misconception.count > 0,
  );

  return {
    averageScore: Number(averageScore.toFixed(1)),
    masteryRate:
      analyses.length === 0
        ? 0
        : Math.round((mastered / analyses.length) * 100),
    needsReviewCount: analyses.filter((analysis) => analysis.needsReview)
      .length,
    topMisconceptionId: topMisconception?.id ?? null,
    misconceptionCounts,
  };
}

export function representativeResponsesFor(
  misconceptionId: string,
  analyses: StudentAnalysis[],
  submissions: AnonymousSubmission[],
): string[] {
  const responseById = new Map(
    submissions.map((submission) => [
      submission.studentId,
      submission.response,
    ]),
  );

  return analyses
    .filter(
      (analysis) => analysis.primaryMisconceptionId === misconceptionId,
    )
    .map((analysis) => responseById.get(analysis.studentId))
    .filter((response): response is string => Boolean(response))
    .slice(0, 3);
}
