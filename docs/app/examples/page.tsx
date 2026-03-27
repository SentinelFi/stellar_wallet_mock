import CodeBlock from "@/components/CodeBlock";
import Link from "next/link";

export const metadata = { title: "Examples - stellar-wallet-mock" };

export default function Examples() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Examples</h1>

      <p className="text-text-muted mb-8">
        All examples below are taken from the{" "}
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock/tree/main/examples/test-dapp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          examples/test-dapp
        </a>{" "}
        directory and the test files in{" "}
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock/tree/main/tests"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          tests/
        </a>
        . The example dApp is a full Scaffold Stellar app with a Counter contract
        and an OpenZeppelin ERC-4626 XLM Vault deployed on testnet.
      </p>

      {/* Fixture setup */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          1. Reusable Playwright Fixture
        </h2>
        <p className="text-text-muted mb-4">
          Start by creating a fixture so every test gets a connected wallet
          automatically. All examples below use this fixture.
        </p>
        <CodeBlock
          filename="tests/fixtures.ts"
          code={`import { test as base } from "@playwright/test";
import { installMockStellarWallet, type MockWallet } from "stellar-wallet-mock";
import { Keypair, Networks } from "@stellar/stellar-sdk";

const SECRET_KEY = "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";
const PUBLIC_KEY = Keypair.fromSecret(SECRET_KEY).publicKey();

export const test = base.extend<{ wallet: MockWallet }>({
  wallet: async ({ page }, use) => {
    const wallet = await installMockStellarWallet({
      page,
      secretKey: SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });
    await use(wallet);
  },
});

export { expect } from "@playwright/test";
export { PUBLIC_KEY };`}
        />
      </section>

      {/* Connect wallet */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          2. Connect Wallet and Verify Address
        </h2>
        <p className="text-text-muted mb-4">
          The simplest test — navigate to your dApp and confirm the wallet
          connected with the right address. This is from{" "}
          <code>tests/test-dapp.spec.ts</code>.
        </p>
        <CodeBlock
          filename="tests/connect.spec.ts"
          code={`import { test, expect, PUBLIC_KEY } from "./fixtures";

test("wallet connects and shows address", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // The dApp reads localStorage and displays the connected address
  await expect(page.getByText(PUBLIC_KEY.slice(0, 5))).toBeVisible({
    timeout: 15_000,
  });
});`}
        />
      </section>

      {/* Counter increment */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          3. Sign a Transaction (Counter Increment)
        </h2>
        <p className="text-text-muted mb-4">
          This test clicks the increment button on a Soroban counter contract.
          The mock transparently signs the transaction — no popup, no manual
          approval. From{" "}
          <code>tests/test-dapp.spec.ts</code>.
        </p>
        <CodeBlock
          filename="tests/counter.spec.ts"
          code={`import { test, expect, PUBLIC_KEY } from "./fixtures";

test("counter increment signs and updates count", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Wait for wallet to connect
  await expect(page.getByText(PUBLIC_KEY.slice(0, 5))).toBeVisible({
    timeout: 15_000,
  });

  // Click increment — triggers a Soroban transaction
  const incrementBtn = page.getByTestId("increment-btn");
  await expect(incrementBtn).toBeEnabled({ timeout: 5_000 });
  await incrementBtn.click();

  // Wait for the on-chain state to update
  const counterValue = page.getByTestId("counter-value");
  await expect(counterValue).not.toContainText("—", { timeout: 45_000 });

  // Verify the count is a positive number
  const text = await counterValue.textContent();
  const match = text?.match(/(\\d+)/);
  expect(match).toBeTruthy();
  expect(Number(match![1])).toBeGreaterThan(0);
});`}
        />
      </section>

      {/* Vault deposit */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          4. Deposit XLM into a Vault (Auth Entry Signing)
        </h2>
        <p className="text-text-muted mb-4">
          This deposits 1 XLM into an OpenZeppelin ERC-4626 vault contract.
          The vault&apos;s <code>deposit()</code> calls <code>require_auth()</code>{" "}
          for both the token transfer and vault interaction — the mock signs
          all auth entries automatically. From{" "}
          <code>tests/test-dapp.spec.ts</code>.
        </p>
        <CodeBlock
          filename="tests/vault-deposit.spec.ts"
          code={`import { test, expect, PUBLIC_KEY } from "./fixtures";

test("deposit XLM into vault and receive shares", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Wait for wallet
  await expect(page.getByText(PUBLIC_KEY.slice(0, 5))).toBeVisible({
    timeout: 15_000,
  });

  // Enter deposit amount
  const depositInput = page.getByTestId("deposit-input");
  await expect(depositInput).toBeVisible({ timeout: 5_000 });
  await depositInput.fill("1");

  // Click deposit — triggers require_auth + auth entry signing
  const depositBtn = page.getByTestId("deposit-btn");
  await expect(depositBtn).toBeEnabled();
  await depositBtn.click();

  // Verify shares were minted
  const sharesMinted = page.getByTestId("shares-minted");
  await expect(sharesMinted).toBeVisible({ timeout: 45_000 });
  const text = await sharesMinted.textContent();
  const match = text?.match(/([\\d.]+)/);
  expect(match).toBeTruthy();
  expect(Number(match![1])).toBeGreaterThan(0);
});`}
        />
      </section>

      {/* Vault withdraw */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          5. Withdraw XLM from a Vault
        </h2>
        <p className="text-text-muted mb-4">
          After depositing, withdraw 0.5 XLM and verify the vault balance
          decreases. From <code>tests/test-dapp.spec.ts</code>.
        </p>
        <CodeBlock
          filename="tests/vault-withdraw.spec.ts"
          code={`import { test, expect, PUBLIC_KEY } from "./fixtures";

test("withdraw XLM from vault", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // Wait for wallet
  await expect(page.getByText(PUBLIC_KEY.slice(0, 5))).toBeVisible({
    timeout: 15_000,
  });

  // Refresh to get current vault balance
  const refreshBtn = page.getByTestId("refresh-balance-btn");
  await expect(refreshBtn).toBeVisible({ timeout: 5_000 });
  await refreshBtn.click();

  const vaultBalance = page.getByTestId("vault-balance");
  await expect(vaultBalance).toContainText("XLM", { timeout: 15_000 });

  // Record balance before withdrawal
  const beforeText = await vaultBalance.textContent();
  const beforeMatch = beforeText?.match(/([\\d.]+)\\s*XLM/);
  const beforeBalance = beforeMatch ? Number(beforeMatch[1]) : 0;

  // Withdraw 0.5 XLM
  const withdrawInput = page.getByTestId("withdraw-input");
  await expect(withdrawInput).toBeVisible({ timeout: 5_000 });
  await withdrawInput.fill("0.5");

  const withdrawBtn = page.getByTestId("withdraw-btn");
  await expect(withdrawBtn).toBeEnabled();
  await withdrawBtn.click();

  // Verify vault balance decreased
  await expect(async () => {
    const afterText = await vaultBalance.textContent();
    const afterMatch = afterText?.match(/([\\d.]+)\\s*XLM/);
    const afterBalance = afterMatch ? Number(afterMatch[1]) : 0;
    expect(afterBalance).toBeLessThan(beforeBalance);
  }).toPass({ timeout: 45_000 });
});`}
        />
      </section>

      {/* Read-only calls */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          6. Read-Only Contract Calls (No Signing)
        </h2>
        <p className="text-text-muted mb-4">
          Not everything needs a signature. Read-only calls like checking a
          counter value or vault balance work without wallet auth.
        </p>
        <CodeBlock
          filename="tests/read-only.spec.ts"
          code={`import { test, expect } from "./fixtures";

test("read counter value without signing", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const getCountBtn = page.getByTestId("get-count-btn");
  await expect(getCountBtn).toBeVisible({ timeout: 10_000 });
  await getCountBtn.click();

  const counterValue = page.getByTestId("counter-value");
  await expect(counterValue).toContainText(/\\d+/, { timeout: 15_000 });
});

test("read vault total assets without signing", async ({ page }) => {
  await page.goto("http://localhost:5173");

  const refreshBtn = page.getByTestId("refresh-balance-btn");
  await expect(refreshBtn).toBeVisible({ timeout: 10_000 });
  await refreshBtn.click();

  const vaultBalance = page.getByTestId("vault-balance");
  await expect(vaultBalance).toContainText("XLM", { timeout: 15_000 });
});`}
        />
      </section>

      {/* Network configs */}
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          7. Network Configuration
        </h2>
        <p className="text-text-muted mb-4">
          The examples above use testnet. Here&apos;s how to configure for other
          networks:
        </p>

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
          8. Playwright Configuration
        </h2>
        <p className="text-text-muted mb-4">
          This is the Playwright config used by the example dApp. It starts the
          dev server automatically and runs tests serially (required when tests
          share a testnet account to avoid sequence number conflicts).
        </p>
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
      <section className="mb-12">
        <h2 className="text-xl font-semibold text-white mb-3">
          9. GitHub Actions CI
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

      {/* Running the example */}
      <section>
        <h2 className="text-xl font-semibold text-white mb-3">
          Running the Example dApp
        </h2>
        <p className="text-text-muted mb-4">
          The{" "}
          <a
            href="https://github.com/SentinelFi/stellar_wallet_mock/tree/main/examples/test-dapp"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            examples/test-dapp
          </a>{" "}
          directory contains a full Scaffold Stellar app with two Soroban
          contracts (Counter + OZ ERC-4626 Vault). To run it locally:
        </p>
        <CodeBlock
          language="bash"
          code={`# Build the Soroban contracts and generate TS clients
cd examples/test-dapp
npm install
stellar scaffold build --build-clients

# Start the dev server
npm run dev

# In another terminal — run the 16 tests (7 unit + 9 E2E)
cd ../..
npm run build
npx playwright test`}
        />
        <div className="bg-surface-light border border-border rounded-lg p-4 mt-4">
          <p className="text-sm text-text-muted">
            <strong className="text-white">Prerequisites:</strong>{" "}
            Rust with <code>wasm32v1-none</code> target, Node.js v22+,{" "}
            Stellar CLI with Scaffold plugin, and Docker.
          </p>
        </div>
      </section>

      {/* Limitations */}
      <section id="limitations" className="scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Limitations
        </h2>
        <div className="bg-surface-light border border-border rounded-lg p-5">
          <ul className="space-y-3 text-sm text-text-muted">
            <li>
              <strong className="text-white">Freighter only</strong> — currently
              only the{" "}
              <a
                href="https://freighter.app"
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline"
              >
                Freighter
              </a>{" "}
              wallet is mocked. Other Stellar wallets (xBull, Albedo, Lobstr,
              etc.) use different communication protocols and are not yet
              supported. Support for additional wallets is planned for future
              releases.
            </li>
            <li>
              <strong className="text-white">Chromium only</strong> —
              Playwright&apos;s <code>page.exposeFunction()</code> is used for
              signing, which works best with Chromium-based browsers.
            </li>
            <li>
              <strong className="text-white">No multi-account support</strong>{" "}
              — a single secret key is used per page. To test multi-account
              flows, use separate pages or fixtures.
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
