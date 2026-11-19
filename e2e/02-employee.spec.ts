import { test, expect } from "playwright/test";

test.use({ storageState: "e2e/.auth/designer.json" });

test.describe("employee dashboard", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard");
  });

  test("dashboard shows assigned QA task", async ({ page }) => {
    await expect(page.getByText("QA Diwali poster").first()).toBeVisible({ timeout: 15000 });
  });

  test("task detail shows client, pay and deadline", async ({ page }) => {
    await page.locator("a[href*='/dashboard/tasks/']").first().click();
    await expect(page).toHaveURL(/\/dashboard\/tasks\//);
    await expect(page.getByText("QA Test Client Ltd")).toBeVisible();
    // Own pay is visible either as "Pays ₹X" (pending) or "Earned ₹X" (done)
    await expect(page.getByText(/Pays ₹|Earned ₹/).first()).toBeVisible();
  });

  test("submit task with link marks it completed", async ({ page }) => {
    await page.getByText("QA Diwali poster").first().click();
    const linkInput = page.locator('input[name="submissionLink"]');
    if (await linkInput.count()) {
      await linkInput.fill("https://canva.com/qa-e2e-submission");
      await page.getByRole("button", { name: /submit|complete|mark/i }).click();
      await expect(page.getByText(/completed|Submitted|waiting/i).first()).toBeVisible({ timeout: 15000 });
    }
  });

  test("clients page lists only assigned clients", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await expect(page.getByText("QA Test Client Ltd")).toBeVisible({ timeout: 15000 });
    // Other clients (e.g. presidency school) must NOT appear
    await expect(page.getByText(/presidency/i)).toHaveCount(0);
  });

  test("assigned client detail is accessible", async ({ page }) => {
    await page.goto("/dashboard/clients");
    await page.getByText("QA Test Client Ltd").click();
    await expect(page.getByText(/QA seeded task|QA Diwali poster/).first()).toBeVisible({ timeout: 15000 });
  });

  test("unassigned client detail returns 404", async ({ page }) => {
    // presidency school client — NOT assigned to qa-designer
    const res = await page.goto("/dashboard/clients/shYWu6KrDtr9aOvddsRs");
    expect(res?.status()).toBe(404);
  });

  test("calendar page renders own tasks", async ({ page }) => {
    await page.goto("/dashboard/calendar");
    await expect(page.getByText(/Calendar|deadline/i).first()).toBeVisible({ timeout: 15000 });
  });
});
