import { defineConfig } from "@playwright/test";

const ownerPin = process.env.PLAYWRIGHT_OWNER_PIN ?? process.env.OWNER_PIN ?? "1234";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [["github"], ["html", { open: "never" }]]
    : [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://localhost:3000",
    viewport: {
      width: 1440,
      height: 1400,
    },
    extraHTTPHeaders: {
      "x-e2e-test": "1",
    },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  webServer: {
    command: "npm run dev:e2e",
    url: "http://localhost:3000/pin",
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      ...process.env,
      E2E_BYPASS_OWNER_AUTH: "1",
      OWNER_PIN: ownerPin,
    },
  },
});
