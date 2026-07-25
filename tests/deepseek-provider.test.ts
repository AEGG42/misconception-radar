import type OpenAI from "openai";
import { describe, expect, it, vi } from "vitest";

import { templates } from "@/lib/domain/templates";
import { DeepSeekAnalysisProvider } from "@/lib/providers/deepseek-provider";
import { DeterministicAnalysisProvider } from "@/lib/providers/deterministic-provider";

function completion(content: string | null) {
  return {
    choices: [{ message: { content } }],
  };
}

function clientWith(create: ReturnType<typeof vi.fn>) {
  return {
    chat: {
      completions: {
        create,
      },
    },
  } as unknown as OpenAI;
}

describe("DeepSeekAnalysisProvider", () => {
  it("uses JSON mode and retries one empty analysis response", async () => {
    const template = templates.collision;
    const submissions = [
      {
        studentId: "S-01",
        response:
          "The truck exerts more force because it has more mass.",
      },
    ];
    const expectedStudents =
      await new DeterministicAnalysisProvider().analyze(
        template,
        submissions,
      );
    const create = vi
      .fn()
      .mockResolvedValueOnce(completion(""))
      .mockResolvedValueOnce(
        completion(JSON.stringify({ students: expectedStudents })),
      );
    const provider = new DeepSeekAnalysisProvider(clientWith(create));

    await expect(provider.analyze(template, submissions)).resolves.toEqual(
      expectedStudents,
    );
    expect(create).toHaveBeenCalledTimes(2);

    const request = create.mock.calls[0][0];
    expect(request.model).toBe("deepseek-v4-flash");
    expect(request.response_format).toEqual({ type: "json_object" });
    expect(request.thinking).toEqual({ type: "disabled" });
    expect(request.messages[0].content).toContain("Return JSON only");
    expect(request.messages[0].content).toContain("class_analysis");
  });

  it("parses a three-step reteach plan through the shared contract", async () => {
    const template = templates.collision;
    const misconception = template.misconceptions[0];
    const responses = [
      "The truck exerts more force because it has more mass.",
    ];
    const expectedPlan =
      await new DeterministicAnalysisProvider().generateReteach(
        template,
        misconception,
        responses,
      );
    const create = vi
      .fn()
      .mockResolvedValue(completion(JSON.stringify(expectedPlan)));
    const provider = new DeepSeekAnalysisProvider(clientWith(create));

    const plan = await provider.generateReteach(
      template,
      misconception,
      responses,
    );

    expect(plan).toEqual(expectedPlan);
    expect(plan.steps).toHaveLength(3);
    expect(create).toHaveBeenCalledOnce();
    expect(create.mock.calls[0][0].messages[0].content).toContain(
      "reteach_plan",
    );
  });

  it("rejects invalid JSON contracts after exactly one retry", async () => {
    const create = vi
      .fn()
      .mockResolvedValue(completion('{"students":[]}'));
    const provider = new DeepSeekAnalysisProvider(clientWith(create));

    await expect(
      provider.analyze(templates.collision, [
        {
          studentId: "S-01",
          response: "The truck pushes harder.",
        },
      ]),
    ).rejects.toThrow();
    expect(create).toHaveBeenCalledTimes(2);
  });
});
