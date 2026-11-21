import { LegalPage, type LegalSection } from "@/components/LegalPage";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy — OverlayLive",
  description: "What data OverlayLive collects, why, how long it is kept and the choices you have.",
};

const sections: LegalSection[] = [
  {
    id: "overview",
    title: "Overview",
    body: (
      <p>
        This policy explains what information OverlayLive collects when you use the dashboard and overlays, how we use it, and the choices you have. It applies together
        with our <Link href="/terms">Terms of Service</Link>.
      </p>
    ),
  },
  {
    id: "collect",
    title: "Information we collect",
    body: (
      <>
        <p>
          <strong>Account and channel details you give us</strong> — your display name, TikTok username, bio, chosen avatar and frame, and contact email if you provide one.
        </p>
        <p>
          <strong>Overlay settings</strong> — the designs, colours, fonts, titles, custom headlines, templates, scenes and game settings you save.
        </p>
        <p>
          <strong>Public LIVE events</strong> — while an overlay is connected we receive the public events of your LIVE: viewers&apos; display names, usernames, profile
          picture links, gifts and coin values, likes, follows, joins, shares and comments. These are already public in your LIVE; we use them to draw your overlays,
          leaderboards and session stats.
        </p>
        <p>
          <strong>Technical data</strong> — basic logs such as which overlay link loaded, a random overlay connection ID, approximate time, and a browser hint (for example
          &quot;OBS Studio&quot; or &quot;TikTok LIVE Studio&quot;) so the dashboard can show which overlays are on your stream.
        </p>
        <p>
          <strong>Stored in your browser</strong> — small preferences such as your dashboard theme and which Top Lists option you use, saved in local storage.
        </p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use information",
    body: (
      <ul>
        <li>to run your overlays, alerts, leaderboards, goals and games in real time;</li>
        <li>to show session statistics and recaps in your dashboard;</li>
        <li>to keep the service secure, prevent abuse and fix problems;</li>
        <li>to provide support and tell you about important changes.</li>
      </ul>
    ),
  },
  {
    id: "tts",
    title: "Text-to-speech and sounds",
    body: (
      <p>
        Text-to-speech and alert sounds are produced by your own browser (the Web Speech and Web Audio APIs). The text that is read aloud is processed on your device by
        your browser or operating system; OverlayLive does not record audio.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Sharing",
    body: (
      <>
        <p>We do not sell your personal information. We share it only:</p>
        <ul>
          <li>with service providers that host our servers and database, under confidentiality obligations;</li>
          <li>with payment providers if you buy a paid plan (we do not store full card numbers);</li>
          <li>when required by law, or to protect the rights and safety of users and the service.</li>
        </ul>
        <p>Anything you choose to show on your overlays is visible to the viewers of your LIVE.</p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep data",
    body: (
      <ul>
        <li>Account details and overlay settings: until you delete them or your account.</li>
        <li>LIVE events and leaderboard totals: until you reset the board or delete your account. Boards set to &quot;Reset when I go LIVE&quot; are cleared each LIVE.</li>
        <li>Overlay connection records: a short time, only to show which overlays are currently open.</li>
      </ul>
    ),
  },
  {
    id: "rights",
    title: "Your choices and rights",
    body: (
      <>
        <p>
          You can view and change your settings in the dashboard, reset leaderboards, remove VIP avatar presets, and disconnect your TikTok username at any time. Depending
          on where you live, you may also have the right to access, correct, export or delete your personal data, or to object to certain processing.
        </p>
        <p>
          To make a request, email <a href="mailto:privacy@overlaylive.app">privacy@overlaylive.app</a>. Viewers who appear in a creator&apos;s overlay can also contact us to
          have their information removed.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <p>
        We use reasonable technical and organisational measures to protect your information, including encrypted connections. No online service is completely secure, so
        please keep your overlay links private.
      </p>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        OverlayLive is meant for creators who meet TikTok&apos;s minimum age to go LIVE. We do not knowingly collect personal information from children under 13 (or the
        minimum age in your country). If you believe a child has given us information, contact us and we will delete it.
      </p>
    ),
  },
  {
    id: "transfers",
    title: "International transfers",
    body: <p>Our servers may be located outside your country. Where required, we use appropriate safeguards for transferring personal data.</p>,
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: <p>We may update this policy. We will change the date at the top of this page and, for important changes, show a notice in the dashboard.</p>,
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about privacy? Email <a href="mailto:privacy@overlaylive.app">privacy@overlaylive.app</a>.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      current="privacy"
      title="Privacy Policy"
      updated="20 November 2026"
      intro="Your privacy matters to us. This policy describes the information OverlayLive handles when you use the dashboard and add overlays to your TikTok LIVE, why we need it and how you stay in control."
      sections={sections}
    />
  );
}
