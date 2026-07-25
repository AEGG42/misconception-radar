import { describe, expect, it } from "vitest";

import {
  AnalysisIntegrityError,
  buildClassSummary,
  quoteExistsInResponse,
  validateStudentAnalyses,
} from "@/lib/domain/analysis";
import { templates } from "@/lib/domain/templates";
import type { StudentAnalysis } from "@/lib/domain/types";

function analysis(
  overrides: Partial<StudentAnalysis> = {},
): StudentAnalysis {
  return {
    studentId: "S-01",
    primaryMisconceptionId: "heavier-more-force",
    secondaryMisconceptionIds: [],
    rubricScore: 0,
    rubricBreakdown: templates.collision.rubric.map((criterion) => ({
      criterionId: criterion.id,
      label: criterion.label,
      earned: 0,
      max: 1 as const,
      reason: "Not yet shown.",
    })),
    evidenceQuotes: ["The truck exerts more force"],
    confidence: "high",
    needsReview: false,
    feedbackDraft: "Revisit the interaction pair.",
    probingQuestion: "Which object does each force act on?",
    ...overrides,
  };
}

describe("analysis integrity", () => {
  it("normalizes whitespace and case when verifying evidence", () => {
    expect(
      quoteExistsInResponse(
        "THE truck exerts more force",
        "The  truck exerts more force because it has more mass.",
      ),
    ).toBe(true);
  });

  it("rejects evidence that was not present in the response", () => {
    expect(() =>
      validateStudentAnalyses(
        templates.collision,
        [
          {
            studentId: "S-01",
            response: "The truck exerts more force because it is heavier.",
          },
        ],
        [analysis({ evidenceQuotes: ["This sentence was invented."] })],
      ),
    ).toThrow(AnalysisIntegrityError);
  });

  it("rejects unknown misconception IDs", () => {
    expect(() =>
      validateStudentAnalyses(
        templates.collision,
        [
          {
            studentId: "S-01",
            response: "The truck exerts more force because it is heavier.",
          },
        ],
        [
          analysis({
            primaryMisconceptionId: "invented-label",
          }),
        ],
      ),
    ).toThrow("Unknown misconception ID");
  });

  it("derives the rubric score from the validated breakdown", () => {
    const [validated] = validateStudentAnalyses(
      templates.collision,
      [
        {
          studentId: "S-01",
          response: "The truck exerts more force because it is heavier.",
        },
      ],
      [analysis({ rubricScore: 4 })],
    );

    expect(validated.rubricScore).toBe(0);
  });

  it("computes counts and mastery from student-level results", () => {
    const second = analysis({
      studentId: "S-02",
      primaryMisconceptionId: null,
      rubricScore: 4,
      rubricBreakdown: templates.collision.rubric.map((criterion) => ({
        criterionId: criterion.id,
        label: criterion.label,
        earned: 1,
        max: 1 as const,
        reason: "Shown.",
      })),
      evidenceQuotes: ["Equal forces"],
    });
    const summary = buildClassSummary(templates.collision, [
      analysis(),
      second,
    ]);

    expect(summary.averageScore).toBe(2);
    expect(summary.masteryRate).toBe(50);
    expect(summary.topMisconceptionId).toBe("heavier-more-force");
    expect(summary.misconceptionCounts[0].count).toBe(1);
  });
});
