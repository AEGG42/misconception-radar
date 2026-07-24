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

test("a valid CSV is previewed before analysis", async ({ page }) => {
  await page.goto("/");
  await page.getByLabel("Upload student response CSV").setInputFiles({
    name: "class.csv",
    mimeType: "text/csv",
    buffer: Buffer.from(
      [
        "student_id,student_name,response",
        'S-10,Ada,"They exert equal forces in opposite directions on each other."',
      ].join("\n"),
    ),
  });

  await expect(page.getByText("Ada", { exact: true })).toBeVisible();
  await expect(page.getByText("Responses ready")).toBeVisible();
  await expect(
    page.getByText("They exert equal forces in opposite directions"),
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
