import { Page, expect } from "playwright/test";

export const QA = {
  password: "QaPass123!",
  admin: { email: "qa-admin@qa.rbs" },
  manager: { email: "qa-manager@qa.rbs" },
  designer: { email: "qa-designer@qa.rbs" },
  it: { email: "qa-it@qa.rbs" },
  accountant: { email: "qa-accountant@qa.rbs" },
};

export async function login(page: Page, email: string, password = QA.password) {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');
}

export async function loginAs(page: Page, role: "admin" | "manager" | "designer" | "it" | "accountant") {
  await login(page, QA[role].email);
  await page.waitForLoadState("networkidle");
}
