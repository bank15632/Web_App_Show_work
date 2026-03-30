import { test, expect } from "./fixtures";

test("dashboard exposes the main workflow navigation", async ({ page }) => {
  await page.goto("/");

  await expect(page).toHaveURL(/\/$/);
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: /เห็นงานสำคัญเร็วขึ้น/,
    }),
  ).toBeVisible();

  await expect(page.getByRole("link", { name: "User Manual", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "GTD Workspace", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Kanban Board", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "GTD Workspace", exact: true }).click();
  await expect(page).toHaveURL(/\/gtd$/);
  await expect(page.getByRole("heading", { name: "GTD Workspace" })).toBeVisible();

  await page.goto("/");
  await page.getByRole("link", { name: "Kanban Board", exact: true }).click();
  await expect(page).toHaveURL(/\/todos$/);
});
