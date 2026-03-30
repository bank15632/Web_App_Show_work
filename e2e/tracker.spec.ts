import { test, expect } from "./fixtures";
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

  const dialog = page.getByRole("heading", { name: "Add task" });
  await expect(dialog).toBeVisible();

  await page.getByPlaceholder("Task title").fill(taskTitle);
  await page.getByPlaceholder("Description").fill("Created by the Playwright smoke suite.");
  await page.locator('input[type="date"]').fill(today);
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Updating tracker...")).toBeVisible();
  await expect(page.getByText("Task created.")).toBeVisible();
  await expect(page.getByText(taskTitle)).toBeVisible();
});

test("tracker section help opens from the tab bar", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  await page.getByRole("button", { name: "Show section guide" }).hover();

  await expect(page.getByRole("tooltip")).toContainText("Tasks:");
  await expect(page.getByRole("tooltip")).toContainText("Review Queue:");
});

test("tracker intake flow can switch modes and queue a meeting note", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  const meetingTitle = `Playwright meeting ${Date.now()}`;
  await page.getByRole("button", { name: "Intake" }).click();

  await expect(page.getByRole("heading", { name: "Meeting note intake" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to log intake" }).click();
  await expect(page.getByRole("heading", { name: "RFI / revision intake" })).toBeVisible();
  await page.getByRole("button", { name: "Switch to image intake" }).click();
  await expect(page.getByRole("heading", { name: "Site photo / markup intake" })).toBeVisible();

  await page.getByRole("button", { name: "Close" }).click();
  await page.getByRole("button", { name: "Intake" }).click();

  await page.getByPlaceholder("Meeting title").fill(meetingTitle);
  await page
    .getByPlaceholder("Paste minutes, discussion notes, or action items...")
    .fill("1. Review revised elevation.\n2. Confirm updated site measurement.");
  await page.getByRole("button", { name: "Save" }).click();

  await expect(page.getByText("Meeting note queued for review.")).toBeVisible();
});
