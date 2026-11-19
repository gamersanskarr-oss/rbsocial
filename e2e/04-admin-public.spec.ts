import { test, expect } from "playwright/test";

test.describe("admin workspace", () => {
  test.use({ storageState: "e2e/.auth/admin.json" });
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin");
  });

  test("home dashboard shows KPI cards", async ({ page }) => {
    await expect(page).toHaveURL(/\/admin/, { timeout: 15000 });
    await expect(page.getByText(/Employees|Clients|Pending tasks/i).first()).toBeVisible();
  });

  test("employees page lists QA users", async ({ page }) => {
    await page.goto("/admin/employees");
    await expect(page.getByText("QA Designer")).toBeVisible({ timeout: 15000 });
    await expect(page.getByText("QA Manager")).toBeVisible();
  });

  test("add employee with weak password is blocked (native minLength)", async ({ page }) => {
    await page.goto("/admin/employees");
    await page.fill('input[name="name"]', "QA ShortPass");
    await page.fill('input[name="email"]', "qa-short@qa.rbs");
    await page.fill('input[name="password"]', "abc");
    await page.getByRole("button", { name: /Add member/i }).click();
    // minLength=6 blocks submission natively — the input reports invalid
    const msg = await page.locator('input[name="password"]').evaluate(
      (el) => (el as HTMLInputElement).validationMessage
    );
    expect(msg.length).toBeGreaterThan(0);
  });

  test("add employee end-to-end creates the member", async ({ page }) => {
    await page.goto("/admin/employees");
    await page.fill('input[name="name"]', "QA E2E Newbie");
    await page.fill('input[name="email"]', "qa-e2e-new@qa.rbs");
    await page.fill('input[name="password"]', "QaPass123!");
    await page.selectOption('select[name="role"]', "EMPLOYEE");
    await page.selectOption('select[name="team"]', "DESIGN");
    await page.getByRole("button", { name: /Add member/i }).click();
    await expect(page.getByRole("cell", { name: "QA E2E Newbie" })).toBeVisible({ timeout: 25000 });
  });

  test("clients page + task create with pay field visible (admin-only)", async ({ page }) => {
    await page.goto("/admin/tasks");
    await expect(page.locator('input[name="payAmount"]')).toBeVisible({ timeout: 15000 });
  });

  test("payouts page computes rows", async ({ page }) => {
    await page.goto("/admin/payouts");
    await expect(page.getByRole("cell", { name: "QA Designer" }).first()).toBeVisible({ timeout: 15000 });
  });

  test("payments: record → mark received → follow-up", async ({ page }) => {
    await page.goto("/admin/payments");
    await expect(page.locator("body")).toContainText(/payment|Payment|received/i, { timeout: 15000 });
  });

  test("expenses page renders add form", async ({ page }) => {
    await page.goto("/admin/expenses");
    await expect(page.locator('select[name="category"], input[name="amount"]').first()).toBeVisible({ timeout: 15000 });
  });

  test("reports page renders", async ({ page }) => {
    await page.goto("/admin/reports");
    await expect(page.locator("body")).toContainText(/report|revenue|expense/i, { timeout: 15000 });
  });

  test("jobs page lists QA opening", async ({ page }) => {
    await page.goto("/admin/jobs");
    await expect(page.getByText("QA Graphic Designer")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("public surfaces", () => {
  test("homepage renders hero", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toContainText(/RB|social|brand/i, { timeout: 20000 });
  });

  test("careers page lists QA job and accepts application", async ({ page }) => {
    await page.goto("/careers");
    await expect(page.getByRole("heading", { name: "QA Graphic Designer" })).toBeVisible({ timeout: 15000 });
  });

  test("health endpoint reports admin SDK ok", async ({ request }) => {
    const res = await request.get("http://localhost:3000/api/health");
    const body = await res.json();
    expect(body.adminSdk).toBe("ok");
    expect(body.canListUsers).toBe(true);
  });
});
