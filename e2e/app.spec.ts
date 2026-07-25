import { expect, test } from "@playwright/test";

test("demo class completes the diagnostic and reteach flow", async ({
  page,
}) => {
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /See what your class actually misunderstands/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load demo class" }).click();
  await expect(page.getByText("8", { exact: true }).first()).toBeVisible();

  await page.getByRole("button", { name: /Analyze class/i }).click();
  await expect(
    page.getByRole("heading", { name: /revealing a pattern/i }),
  ).toBeVisible();
  await expect(page.getByText("Rule-grounded demo")).toBeVisible();
  await expect(page.getByText("Misconception map")).toBeVisible();

  await page.getByRole("button", { name: /Maya/i }).click();
  const feedback = page.getByLabel(/Feedback draft/i);
  await expect(feedback).toBeVisible();
  await feedback.fill(
    "You connected force to mass. Now compare the two forces in one interaction.",
  );
  await page.getByRole("button", { name: "Approve draft" }).click();
  await expect(
    page.getByRole("button", { name: /Feedback approved locally/i }),
  ).toBeVisible();

  await page
    .getByRole("button", { name: /Generate 5-minute plan/i })
    .click();
  await expect(page.getByText("Learning objective")).toBeVisible();
  await expect(page.getByText("Exit ticket", { exact: true })).toBeVisible();
});

test("a valid CSV stays anonymous through analysis and teacher review", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "class.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "student_id,student_name,response",
        'S-10,Ada,"The truck exerts more force because it has much more mass."',
        'S-11,Ben,"They exert equal forces in opposite directions on each other."',
      ].join("\n"),
    ),
  });

  await expect(page.getByText("Ada", { exact: true })).toBeVisible();
  await expect(page.getByText("Responses ready")).toBeVisible();
  await expect(
    page.getByText("The truck exerts more force because"),
  ).toBeVisible();

  const analyzeRequestPromise = page.waitForRequest("**/api/analyze");
  await page.getByRole("button", { name: /Analyze class/i }).click();
  const analyzeRequest = await analyzeRequestPromise;
  expect(analyzeRequest.postDataJSON()).toEqual({
    templateId: "collision",
    submissions: [
      {
        studentId: "S-10",
        response:
          "The truck exerts more force because it has much more mass.",
      },
      {
        studentId: "S-11",
        response:
          "They exert equal forces in opposite directions on each other.",
      },
    ],
  });

  await expect(page.getByText("Misconception map")).toBeVisible();
  await page.getByRole("button", { name: /Ada/i }).click();
  const studentPanel = page.getByRole("complementary");
  await expect(studentPanel.getByText("Original response")).toBeVisible();
  await expect(
    studentPanel
      .getByText(
        /The truck exerts more force because it has much more mass\./,
      )
      .first(),
  ).toBeVisible();
  await expect(
    studentPanel.getByText(/Evidence: “The truck exerts more force/i),
  ).toBeVisible();

  const feedback = page.getByLabel(/Feedback draft/i);
  await feedback.fill(
    "Compare the two forces in this single interaction, then explain the different accelerations.",
  );
  await page.getByRole("button", { name: "Approve draft" }).click();
  await expect(
    page.getByRole("button", { name: /Feedback approved locally/i }),
  ).toBeVisible();
});

test("an invalid CSV reports actionable errors and preserves setup", async ({
  page,
}) => {
  await page.goto("/");
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "invalid.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(["id,name,answer", "1,Ada,Answer"].join("\n")),
  });

  await expect(
    page.getByRole("alert").filter({ hasText: "Check the CSV" }),
  ).toContainText("Missing required columns");
  await expect(
    page.getByRole("heading", { name: "Add class responses" }),
  ).toBeVisible();
});

test("sample snapshot is explicitly labeled", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("button", { name: "Use sample snapshot" })
    .click();

  await expect(page.getByText("Sample snapshot", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/This is not a live model result/i),
  ).toBeVisible();
});

test("an analysis outage preserves responses and offers the labeled fallback", async ({
  page,
}) => {
  await page.route("**/api/analyze", async (route) => {
    await route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({
        error:
          "The analysis service is unavailable. Your responses are still in the browser.",
      }),
    });
  });

  await page.goto("/");
  await page.getByRole("button", { name: "Load demo class" }).click();
  await page.getByRole("button", { name: /Analyze class/i }).click();

  const alert = page
    .getByRole("alert")
    .filter({ hasText: "Analysis paused" });
  await expect(alert).toContainText("Analysis paused");
  await expect(alert).toContainText(
    "Your responses are still in the browser",
  );
  await expect(page.getByText("Responses ready")).toBeVisible();
  await expect(page.getByText("Maya", { exact: true })).toBeVisible();

  await alert
    .getByRole("button", {
      name: "Use the clearly labeled sample snapshot",
    })
    .click();
  await expect(page.getByText("Sample snapshot", { exact: true })).toBeVisible();
  await expect(
    page.getByText(/This is not a live model result/i),
  ).toBeVisible();
});

test("the core demo remains usable at a 390px mobile viewport", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");

  await expect(
    page.getByRole("heading", {
      name: /See what your class actually misunderstands/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Load demo class" }).click();
  await expect(page.getByText("Responses ready")).toBeVisible();
  await page.getByRole("button", { name: /Analyze class/i }).click();

  await expect(page.getByText("Misconception map")).toBeVisible();
  await expect(
    page.getByRole("button", { name: /Generate 5-minute plan/i }),
  ).toBeVisible();
});
