// apps/web/app/layout.tsx
// PORTED: re-added AdSense <Script> from insta-download

import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelSave Pro",
  description: "Download Instagram Reels instantly",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/* PORTED: AdSense script — loads after page is interactive */}
      <head>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
          strategy="afterInteractive"
          crossOrigin="anonymous"
          data-ad-client="pub-6242821979676967"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
