import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Analytics } from "@vercel/analytics/next";
import { Changa, Noto_Sans_Arabic } from "next/font/google";
import "./globals.css";
import { LocaleProvider } from "@/components/LocaleProvider";

const changa = Changa({ subsets: ["arabic", "latin"], weight: ["200", "300", "400", "500", "600", "700", "800"], variable: "--font-changa", display: "swap" });
const notoSansArabic = Noto_Sans_Arabic({ subsets: ["arabic", "latin"], weight: ["400", "500", "600", "700"], variable: "--font-noto-arabic", display: "swap" });

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
    <html lang="en" dir="ltr" className={`dark ${changa.variable} ${notoSansArabic.variable}`} suppressHydrationWarning>
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/assets/overlaylive-engine.css" />
      </head>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased selection:bg-primary/30 selection:text-foreground">
        <LocaleProvider>{children}</LocaleProvider>
        {process.env.VERCEL ? <Analytics /> : null}
      </body>
    </html>
  );
}
