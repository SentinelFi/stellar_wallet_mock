export const metadata = { title: "How It Works - stellar-wallet-mock" };

export default function HowItWorks() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">How It Works</h1>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Architecture
      </h2>
      <p className="text-text-muted mb-4">
        The mock operates at the <code>window.postMessage</code> layer — the
        universal protocol that all Freighter integrations use:
      </p>
      <pre className="text-sm">
{`Your dApp code
  ↓
stellar-wallets-kit (or freighter-api directly)
  ↓
window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_REQUEST", ... })
  ↓
stellar-wallet-mock (intercepts and responds)
  ↓
window.postMessage({ source: "FREIGHTER_EXTERNAL_MSG_RESPONSE", ... })`}
      </pre>

      <p className="text-text-muted mt-4 mb-8">
        This means it works transparently with:
      </p>
      <ul className="list-disc list-inside text-text-muted space-y-1 mb-8">
        <li><code>@stellar/freighter-api</code> directly</li>
        <li><code>@creit-tech/stellar-wallets-kit</code> with FreighterModule</li>
        <li>Raw <code>postMessage</code> calls</li>
        <li>Scaffold Stellar apps</li>
      </ul>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Message Protocol
      </h2>
      <p className="text-text-muted mb-4">
        The mock intercepts and responds to these Freighter message types:
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Message Type</th>
              <th className="py-2 text-text-muted font-medium">Purpose</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            {[
              ["REQUEST_CONNECTION_STATUS", "Wallet connection check"],
              ["REQUEST_ACCESS", "Request wallet access"],
              ["REQUEST_PUBLIC_KEY", "Get connected address"],
              ["REQUEST_NETWORK", "Get network info"],
              ["REQUEST_NETWORK_DETAILS", "Get detailed network info"],
              ["SUBMIT_TRANSACTION", "Sign a transaction XDR"],
              ["SUBMIT_AUTH_ENTRY", "Sign a Soroban auth entry"],
              ["SUBMIT_BLOB", "Sign an arbitrary message/blob"],
              ["REQUEST_ALLOWED_STATUS", "Domain allowlist check"],
              ["SET_ALLOWED_STATUS", "Set domain allowlist"],
              ["REQUEST_USER_INFO", "Get user info"],
            ].map(([type, purpose]) => (
              <tr key={type} className="border-b border-border">
                <td className="py-2 pr-4"><code>{type}</code></td>
                <td className="py-2">{purpose}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        localStorage Pre-Seeding
      </h2>
      <p className="text-text-muted mb-4">
        For dApps using <code>stellar-wallets-kit</code> or Scaffold Stellar,
        the mock pre-seeds localStorage so they boot into a connected state:
      </p>

      <h3 className="text-lg font-medium text-white mt-4 mb-2">
        stellar-wallets-kit keys
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Key</th>
              <th className="py-2 text-text-muted font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/activeAddress</code></td>
              <td className="py-2">Public key</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/selectedModuleId</code></td>
              <td className="py-2"><code>&quot;freighter&quot;</code></td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/usedWalletsIds</code></td>
              <td className="py-2"><code>[&quot;freighter&quot;]</code></td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-medium text-white mt-4 mb-2">
        Scaffold Stellar keys
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Key</th>
              <th className="py-2 text-text-muted font-medium">Value</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletId</code></td>
              <td className="py-2"><code>&quot;freighter&quot;</code></td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletAddress</code></td>
              <td className="py-2">Public key</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletNetwork</code></td>
              <td className="py-2">Network name</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>networkPassphrase</code></td>
              <td className="py-2">Network passphrase</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Implementation Details
      </h2>
      <ul className="list-disc list-inside text-text-muted space-y-2">
        <li>
          Sets <code>window.freighter = true</code> so{" "}
          <code>isConnected()</code> doesn&apos;t short-circuit
        </li>
        <li>
          Transaction signing happens in Node.js via{" "}
          <code>page.exposeFunction()</code> using{" "}
          <code>@stellar/stellar-sdk</code>
        </li>
        <li>
          Auth entry signing: SHA-256 hashes the <code>HashIdPreimage</code>{" "}
          XDR, then ed25519 signs the hash
        </li>
        <li>
          Uses the <code>messagedId</code> field name (matching the typo in
          freighter-api&apos;s response matching logic)
        </li>
        <li>
          Zero runtime dependencies beyond <code>@stellar/stellar-sdk</code>
        </li>
      </ul>
    </div>
  );
}
