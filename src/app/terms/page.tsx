import { LegalPage, type LegalSection } from "@/components/LegalPage";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service — OverlayLive",
  description: "The terms that apply when you use OverlayLive overlays, alerts, games and the dashboard.",
};

const sections: LegalSection[] = [
  {
    id: "acceptance",
    title: "Agreeing to these terms",
    body: (
      <p>
        By opening the OverlayLive dashboard or adding an OverlayLive overlay link to OBS Studio, Streamlabs Desktop or TikTok LIVE Studio, you agree to these Terms of
        Service and to our <Link href="/privacy">Privacy Policy</Link>. If you do not agree, please do not use the service.
      </p>
    ),
  },
  {
    id: "service",
    title: "What OverlayLive does",
    body: (
      <>
        <p>
          OverlayLive gives TikTok LIVE creators on-stream overlays — leaderboards, goals, alerts, chat boxes, avatar frames, games such as Live Quiz and Breaking News,
          and Link Scenes — that load as browser sources. Overlays react to the public events of a LIVE (gifts, likes, follows, joins, shares and comments).
        </p>
        <p>
          OverlayLive is an independent tool. It is <strong>not affiliated with, endorsed by or sponsored by TikTok</strong>, ByteDance, OBS or Streamlabs. All
          trademarks belong to their owners.
        </p>
      </>
    ),
  },
  {
    id: "account",
    title: "Your account and TikTok username",
    body: (
      <ul>
        <li>You may only connect a TikTok username that you own or are authorised to manage.</li>
        <li>Each username can be linked to one OverlayLive account at a time.</li>
        <li>You are responsible for everything done through your account and for keeping your overlay links private — anyone with a link can display that overlay.</li>
        <li>We never ask for your TikTok password.</li>
      </ul>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>break TikTok&apos;s Terms of Service or Community Guidelines, or any law, while using OverlayLive;</li>
          <li>show hateful, harassing, sexual, violent or otherwise harmful content in custom headlines, titles, notes or templates;</li>
          <li>use games or rewards for gambling, or promise prizes you cannot deliver;</li>
          <li>attempt to break, overload, scrape or reverse-engineer the service, or get around usage limits;</li>
          <li>impersonate another creator or use their username, image or brand without permission.</li>
        </ul>
        <p>We may suspend accounts that break these rules.</p>
      </>
    ),
  },
  {
    id: "content",
    title: "Your content",
    body: (
      <p>
        You keep ownership of the text, colours, headlines and settings you create. You give us a limited licence to store and display that content only so we can run
        your overlays. Viewer names, profile pictures and comments shown on your overlays come from your public LIVE; you are responsible for how you display them on stream.
      </p>
    ),
  },
  {
    id: "plans",
    title: "Free and paid features",
    body: (
      <p>
        Some features are free and some may require a paid plan. Plan prices, trial periods and what each plan includes are shown in the dashboard before you pay. Paid
        plans renew until you cancel; cancelling stops future renewals and keeps access until the end of the paid period. Refunds follow the policy shown at checkout and
        any rights you have under local consumer law.
      </p>
    ),
  },
  {
    id: "availability",
    title: "Availability and changes",
    body: (
      <p>
        We work to keep overlays online during your LIVE, but the service depends on TikTok, your internet connection and your streaming software, so we cannot promise
        uninterrupted operation. We may add, change or remove features, designs and games over time.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Disclaimer and limitation of liability",
    body: (
      <>
        <p>OverlayLive is provided &quot;as is&quot; and &quot;as available&quot;, without warranties of any kind, to the extent the law allows.</p>
        <p>
          To the extent the law allows, OverlayLive is not liable for indirect or consequential losses, lost gifts, lost revenue or interrupted streams. Our total liability
          for any claim is limited to the amount you paid us in the 12 months before the claim.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Ending your use",
    body: (
      <p>
        You can stop using OverlayLive at any time by removing the overlay links from your streaming software and deleting your account. We may suspend or end access if
        you break these terms or if required by law. Sections on content, liability and disputes continue to apply after termination.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these terms. When we make important changes we will update the date at the top of this page and, where appropriate, show a notice in the dashboard.
        Continuing to use OverlayLive after a change means you accept the new terms.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <p>
        Questions about these terms? Contact us at <a href="mailto:support@overlaylive.app">support@overlaylive.app</a>.
      </p>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      current="terms"
      title="Terms of Service"
      updated="20 November 2026"
      intro="These terms explain the rules for using OverlayLive — the dashboard, overlay links, games and related tools for TikTok LIVE creators. Please read them together with our Privacy Policy."
      sections={sections}
    />
  );
}
