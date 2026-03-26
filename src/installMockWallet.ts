import { type Page } from "@playwright/test";
import { createWallet, type MockWallet, type WalletOptions } from "./createWallet";

export interface InstallMockWalletOptions {
  page: Page;
  secretKey: string;
  network?: string;
  networkPassphrase?: string;
}

/**
 * The script that runs inside the browser page.
 * It intercepts postMessage requests from @stellar/freighter-api
 * and responds with mock wallet data.
 *
 * This function is serialized and injected via page.addInitScript(),
 * so it must be fully self-contained — no closures over external variables.
 */
function browserMockScript(config: {
  publicKey: string;
  secretKey: string;
  network: string;
  networkPassphrase: string;
}) {
  const EXTERNAL_MSG_REQUEST = "FREIGHTER_EXTERNAL_MSG_REQUEST";
  const EXTERNAL_MSG_RESPONSE = "FREIGHTER_EXTERNAL_MSG_RESPONSE";

  // Signal to freighter-api's isConnected() that the extension is present.
  // Without this, isConnected() short-circuits to false before even trying postMessage.
  (window as any).freighter = true;

  // Pre-seed localStorage for stellar-wallets-kit so dApps using it
  // boot into a "connected" state without needing the auth modal.
  try {
    localStorage.setItem(
      "@StellarWalletsKit/activeAddress",
      config.publicKey
    );
    localStorage.setItem(
      "@StellarWalletsKit/selectedModuleId",
      "freighter"
    );
    localStorage.setItem(
      "@StellarWalletsKit/usedWalletsIds",
      JSON.stringify(["freighter"])
    );

    // Pre-seed localStorage for scaffold-stellar's WalletProvider.
    // The scaffold reads these keys (via its typed storage utility which
    // JSON.stringify's values) to restore wallet state on page load.
    localStorage.setItem("walletId", JSON.stringify("freighter"));
    localStorage.setItem("walletAddress", JSON.stringify(config.publicKey));
    localStorage.setItem("walletNetwork", JSON.stringify(config.network));
    localStorage.setItem(
      "networkPassphrase",
      JSON.stringify(config.networkPassphrase)
    );
  } catch {
    // localStorage may not be available in some contexts
  }

  /**
   * Sign a Stellar transaction XDR using the mock secret key.
   *
   * We dynamically import the stellar-sdk that's already loaded in the page
   * is NOT available here — this runs in the browser context. Instead, we
   * use the low-level approach: the freighter-api only needs the signed XDR
   * back. We use the browser's crypto API + stellar-base logic.
   *
   * However, since we can't import stellar-sdk in the browser injection script,
   * we use a simpler approach: we parse the XDR, sign with nacl/ed25519.
   *
   * Actually, the cleanest approach for a mock is to use the page's own
   * stellar SDK if available, or do the signing server-side and pass it in.
   *
   * For the mock, we'll do the signing in Node.js (in the Playwright context)
   * and use a request/response bridge. But that's complex.
   *
   * SIMPLEST APPROACH: For the browser script, we store the secret key and
   * use a minimal ed25519 signing implementation. But stellar transaction
   * signing requires hashing the network passphrase + tx envelope which is
   * complex to reimplement.
   *
   * PRAGMATIC APPROACH: We intercept the postMessage, send it to the
   * Playwright test context via a page.exposeFunction bridge, get the
   * signed result back, and respond.
   *
   * CHOSEN APPROACH: We expose a signing function from Node.js to the browser
   * via page.exposeFunction, then the browser mock calls it for signing.
   */

  // Listen for postMessage requests from freighter-api
  window.addEventListener("message", async (event: MessageEvent) => {
    const data = event.data;

    // Only intercept freighter-api requests
    if (!data || data.source !== EXTERNAL_MSG_REQUEST) return;

    const { messageId, type } = data;
    let response: Record<string, unknown> = {};

    switch (type) {
      case "REQUEST_CONNECTION_STATUS":
        response = { isConnected: true };
        break;

      case "REQUEST_ACCESS":
        response = { publicKey: config.publicKey };
        break;

      case "REQUEST_PUBLIC_KEY":
        response = { publicKey: config.publicKey };
        break;

      case "REQUEST_NETWORK":
        response = {
          network: config.network,
          networkPassphrase: config.networkPassphrase,
        };
        break;

      case "REQUEST_NETWORK_DETAILS":
        response = {
          network: config.network,
          networkPassphrase: config.networkPassphrase,
          sorobanRpcUrl: undefined,
        };
        break;

      case "SUBMIT_TRANSACTION": {
        // Use the exposed Node.js signing function
        try {
          const signedXdr = await (window as any).__stellarMockSignTransaction(
            data.transactionXdr
          );
          response = {
            signedTransaction: signedXdr,
            signerAddress: config.publicKey,
          };
        } catch (err: any) {
          response = {
            error: { code: -1, message: err?.message || "Signing failed" },
          };
        }
        break;
      }

      case "SUBMIT_AUTH_ENTRY": {
        try {
          const signedEntry = await (window as any).__stellarMockSignAuthEntry(
            data.entryXdr
          );
          response = {
            signedAuthEntry: signedEntry,
            signerAddress: config.publicKey,
          };
        } catch (err: any) {
          response = {
            error: { code: -1, message: err?.message || "Auth entry signing failed" },
          };
        }
        break;
      }

      case "SUBMIT_BLOB": {
        try {
          const signedBlob = await (window as any).__stellarMockSignMessage(
            data.blob
          );
          response = {
            signedMessage: signedBlob,
            signerAddress: config.publicKey,
          };
        } catch (err: any) {
          response = {
            error: { code: -1, message: err?.message || "Message signing failed" },
          };
        }
        break;
      }

      case "REQUEST_ALLOWED_STATUS":
        response = { isAllowed: true };
        break;

      case "SET_ALLOWED_STATUS":
        response = { isAllowed: true };
        break;

      case "REQUEST_USER_INFO":
        response = { publicKey: config.publicKey };
        break;

      default:
        response = {
          error: { code: -3, message: `Unsupported message type: ${type}` },
        };
        break;
    }

    // Send the response via postMessage so that event.source === window,
    // which freighter-api v5+ checks when matching responses.
    // Note: freighter-api uses "messagedId" (typo) for matching.
    window.postMessage(
      {
        source: EXTERNAL_MSG_RESPONSE,
        messagedId: messageId,
        ...response,
      },
      window.location.origin
    );
  });
}

/**
 * Installs a mock Freighter wallet into a Playwright page.
 *
 * This intercepts the postMessage protocol between @stellar/freighter-api
 * and the Freighter browser extension, allowing headless E2E tests to
 * connect, sign transactions, and interact with any Soroban dApp without
 * a real wallet extension.
 *
 * @example
 * ```ts
 * import { installMockStellarWallet } from 'stellar-wallet-mock';
 *
 * test('connects wallet', async ({ page }) => {
 *   await installMockStellarWallet({
 *     page,
 *     secretKey: 'SCZANGBA5YHTNYVVV3C7CAZMCLXPILHSE6PGYAY2TDGPMWRCKOXEB2OI',
 *   });
 *   await page.goto('http://localhost:5173');
 *   // dApp now sees a connected Freighter wallet
 * });
 * ```
 */
export async function installMockStellarWallet(
  options: InstallMockWalletOptions
): Promise<MockWallet> {
  const { page, secretKey, network, networkPassphrase } = options;

  const wallet = createWallet(secretKey, { network, networkPassphrase });
  const injectionConfig = wallet.getInjectionConfig();

  // Expose Node.js signing functions to the browser context.
  // These are called by the browser mock script when it needs to sign.
  await page.exposeFunction(
    "__stellarMockSignTransaction",
    async (transactionXdr: string): Promise<string> => {
      const {
        TransactionBuilder,
        Keypair,
        Networks,
      } = require("@stellar/stellar-sdk");

      const kp = Keypair.fromSecret(secretKey);
      const tx = TransactionBuilder.fromXDR(
        transactionXdr,
        wallet.networkPassphrase
      );
      tx.sign(kp);
      return tx.toXDR();
    }
  );

  await page.exposeFunction(
    "__stellarMockSignAuthEntry",
    async (entryXdr: string): Promise<string> => {
      const { Keypair } = require("@stellar/stellar-sdk");
      const crypto = require("crypto");
      const kp = Keypair.fromSecret(secretKey);

      // The entryXdr is a HashIdPreimage XDR (base64) from authorizeEntry.
      // Stellar convention: SHA-256 hash the preimage, then ed25519 sign the hash.
      const preimageBytes = Buffer.from(entryXdr, "base64");
      const hash = crypto.createHash("sha256").update(preimageBytes).digest();
      const signature = kp.sign(hash);
      return signature.toString("base64");
    }
  );

  await page.exposeFunction(
    "__stellarMockSignMessage",
    async (message: string): Promise<string> => {
      const { Keypair } = require("@stellar/stellar-sdk");
      const kp = Keypair.fromSecret(secretKey);

      const messageBuf = Buffer.from(message, "utf-8");
      const signature = kp.sign(messageBuf);
      return signature.toString("base64");
    }
  );

  // Inject the mock script before any page JavaScript runs.
  // addInitScript runs in the page context before any script on the page.
  await page.addInitScript(browserMockScript, injectionConfig);

  return wallet;
}
