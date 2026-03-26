import CodeBlock from "@/components/CodeBlock";

export const metadata = { title: "Quick Start - stellar-wallet-mock" };

export default function QuickStart() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Quick Start</h1>

      <p className="text-text-muted mb-6">
        Get a mock Freighter wallet running in your Playwright tests in under 5
        minutes.
      </p>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        1. Install
      </h2>
      <CodeBlock
        language="bash"
        code={`npm install github:SentinelFi/stellar_wallet_mock
npm install -D @playwright/test
npx playwright install chromium`}
      />

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        2. Write your first test
      </h2>
      <CodeBlock
        filename="tests/wallet.spec.ts"
        code={`import { test, expect } from "@playwright/test";
import { installMockStellarWallet } from "stellar-wallet-mock";

const SECRET_KEY = "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";

test("dApp connects to mock wallet", async ({ page }) => {
  // Install the mock BEFORE navigating
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
  });

  await page.goto("http://localhost:5173");

  // Your dApp now sees a connected Freighter wallet
  await expect(page.locator(".wallet-address")).toBeVisible();
});`}
      />

      <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mt-6">
        <p className="text-sm text-primary-light font-medium mb-1">Important</p>
        <p className="text-sm text-text-muted">
          You must call <code>installMockStellarWallet()</code> <strong className="text-white">before</strong>{" "}
          <code>page.goto()</code>. The mock needs to intercept messages from the
          moment the page loads.
        </p>
      </div>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        3. Run
      </h2>
      <CodeBlock language="bash" code={`npx playwright test`} />

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        What just happened?
      </h2>
      <p className="text-text-muted mb-4">
        The mock wallet injected itself into the browser page and intercepted
        all <code>window.postMessage</code> calls that Freighter would normally
        handle. Your dApp thinks it&apos;s talking to a real Freighter extension, but
        the mock is responding with real cryptographic signatures using your
        secret key.
      </p>
      <p className="text-text-muted">
        It also pre-seeded <code>localStorage</code> keys so dApps using{" "}
        <code>stellar-wallets-kit</code> or Scaffold Stellar boot directly into
        a connected state.
      </p>
    </div>
  );
}
