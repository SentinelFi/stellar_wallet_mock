# stellar-wallet-mock

Mock [Freighter](https://freighter.app) wallet for headless E2E testing of Stellar/Soroban dApps with [Playwright](https://playwright.dev).

No browser extension needed. No manual wallet interaction. Works with any dApp that uses `@stellar/freighter-api` or `@creit-tech/stellar-wallets-kit` — zero dApp code changes required.

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

## Documentation

Full documentation is available in the [`docs/`](./docs) directory. Run it locally:

```bash
cd docs
npm install
npm run dev
```

Or visit the hosted docs (coming soon).

## Features

- Intercepts the `window.postMessage` protocol — works with `freighter-api`, `stellar-wallets-kit`, and Scaffold Stellar
- Signs real transactions, Soroban auth entries, and arbitrary messages with ed25519
- Pre-seeds `localStorage` so dApps boot into a connected state
- Works on testnet, mainnet, and local standalone networks
- CI/CD ready — no browser extension needed
- Zero runtime dependencies beyond `@stellar/stellar-sdk`

## Limitations

- **Freighter only** — currently only mocks the [Freighter](https://freighter.app) wallet. Other wallets (xBull, Albedo, Lobstr, etc.) use different communication protocols and are not yet supported. Support for additional wallets is planned for future releases.
- **Chromium only** — Playwright's `page.exposeFunction()` is used for signing, which works best with Chromium-based browsers.
- **No multi-account support** — a single secret key is used per page. To test multi-account flows, use separate pages or fixtures.

## Inspiration

- [wallet-mock](https://github.com/johanneskares/wallet-mock) — Ethereum wallet mock for Playwright by Johannes Kares
- [Freighter](https://github.com/nicholasgasior/nicholasgasior-freighter) — Stellar's official wallet extension
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) by Creit Tech
- [Synpress](https://github.com/Synthetixio/synpress) — E2E testing for Ethereum dApps with MetaMask

## License

MIT
