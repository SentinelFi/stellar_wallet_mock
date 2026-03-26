import { defineConfig } from "@playwright/test";

export default defineConfig({
  globalSetup: "./tests/global-setup.ts",
  testDir: "./tests",
  timeout: 60_000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
  },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: [
    {
      command: "npx serve tests/fixtures -l 5174 --no-clipboard",
      port: 5174,
      reuseExistingServer: true,
    },
    {
      command: "npx vite --port 5173",
      port: 5173,
      cwd: "./examples/test-dapp",
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
