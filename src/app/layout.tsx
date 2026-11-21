import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "OverlayLive | TikTok LIVE Overlays, Alerts, Avatars & Free Games for OBS & LIVE Studio",
  description:
    "Real-time TikTok LIVE overlays, gift alerts, 68 animated avatar frames, 17 avatars, and 12 free interactive chat & gift games for TikTok LIVE Studio and OBS Studio.",
  icons: {
    icon: "/icon.png",
    apple: "/icon.png",
  },
  other: {
    // TikTok for Developers — URL / domain ownership verification
    "tiktok-developers-site-verification": "BQkJAUBQNUSWSJDpcEyBQC5JPCXAn0C9",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/overlaylive-engine.css" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        {children}
      </body>
    </html>
  );
}
