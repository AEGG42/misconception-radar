import { describe, expect, it } from "vitest";

import { templates } from "@/lib/domain/templates";
import type { TemplateId } from "@/lib/domain/types";
import { DeterministicAnalysisProvider } from "@/lib/providers/deterministic-provider";

export interface EvaluationCase {
  templateId: TemplateId;
  response: string;
  expectedMisconception: string | null;
  expectedScore: number;
}

export const evaluationCases: EvaluationCase[] = [
  {
    templateId: "collision",
    response:
      "The truck exerts greater force because the truck has more mass.",
    expectedMisconception: "heavier-more-force",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "The heavier vehicle creates more force, so the truck pushes harder.",
    expectedMisconception: "heavier-more-force",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "The faster car hits harder and therefore exerts the greater force.",
    expectedMisconception: "motion-more-force",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "Whichever vehicle is moving faster gives the other one more force.",
    expectedMisconception: "motion-more-force",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "The car applies the action first, then the reaction comes from the truck.",
    expectedMisconception: "action-before-reaction",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "The truck pushes only after the car makes the first action force.",
    expectedMisconception: "action-before-reaction",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "The forces are equal and opposite, so they cancel and neither accelerates.",
    expectedMisconception: "third-law-forces-cancel",
    expectedScore: 2,
  },
  {
    templateId: "collision",
    response:
      "The two forces cancel each other because Newton's third law says opposite.",
    expectedMisconception: "third-law-forces-cancel",
    expectedScore: 1,
  },
  {
    templateId: "collision",
    response:
      "Only the car exerts force because the truck does not push back.",
    expectedMisconception: "one-sided-interaction",
    expectedScore: 0,
  },
  {
    templateId: "collision",
    response:
      "They exert equal forces in opposite directions on each other. The car accelerates more because it has less mass.",
    expectedMisconception: null,
    expectedScore: 4,
  },
  {
    templateId: "book-at-rest",
    response: "There are no forces because the book is still at rest.",
    expectedMisconception: "no-motion-no-force",
    expectedScore: 0,
  },
  {
    templateId: "book-at-rest",
    response: "The book is not moving, so no force acts on it.",
    expectedMisconception: "no-motion-no-force",
    expectedScore: 0,
  },
  {
    templateId: "book-at-rest",
    response:
      "The normal force from the table is the reaction to the weight.",
    expectedMisconception: "normal-is-reaction",
    expectedScore: 3,
  },
  {
    templateId: "book-at-rest",
    response:
      "The table is the third law reaction force to gravity on the book.",
    expectedMisconception: "normal-is-reaction",
    expectedScore: 3,
  },
  {
    templateId: "book-at-rest",
    response: "Only gravity acts on the book.",
    expectedMisconception: "gravity-only",
    expectedScore: 1,
  },
  {
    templateId: "book-at-rest",
    response: "Gravity is the only force but the solid table blocks motion.",
    expectedMisconception: "gravity-only",
    expectedScore: 1,
  },
  {
    templateId: "book-at-rest",
    response:
      "The table's support force is greater than weight to hold the book up.",
    expectedMisconception: "support-greater",
    expectedScore: 2,
  },
  {
    templateId: "book-at-rest",
    response:
      "The normal force is larger than gravity, otherwise the book would fall.",
    expectedMisconception: "support-greater",
    expectedScore: 2,
  },
  {
    templateId: "book-at-rest",
    response: "An upward force keeps the book still at rest.",
    expectedMisconception: "force-keeps-rest",
    expectedScore: 0,
  },
  {
    templateId: "book-at-rest",
    response:
      "Gravity pulls down and the table's normal force pushes up equally, so net force is zero; they are not a third-law pair.",
    expectedMisconception: null,
    expectedScore: 4,
  },
  {
    templateId: "elevator",
    response:
      "Tension is greater than weight because the elevator is moving upward.",
    expectedMisconception: "moving-up-net-force-up",
    expectedScore: 2,
  },
  {
    templateId: "elevator",
    response:
      "The upward force is larger because it is going up at constant speed.",
    expectedMisconception: "moving-up-net-force-up",
    expectedScore: 0,
  },
  {
    templateId: "elevator",
    response:
      "The elevator has acceleration because it has upward velocity.",
    expectedMisconception: "constant-speed-has-acceleration",
    expectedScore: 0,
  },
  {
    templateId: "elevator",
    response:
      "Anything moving upward is accelerating upward even at constant speed.",
    expectedMisconception: "constant-speed-has-acceleration",
    expectedScore: 0,
  },
  {
    templateId: "elevator",
    response:
      "There are no forces because it has zero acceleration.",
    expectedMisconception: "no-acceleration-no-force",
    expectedScore: 1,
  },
  {
    templateId: "elevator",
    response:
      "No acceleration means zero forces are acting on the elevator.",
    expectedMisconception: "no-acceleration-no-force",
    expectedScore: 0,
  },
  {
    templateId: "elevator",
    response:
      "Gravity no longer matters once the elevator starts moving upward.",
    expectedMisconception: "weight-disappears",
    expectedScore: 0,
  },
  {
    templateId: "elevator",
    response:
      "The elevator has no weight during motion because the cable supports it.",
    expectedMisconception: "weight-disappears",
    expectedScore: 1,
  },
  {
    templateId: "elevator",
    response: "Tension keeps it moving upward at the same speed.",
    expectedMisconception: "tension-equals-motion",
    expectedScore: 1,
  },
  {
    templateId: "elevator",
    response:
      "Tension equals weight. Constant speed means zero acceleration and zero net force.",
    expectedMisconception: null,
    expectedScore: 4,
  },
];

describe("30-case deterministic evaluation set", () => {
  it("meets the misconception and rubric acceptance targets", async () => {
    const provider = new DeterministicAnalysisProvider();
    let labelMatches = 0;
    let scoreWithinOne = 0;

    for (const [index, testCase] of evaluationCases.entries()) {
      const [result] = await provider.analyze(
        templates[testCase.templateId],
        [
          {
            studentId: `eval-${index}`,
            response: testCase.response,
          },
        ],
      );

      if (
        result.primaryMisconceptionId ===
        testCase.expectedMisconception
      ) {
        labelMatches += 1;
      }
      if (Math.abs(result.rubricScore - testCase.expectedScore) <= 1) {
        scoreWithinOne += 1;
      }
    }

    const labelAccuracy = labelMatches / evaluationCases.length;
    const scoreTolerance = scoreWithinOne / evaluationCases.length;

    expect(evaluationCases).toHaveLength(30);
    expect(labelAccuracy).toBeGreaterThanOrEqual(0.85);
    expect(scoreTolerance).toBeGreaterThanOrEqual(0.9);
  });
});
