import CodeBlock from "../../components/CodeBlock";

export const metadata = { title: "How It Works - stellar-wallet-mock" };

export default function HowItWorks() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">How It Works</h1>

      <p className="text-text-muted mb-8">
        stellar-wallet-mock is a Playwright testing library that mocks the
        Freighter wallet browser extension. It lets you run headless E2E tests
        against Stellar/Soroban dApps without installing a real extension or
        interacting with any wallet UI. This page explains the architecture in
        detail so you understand exactly what happens when you call{" "}
        <code>installMockStellarWallet()</code>.
      </p>

      {/* ── Origin & Inspiration ── */}
      <h2
        id="origin-and-inspiration"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        Origin & Inspiration
      </h2>
      <p className="text-text-muted mb-4">
        The core architecture of stellar-wallet-mock is adapted from{" "}
        <a
          href="https://github.com/johanneskares/wallet-mock"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          @johanneskares/wallet-mock
        </a>
        , an Ethereum wallet mock for Playwright by Johannes Kares. Both
        libraries share the same two-step pattern:
      </p>
      <ol className="list-decimal list-inside text-text-muted space-y-2 mb-6">
        <li>
          <strong><code>page.exposeFunction()</code></strong> &mdash; registers
          a Node.js signing function so it&apos;s callable from the browser.
          The private key never enters the browser; all cryptography stays in
          Node.js.
        </li>
        <li>
          <strong><code>page.addInitScript()</code></strong> &mdash; injects a
          self-contained script (no closures, since it&apos;s serialized to a
          string) that pretends to be the real wallet extension.
        </li>
      </ol>

      <p className="text-text-muted mb-4">
        The difference is what gets mocked. wallet-mock targets the Ethereum
        ecosystem, while stellar-wallet-mock targets Stellar:
      </p>

      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium"></th>
              <th className="py-2 pr-4 text-text-muted font-medium">wallet-mock (Ethereum)</th>
              <th className="py-2 text-text-muted font-medium">stellar-wallet-mock</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium text-white">Protocol</td>
              <td className="py-2 pr-4">EIP-1193 / EIP-6963 provider</td>
              <td className="py-2">Freighter <code>window.postMessage</code></td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium text-white">Signing</td>
              <td className="py-2 pr-4"><code>viem</code> WalletClient in Node.js</td>
              <td className="py-2"><code>@stellar/stellar-sdk</code> Keypair in Node.js</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium text-white">Discovery</td>
              <td className="py-2 pr-4">Dispatches <code>eip6963:announceProvider</code> event</td>
              <td className="py-2">Sets <code>window.freighter = true</code> + pre-seeds <code>localStorage</code></td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4 font-medium text-white">Exposed function</td>
              <td className="py-2 pr-4"><code>eip1193Request</code> (single RPC handler)</td>
              <td className="py-2">Three dedicated functions (transaction, auth entry, message)</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-text-muted mb-4">
        The key adaptations for Stellar:
      </p>
      <ul className="list-disc list-inside text-text-muted space-y-2 mb-8">
        <li>
          <strong>Protocol</strong> &mdash; Ethereum wallets use the EIP-1193
          provider interface (a JavaScript object with a <code>request()</code>{" "}
          method). Freighter uses <code>window.postMessage</code> with specific
          source strings and message types. The mock replaces the EIP-6963
          event dispatch with a <code>postMessage</code> listener.
        </li>
        <li>
          <strong>Signing</strong> &mdash; wallet-mock uses <code>viem</code>{" "}
          for Ethereum signing (secp256k1). stellar-wallet-mock uses{" "}
          <code>@stellar/stellar-sdk</code> for Stellar signing (ed25519),
          including the Stellar-specific transaction hashing (network
          passphrase + envelope hash).
        </li>
        <li>
          <strong>Discovery</strong> &mdash; Ethereum wallets announce
          themselves via <code>eip6963:announceProvider</code> events.
          Freighter signals its presence by setting{" "}
          <code>window.freighter = true</code>. The mock also pre-seeds{" "}
          <code>localStorage</code> for Stellar-specific libraries, which
          Ethereum wallets don&apos;t need.
        </li>
        <li>
          <strong>Function granularity</strong> &mdash; wallet-mock exposes a
          single <code>eip1193Request</code> function that handles all RPC
          methods. stellar-wallet-mock exposes three separate functions because
          each Stellar signing type (transaction, auth entry, message) has
          different input processing.
        </li>
      </ul>

      {/* ── Architecture ── */}
      <h2
        id="architecture"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        Architecture
      </h2>
      <p className="text-text-muted mb-4">
        When your dApp communicates with the Freighter wallet, it doesn&apos;t
        talk to the browser extension directly. Instead, it uses{" "}
        <code>window.postMessage()</code> &mdash; a standard browser API for
        cross-context messaging. The real Freighter extension listens for these
        messages and responds. stellar-wallet-mock replaces that listener with
        its own, so your dApp can&apos;t tell the difference.
      </p>

      <pre className="text-sm mb-4">
{`Playwright Test
    |
    v
installMockStellarWallet(page, secretKey)
    |
    |-- createWallet(secretKey)          -- creates a real Keypair in Node.js
    |
    |-- page.exposeFunction() x3         -- bridges Node.js signing into the browser
    |     * __stellarMockSignTransaction
    |     * __stellarMockSignAuthEntry
    |     * __stellarMockSignMessage
    |
    +-- page.addInitScript()             -- injects mock before the dApp loads
          * sets window.freighter = true
          * pre-seeds localStorage
          * listens for postMessage events (Freighter protocol)
          * routes signing requests to the exposed Node.js functions`}
      </pre>

      <p className="text-text-muted mb-4">
        The mock operates at the <code>window.postMessage</code> layer &mdash;
        the universal protocol that all Freighter integrations use. This means
        it works transparently with:
      </p>
      <ul className="list-disc list-inside text-text-muted space-y-1 mb-8">
        <li><code>@stellar/freighter-api</code> directly</li>
        <li><code>@creit-tech/stellar-wallets-kit</code> with FreighterModule</li>
        <li>Scaffold Stellar apps</li>
        <li>Any code that sends raw <code>postMessage</code> calls using the Freighter protocol</li>
      </ul>

      {/* ── The Bridge Pattern ── */}
      <h2
        id="the-bridge-pattern"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        The Bridge Pattern
      </h2>
      <p className="text-text-muted mb-4">
        The central design challenge is that signing requires{" "}
        <code>@stellar/stellar-sdk</code>, which is a Node.js library. But the
        mock script runs inside the browser &mdash; injected via{" "}
        <code>page.addInitScript()</code> &mdash; where Node.js modules
        aren&apos;t available.
      </p>
      <p className="text-text-muted mb-4">
        The solution is Playwright&apos;s{" "}
        <code>page.exposeFunction()</code>. This API registers a Node.js
        function and makes it callable from the browser as if it were a normal{" "}
        <code>window</code> function. Playwright handles the IPC
        (inter-process communication) behind the scenes.
      </p>

      <p className="text-text-muted mb-2 font-medium text-white">
        Node.js side &mdash; register the signing function:
      </p>
      <CodeBlock
        language="typescript"
        filename="installMockWallet.ts (Node.js context)"
        code={`await page.exposeFunction(
  "__stellarMockSignTransaction",
  async (transactionXdr: string): Promise<string> => {
    // This runs in Node.js — stellar-sdk is available here
    const kp = Keypair.fromSecret(secretKey);
    const tx = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    tx.sign(kp);
    return tx.toXDR();
  }
);`}
      />

      <p className="text-text-muted mb-2 font-medium text-white">
        Browser side &mdash; call it like a local async function:
      </p>
      <CodeBlock
        language="typescript"
        filename="browserMockScript (browser context)"
        code={`// Inside the injected browser script
const signedXdr = await window.__stellarMockSignTransaction(
  data.transactionXdr
);`}
      />

      <p className="text-text-muted mb-4">
        When the browser calls{" "}
        <code>window.__stellarMockSignTransaction()</code>, Playwright:
      </p>
      <ol className="list-decimal list-inside text-text-muted space-y-1 mb-4">
        <li>Sends the arguments from the browser process to the Node.js process</li>
        <li>Executes the Node.js function (where <code>stellar-sdk</code> signs the transaction)</li>
        <li>Sends the return value back to the browser</li>
        <li>Resolves the Promise in the browser</li>
      </ol>
      <p className="text-text-muted mb-8">
        The private key never enters the browser. All cryptography stays in
        Node.js, just as it would with a real extension.
      </p>

      {/* ── Browser Injection ── */}
      <h2
        id="browser-injection"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        Browser Injection
      </h2>
      <p className="text-text-muted mb-4">
        The mock script is injected via{" "}
        <code>page.addInitScript(browserMockScript, config)</code>. This
        Playwright API runs the given function in the browser context{" "}
        <strong>before any page JavaScript executes</strong>. This is critical
        &mdash; the mock must be in place before the dApp tries to detect or
        communicate with Freighter.
      </p>
      <p className="text-text-muted mb-4">
        Because <code>addInitScript</code> serializes the function to a string,
        the script must be <strong>completely self-contained</strong>. It
        cannot close over any external variables or import any modules. All
        configuration is passed in as a parameter:
      </p>
      <CodeBlock
        language="typescript"
        filename="installMockWallet.ts"
        code={`// config is serialized to JSON and passed into the browser
await page.addInitScript(browserMockScript, {
  publicKey: wallet.publicKey,
  secretKey: secretKey,
  network: wallet.network,
  networkPassphrase: wallet.networkPassphrase,
});`}
      />
      <p className="text-text-muted mb-4">
        Once injected, the script does three things:
      </p>
      <ol className="list-decimal list-inside text-text-muted space-y-2 mb-8">
        <li>
          <strong>Sets <code>window.freighter = true</code></strong> &mdash;
          this is how <code>freighter-api</code>&apos;s{" "}
          <code>isConnected()</code> detects that the extension is present.
          Without it, the dApp short-circuits and never sends any messages.
        </li>
        <li>
          <strong>Pre-seeds localStorage</strong> &mdash; libraries like{" "}
          <code>@creit-tech/stellar-wallets-kit</code> and Scaffold Stellar check
          localStorage to see if a wallet was previously connected. The mock
          populates these keys so the dApp boots into a &ldquo;connected&rdquo;
          state without showing modal dialogs (which would hang headless tests).
        </li>
        <li>
          <strong>Listens for <code>window.postMessage</code> events</strong>{" "}
          &mdash; intercepts every message with{" "}
          <code>source: &quot;FREIGHTER_EXTERNAL_MSG_REQUEST&quot;</code> and
          responds with the appropriate data.
        </li>
      </ol>

      {/* ── Message Protocol ── */}
      <h2
        id="message-protocol"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        Message Protocol
      </h2>
      <p className="text-text-muted mb-4">
        The Freighter extension communicates with dApps via a specific{" "}
        <code>postMessage</code> protocol. Each request has a{" "}
        <code>source</code> of{" "}
        <code>&quot;FREIGHTER_EXTERNAL_MSG_REQUEST&quot;</code>, a unique{" "}
        <code>messageId</code>, and a <code>type</code> field indicating what
        the dApp wants. The mock intercepts these and responds with{" "}
        <code>source: &quot;FREIGHTER_EXTERNAL_MSG_RESPONSE&quot;</code>.
      </p>

      <p className="text-text-muted mb-2 font-medium text-white">
        Request format (dApp &rarr; mock):
      </p>
      <CodeBlock
        language="typescript"
        code={`window.postMessage({
  source: "FREIGHTER_EXTERNAL_MSG_REQUEST",
  messageId: "<unique-id>",
  type: "REQUEST_PUBLIC_KEY",  // or SUBMIT_TRANSACTION, etc.
  transactionXdr: "...",       // only for SUBMIT_TRANSACTION
  entryXdr: "...",             // only for SUBMIT_AUTH_ENTRY
  blob: "...",                 // only for SUBMIT_BLOB
}, window.location.origin);`}
      />

      <p className="text-text-muted mb-2 font-medium text-white">
        Response format (mock &rarr; dApp):
      </p>
      <CodeBlock
        language="typescript"
        code={`window.postMessage({
  source: "FREIGHTER_EXTERNAL_MSG_RESPONSE",
  messagedId: "<matching-id>",  // note: "messagedId" — typo in Freighter protocol
  publicKey: "G...",
  signedTransaction: "...",
  // ... other fields depending on request type
}, window.location.origin);`}
      />

      <p className="text-text-muted mb-4">
        Note the <code>messagedId</code> field name &mdash; this is a typo in
        Freighter&apos;s actual protocol (it should be{" "}
        <code>messageId</code>). The mock reproduces this typo exactly, because{" "}
        <code>freighter-api</code> matches responses using this misspelled
        field. Getting it wrong would silently break response matching.
      </p>

      <p className="text-text-muted mb-4">
        The mock handles the following message types:
      </p>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Message Type</th>
              <th className="py-2 pr-4 text-text-muted font-medium">Purpose</th>
              <th className="py-2 text-text-muted font-medium">Response</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            {[
              ["REQUEST_CONNECTION_STATUS", "Check if wallet is connected", "isConnected: true"],
              ["REQUEST_ACCESS", "Request wallet access", "publicKey"],
              ["REQUEST_PUBLIC_KEY", "Get the connected address", "publicKey"],
              ["REQUEST_NETWORK", "Get network name and passphrase", "network, networkPassphrase"],
              ["REQUEST_NETWORK_DETAILS", "Get detailed network info", "network, networkPassphrase, sorobanRpcUrl"],
              ["SUBMIT_TRANSACTION", "Sign a transaction XDR", "signedTransaction, signerAddress"],
              ["SUBMIT_AUTH_ENTRY", "Sign a Soroban auth entry", "signedAuthEntry, signerAddress"],
              ["SUBMIT_BLOB", "Sign an arbitrary message", "signedMessage, signerAddress"],
              ["REQUEST_ALLOWED_STATUS", "Check domain allowlist", "isAllowed: true"],
              ["SET_ALLOWED_STATUS", "Set domain allowlist", "isAllowed: true"],
              ["REQUEST_USER_INFO", "Get user info", "publicKey"],
            ].map(([type, purpose, response]) => (
              <tr key={type} className="border-b border-border">
                <td className="py-2 pr-4"><code>{type}</code></td>
                <td className="py-2 pr-4">{purpose}</td>
                <td className="py-2"><code>{response}</code></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── localStorage Pre-Seeding ── */}
      <h2
        id="localstorage-pre-seeding"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        localStorage Pre-Seeding
      </h2>
      <p className="text-text-muted mb-4">
        Intercepting <code>postMessage</code> alone isn&apos;t enough for all
        dApps. Libraries like <code>@creit-tech/stellar-wallets-kit</code> and Scaffold
        Stellar check <code>localStorage</code> on page load to determine if a
        wallet was previously connected. If these keys are missing, the dApp
        shows a &ldquo;Connect Wallet&rdquo; modal &mdash; which hangs
        headless tests because there&apos;s no user to click it.
      </p>
      <p className="text-text-muted mb-4">
        The mock pre-seeds these localStorage keys before the dApp code runs,
        so the dApp boots directly into a connected state.
      </p>

      <h3 className="text-lg font-medium text-white mt-6 mb-2">
        stellar-wallets-kit keys
      </h3>
      <p className="text-text-muted mb-3">
        <code>@creit-tech/stellar-wallets-kit</code> persists wallet state
        under these keys:
      </p>
      <div className="overflow-x-auto mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Key</th>
              <th className="py-2 pr-4 text-text-muted font-medium">Value</th>
              <th className="py-2 text-text-muted font-medium">Why</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/activeAddress</code></td>
              <td className="py-2 pr-4">Public key</td>
              <td className="py-2">Kit reads this to restore the active account</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/selectedModuleId</code></td>
              <td className="py-2 pr-4"><code>&quot;freighter&quot;</code></td>
              <td className="py-2">Tells the kit which wallet module to use</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@StellarWalletsKit/usedWalletsIds</code></td>
              <td className="py-2 pr-4"><code>[&quot;freighter&quot;]</code></td>
              <td className="py-2">Marks Freighter as a previously-used wallet</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 className="text-lg font-medium text-white mt-6 mb-2">
        Scaffold Stellar keys
      </h3>
      <p className="text-text-muted mb-3">
        Scaffold Stellar&apos;s <code>WalletProvider</code> uses its own
        localStorage keys (JSON-stringified via a typed storage utility):
      </p>
      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Key</th>
              <th className="py-2 pr-4 text-text-muted font-medium">Value</th>
              <th className="py-2 text-text-muted font-medium">Why</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletId</code></td>
              <td className="py-2 pr-4"><code>&quot;freighter&quot;</code></td>
              <td className="py-2">Identifies the connected wallet type</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletAddress</code></td>
              <td className="py-2 pr-4">Public key</td>
              <td className="py-2">Restores the connected account address</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>walletNetwork</code></td>
              <td className="py-2 pr-4">Network name</td>
              <td className="py-2">Restores the selected network</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>networkPassphrase</code></td>
              <td className="py-2 pr-4">Network passphrase</td>
              <td className="py-2">Required for transaction signing context</td>
            </tr>
          </tbody>
        </table>
      </div>

      <p className="text-text-muted mb-8">
        If your dApp doesn&apos;t use either of these libraries, the extra
        localStorage keys are harmless &mdash; the core{" "}
        <code>postMessage</code> mock works regardless.
      </p>

      {/* ── Signing in Detail ── */}
      <h2
        id="signing-in-detail"
        className="text-xl font-semibold text-white mt-10 mb-3 scroll-mt-8"
      >
        Signing in Detail
      </h2>
      <p className="text-text-muted mb-4">
        The mock exposes three signing functions from Node.js to the browser.
        Each handles a different type of signing operation that Freighter
        supports:
      </p>

      <h3 className="text-lg font-medium text-white mt-6 mb-2">
        Transaction signing
      </h3>
      <p className="text-text-muted mb-3">
        When the dApp sends <code>SUBMIT_TRANSACTION</code> with a transaction
        XDR, the mock calls <code>__stellarMockSignTransaction</code>:
      </p>
      <CodeBlock
        language="typescript"
        filename="Node.js signing function"
        code={`async (transactionXdr: string): Promise<string> => {
  const kp = Keypair.fromSecret(secretKey);
  const tx = TransactionBuilder.fromXDR(
    transactionXdr, networkPassphrase
  );
  tx.sign(kp);          // ed25519 signature over network hash + tx envelope
  return tx.toXDR();    // return signed XDR back to the browser
}`}
      />
      <p className="text-text-muted mb-4">
        This is real cryptographic signing using <code>@stellar/stellar-sdk</code>.
        The signed transaction is valid and can be submitted to the Stellar
        network.
      </p>

      <h3 className="text-lg font-medium text-white mt-6 mb-2">
        Soroban auth entry signing
      </h3>
      <p className="text-text-muted mb-3">
        When the dApp sends <code>SUBMIT_AUTH_ENTRY</code>, the mock calls{" "}
        <code>__stellarMockSignAuthEntry</code>:
      </p>
      <CodeBlock
        language="typescript"
        filename="Node.js signing function"
        code={`async (entryXdr: string): Promise<string> => {
  const kp = Keypair.fromSecret(secretKey);
  // entryXdr is a HashIdPreimage XDR (base64) from authorizeEntry
  const preimageBytes = Buffer.from(entryXdr, "base64");
  const hash = crypto.createHash("sha256").update(preimageBytes).digest();
  const signature = kp.sign(hash);  // ed25519 sign the SHA-256 hash
  return signature.toString("base64");
}`}
      />
      <p className="text-text-muted mb-4">
        Soroban auth entries require a two-step process: SHA-256 hash the{" "}
        <code>HashIdPreimage</code> XDR, then ed25519 sign the hash. This is
        the same process the real Freighter extension uses.
      </p>

      <h3 className="text-lg font-medium text-white mt-6 mb-2">
        Arbitrary message signing
      </h3>
      <p className="text-text-muted mb-3">
        When the dApp sends <code>SUBMIT_BLOB</code>, the mock calls{" "}
        <code>__stellarMockSignMessage</code>:
      </p>
      <CodeBlock
        language="typescript"
        filename="Node.js signing function"
        code={`async (message: string): Promise<string> => {
  const kp = Keypair.fromSecret(secretKey);
  const messageBuf = Buffer.from(message, "utf-8");
  const signature = kp.sign(messageBuf);  // ed25519 sign raw bytes
  return signature.toString("base64");
}`}
      />
      <p className="text-text-muted mb-8">
        This signs arbitrary UTF-8 messages with ed25519, returning a
        base64-encoded signature.
      </p>

    </div>
  );
}
