# stellar-wallet-mock

Mock [Freighter](https://freighter.app) wallet for headless E2E testing of Stellar/Soroban dApps with [Playwright](https://playwright.dev).

No browser extension needed. No manual wallet interaction. Works with any dApp that uses `@stellar/freighter-api` or `@creit-tech/stellar-wallets-kit` — zero dApp code changes required.

## Table of Contents

- [Features](#features)
- [Install](#install)
- [Quickstart](#quickstart)
- [API Reference](#api-reference)
- [Usage Guide](#usage-guide)
  - [Signing Transactions](#signing-transactions)
  - [Signing Auth Entries](#signing-auth-entries)
  - [Using a Playwright Fixture](#using-a-playwright-fixture)
  - [Network Configuration](#network-configuration)
  - [CI / GitHub Actions](#ci--github-actions)
  - [Playwright Config](#playwright-config)
- [How It Works](#how-it-works)
  - [Message Protocol](#message-protocol)
  - [localStorage Pre-Seeding](#localstorage-pre-seeding)
  - [Architecture Diagram](#architecture-diagram)
- [Example: test-dapp](#example-test-dapp)
  - [What the Example Contains](#what-the-example-contains)
  - [Setting Up the Example](#setting-up-the-example)
  - [Test Coverage](#test-coverage)
- [Why Not Mock at the Kit Level?](#why-not-mock-at-the-kit-level)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [Inspiration](#inspiration)
- [License](#license)

## Features

- Intercepts the `window.postMessage` protocol between `@stellar/freighter-api` and the Freighter extension
- Signs real transactions with a provided Stellar secret key (ed25519)
- Signs Soroban authorization entries (`signAuthEntry`) for smart contract interactions
- Signs arbitrary messages (`signMessage` / `signBlob`)
- Pre-seeds `localStorage` for [`stellar-wallets-kit`](https://github.com/Creit-Tech/Stellar-Wallets-Kit) and [Scaffold Stellar](https://github.com/theahaco/scaffold-stellar) so dApps boot into a connected state
- Handles polling — responds correctly to repeated `getAddress()` / `getNetwork()` calls
- Works on testnet, mainnet, and local standalone networks
- Zero runtime dependencies beyond `@stellar/stellar-sdk`

## Install

Install directly from GitHub:

```bash
npm install github:SentinelFi/stellar_wallet_mock
```

Or pin to a specific commit/tag:

```bash
npm install github:SentinelFi/stellar_wallet_mock#main
npm install github:SentinelFi/stellar_wallet_mock#v0.1.0    # when a tag exists
npm install github:SentinelFi/stellar_wallet_mock#abc1234    # specific commit
```

Once published to npm (planned), you'll be able to install with:

```bash
npm install stellar-wallet-mock
```

Peer dependency:

```bash
npm install -D @playwright/test
npx playwright install chromium
```

## Quickstart

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

  // Your dApp now sees a connected Freighter wallet.
  // No extension popup, no manual clicks.
  await expect(page.locator(".wallet-address")).toBeVisible();
});
```

## API Reference

### `installMockStellarWallet(options): Promise<MockWallet>`

Installs the mock wallet into a Playwright page. **Must be called before `page.goto()`** — it uses `page.addInitScript()` and `page.exposeFunction()` which must be registered before navigation.

#### Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | `Page` | Yes | — | Playwright `Page` instance |
| `secretKey` | `string` | Yes | — | Stellar secret key (starts with `S`) |
| `network` | `string` | No | `"TESTNET"` | Network name |
| `networkPassphrase` | `string` | No | `Networks.TESTNET` | Stellar network passphrase |

#### Returns

A `MockWallet` object:

```ts
interface MockWallet {
  keypair: Keypair;             // Stellar Keypair instance
  publicKey: string;            // Public key (starts with 'G')
  network: string;              // Network name
  networkPassphrase: string;    // Network passphrase
  getInjectionConfig(): WalletInjectionConfig;
}
```

#### Example

```ts
const wallet = await installMockStellarWallet({
  page,
  secretKey: "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ",
  network: "TESTNET",
  networkPassphrase: "Test SDF Network ; September 2015",
});

console.log(wallet.publicKey); // "GBIIN6LP..."
```

### `createWallet(secretKey, options?): MockWallet`

Lower-level function to create a wallet instance without installing it into a page. Useful if you need the public key or keypair for test assertions before page setup.

```ts
import { createWallet } from "stellar-wallet-mock";

const wallet = createWallet("SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ", {
  network: "TESTNET",
});

console.log(wallet.publicKey); // "GBIIN6LP..."
```

### Exported Types

```ts
import type {
  MockWallet,
  WalletOptions,
  WalletInjectionConfig,
  InstallMockWalletOptions,
} from "stellar-wallet-mock";
```

## Usage Guide

### Signing Transactions

The mock signs real Stellar transactions using the provided secret key. When your dApp calls `kit.signTransaction(xdr)` or `freighterApi.signTransaction(xdr)`, the mock intercepts the postMessage, signs in Node.js via `page.exposeFunction()`, and returns the signed XDR.

```ts
test("signs and submits a payment", async ({ page }) => {
  await installMockStellarWallet({
    page,
    secretKey: SECRET_KEY,
    networkPassphrase: Networks.TESTNET,
  });

  await page.goto("http://localhost:5173");

  // Interact with your dApp — the mock handles signing transparently
  await page.fill("#amount", "10");
  await page.click("#send-payment");
  await expect(page.locator(".tx-success")).toBeVisible({ timeout: 30_000 });
});
```

### Signing Auth Entries

Soroban smart contracts use `require_auth()` which requires signing authorization entries. The mock handles this automatically — when the Soroban SDK's `authorizeEntry()` sends a `SUBMIT_AUTH_ENTRY` message, the mock SHA-256 hashes the `HashIdPreimage` XDR and signs it with ed25519.

This is exercised in the [example test-dapp](#example-test-dapp) with an OpenZeppelin ERC-4626 vault contract that requires multi-parameter auth signing for deposits and withdrawals.

### Using a Playwright Fixture

For cleaner tests, create a reusable fixture:

```ts
// tests/fixtures.ts
import { test as base } from "@playwright/test";
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

export { expect } from "@playwright/test";
```

Then in your tests:

```ts
// tests/my-dapp.spec.ts
import { test, expect } from "./fixtures";

test("submits a transaction", async ({ page, wallet }) => {
  await page.goto("http://localhost:5173");

  // wallet.publicKey is available for assertions
  await expect(page.locator(".address")).toContainText(wallet.publicKey.slice(0, 4));

  await page.click("#send-payment");
  await expect(page.locator(".tx-success")).toBeVisible();
});
```

### Network Configuration

**Testnet** (default):

```ts
await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
});
```

**Mainnet**:

```ts
import { Networks } from "@stellar/stellar-sdk";

await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
  network: "PUBLIC",
  networkPassphrase: Networks.PUBLIC,
});
```

**Local Standalone**:

```ts
await installMockStellarWallet({
  page,
  secretKey: SECRET_KEY,
  network: "STANDALONE",
  networkPassphrase: "Standalone Network ; February 2017",
});
```

### CI / GitHub Actions

The mock requires no browser extension, so it works in headless CI out of the box:

```yaml
name: E2E Tests
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
      - run: npx playwright test
```

### Playwright Config

Point the Playwright web server at your dApp so it starts automatically when tests run:

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  use: {
    headless: true,
  },
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
});
```

## How It Works

### Architecture Diagram

```
Your dApp code
  → stellar-wallets-kit (or freighter-api directly)
    → window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_REQUEST", ... })
      → stellar-wallet-mock (intercepts and responds)
        ← window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", ... })
```

The mock operates at the `window.postMessage` layer — the universal protocol that all Freighter integrations use. This means it works whether your dApp uses:

- `@stellar/freighter-api` directly
- `@creit-tech/stellar-wallets-kit` with `FreighterModule`
- Raw `postMessage` calls
- [Scaffold Stellar](https://github.com/theahaco/scaffold-stellar) (pre-seeds its localStorage keys too)

Everything above the interception point runs exactly as it would in production. If the Kit has a bug in how it talks to Freighter, or if `freighter-api` changes its message format, your tests will catch it.

### Message Protocol

The mock intercepts and responds to these Freighter postMessage types:

| Message Type | Response | Purpose |
|---|---|---|
| `REQUEST_CONNECTION_STATUS` | `{ isConnected: true }` | Wallet connection check |
| `REQUEST_ACCESS` | `{ publicKey }` | Request wallet access |
| `REQUEST_PUBLIC_KEY` | `{ publicKey }` | Get connected address |
| `REQUEST_NETWORK` | `{ network, networkPassphrase }` | Get network info |
| `REQUEST_NETWORK_DETAILS` | `{ network, networkPassphrase }` | Get detailed network info |
| `SUBMIT_TRANSACTION` | `{ signedTransaction, signerAddress }` | Sign a transaction XDR |
| `SUBMIT_AUTH_ENTRY` | `{ signedAuthEntry, signerAddress }` | Sign a Soroban auth entry |
| `SUBMIT_BLOB` | `{ signedMessage, signerAddress }` | Sign an arbitrary message |
| `REQUEST_ALLOWED_STATUS` | `{ isAllowed: true }` | Domain allowlist check |
| `SET_ALLOWED_STATUS` | `{ isAllowed: true }` | Set domain allowlist |
| `REQUEST_USER_INFO` | `{ publicKey }` | Get user info |

### localStorage Pre-Seeding

For dApps using `stellar-wallets-kit` or Scaffold Stellar, the mock pre-seeds localStorage so the dApp starts in a connected state without needing the auth modal:

**stellar-wallets-kit keys:**

| Key | Value |
|---|---|
| `@StellarWalletsKit/activeAddress` | Public key |
| `@StellarWalletsKit/selectedModuleId` | `"freighter"` |
| `@StellarWalletsKit/usedWalletsIds` | `["freighter"]` |

**Scaffold Stellar keys:**

| Key | Value |
|---|---|
| `walletId` | `"freighter"` |
| `walletAddress` | Public key |
| `walletNetwork` | Network name |
| `networkPassphrase` | Network passphrase |

### Other Implementation Details

- Sets `window.freighter = true` so `isConnected()` doesn't short-circuit
- Transaction signing happens in Node.js via `page.exposeFunction()` using `@stellar/stellar-sdk`
- Auth entry signing: SHA-256 hashes the `HashIdPreimage` XDR, then ed25519 signs the hash
- Uses the `messagedId` field name (matching the typo in freighter-api's response matching logic)

## Example: test-dapp

The `examples/test-dapp/` directory contains a full [Scaffold Stellar](https://github.com/theahaco/scaffold-stellar) dApp that demonstrates the wallet mock against real Soroban smart contracts deployed on testnet.

### What the Example Contains

**Smart Contracts (Rust/Soroban):**

- **Counter** — simple increment/get_count contract. Exercises basic transaction signing and read-only calls.
- **Vault** — an [OpenZeppelin ERC-4626](https://docs.openzeppelin.com/contracts-stellar/0.6.0/) tokenized vault wrapping native XLM, built with the `stellar-tokens` crate (v0.6.0). Deposits transfer XLM and mint share tokens (vXLM), withdrawals burn shares and return XLM. This exercises multi-parameter auth entry signing — the `deposit(assets, receiver, from, operator)` call requires signing authorization for both the token transfer and the vault interaction.

**React Frontend:**

- Counter component — increment button, get count button, displays current count
- Vault component — deposit XLM, withdraw XLM, view vault total assets, view user share balance, shows shares minted after deposit

### Setting Up the Example

Prerequisites:
- [Rust](https://www.rust-lang.org/tools/install) with `wasm32v1-none` target
- [Node.js](https://nodejs.org/) v22+
- [Stellar CLI](https://github.com/stellar/stellar-core) with [Scaffold plugin](https://github.com/AhaLabs/scaffold-stellar)
- Docker (for local Stellar network during build)

```bash
# From the repo root
cd examples/test-dapp
npm install

# Build Soroban contracts, deploy to testnet, generate TypeScript clients
stellar scaffold build --build-clients

# Verify the dev server starts
npm run dev
```

Then run the E2E tests:

```bash
# From the repo root
npm run build                                      # build the wallet mock
npx playwright test tests/test-dapp.spec.ts        # run the dApp tests
```

### Test Coverage

The example includes 9 E2E tests in `tests/test-dapp.spec.ts`:

| # | Test | What It Verifies |
|---|------|-----------------|
| 1 | wallet connects and shows address | Mock injects correctly, dApp displays the connected public key |
| 2 | counter increment signs and updates count | Transaction signing via `signTransaction`, state mutation on-chain |
| 3 | counter get_count reads without signing | Read-only contract call, no wallet auth needed |
| 4 | vault deposit triggers auth entry signing | Multi-param `require_auth` on OZ vault deposit, `signAuthEntry` works |
| 5 | vault refresh balance reads without signing | `total_assets()` read-only query returns data |
| 6 | oz vault deposit returns shares | Deposit 1 XLM, verify share tokens minted > 0 |
| 7 | oz vault share balance shows user shares | `share_balance()` returns the user's vXLM balance |
| 8 | oz vault total_assets reads without signing | Confirms vault holds deposited XLM |
| 9 | oz vault withdraw reclaims assets | Withdraw 0.5 XLM, verify vault balance decreases |

Combined with the 7 mock wallet unit tests in `tests/mock-wallet.spec.ts`, the full suite is **16 tests**.

## Why Not Mock at the Kit Level?

You *could* create a mock wallet module and inject it into `StellarWalletsKit` directly, but there are meaningful tradeoffs:

| | Kit-level mock | postMessage-level mock (this library) |
|---|---|---|
| dApp code changes required | Yes — needs dependency injection or test flags | None — completely transparent to the dApp |
| What it covers | Only dApps using `stellar-wallets-kit` | Any integration: Kit, `freighter-api`, or raw `postMessage` |
| What it tests | Your mock | Your actual dApp's wallet flow end-to-end |
| Catches Kit/freighter-api bugs | No — those layers are bypassed | Yes — the full stack is exercised |
| Production fidelity | Low — skips serialization, polling, message matching | High — same code path as a real Freighter extension |

This library intercepts at the lowest common layer:

```
dApp → stellar-wallets-kit → FreighterModule → freighter-api → postMessage → [mock intercepts here]
```

Everything above the interception point runs exactly as it would in production. If the Kit has a bug in how it talks to Freighter, or if `freighter-api` changes its message format, your tests will catch it — because you're testing the real integration, not a stub.

The tradeoff is that this library is coupled to Freighter's internal `postMessage` protocol (message types, field names, even the `messagedId` typo). But that coupling is a feature — if the protocol changes and your dApp breaks in production, your tests should break too.

**TL;DR:** Mocking at the Kit level tests your mock. Mocking at the postMessage level tests your dApp.

## Project Structure

```
stellar-wallet-mock/
├── src/
│   ├── index.ts                # Public exports
│   ├── createWallet.ts         # Wallet creation and keypair management
│   └── installMockWallet.ts    # Playwright page injection and message interception
├── tests/
│   ├── fixtures/index.html     # Self-contained HTML page for unit tests
│   ├── global-setup.ts         # Test account funding via friendbot
│   ├── mock-wallet.spec.ts     # 7 unit tests for the mock wallet API
│   └── test-dapp.spec.ts       # 9 E2E tests against the example dApp
├── examples/
│   └── test-dapp/              # Full Scaffold Stellar dApp
│       ├── contracts/
│       │   ├── counter/        # Simple counter contract (Rust)
│       │   └── vault/          # OZ ERC-4626 vault contract (Rust)
│       ├── src/
│       │   ├── components/     # React components (Counter, Vault)
│       │   ├── contracts/      # Auto-generated TS contract clients
│       │   └── hooks/          # useWallet hook
│       ├── environments.toml   # Network config + constructor args
│       ├── Cargo.toml          # Rust workspace (soroban-sdk + OZ deps)
│       └── package.json        # Frontend dependencies
├── dist/                       # Compiled output (published to npm)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

## Contributing

```bash
# Clone the repo
git clone https://github.com/AhaLabs/stellar-wallet-mock.git
cd stellar-wallet-mock

# Install dependencies
npm install
npx playwright install chromium

# Build
npm run build

# Run unit tests (no external dependencies)
npx playwright test tests/mock-wallet.spec.ts

# Run the full suite including E2E tests
# (requires examples/test-dapp to be built — see "Example: test-dapp" section)
npx playwright test

# Run tests with browser visible
npm run test:headed
```

## Inspiration

This project was inspired by and builds on ideas from:

- [wallet-mock](https://github.com/johanneskares/wallet-mock) — Ethereum wallet mock for Playwright by Johannes Kares. The approach of intercepting wallet communication at the message layer for headless E2E testing was a direct inspiration for this project.
- [Freighter](https://github.com/nicholasgasior/nicholasgasior-freighter) by Stellar — the official Stellar wallet extension whose `postMessage` protocol this library mocks.
- [Stellar Wallets Kit](https://github.com/Creit-Tech/Stellar-Wallets-Kit) by Creit Tech — the wallet abstraction layer whose `localStorage` conventions this library pre-seeds for seamless integration.
- [Synpress](https://github.com/Synthetixio/synpress) — E2E testing framework for Ethereum dApps with MetaMask, which demonstrated the value of automated wallet testing in CI pipelines.

## License

MIT
