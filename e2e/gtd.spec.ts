import { test, expect } from "./fixtures";
import { ensureTrackerWorkspace } from "./helpers/tracker";

test("gtd can send an inbox item to kanban", async ({ page }) => {
  await ensureTrackerWorkspace(page);

  const itemTitle = `Playwright GTD ${Date.now()}`;

  await page.goto("/gtd");
  await expect(page.getByRole("heading", { name: "GTD Workspace" })).toBeVisible();

  await page
    .getByPlaceholder("Quick capture: พิมพ์งานที่นึกออกแล้วกด Enter")
    .fill(itemTitle);
  await page.getByRole("button", { name: "Add to inbox" }).click();

  await expect(page.getByText("Added to inbox.")).toBeVisible();
  await expect(page.getByRole("heading", { name: itemTitle })).toBeVisible();

  await page.getByRole("button", { name: "Send to Kanban" }).click();

  await expect(page.getByRole("heading", { name: "Send To Kanban" })).toBeVisible();
  await page.locator('label:has-text("Task Type") select').selectOption("meeting_followup");
  const createInKanbanButton = page.getByRole("button", { name: "Create in Kanban" });
  await createInKanbanButton.scrollIntoViewIfNeeded();
  await createInKanbanButton.click();

  await expect(page.getByText(/Sent to Kanban project/)).toBeVisible();
  await expect(page.getByText("Linked to Kanban.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Open in Kanban" })).toBeVisible();
});
