import { test as base, expect } from "@playwright/test";

export const test = base.extend({
  page: async ({ page, baseURL }, runTest) => {
    if (!baseURL) {
      throw new Error("Playwright baseURL is required for E2E bypass cookies.");
    }

    await page.context().addCookies([
      {
        name: "e2e_bypass",
        value: "1",
        url: baseURL,
        sameSite: "Lax",
      },
    ]);

    await runTest(page);
  },
});

export { expect };
