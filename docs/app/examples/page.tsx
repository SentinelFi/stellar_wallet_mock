import CodeBlock from "@/components/CodeBlock";

export const metadata = { title: "Examples - stellar-wallet-mock" };

export default function Examples() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Examples</h1>

      <p className="text-text-muted mb-4">
        The code below comes from the{" "}
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock/tree/main/examples/test-dapp"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          examples/test-dapp
        </a>{" "}
        directory in the repository. It is a full{" "}
        <a
          href="https://github.com/theahaco/scaffold-stellar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Scaffold Stellar
        </a>{" "}
        app with two Soroban contracts deployed on testnet: a Counter and an
        OpenZeppelin ERC-4626 XLM Vault. The test files live in{" "}
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock/tree/main/tests"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          tests/
        </a>
        .
      </p>
      <p className="text-text-muted mb-8">
        Each example demonstrates a different kind of dApp interaction you can
        automate with stellar-wallet-mock &mdash; from basic wallet connection
        to Soroban auth entry signing.
      </p>

      {/* Fixture setup */}
      <section id="playwright-fixture" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Playwright Fixture
        </h2>
        <p className="text-text-muted mb-4">
          A{" "}
          <a
            href="https://playwright.dev/docs/test-fixtures"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent hover:underline"
          >
            Playwright fixture
          </a>{" "}
          lets you run setup code before each test. Here we create a{" "}
          <code>wallet</code> fixture that installs the mock wallet so every
          test starts with a connected wallet automatically.
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
        <p className="text-text-muted mt-4">
          All examples below import <code>test</code> and{" "}
          <code>expect</code> from this fixture file instead of from{" "}
          <code>@playwright/test</code> directly.
        </p>
      </section>

      {/* Connect wallet */}
      <section id="connect-wallet" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Connect Wallet
        </h2>
        <p className="text-text-muted mb-4">
          The simplest test &mdash; navigate to the dApp and confirm the
          wallet connected with the right address. The mock pre-seeds
          localStorage, so the dApp boots directly into a connected state.
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
      <section id="sign-transaction" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Sign a Transaction
        </h2>
        <p className="text-text-muted mb-4">
          Clicking the increment button on a Soroban counter contract triggers
          a transaction. The mock intercepts the{" "}
          <code>SUBMIT_TRANSACTION</code> message and signs it in Node.js
          &mdash; no popup, no manual approval.
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
      <section id="vault-deposit" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Vault Deposit (Auth Entry Signing)
        </h2>
        <p className="text-text-muted mb-4">
          Depositing XLM into an OpenZeppelin ERC-4626 vault is more complex
          than a simple transaction. The vault&apos;s <code>deposit()</code>{" "}
          calls <code>require_auth()</code> for both the token transfer and
          the vault interaction, which means the wallet needs to sign Soroban
          auth entries (via <code>SUBMIT_AUTH_ENTRY</code>). The mock handles
          this automatically.
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
      <section id="vault-withdraw" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Vault Withdraw
        </h2>
        <p className="text-text-muted mb-4">
          After depositing, withdraw XLM and verify the vault balance
          decreases. This also uses auth entry signing under the hood.
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
      <section id="read-only" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Read-Only Contract Calls
        </h2>
        <p className="text-text-muted mb-4">
          Not every interaction needs signing. Reading contract state (counter
          value, vault balance) works without wallet authorization &mdash; but
          you still need the mock installed so the dApp boots into a connected
          state.
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
});`}
        />
      </section>

      {/* Network configs */}
      <section id="network-configuration" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Network Configuration
        </h2>
        <p className="text-text-muted mb-4">
          The examples above use testnet. Pass different <code>network</code>{" "}
          and <code>networkPassphrase</code> values for other networks:
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
      <section id="playwright-configuration" className="mb-12 scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Playwright Configuration
        </h2>
        <p className="text-text-muted mb-4">
          The Playwright config used by the example dApp. It starts the dev
          server automatically and runs tests serially (required when tests
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

      {/* Running the example */}
      <section id="running-the-example" className="scroll-mt-8">
        <h2 className="text-xl font-semibold text-white mb-3">
          Running the Example dApp
        </h2>
        <p className="text-text-muted mb-4">
          To run the example dApp and its tests locally:
        </p>
        <CodeBlock
          language="bash"
          code={`# Build the Soroban contracts and generate TS clients
cd examples/test-dapp
npm install
stellar scaffold build --build-clients

# Start the dev server
npm run dev

# In another terminal — run the tests
cd ../..
npm run build
npx playwright test`}
        />
      </section>
    </div>
  );
}
