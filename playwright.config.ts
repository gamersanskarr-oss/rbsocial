import { defineConfig } from "playwright/test";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  retries: 1, // dev-server cold compiles can exceed tight timeouts on first hit
  expect: { timeout: 20_000 },
  navigationTimeout: 30_000,
  workers: 1, // serial — tests share live DB state
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e-report" }]],
  use: {
    baseURL: "http://localhost:3000",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
});
