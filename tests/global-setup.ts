import { Keypair } from "@stellar/stellar-sdk";

/**
 * Global setup: funds the test account on testnet via friendbot.
 * This runs once before all tests.
 */
async function globalSetup() {
  const TEST_SECRET_KEY =
    "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ";
  const kp = Keypair.fromSecret(TEST_SECRET_KEY);
  const publicKey = kp.publicKey();

  console.log(`Funding test account ${publicKey} via friendbot...`);
  try {
    const res = await fetch(
      `https://friendbot.stellar.org/?addr=${publicKey}`
    );
    if (res.ok) {
      console.log("Test account funded successfully.");
    } else {
      const text = await res.text();
      // Account already funded is fine
      if (
        text.includes("createAccountAlreadyExist") ||
        text.includes("already funded")
      ) {
        console.log("Test account already funded.");
      } else {
        console.warn(`Friendbot response: ${res.status} — ${text}`);
      }
    }
  } catch (err) {
    console.warn("Failed to fund test account (may already be funded):", err);
  }
}

export default globalSetup;
