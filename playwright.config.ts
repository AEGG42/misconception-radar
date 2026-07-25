import { defineConfig, devices } from "@playwright/test";

const externalServerIsReady = process.env.E2E_SERVER_READY === "1";
const localChromeChannel = process.env.CI
  ? {}
  : { channel: "chrome" as const };

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chrome",
      use: { ...devices["Desktop Chrome"], ...localChromeChannel },
    },
  ],
  webServer: externalServerIsReady
    ? undefined
    : {
        command: "node node_modules/next/dist/bin/next dev",
        url: "http://127.0.0.1:3000",
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
