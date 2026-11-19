import { test, expect } from "playwright/test";
import { QA, login } from "./helpers";

test.describe("authentication", () => {
  test("login page renders", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();
  });

  test("wrong password shows generic error", async ({ page }) => {
    await login(page, QA.designer.email, "WrongPass999");
    await expect(page.locator(".banner-error")).toHaveText("Invalid email or password.", { timeout: 15000 });
  });

  test("unauthenticated /admin redirects to /login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /manager redirects to /login", async ({ page }) => {
    await page.goto("/manager/tasks");
    await expect(page).toHaveURL(/\/login/);
  });

  test("unauthenticated /dashboard redirects to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("role boundary enforcement (direct URL access)", () => {
  test("employee hitting /admin is bounced to /dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/designer.json" });
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await ctx.close();
  });

  test("employee hitting /manager is bounced to /dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/designer.json" });
    const page = await ctx.newPage();
    await page.goto("/manager/tasks");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await ctx.close();
  });

  test("manager hitting /admin is bounced to /manager", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/manager.json" });
    const page = await ctx.newPage();
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/manager/, { timeout: 20000 });
    await ctx.close();
  });

  test("manager hitting /admin/payments (finance) is bounced", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/manager.json" });
    const page = await ctx.newPage();
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/\/manager/, { timeout: 20000 });
    await ctx.close();
  });

  test("employee hitting /admin/payments is bounced to /dashboard", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/designer.json" });
    const page = await ctx.newPage();
    await page.goto("/admin/payments");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await ctx.close();
  });

  test("manager hitting /dashboard is bounced to /manager", async ({ browser }) => {
    const ctx = await browser.newContext({ storageState: "e2e/.auth/manager.json" });
    const page = await ctx.newPage();
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/manager/, { timeout: 20000 });
    await ctx.close();
  });
});
