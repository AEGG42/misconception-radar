import { mkdir } from "node:fs/promises";
import { chromium } from "@playwright/test";

const outputDirectory = "public/screenshots";
await mkdir(outputDirectory, { recursive: true });

const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 1,
});

async function prepareTopFrame() {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    document
      .querySelectorAll("nextjs-portal")
      .forEach((element) => element.setAttribute("style", "display:none"));
  });
  await page.waitForTimeout(300);
}

await page.goto("http://127.0.0.1:3000", {
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
await prepareTopFrame();
await page.screenshot({
  path: `${outputDirectory}/02-diagnostic-map.png`,
  fullPage: false,
});

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
