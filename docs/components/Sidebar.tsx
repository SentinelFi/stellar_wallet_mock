"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

type NavItem = {
  href: string;
  label: string;
  children?: { href: string; label: string }[];
};

const nav: NavItem[] = [
  { href: "/", label: "Introduction" },
  { href: "/installation", label: "Installation" },
  { href: "/quickstart", label: "Quick Start" },
  {
    href: "/api",
    label: "API Reference",
    children: [
      { href: "/api#installmockstellarwallet", label: "installMockStellarWallet" },
      { href: "/api#createwallet", label: "createWallet" },
      { href: "/api#mockwallet", label: "MockWallet" },
      { href: "/api#exported-types", label: "Exported Types" },
    ],
  },
  {
    href: "/examples",
    label: "Examples",
    children: [
      { href: "/examples#1-reusable-playwright-fixture", label: "Playwright Fixture" },
      { href: "/examples#2-connect-wallet-and-verify-address", label: "Connect Wallet" },
      { href: "/examples#3-sign-a-transaction-counter-increment", label: "Sign Transaction" },
      { href: "/examples#4-deposit-xlm-into-a-vault-auth-entry-signing", label: "Vault Deposit" },
      { href: "/examples#5-withdraw-xlm-from-a-vault", label: "Vault Withdraw" },
      { href: "/examples#6-read-only-contract-calls-no-signing", label: "Read-Only Calls" },
      { href: "/examples#7-network-configuration", label: "Network Config" },
      { href: "/examples#8-playwright-configuration", label: "Playwright Config" },
      { href: "/examples#9-github-actions-ci", label: "GitHub Actions CI" },
      { href: "/examples#limitations", label: "Limitations" },
    ],
  },
  {
    href: "/how-it-works",
    label: "How It Works",
    children: [
      { href: "/how-it-works#architecture", label: "Architecture" },
      { href: "/how-it-works#message-protocol", label: "Message Protocol" },
      { href: "/how-it-works#localstorage-pre-seeding", label: "localStorage Pre-Seeding" },
      { href: "/how-it-works#implementation-details", label: "Implementation Details" },
    ],
  },
];

function NavSection({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
  const isCurrentPage = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
  const [expanded, setExpanded] = useState(isCurrentPage);

  useEffect(() => {
    if (isCurrentPage) setExpanded(true);
  }, [isCurrentPage]);

  if (!item.children) {
    return (
      <Link
        href={item.href}
        className={`px-3 py-2 rounded-md text-sm transition-colors ${
          isActive
            ? "bg-primary/20 text-primary-light font-medium"
            : "text-text-muted hover:text-white hover:bg-surface-light"
        }`}
      >
        {item.label}
      </Link>
    );
  }

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors text-left ${
          isCurrentPage
            ? "bg-primary/20 text-primary-light font-medium"
            : "text-text-muted hover:text-white hover:bg-surface-light"
        }`}
      >
        <Link href={item.href} onClick={(e) => e.stopPropagation()}>
          {item.label}
        </Link>
        <svg
          className={`w-3.5 h-3.5 transition-transform shrink-0 ${expanded ? "rotate-90" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {expanded && (
        <div className="ml-3 mt-1 flex flex-col gap-0.5 border-l border-border pl-3">
          {item.children.map((child) => (
            <Link
              key={child.href}
              href={child.href}
              className="px-2 py-1.5 rounded text-xs text-text-muted hover:text-white hover:bg-surface-light transition-colors"
            >
              {child.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 border-r border-border sticky top-0 h-screen overflow-y-auto p-6 hidden md:block">
      <Link href="/" className="block mb-8">
        <h2 className="text-lg font-bold text-white">stellar-wallet-mock</h2>
        <p className="text-xs text-text-muted mt-1">Mock Freighter for E2E tests</p>
      </Link>
      <nav className="flex flex-col gap-1">
        {nav.map((item) => (
          <NavSection key={item.href} item={item} pathname={pathname} />
        ))}
      </nav>
      <div className="mt-8 pt-6 border-t border-border">
        <a
          href="https://github.com/SentinelFi/stellar_wallet_mock"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-text-muted hover:text-white transition-colors"
        >
          GitHub
        </a>
      </div>
    </aside>
  );
}
