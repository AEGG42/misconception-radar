import { describe, expect, it } from "vitest";

import { POST as analyze } from "@/app/api/analyze/route";
import { POST as reteach } from "@/app/api/reteach/route";
import { POST as sample } from "@/app/api/sample/route";
import { createEmptyCustomTemplate } from "@/lib/domain/custom-template";

function completeCustomTemplate() {
  const template = createEmptyCustomTemplate();
  return {
    ...template,
    title: "Energy transfer",
    question:
      "A cart rolls down a ramp. Explain how its energy changes.",
    referenceAnswer:
      "Gravitational potential energy decreases while kinetic energy increases; total energy is conserved when losses are negligible.",
    rubric: template.rubric.map((criterion, index) => ({
      ...criterion,
      label: [
        "Identifies gravitational potential energy",
        "Identifies kinetic energy",
        "Describes an energy transfer",
        "States that total energy is conserved",
      ][index],
      description: [
        "Identifies gravitational potential energy",
        "Identifies kinetic energy",
        "Describes an energy transfer",
        "States that total energy is conserved",
      ][index],
    })),
    misconceptions: template.misconceptions.map(
      (misconception, index) => {
        const labels = [
          "Energy disappears as the cart moves",
          "The cart creates new energy",
          "Only kinetic energy exists on the ramp",
        ];
        return {
          ...misconception,
          shortLabel: labels[index],
          label: labels[index],
          description: labels[index],
        };
      },
    ),
  };
}

describe("API contracts", () => {
  it("returns anonymized student analysis and deterministic summary", async () => {
    const request = new Request("http://localhost/api/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        templateId: "collision",
        submissions: [
          {
            studentId: "S-01",
            response:
              "The truck exerts more force because it has much more mass.",
          },
          {
            studentId: "S-02",
            response:
              "They exert equal forces in opposite directions on each other. The car accelerates more because it has less mass.",
          },
        ],
      }),
    });

    const response = await analyze(request);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.students).toHaveLength(2);
    expect(payload.summary.misconceptionCounts[0].count).toBe(1);
    expect(payload.metadata.provider).toBe("deterministic");
    expect(JSON.stringify(payload)).not.toContain("studentName");
  });

  it("rejects duplicate IDs before provider execution", async () => {
    const response = await analyze(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "collision",
          submissions: [
            { studentId: "S-01", response: "First answer" },
            { studentId: "s-01", response: "Second answer" },
          ],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Check the submitted class data");
  });

  it("analyzes a validated custom exit ticket without sending names", async () => {
    const response = await analyze(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "custom",
          customTemplate: completeCustomTemplate(),
          submissions: [
            {
              studentId: "C-01",
              response:
                "The cart speeds up because its energy disappears as it moves.",
            },
          ],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.students[0]).toMatchObject({
      studentId: "C-01",
      primaryMisconceptionId: "custom-misconception-1",
      needsReview: true,
      confidence: "low",
    });
    expect(payload.summary.misconceptionCounts).toHaveLength(3);
    expect(JSON.stringify(payload)).not.toContain("studentName");
  });

  it("rejects a custom template request without the template definition", async () => {
    const response = await analyze(
      new Request("http://localhost/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "custom",
          submissions: [
            { studentId: "C-01", response: "A short response." },
          ],
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("returns a three-step reteach plan for a valid misconception", async () => {
    const response = await reteach(
      new Request("http://localhost/api/reteach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "collision",
          misconceptionId: "heavier-more-force",
          representativeResponses: [
            "The truck exerts more force because it is heavier.",
          ],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.steps).toHaveLength(3);
    expect(payload.misconceptionId).toBe("heavier-more-force");
    expect(payload.metadata.provider).toBe("deterministic");
  });

  it("generates a reteach plan from the same custom template", async () => {
    const response = await reteach(
      new Request("http://localhost/api/reteach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "custom",
          customTemplate: completeCustomTemplate(),
          misconceptionId: "custom-misconception-1",
          representativeResponses: [
            "The cart's energy disappears as it moves.",
          ],
        }),
      }),
    );
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.steps).toHaveLength(3);
    expect(payload.misconceptionId).toBe(
      "custom-misconception-1",
    );
  });

  it("rejects a misconception from another template", async () => {
    const response = await reteach(
      new Request("http://localhost/api/reteach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templateId: "book-at-rest",
          misconceptionId: "heavier-more-force",
          representativeResponses: ["The book is heavier."],
        }),
      }),
    );

    expect(response.status).toBe(400);
  });

  it("keeps the fixed demo snapshot centered on a three-student cluster", async () => {
    const response = await sample(
      new Request("http://localhost/api/sample", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId: "collision" }),
      }),
    );
    const payload = await response.json();
    const topMisconception = payload.summary.misconceptionCounts.find(
      (item: { id: string }) => item.id === "heavier-more-force",
    );

    expect(response.status).toBe(200);
    expect(payload.metadata.provider).toBe("sample-snapshot");
    expect(payload.summary.topMisconceptionId).toBe(
      "heavier-more-force",
    );
    expect(topMisconception.count).toBe(3);
  });
});
