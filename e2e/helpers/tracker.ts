import { expect, type Page } from "@playwright/test";

export async function ensureTrackerWorkspace(page: Page) {
  await page.goto("/todos");
  await expect(page).toHaveURL(/\/todos$/);
  await page.waitForLoadState("networkidle");
  await waitForTrackerShell(page);

  const addTaskButton = page.getByRole("button", { name: "Add Task" });
  if (await addTaskButton.isVisible()) {
    return null;
  }

  const createFirstProjectButton = page.getByRole("button", { name: "Create first project" });
  await page.waitForTimeout(250);

  if (await addTaskButton.isVisible()) {
    return null;
  }

  if (await createFirstProjectButton.isVisible()) {
    const timestamp = Date.now();
    const projectName = `Playwright Smoke ${timestamp}`;

    await createFirstProjectButton.click();
    await expect(page.getByRole("heading", { name: "Create project" })).toBeVisible();
    await page.getByPlaceholder("Project name").fill(projectName);
    await page.getByPlaceholder("Code").fill(`E2E-${String(timestamp).slice(-6)}`);
    await page.getByPlaceholder("Client").fill("Playwright");
    await page.getByPlaceholder("Overview").fill("Project created by Playwright smoke tests.");
    await page.getByRole("button", { name: "Save" }).click();

    await expect(page.getByRole("button", { name: "Add Task" })).toBeVisible();
    await expect(page.getByRole("heading", { name: projectName })).toBeVisible();
    return projectName;
  }

  await expect(addTaskButton).toBeVisible();
  return null;
}

async function waitForTrackerShell(page: Page) {
  const addTaskButton = page.getByRole("button", { name: "Add Task" });
  const createFirstProjectButton = page.getByRole("button", { name: "Create first project" });
  const emptyWorkspaceHeading = page.getByRole("heading", { name: "No project workspace" });

  await Promise.any([
    addTaskButton.waitFor({ state: "visible" }),
    createFirstProjectButton.waitFor({ state: "visible" }),
    emptyWorkspaceHeading.waitFor({ state: "visible" }),
  ]);
}
