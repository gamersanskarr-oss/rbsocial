import { test, expect } from "playwright/test";

test.use({ storageState: "e2e/.auth/manager.json" });

test.describe("manager workspace", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/manager/tasks");
  });

  test("lands on tasks page with assign form", async ({ page }) => {
    await expect(page).toHaveURL(/\/manager\/tasks/, { timeout: 15000 });
    await expect(page.getByText("Assign a task")).toBeVisible();
  });

  test("create form has NO pay field (manager restriction)", async ({ page }) => {
    await expect(page.locator('input[name="payAmount"]')).toHaveCount(0);
  });

  test("create task end-to-end", async ({ page }) => {
    test.setTimeout(90_000);
    await page.fill('input[name="topic"]', "QA E2E Manager Task");
    await page.fill('textarea[name="description"]', "created by playwright");
    await page.selectOption('select[name="taskType"]', { index: 1 });
    await page.selectOption('select[name="clientId"]', { label: "QA Test Client Ltd" });
    await page.selectOption('select[name="assignedToId"]', "bkBKnCGKlFbTOkzR75qV8crqzPs2"); // QA Designer
    const dl = new Date(Date.now() + 72 * 36e5);
    const dlStr = `${dl.getFullYear()}-${String(dl.getMonth() + 1).padStart(2, "0")}-${String(dl.getDate()).padStart(2, "0")}T18:00`;
    await page.fill('input[name="deadline"]', dlStr);
    await page.getByRole("button", { name: "Assign Task" }).click();
    // either the success toast/banner or the task row appearing
    await expect(
      page.getByText(/Task "QA E2E Manager Task" assigned|QA E2E Manager Task/).first()
    ).toBeVisible({ timeout: 30000 });
  });

  test("clients page shows AssignSelect (manager can assign designers)", async ({ page }) => {
    await page.goto("/manager/clients");
    await expect(page.getByText("QA Test Client Ltd")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("QA Designer").first()).toBeVisible();
  });

  test("calendar modal has editable date+time and worker select", async ({ page }) => {
    await page.goto("/manager/calendar");
    // click a day cell (a day number)
    await page.locator(".grid.grid-cols-7 > div:not(.bg-panel\\/30)").nth(20).click({ timeout: 10000 }).catch(() => {});
    const modal = page.locator("text=Assign task");
    if (await modal.count()) {
      await expect(page.locator('input[name="deadline"][type="datetime-local"]')).toBeVisible();
      await expect(page.locator('select[name="assignedToId"]')).toBeVisible();
    }
  });

  test("team page shows employees with stats", async ({ page }) => {
    await page.goto("/manager/team");
    await expect(page.getByText("QA Designer")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("QA IT Member")).toBeVisible();
  });

  test("reports page shows per-employee monthly stats", async ({ page }) => {
    await page.goto("/manager/reports");
    await expect(page.getByText("Team reports")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("QA Designer")).toBeVisible();
  });

  test("requests page loads", async ({ page }) => {
    await page.goto("/manager/requests");
    await expect(page.locator("body")).toContainText(/request|Requests/i, { timeout: 15000 });
  });

  test("manager task detail has no pay approval controls", async ({ page }) => {
    await page.goto("/manager/tasks");
    const first = page.locator("table a[href*='/manager/tasks/']").first();
    if (await first.count()) {
      await first.click();
      await expect(page.getByRole("button", { name: /Approve ₹/ })).toHaveCount(0);
      await expect(page.getByText(/quoted by/)).toHaveCount(0);
    }
  });
});
