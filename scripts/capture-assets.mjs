import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const outputDirectory = "public/screenshots";
const baseUrl =
  process.env.CAPTURE_BASE_URL || "http://127.0.0.1:3000";
const expectedProviderLabel =
  process.env.CAPTURE_EXPECTED_PROVIDER_LABEL || "";
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
});
page.setDefaultTimeout(90_000);

async function prepareTopFrame() {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document
      .querySelectorAll("nextjs-portal")
      .forEach((element) => element.setAttribute("style", "display:none"));
  });
  await page.waitForTimeout(300);
}

await page.goto(baseUrl, {
  waitUntil: "networkidle",
});

await page.getByRole("button", { name: "Load demo class" }).click();
await page.getByText("Responses ready").waitFor();
await prepareTopFrame();
await page.screenshot({
  path: `${outputDirectory}/01-class-responses.png`,
  fullPage: false,
});

await page.getByRole("button", { name: /Analyze class/i }).click();
await page.getByText("Misconception map").waitFor();
if (expectedProviderLabel) {
  await page.getByText(expectedProviderLabel, { exact: true }).waitFor();
}
await prepareTopFrame();
await page.screenshot({
  path: `${outputDirectory}/02-diagnostic-map.png`,
  fullPage: false,
});

await page.getByRole("button", { name: /Maya/i }).click();
await page
  .getByLabel(/Feedback draft/i)
  .fill(
    "You connected force to mass. Now compare the two forces in the same interaction and explain the different accelerations.",
  );
await page.getByRole("button", { name: "Approve draft" }).click();
await page
  .getByRole("button", { name: /Generate 5-minute plan/i })
  .click();
await page.getByText("Learning objective").waitFor();
await page.getByText("Learning objective").scrollIntoViewIfNeeded();
await page.evaluate(() => window.scrollBy(0, -120));
await page
  .locator("nextjs-portal")
  .evaluateAll((elements) =>
    elements.forEach((element) => element.setAttribute("style", "display:none")),
  );
await page.waitForTimeout(300);
await page.screenshot({
  path: `${outputDirectory}/03-reteach-and-feedback.png`,
  fullPage: false,
});

await browser.close();

console.info(
  `Captured submission assets from ${baseUrl}${
    expectedProviderLabel
      ? ` with provider label "${expectedProviderLabel}"`
      : ""
  }.`,
);
