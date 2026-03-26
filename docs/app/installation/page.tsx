import CodeBlock from "@/components/CodeBlock";

export const metadata = { title: "Installation - stellar-wallet-mock" };

export default function Installation() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-6">Installation</h1>

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Install from GitHub
      </h2>
      <p className="text-text-muted mb-4">
        Until the package is published to npm, install directly from GitHub:
      </p>
      <CodeBlock
        language="bash"
        code={`# Latest
npm install github:SentinelFi/stellar_wallet_mock

# Specific tag
npm install github:SentinelFi/stellar_wallet_mock#v0.1.0

# Specific commit
npm install github:SentinelFi/stellar_wallet_mock#abc1234`}
      />

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Peer Dependencies
      </h2>
      <p className="text-text-muted mb-4">
        You need Playwright and a Chromium browser installed:
      </p>
      <CodeBlock
        language="bash"
        code={`npm install -D @playwright/test
npx playwright install chromium`}
      />

      <h2 className="text-xl font-semibold text-white mt-8 mb-3">
        Dependencies
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm mt-2">
          <thead>
            <tr className="border-b border-border text-left">
              <th className="py-2 pr-4 text-text-muted font-medium">Package</th>
              <th className="py-2 pr-4 text-text-muted font-medium">Type</th>
              <th className="py-2 text-text-muted font-medium">Version</th>
            </tr>
          </thead>
          <tbody className="text-text-muted">
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@stellar/stellar-sdk</code></td>
              <td className="py-2 pr-4">Production</td>
              <td className="py-2">^13.1.0</td>
            </tr>
            <tr className="border-b border-border">
              <td className="py-2 pr-4"><code>@playwright/test</code></td>
              <td className="py-2 pr-4">Peer</td>
              <td className="py-2">^1.52.0</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
