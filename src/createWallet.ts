import { Keypair, TransactionBuilder, Networks } from "@stellar/stellar-sdk";

export interface WalletOptions {
  network?: string;
  networkPassphrase?: string;
}

export interface MockWallet {
  keypair: Keypair;
  publicKey: string;
  network: string;
  networkPassphrase: string;
  /**
   * Returns the serialized wallet config that can be injected into a browser page.
   * This is the data the postMessage handler needs to respond to freighter-api calls.
   */
  getInjectionConfig(): WalletInjectionConfig;
}

export interface WalletInjectionConfig {
  publicKey: string;
  secretKey: string;
  network: string;
  networkPassphrase: string;
}

/**
 * Creates a mock wallet from a Stellar secret key.
 *
 * @param secretKey - Stellar secret key (starts with 'S')
 * @param options - Optional network configuration
 * @returns A MockWallet instance that can sign transactions
 */
export function createWallet(
  secretKey: string,
  options?: WalletOptions
): MockWallet {
  const keypair = Keypair.fromSecret(secretKey);
  const network = options?.network ?? "TESTNET";
  const networkPassphrase =
    options?.networkPassphrase ?? Networks.TESTNET;

  return {
    keypair,
    publicKey: keypair.publicKey(),
    network,
    networkPassphrase,
    getInjectionConfig(): WalletInjectionConfig {
      return {
        publicKey: keypair.publicKey(),
        secretKey,
        network,
        networkPassphrase,
      };
    },
  };
}
