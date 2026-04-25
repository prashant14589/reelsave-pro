import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ReelSave Pro",
  description: "India's cleanest Instagram Reel downloader",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
