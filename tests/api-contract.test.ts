import { describe, expect, it } from "vitest";

import { POST as analyze } from "@/app/api/analyze/route";
import { POST as reteach } from "@/app/api/reteach/route";

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
});
