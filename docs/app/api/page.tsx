import CodeBlock from "@/components/CodeBlock";

export const metadata = { title: "API Reference - stellar-wallet-mock" };

export default function ApiReference() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">API Reference</h1>

      {/* installMockStellarWallet */}
      <section id="installmockstellarwallet" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-white mb-3">
          <code>installMockStellarWallet(options)</code>
        </h2>
        <p className="text-text-muted mb-4">
          Installs the mock wallet into a Playwright page. Must be called{" "}
          <strong className="text-white">before</strong>{" "}
          <code>page.goto()</code>.
        </p>

        <h3 className="text-lg font-medium text-white mt-6 mb-2">Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-text-muted font-medium">Parameter</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Type</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Required</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Default</th>
                <th className="py-2 text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>page</code></td>
                <td className="py-2 pr-4"><code>Page</code></td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2 pr-4">-</td>
                <td className="py-2">Playwright Page instance</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>secretKey</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2 pr-4">-</td>
                <td className="py-2">Stellar secret key (starts with S)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>network</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4"><code>&quot;TESTNET&quot;</code></td>
                <td className="py-2">Network name</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>networkPassphrase</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2 pr-4"><code>Networks.TESTNET</code></td>
                <td className="py-2">Stellar network passphrase</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3 className="text-lg font-medium text-white mt-6 mb-2">Returns</h3>
        <p className="text-text-muted mb-2">
          <code>Promise&lt;MockWallet&gt;</code>
        </p>

        <CodeBlock
          code={`const wallet = await installMockStellarWallet({
  page,
  secretKey: "SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ",
  network: "TESTNET",
});

console.log(wallet.publicKey); // "GBIIN6LP..."`}
        />
      </section>

      {/* createWallet */}
      <section id="createwallet" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-white mb-3">
          <code>createWallet(secretKey, options?)</code>
        </h2>
        <p className="text-text-muted mb-4">
          Creates a wallet instance without installing it into a page. Useful
          for getting the public key or keypair before page setup.
        </p>

        <h3 className="text-lg font-medium text-white mt-6 mb-2">Parameters</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-text-muted font-medium">Parameter</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Type</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Required</th>
                <th className="py-2 text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>secretKey</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2 pr-4">Yes</td>
                <td className="py-2">Stellar secret key</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>options</code></td>
                <td className="py-2 pr-4"><code>WalletOptions</code></td>
                <td className="py-2 pr-4">No</td>
                <td className="py-2">Network configuration</td>
              </tr>
            </tbody>
          </table>
        </div>

        <CodeBlock
          code={`import { createWallet } from "stellar-wallet-mock";

const wallet = createWallet("SDPDMYEWFZEL6MW37FTPNTPZFYU2QYX4MLDSA7QBS4VSNZL5JL4IKDVQ");
console.log(wallet.publicKey); // "GBIIN6LP..."`}
        />
      </section>

      {/* MockWallet */}
      <section id="mockwallet" className="mb-12 scroll-mt-8">
        <h2 className="text-2xl font-semibold text-white mb-3">
          <code>MockWallet</code>
        </h2>
        <p className="text-text-muted mb-4">
          The wallet object returned by both <code>installMockStellarWallet</code>{" "}
          and <code>createWallet</code>.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="py-2 pr-4 text-text-muted font-medium">Property</th>
                <th className="py-2 pr-4 text-text-muted font-medium">Type</th>
                <th className="py-2 text-text-muted font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-text-muted">
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>keypair</code></td>
                <td className="py-2 pr-4"><code>Keypair</code></td>
                <td className="py-2">Stellar Keypair instance</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>publicKey</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2">Public key (starts with G)</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>network</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2">Network name</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>networkPassphrase</code></td>
                <td className="py-2 pr-4"><code>string</code></td>
                <td className="py-2">Network passphrase</td>
              </tr>
              <tr className="border-b border-border">
                <td className="py-2 pr-4"><code>getInjectionConfig()</code></td>
                <td className="py-2 pr-4"><code>WalletInjectionConfig</code></td>
                <td className="py-2">Returns serialized config for browser injection</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* Exported Types */}
      <section id="exported-types" className="scroll-mt-8">
        <h2 className="text-2xl font-semibold text-white mb-3">
          Exported Types
        </h2>
        <CodeBlock
          code={`import type {
  MockWallet,              // Wallet instance
  WalletOptions,           // Network config options
  WalletInjectionConfig,   // Serialized config for browser
  InstallMockWalletOptions // Options for installMockStellarWallet()
} from "stellar-wallet-mock";`}
        />
      </section>
    </div>
  );
}
