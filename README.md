# stellar-wallet-mock

A [Playwright](https://playwright.dev) testing library that mocks the [Freighter](https://freighter.app) wallet browser extension, letting you run headless E2E tests against Stellar/Soroban dApps without a real wallet extension.

No browser extension needed. No manual wallet interaction. Works with any dApp that uses `@stellar/freighter-api` — zero dApp code changes required.

## Install

```bash
npm install github:SentinelFi/stellar_wallet_mock
npm install -D @playwright/test
npx playwright install chromium
```

## Quick Start

```ts
import { test, expect } from "@playwright/test";
import { installMockStellarWallet } from "stellar-wallet-mock";

const SECRET_KEY = "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";

test("dApp connects to mock wallet", async ({ page }) => {
  // Install the mock BEFORE navigating to your dApp
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
  });

  await page.goto("http://localhost:5173");
  await expect(page.locator(".wallet-address")).toBeVisible();
});
```

> **Note:** `installMockStellarWallet()` must be called **before** `page.goto()`.

## How It Works

```
Playwright Test
    │
    ▼
installMockStellarWallet(page, secretKey)
    │
    ├─▶ createWallet(secretKey)          — creates a real Keypair in Node.js
    │
    ├─▶ page.exposeFunction() ×3         — bridges Node.js signing into the browser
    │     • __stellarMockSignTransaction
    │     • __stellarMockSignAuthEntry
    │     • __stellarMockSignMessage
    │
    └─▶ page.addInitScript()             — injects mock before the dApp loads
          • sets window.freighter = true
          • pre-seeds localStorage (so dApp thinks wallet is connected)
          • listens for postMessage events (Freighter protocol)
          • routes signing requests to the exposed Node.js functions
```

1. **Before the page loads**, a self-contained script is injected via Playwright's `page.addInitScript()`. This script mimics what the real Freighter extension would do.

2. **The dApp sends `window.postMessage()` requests** (e.g. `REQUEST_PUBLIC_KEY`, `SUBMIT_TRANSACTION`) — the same protocol used by `@stellar/freighter-api`.

3. **The mock intercepts these messages** and responds with the appropriate data. For signing operations, it calls back into Node.js (via `page.exposeFunction()`) where `@stellar/stellar-sdk` does real ed25519 signing.

4. **The dApp receives responses** formatted exactly like Freighter's — so no dApp code changes are needed.

### Origin and design

The core architecture is adapted from [@johanneskares/wallet-mock](https://github.com/johanneskares/wallet-mock), an Ethereum wallet mock for Playwright. Both libraries share the same two-step pattern:

1. **`page.exposeFunction()`** — registers a Node.js signing function so it's callable from the browser. The private key never enters the browser; all cryptography stays in Node.js.
2. **`page.addInitScript()`** — injects a self-contained script (no closures, since it's serialized to a string) that pretends to be the real wallet extension.

The difference is what gets mocked:

| | wallet-mock (Ethereum) | stellar-wallet-mock |
|---|---|---|
| **Protocol** | EIP-1193 / EIP-6963 provider | Freighter `window.postMessage` |
| **Signing** | `viem` WalletClient in Node.js | `@stellar/stellar-sdk` Keypair in Node.js |
| **Discovery** | Dispatches `eip6963:announceProvider` event | Sets `window.freighter = true` + pre-seeds `localStorage` |

This project replaces the Ethereum-specific pieces with Stellar equivalents: Freighter's postMessage protocol, `@stellar/stellar-sdk` for ed25519 signing, and localStorage seeding for `stellar-wallets-kit` and Scaffold Stellar so dApps boot into a connected state without modal dialogs.

## Documentation

Full documentation is available in the [`docs/`](./docs) directory. Run it locally:

```bash
cd docs
npm install
npm run dev
```

Or visit the hosted docs (coming soon).

## Limitations

- **Freighter only** — currently only mocks the [Freighter](https://freighter.app) wallet. Other wallets (xBull, Albedo, Lobstr, etc.) use different communication protocols and are not yet supported. Support for additional wallets is planned for future releases.
- **Chromium only** — Playwright's `page.exposeFunction()` is used for signing, which works best with Chromium-based browsers.
- **No multi-account support** — a single secret key is used per page. To test multi-account flows, use separate pages or fixtures.