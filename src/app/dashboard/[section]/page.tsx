import { DashboardApp } from "@/components/DashboardApp";

const ROUTE_TO_SECTION: Record<string, string> = {
  top: "top-lists",
  "top-lists": "top-lists",
  goals: "goals",
  "gift-alert": "gift-alerts",
  "gift-alerts": "gift-alerts",
  "gift-video": "gift-videos",
  "gift-videos": "gift-videos",
  follow: "follow-join",
  join: "follow-join",
  "follow-join": "follow-join",
  vip: "avatars",
  superfan: "avatars",
  avatars: "avatars",
  feed: "event-feed",
  "event-feed": "event-feed",
  chat: "chat-box",
  "chat-box": "chat-box",
  games: "games",
  "live-overlays": "games",
  effects: "effects",
  hearts: "effects",
  tts: "tts-sound",
  "sound-alerts": "tts-sound",
  scenes: "scenes",
  social: "social",
  branding: "branding",
  notes: "notes",
  live: "live-room",
  "live-room": "live-room",
  viewers: "viewers",
  performance: "performance",
  download: "studio-setup",
  "studio-setup": "studio-setup",
  settings: "settings",
  backgrounds: "backgrounds",
  display: "display",
  quran: "quran",
  "flag-hearts": "flag-hearts",
};

export default async function DashboardSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  const mapped = ROUTE_TO_SECTION[section] || "overview";
  return <DashboardApp initialSection={mapped} />;
}
