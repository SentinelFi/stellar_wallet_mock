import { test, expect } from "@playwright/test";
import { Keypair, Networks } from "@stellar/stellar-sdk";
import { installMockStellarWallet } from "../src/installMockWallet";

const TEST_SECRET_KEY =
  "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";
const TEST_PUBLIC_KEY = Keypair.fromSecret(TEST_SECRET_KEY).publicKey();
const DAPP_URL = "http://localhost:5173";

test.describe("scaffold test-dapp E2E", () => {
  // Run serially — all tests share the same testnet account,
  // so concurrent transactions cause sequence number conflicts.
  test.describe.configure({ mode: "serial" });

  test("wallet connects and shows address", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // The scaffold's WalletProvider reads localStorage and displays
    // the connected wallet address in the header area.
    // Wait for the wallet state to be picked up.
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });
  });

  test("counter increment signs and updates count", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Wait for wallet to be connected
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });

    // Click increment button
    const incrementBtn = page.getByTestId("increment-btn");
    await expect(incrementBtn).toBeEnabled({ timeout: 5_000 });
    await incrementBtn.click();

    // Wait for transaction to complete — the count should update
    const counterValue = page.getByTestId("counter-value");
    await expect(counterValue).not.toContainText("—", { timeout: 45_000 });

    // The count should be a positive number
    const text = await counterValue.textContent();
    const match = text?.match(/(\d+)/);
    expect(match).toBeTruthy();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  test("counter get_count reads without signing", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Get count is a read-only call — no wallet connection required
    const getCountBtn = page.getByTestId("get-count-btn");
    await expect(getCountBtn).toBeVisible({ timeout: 10_000 });
    await getCountBtn.click();

    // The counter value should update to show a number (possibly 0)
    const counterValue = page.getByTestId("counter-value");
    await expect(counterValue).toContainText(/\d+/, { timeout: 15_000 });
  });

  test("vault deposit triggers auth entry signing", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Wait for wallet to be connected
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });

    // Enter deposit amount (small amount for testing)
    const depositInput = page.getByTestId("deposit-input");
    await expect(depositInput).toBeVisible({ timeout: 5_000 });
    await depositInput.fill("1");

    // Click deposit — this triggers require_auth which exercises auth entry signing
    const depositBtn = page.getByTestId("deposit-btn");
    await expect(depositBtn).toBeEnabled();
    await depositBtn.click();

    // Wait for the transaction to complete.
    // After deposit, the vault balance should update.
    const vaultBalance = page.getByTestId("vault-balance");
    await expect(vaultBalance).not.toContainText("—", { timeout: 45_000 });
  });

  test("vault refresh balance reads without signing", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Click refresh balance — read-only call
    const refreshBtn = page.getByTestId("refresh-balance-btn");
    await expect(refreshBtn).toBeVisible({ timeout: 10_000 });
    await refreshBtn.click();

    // Should show a balance (possibly 0)
    const vaultBalance = page.getByTestId("vault-balance");
    await expect(vaultBalance).toContainText("XLM", { timeout: 15_000 });
  });

  test("oz vault deposit returns shares", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Wait for wallet to be connected
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });

    // Deposit 1 XLM
    const depositInput = page.getByTestId("deposit-input");
    await expect(depositInput).toBeVisible({ timeout: 5_000 });
    await depositInput.fill("1");

    const depositBtn = page.getByTestId("deposit-btn");
    await expect(depositBtn).toBeEnabled();
    await depositBtn.click();

    // Verify shares minted is shown with a positive number
    const sharesMinted = page.getByTestId("shares-minted");
    await expect(sharesMinted).toBeVisible({ timeout: 45_000 });
    const text = await sharesMinted.textContent();
    const match = text?.match(/([\d.]+)/);
    expect(match).toBeTruthy();
    expect(Number(match![1])).toBeGreaterThan(0);
  });

  test("oz vault share balance shows user shares", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Wait for wallet to be connected
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });

    // Refresh to load balances
    const refreshBtn = page.getByTestId("refresh-balance-btn");
    await expect(refreshBtn).toBeVisible({ timeout: 5_000 });
    await refreshBtn.click();

    // Share balance should show digits
    const shareBalance = page.getByTestId("share-balance");
    await expect(shareBalance).toContainText(/\d+/, { timeout: 15_000 });
  });

  test("oz vault total_assets reads without signing", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Refresh — read-only call
    const refreshBtn = page.getByTestId("refresh-balance-btn");
    await expect(refreshBtn).toBeVisible({ timeout: 10_000 });
    await refreshBtn.click();

    // Vault total assets should contain XLM
    const vaultBalance = page.getByTestId("vault-balance");
    await expect(vaultBalance).toContainText("XLM", { timeout: 15_000 });
  });

  test("oz vault withdraw reclaims assets", async ({ page }) => {
    await installMockStellarWallet({
      page,
      secretKey: TEST_SECRET_KEY,
      network: "TESTNET",
      networkPassphrase: Networks.TESTNET,
    });

    await page.goto(DAPP_URL);

    // Wait for wallet to be connected
    await expect(page.getByText(TEST_PUBLIC_KEY.slice(0, 5))).toBeVisible({
      timeout: 15_000,
    });

    // First refresh to get current balance
    const refreshBtn = page.getByTestId("refresh-balance-btn");
    await expect(refreshBtn).toBeVisible({ timeout: 5_000 });
    await refreshBtn.click();

    const vaultBalance = page.getByTestId("vault-balance");
    await expect(vaultBalance).toContainText("XLM", { timeout: 15_000 });

    // Get the balance before withdrawal
    const beforeText = await vaultBalance.textContent();
    const beforeMatch = beforeText?.match(/([\d.]+)\s*XLM/);
    const beforeBalance = beforeMatch ? Number(beforeMatch[1]) : 0;

    // Withdraw 0.5 XLM
    const withdrawInput = page.getByTestId("withdraw-input");
    await expect(withdrawInput).toBeVisible({ timeout: 5_000 });
    await withdrawInput.fill("0.5");

    const withdrawBtn = page.getByTestId("withdraw-btn");
    await expect(withdrawBtn).toBeEnabled();
    await withdrawBtn.click();

    // Wait for tx to complete — vault balance should update
    // The balance should decrease after withdrawal
    await expect(async () => {
      const afterText = await vaultBalance.textContent();
      const afterMatch = afterText?.match(/([\d.]+)\s*XLM/);
      const afterBalance = afterMatch ? Number(afterMatch[1]) : 0;
      expect(afterBalance).toBeLessThan(beforeBalance);
    }).toPass({ timeout: 45_000 });
  });
});
