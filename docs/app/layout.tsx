import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "stellar-wallet-mock - Documentation",
  description:
    "Mock Freighter wallet for headless E2E testing of Stellar/Soroban dApps with Playwright",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 max-w-3xl mx-auto px-6 py-12">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
