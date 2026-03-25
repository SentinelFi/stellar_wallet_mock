# stellar-wallet-mock

Mock [Freighter](https://freighter.app) wallet for headless E2E testing of Stellar/Soroban dApps with [Playwright](https://playwright.dev).

No browser extension needed. No manual wallet interaction. Works with any dApp that uses `@stellar/freighter-api` or `@creit-tech/stellar-wallets-kit` — zero code changes required.

## Features

- Intercepts the `window.postMessage` protocol between `@stellar/freighter-api` and the Freighter extension
- Signs real transactions with a provided secret key
- Pre-seeds `localStorage` for [`stellar-wallets-kit`](https://github.com/Creit-Tech/Stellar-Wallets-Kit) so dApps boot into a connected state
- Handles polling — responds correctly to repeated `getAddress()` / `getNetwork()` calls
- Supports `signTransaction`, `signAuthEntry`, and `signMessage`

## Install

```bash
npm install stellar-wallet-mock @playwright/test
```

## Quickstart

```ts
import { test, expect } from "@playwright/test";
import { installMockStellarWallet } from "stellar-wallet-mock";

const SECRET_KEY = "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";

test("dApp connects to mock wallet", async ({ page }) => {
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
  });

  await page.goto("http://localhost:5173");

  // Your dApp now sees a connected Freighter wallet.
  // No extension popup, no manual clicks.
  await expect(page.locator(".wallet-address")).toBeVisible();
});
```

## API

### `installMockStellarWallet(options)`

Installs the mock wallet into a Playwright page. Must be called **before** `page.goto()`.

```ts
await installMockStellarWallet({
  page,                    // Playwright Page instance (required)
  secretKey,               // Stellar secret key, starts with 'S' (required)
  network,                 // Network name, e.g. "TESTNET" (default: "TESTNET")
  networkPassphrase,       // Network passphrase (default: Networks.TESTNET)
});
```

Returns a `MockWallet` object with `publicKey`, `keypair`, `network`, and `networkPassphrase`.

### `createWallet(secretKey, options?)`

Lower-level function to create a wallet instance without installing it into a page. Useful if you need the public key or keypair for test assertions.

```ts
import { createWallet } from "stellar-wallet-mock";
import { Networks } from "@stellar/stellar-sdk";

const wallet = createWallet("SDPDMYEW...", {
  network: "TESTNET",
  networkPassphrase: Networks.TESTNET,
});

console.log(wallet.publicKey); // GBIIN6LP...
```

## Signing transactions

The mock signs real transactions using the provided secret key. Build transactions in your test, inject them into the page, and the mock handles signing through the same postMessage protocol Freighter uses.

```ts
import { Keypair, Networks, TransactionBuilder, Account, Operation } from "@stellar/stellar-sdk";

test("signs a transaction", async ({ page }) => {
  const wallet = await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
    networkPassphrase: Networks.TESTNET,
  });

  await page.goto("http://localhost:5173");

  // When the dApp calls kit.signTransaction(xdr) or freighterApi.signTransaction(xdr),
  // the mock intercepts it, signs with the secret key, and returns the signed XDR.
  await page.click("#submit-transaction-button");
  await expect(page.locator(".tx-success")).toBeVisible();
});
```

## How it works

```
Your dApp code
  → stellar-wallets-kit (or freighter-api directly)
    → window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_REQUEST", ... })
      → stellar-wallet-mock (intercepts and responds)
        ← window.dispatchEvent({ source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", ... })
```

The mock operates at the `window.postMessage` layer — the universal protocol that all Freighter integrations use. This means it works whether the dApp uses:

- `@stellar/freighter-api` directly
- `@creit-tech/stellar-wallets-kit` with `FreighterModule`
- Raw `postMessage` calls

### What gets mocked

| Message type | Response |
|---|---|
| `REQUEST_CONNECTION_STATUS` | `{ isConnected: true }` |
| `REQUEST_ACCESS` | `{ publicKey }` |
| `REQUEST_PUBLIC_KEY` | `{ publicKey }` |
| `REQUEST_NETWORK` | `{ network, networkPassphrase }` |
| `REQUEST_NETWORK_DETAILS` | `{ network, networkPassphrase }` |
| `SUBMIT_TRANSACTION` | `{ signedTransaction, signerAddress }` |
| `SUBMIT_AUTH_ENTRY` | `{ signedAuthEntry, signerAddress }` |
| `SUBMIT_BLOB` | `{ signedMessage, signerAddress }` |

### localStorage pre-seeding

For dApps using `stellar-wallets-kit`, the mock pre-seeds these keys so the dApp starts in a connected state:

| Key | Value |
|---|---|
| `@StellarWalletsKit/activeAddress` | Public key |
| `@StellarWalletsKit/selectedModuleId` | `"freighter"` |
| `@StellarWalletsKit/usedWalletsIds` | `["freighter"]` |

### Other details

- Sets `window.freighter = true` so `isConnected()` doesn't short-circuit
- Transaction signing happens in Node.js via `page.exposeFunction()` using `@stellar/stellar-sdk`
- Uses the `messagedId` field name (matching the typo in freighter-api's response matching)

## Testing with a local Stellar Standalone network

```ts
import { Networks } from "@stellar/stellar-sdk";

await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
  network: "STANDALONE",
  networkPassphrase: "Standalone Network ; February 2017",
});
```

## Project structure

```
stellar-wallet-mock/
  src/
    index.ts                  # Public exports
    createWallet.ts           # Wallet abstraction
    installMockWallet.ts      # Playwright page injection
  tests/
    fixtures/index.html       # Self-contained test page
    mock-wallet.spec.ts       # Test suite
  playwright.config.ts
```

## Running tests

```bash
npm install
npx playwright install chromium
npm run build
npm test
```

## License

MIT
