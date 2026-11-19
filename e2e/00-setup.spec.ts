import { test, expect } from "playwright/test";
import { QA, login } from "./helpers";

// Runs first: signs each QA role in once and saves its session for reuse.
// This keeps us under the 20-logins/10min rate limit and removes the
// cookie-set race that made page.goto fire before the session existed.

const roles: { name: keyof typeof QA & string; email: string; dest: RegExp }[] = [
  { name: "admin", email: QA.admin.email, dest: /\/admin/ },
  { name: "manager", email: QA.manager.email, dest: /\/manager/ },
  { name: "designer", email: QA.designer.email, dest: /\/dashboard/ },
  { name: "it", email: QA.it.email, dest: /\/dashboard/ },
  { name: "accountant", email: QA.accountant.email, dest: /\/admin\/payments/ },
];

for (const r of roles) {
  test(`auth setup: ${r.name}`, async ({ page }) => {
    await login(page, r.email);
    await expect(page).toHaveURL(r.dest, { timeout: 25000 });
    await page.context().storageState({ path: `e2e/.auth/${r.name}.json` });
  });
}
