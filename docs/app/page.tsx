import Link from "next/link";

export default function Home() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-4">
        stellar-wallet-mock
      </h1>

      <h2 id="what" className="text-2xl font-bold text-white mt-8 mb-4 scroll-mt-8">What</h2>
      <p className="text-xl text-text-muted mb-8">
        A Playwright testing library that mocks the Freighter wallet browser
        extension, letting you run headless E2E tests against Stellar/Soroban
        dApps without a real wallet extension. No browser extension needed. No
        manual wallet interaction. Works with any dApp that uses{" "}
        <code>@stellar/freighter-api</code> — zero dApp code changes
        required.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 mb-12">
        {[
          {
            title: "Zero dApp Code Changes",
            desc: "Works transparently with any dApp using @stellar/freighter-api.",
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

      <h2 id="why" className="text-2xl font-bold text-white mb-4 scroll-mt-8">Why</h2>
      <p className="text-text-muted mb-4">
        Testing Stellar dApps end-to-end traditionally requires a real browser
        wallet extension, manual clicks through approval dialogs, and often
        test-specific code paths in your dApp. <strong className="text-white">stellar-wallet-mock</strong>{" "}
        eliminates all of that by intercepting the{" "}
        <code>window.postMessage</code> protocol between your dApp and the
        Freighter wallet extension.
      </p>
      <p className="text-text-muted mb-4">
        The goal is to automate your frontend tests — verify that your dApp
        connects to wallets, reads contract state, and submits transactions
        correctly, all without manual interaction.
      </p>

      <h3 id="compatibility" className="text-xl font-semibold text-white mt-6 mb-3 scroll-mt-8">
        Compatibility
      </h3>
      <p className="text-text-muted mb-4">
        Intercepting <code>postMessage</code> is enough for dApps that use{" "}
        <code>@stellar/freighter-api</code> directly. But popular frameworks
        like{" "}
        <a
          href="https://github.com/theahaco/scaffold-stellar"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          Scaffold Stellar
        </a>{" "}
        and{" "}
        <a
          href="https://github.com/Creit-Tech/Stellar-Wallets-Kit"
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          @creit-tech/stellar-wallets-kit
        </a>{" "}
        also check <code>localStorage</code> on page load to restore previous
        wallet connections. If those keys are missing, the dApp shows a
        &ldquo;Connect Wallet&rdquo; modal — which hangs headless tests
        because there&apos;s no user to click it.
      </p>
      <p className="text-text-muted mb-8">
        To handle this, the mock pre-seeds <code>localStorage</code> with the
        keys these libraries expect (e.g.{" "}
        <code>@StellarWalletsKit/activeAddress</code>,{" "}
        <code>walletId</code>, <code>walletAddress</code>), so the dApp boots
        directly into a connected state. See{" "}
        <a href="/how-it-works#localstorage-pre-seeding" className="text-accent hover:underline">
          localStorage Pre-Seeding
        </a>{" "}
        in How It Works for the full list of keys.
      </p>

      <h2 id="current-limitations" className="text-2xl font-bold text-white mb-4 scroll-mt-8">Current Limitations</h2>
      <div className="bg-surface-light border border-border rounded-lg p-5 mb-8">
        <ul className="space-y-3 text-sm text-text-muted">
          <li>
            <strong className="text-white">Freighter only</strong> — currently
            only mocks the Freighter wallet. Other Stellar wallets (xBull,
            Albedo, Lobstr, etc.) use different communication protocols and are
            not yet supported. Support for additional wallets is planned for
            future releases.
          </li>
          <li>
            <strong className="text-white">Chromium only</strong> —
            Playwright&apos;s <code>page.exposeFunction()</code> is used for signing,
            which works best with Chromium-based browsers.
          </li>
          <li>
            <strong className="text-white">No multi-account support</strong> — a
            single secret key is used per page. To test multi-account flows, use
            separate pages or fixtures.
          </li>
        </ul>
      </div>

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
