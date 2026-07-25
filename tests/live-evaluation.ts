import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { validateStudentAnalyses } from "@/lib/domain/analysis";
import { reteachModelOutputSchema } from "@/lib/domain/schemas";
import { templates } from "@/lib/domain/templates";
import type { TemplateId } from "@/lib/domain/types";
import { getAnalysisProvider } from "@/lib/providers";
import { evaluationCases } from "@/tests/evaluation.test";

const templateIds: TemplateId[] = [
  "collision",
  "book-at-rest",
  "elevator",
];
const runCount = 3;

function roundMetric(value: number) {
  return Math.round(value * 10_000) / 10_000;
}

describe("live provider evaluation", () => {
  it("meets the acceptance gates across three complete runs", async () => {
    const provider = await getAnalysisProvider();
    expect(provider.kind).not.toBe("deterministic");
    expect(provider.kind).not.toBe("sample-snapshot");

    const runs = [];

    for (let runIndex = 0; runIndex < runCount; runIndex += 1) {
      let labelMatches = 0;
      let scoresWithinOne = 0;
      let integrityPasses = 0;
      const errors: Array<{
        templateId: TemplateId;
        errorType: string;
      }> = [];
      const startedAt = performance.now();

      for (const templateId of templateIds) {
        const indexedCases = evaluationCases
          .map((testCase, caseIndex) => ({ testCase, caseIndex }))
          .filter(({ testCase }) => testCase.templateId === templateId);
        const submissions = indexedCases.map(
          ({ testCase, caseIndex }) => ({
            studentId: `live-${runIndex}-${caseIndex}`,
            response: testCase.response,
          }),
        );

        try {
          const rawResults = await provider.analyze(
            templates[templateId],
            submissions,
          );
          const results = validateStudentAnalyses(
            templates[templateId],
            submissions,
            rawResults,
          );
          integrityPasses += submissions.length;
          const resultById = new Map(
            results.map((result) => [result.studentId, result]),
          );

          for (const { testCase, caseIndex } of indexedCases) {
            const result = resultById.get(
              `live-${runIndex}-${caseIndex}`,
            );
            if (
              result?.primaryMisconceptionId ===
              testCase.expectedMisconception
            ) {
              labelMatches += 1;
            }
            if (
              result &&
              Math.abs(
                result.rubricScore - testCase.expectedScore,
              ) <= 1
            ) {
              scoresWithinOne += 1;
            }
          }
        } catch (error) {
          errors.push({
            templateId,
            errorType:
              error instanceof Error
                ? error.constructor.name
                : "UnknownError",
          });
        }
      }

      const run = {
        run: runIndex + 1,
        labelAccuracy: roundMetric(
          labelMatches / evaluationCases.length,
        ),
        scoreWithinOne: roundMetric(
          scoresWithinOne / evaluationCases.length,
        ),
        integrityPassRate: roundMetric(
          integrityPasses / evaluationCases.length,
        ),
        durationMs: Math.round(performance.now() - startedAt),
        errors,
      };
      runs.push(run);
    }

    let reteachReport:
      | {
          passed: true;
          misconceptionId: string;
          stepCount: number;
        }
      | { passed: false; errorType: string };
    try {
      const reteach = reteachModelOutputSchema.parse(
        await provider.generateReteach(
          templates.collision,
          templates.collision.misconceptions[0],
          [
            "The truck exerts more force because it has more mass.",
          ],
        ),
      );
      reteachReport = {
        passed: true,
        misconceptionId: reteach.misconceptionId,
        stepCount: reteach.steps.length,
      };
    } catch (error) {
      reteachReport = {
        passed: false,
        errorType:
          error instanceof Error
            ? error.constructor.name
            : "UnknownError",
      };
    }

    const labelAccuracies = runs.map((run) => run.labelAccuracy);
    const scoreTolerances = runs.map((run) => run.scoreWithinOne);
    const report = {
      generatedAt: new Date().toISOString(),
      provider: provider.kind,
      model: provider.model,
      caseCount: evaluationCases.length,
      runs,
      aggregate: {
        meanLabelAccuracy: roundMetric(
          labelAccuracies.reduce((sum, value) => sum + value, 0) /
            runs.length,
        ),
        labelAccuracyRange: roundMetric(
          Math.max(...labelAccuracies) -
            Math.min(...labelAccuracies),
        ),
        meanScoreWithinOne: roundMetric(
          scoreTolerances.reduce((sum, value) => sum + value, 0) /
            runs.length,
        ),
        scoreWithinOneRange: roundMetric(
          Math.max(...scoreTolerances) -
            Math.min(...scoreTolerances),
        ),
        integrityPassRate: roundMetric(
          runs.reduce(
            (sum, run) => sum + run.integrityPassRate,
            0,
          ) / runs.length,
        ),
      },
      reteach: reteachReport,
    };
    const reportPath = path.resolve(
      process.env.LIVE_EVAL_REPORT_PATH ||
        "test-results/live-evaluation.json",
    );
    await mkdir(path.dirname(reportPath), { recursive: true });
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);

    console.info(`[live-evaluation] ${JSON.stringify(report)}`);

    for (const run of runs) {
      expect(run.labelAccuracy).toBeGreaterThanOrEqual(0.85);
      expect(run.scoreWithinOne).toBeGreaterThanOrEqual(0.9);
      expect(run.integrityPassRate).toBe(1);
    }
    expect(reteachReport.passed).toBe(true);
    if (reteachReport.passed) {
      expect(reteachReport.stepCount).toBe(3);
    }
  });
});
