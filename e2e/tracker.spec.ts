import { expect, test } from "./fixtures";
import { ensureTrackerWorkspace } from "./helpers/tracker";

test("tracker can create a task from the workspace", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  const taskTitle = `Playwright task ${Date.now()}`;
  const today = new Date().toISOString().slice(0, 10);

  await page.route("**/api/tracker/tasks", async (route) => {
    await page.waitForTimeout(250);
    await route.continue();
  });

  await page.getByRole("button", { name: "Add Task" }).click();
  await expect(page.getByRole("heading", { name: "Add task" })).toBeVisible();

  await page.getByPlaceholder("Task title").fill(taskTitle);
  await page.getByPlaceholder("Description").fill("Created by the Playwright smoke suite.");
  await page.locator('input[type="date"]').fill(today);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Updating Kanban board...")).toBeVisible();
  await expect(page.getByText("Task created.")).toBeVisible();
  await expect(page.getByText(taskTitle)).toBeVisible();
});

test("tracker section help opens from the tab bar", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  await page.getByRole("button", { name: "Show Kanban board guide" }).hover();

  await expect(page.getByRole("tooltip")).toContainText("Tasks:");
  await expect(page.getByRole("tooltip")).toContainText("Decisions:");
});

test("approved decisions can be created edited and deleted", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  const baseTitle = `Playwright decision ${Date.now()}`;
  const updatedTitle = `${baseTitle} updated`;

  await page.getByRole("button", { name: "Decisions" }).click();
  await page.getByRole("button", { name: "Add decision" }).click();

  await expect(page.getByRole("heading", { name: "Add decision" })).toBeVisible();
  await page.getByPlaceholder("Decision title").fill(baseTitle);
  await page
    .getByPlaceholder("What was decided, what changed, and what the team should follow next?")
    .fill("Confirm updated detail direction for the current phase.");
  await page.getByRole("button", { name: "Save decision" }).click();

  await expect(page.getByText("Decision saved.")).toBeVisible();
  await expect(page.getByText(baseTitle)).toBeVisible();

  await page.getByRole("button", { name: `Edit decision ${baseTitle}` }).click();
  await expect(page.getByRole("heading", { name: "Edit decision" })).toBeVisible();
  await page.getByPlaceholder("Decision title").fill(updatedTitle);
  await page.getByRole("button", { name: "Save changes" }).click();

  await expect(page.getByText("Decision updated.")).toBeVisible();
  await expect(page.getByText(updatedTitle)).toBeVisible();

  await page.getByRole("button", { name: `Edit decision ${updatedTitle}` }).click();
  page.once("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "Delete", exact: true }).click();

  await expect(page.getByText("Decision deleted.")).toBeVisible();
  await expect(page.getByText(updatedTitle)).not.toBeVisible();
});
