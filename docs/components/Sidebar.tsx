"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/", label: "Introduction" },
  { href: "/installation", label: "Installation" },
  { href: "/quickstart", label: "Quick Start" },
  { href: "/api", label: "API Reference" },
  { href: "/examples", label: "Examples" },
  { href: "/how-it-works", label: "How It Works" },
];

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
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded-md text-sm transition-colors ${
              pathname === item.href
                ? "bg-primary/20 text-primary-light font-medium"
                : "text-text-muted hover:text-white hover:bg-surface-light"
            }`}
          >
            {item.label}
          </Link>
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
