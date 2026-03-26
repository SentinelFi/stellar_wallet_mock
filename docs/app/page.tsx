import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">
        stellar-wallet-mock
      </h1>
      <p className="text-xl text-text-muted mb-8">
        A mock Freighter wallet for headless E2E testing of Stellar/Soroban
        dApps using Playwright.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {[
          {
            title: "Zero dApp Code Changes",
            desc: "Works transparently with any dApp using @stellar/freighter-api or @creit-tech/stellar-wallets-kit.",
          },
          {
            title: "Real Transaction Signing",
            desc: "Uses your Stellar secret key to sign actual transactions via ed25519.",
          },
          {
            title: "Soroban Auth Support",
            desc: "Handles signAuthEntry() for smart contract authorization automatically.",
          },
          {
            title: "CI/CD Ready",
            desc: "Works in headless environments like GitHub Actions with no extra setup.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="p-4 rounded-lg border border-border bg-surface-light"
          >
            <h3 className="font-semibold text-white mb-1">{f.title}</h3>
            <p className="text-sm text-text-muted">{f.desc}</p>
          </div>
        ))}
      </div>

      <h2 className="text-2xl font-bold text-white mb-4">Why?</h2>
      <p className="text-text-muted mb-4">
        Testing Stellar dApps end-to-end traditionally requires a real browser
        wallet extension, manual clicks through approval dialogs, and often
        test-specific code paths in your dApp. <strong className="text-white">stellar-wallet-mock</strong>{" "}
        eliminates all of that by intercepting the{" "}
        <code>window.postMessage</code> protocol between your dApp and the
        Freighter wallet extension.
      </p>
      <p className="text-text-muted mb-8">
        Everything above the interception point runs exactly as it would in
        production — if the Stellar Wallets Kit has a bug or if freighter-api
        changes its message format, your tests will catch it.
      </p>

      <div className="flex gap-4">
        <Link
          href="/installation"
          className="px-6 py-3 bg-primary hover:bg-primary-dark text-white rounded-lg font-medium transition-colors"
        >
          Get Started
        </Link>
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock"
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 border border-border hover:border-text-muted text-text-muted hover:text-white rounded-lg font-medium transition-colors"
        >
          View on GitHub
        </a>
      </div>
    </div>
  );
}
