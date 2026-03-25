import { test, expect } from "@playwright/test";
import { installMockStellarWallet } from "../src/installMockWallet";
import {
  Keypair,
  Networks,
  TransactionBuilder,
  Account,
  Operation,
} from "@stellar/stellar-sdk";

// A deterministic test keypair
const TEST_SECRET_KEY =
  "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";
const TEST_PUBLIC_KEY = Keypair.fromSecret(TEST_SECRET_KEY).publicKey();

const FIXTURE_URL = "http://localhost:5174";

test.describe("stellar-wallet-mock", () => {
  test("installs mock and connects automatically", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);

    // The fixture auto-checks connection on load
    const status = page.locator("#status");
    await expect(status).toHaveText("Connected", { timeout: 5000 });
    await expect(status).toHaveClass(/success/);
  });

  test("returns correct public key", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);
    await page.click("#btn-address");

    const result = page.locator("#result-address");
    await expect(result).toContainText(TEST_PUBLIC_KEY, { timeout: 5000 });
  });

  test("returns correct network details", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);
    await page.click("#btn-network");

    const result = page.locator("#result-network");
    await expect(result).toContainText("TESTNET", { timeout: 5000 });
    await expect(result).toContainText(Networks.TESTNET);
  });

  test("signs a transaction and returns valid XDR", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);

    // Build a test transaction in Node.js
    const keypair = Keypair.fromSecret(TEST_SECRET_KEY);
    const account = new Account(keypair.publicKey(), "100");
    const tx = new TransactionBuilder(account, {
      fee: "100",
      networkPassphrase: Networks.TESTNET,
    })
      .addOperation(
        Operation.manageData({
          name: "test",
          value: "hello",
        })
      )
      .setTimeout(30)
      .build();

    const unsignedXdr = tx.toXDR();

    // Inject the XDR into the page and click sign
    await page.evaluate((xdr) => {
      (window as any).__testTransactionXdr = xdr;
    }, unsignedXdr);

    await page.click("#btn-sign");

    // Check that signing succeeded
    const signResult = page.locator("#result-sign");
    await expect(signResult).toContainText("Success", { timeout: 5000 });

    const signerResult = page.locator("#result-signer");
    await expect(signerResult).toContainText(TEST_PUBLIC_KEY);
  });

  test("pre-seeds localStorage for stellar-wallets-kit", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);

    // Verify localStorage was pre-seeded
    const activeAddress = await page.evaluate(() =>
      localStorage.getItem("@StellarWalletsKit/activeAddress")
    );
    expect(activeAddress).toBe(TEST_PUBLIC_KEY);

    const selectedModule = await page.evaluate(() =>
      localStorage.getItem("@StellarWalletsKit/selectedModuleId")
    );
    expect(selectedModule).toBe("freighter");
  });

  test("sets window.freighter flag", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);

    const freighterFlag = await page.evaluate(() => (window as any).freighter);
    expect(freighterFlag).toBe(true);
  });

  test("responds to repeated polling (simulates kit behavior)", async ({
    page,
  }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(FIXTURE_URL);

    // Simulate the kit's 1-second polling: request public key and network 5 times
    const results = await page.evaluate(async () => {
      const responses: string[] = [];

      for (let i = 0; i < 5; i++) {
        const res: any = await new Promise((resolve) => {
          const msgId = Date.now() + Math.random();
          function handler(event: MessageEvent) {
            if (
              event.data?.source === "FREIGHTER_EXTERNAL_MSG_RESPONSE" &&
              event.data?.messagedId === msgId
            ) {
              window.removeEventListener("message", handler);
              resolve(event.data);
            }
          }
          window.addEventListener("message", handler);
          window.postMessage(
            {
              source: "FREIGHTER_EXTERNAL_MSG_REQUEST",
              messageId: msgId,
              type: "REQUEST_PUBLIC_KEY",
            },
            window.location.origin
          );
        });
        responses.push(res.publicKey);
        // Small delay to simulate polling interval
        await new Promise((r) => setTimeout(r, 100));
      }

      return responses;
    });

    // All 5 responses should return the same public key
    expect(results).toHaveLength(5);
    for (const pk of results) {
      expect(pk).toBe(TEST_PUBLIC_KEY);
    }
  });
});
