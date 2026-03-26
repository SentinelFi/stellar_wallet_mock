import CodeBlock from "@/components/CodeBlock";

export const metadata = { title: "Examples - stellar-wallet-mock" };

export default function Examples() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Examples</h1>

      {/* Fixture */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Playwright Fixture (Recommended)
        </h2>
        <p className="text-text-muted mb-4">
          Create a reusable fixture so every test gets a wallet automatically:
        </p>
        <CodeBlock
          filename="tests/fixtures.ts"
          code={`import { test as base } from "@playwright/test";
import { installMockStellarWallet, type MockWallet } from "stellar-wallet-mock";

const SECRET_KEY = "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";

export const test = base.extend<{ wallet: MockWallet }>({
  wallet: async ({ page }, use) => {
    const wallet = await installMockStellarWallet({
      page,
      secretKey: SECRET_KEY,
    });
    await use(wallet);
  },
});

export { expect } from "@playwright/test";`}
        />
        <CodeBlock
          filename="tests/my-test.spec.ts"
          code={`import { test, expect } from "./fixtures";

test("submits a transaction", async ({ page, wallet }) => {
  await page.goto("http://localhost:5173");

  await expect(page.locator(".address")).toContainText(
    wallet.publicKey.slice(0, 4)
  );

  await page.click("#send-payment");
  await expect(page.locator(".tx-success")).toBeVisible();
});`}
        />
      </section>

      {/* Transaction signing */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Signing Transactions
        </h2>
        <p className="text-text-muted mb-4">
          The mock handles transaction signing transparently. No extra code needed:
        </p>
        <CodeBlock
          code={`test("signs and submits a payment", async ({ page }) => {
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
    networkPassphrase: Networks.TESTNET,
  });

  await page.goto("http://localhost:5173");

  await page.fill("#amount", "10");
  await page.click("#send-payment");
  await expect(page.locator(".tx-success")).toBeVisible({ timeout: 30_000 });
});`}
        />
      </section>

      {/* Soroban Auth */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Soroban Auth Entry Signing
        </h2>
        <p className="text-text-muted mb-4">
          The mock automatically handles <code>require_auth()</code> calls in
          smart contracts:
        </p>
        <CodeBlock
          code={`test("vault deposit with auth entry signing", async ({ page }) => {
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
    networkPassphrase: Networks.TESTNET,
  });

  await page.goto("http://localhost:5173");

  await page.fill("#amount", "1");
  await page.click("#deposit");
  await expect(page.locator(".deposit-success")).toBeVisible({
    timeout: 30_000,
  });
});`}
        />
      </section>

      {/* Network configs */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Network Configuration
        </h2>

        <h3 className="text-lg font-medium text-white mt-4 mb-2">Mainnet</h3>
        <CodeBlock
          code={`import { Networks } from "@stellar/stellar-sdk";

await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
  network: "PUBLIC",
  networkPassphrase: Networks.PUBLIC,
});`}
        />

        <h3 className="text-lg font-medium text-white mt-4 mb-2">
          Local Standalone
        </h3>
        <CodeBlock
          code={`await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
  network: "STANDALONE",
  networkPassphrase: "Standalone Network ; February 2017",
});`}
        />
      </section>

      {/* Playwright config */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          Playwright Configuration
        </h2>
        <CodeBlock
          filename="playwright.config.ts"
          code={`import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: { headless: true },
  projects: [
    {
      name: "chromium",
      use: { browserName: "chromium" },
    },
  ],
  webServer: {
    command: "npm run dev",
    port: 5173,
    reuseExistingServer: true,
  },
});`}
        />
      </section>

      {/* CI */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          GitHub Actions CI
        </h2>
        <CodeBlock
          language="yaml"
          filename=".github/workflows/e2e.yml"
          code={`name: E2E Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - run: npm ci
      - run: npx playwright install --with-deps chromium
      - run: npm run build
      - run: npx playwright test`}
        />
      </section>
    </div>
  );
}
