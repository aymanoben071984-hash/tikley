/**
 * Single-event "Latest Events" tickers — one OBS / LIVE Studio browser source per event.
 * All settings live in the overlay URL (same parameter names as OverlayLive's feed tickers).
 */
import { AVATAR_FRAMES, NAME_ANIMATIONS } from "@/lib/catalog";

export type TickerEvent = "follow" | "like" | "gift" | "join" | "share";
export type TickerDesign =
  | "classic"
  | "vertical"
  | "laurel"
  | "sparkle"
  | "heartbeat"
  | "chat-pop"
  | "solar-orbit"
  | "heart-portal";
export type RingFrame = "neon" | "energy" | "orbit" | "halo";
export type ReplayFx = "none" | "fade" | "pulse" | "bounce" | "swing" | "shake" | "zoom" | "flip" | "wave";

export interface TickerSettings {
  design: TickerDesign;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  msgFont: string;
  message: string;
  avatarFrame: string; // ring id, image frame slug, or "none"
  avatarScale: number; // 50–200
  nameScale: number; // 50–200
  msgScale: number; // 50–200
  nameAnim: string;
  label: boolean;
  replay: ReplayFx;
  replaySec: number;
  burst: boolean;
}

export const TICKER_EVENTS: Array<{ id: TickerEvent; label: string; icon: string; defaultMessage: string; accent: string }> = [
  { id: "follow", label: "Last Follow", icon: "⭐", defaultMessage: "just followed you!", accent: "#398dc0" },
  { id: "like", label: "Last Like", icon: "❤️", defaultMessage: "sent likes", accent: "#ff426d" },
  { id: "gift", label: "Last Gift", icon: "🎁", defaultMessage: "sent a gift", accent: "#f5b301" },
  { id: "join", label: "Last Join", icon: "👋", defaultMessage: "joined the LIVE", accent: "#22d3ee" },
  { id: "share", label: "Last Share", icon: "🔁", defaultMessage: "shared the LIVE", accent: "#a855f7" },
];

export const TICKER_DESIGNS: Array<{ id: TickerDesign; label: string; hint: string }> = [
  { id: "classic", label: "Classic", hint: "Framed avatar beside the name" },
  { id: "vertical", label: "Vertical", hint: "Avatar on top, name below" },
  { id: "laurel", label: "Laurel", hint: "Golden laurel branches" },
  { id: "sparkle", label: "Sparkle", hint: "Outlined name with twinkling stars" },
  { id: "heartbeat", label: "Heartbeat", hint: "Pulse line beside the name" },
  { id: "chat-pop", label: "Chat Pop", hint: "Speech bubble card" },
  { id: "solar-orbit", label: "Solar Orbit", hint: "Planets orbit the avatar" },
  { id: "heart-portal", label: "Heart Portal", hint: "Hearts circle the avatar" },
];

export const RING_FRAMES: Array<{ id: RingFrame; label: string }> = [
  { id: "neon", label: "Neon" },
  { id: "energy", label: "Energy" },
  { id: "orbit", label: "Orbit" },
  { id: "halo", label: "Halo" },
];

export const REPLAY_FX: ReplayFx[] = ["none", "fade", "pulse", "bounce", "swing", "shake", "zoom", "flip", "wave"];

export const TICKER_FONTS = ["Changa", "Inter", "Cairo", "Roadster", "Orbitron", "Bebas Neue", "Montserrat", "Poppins", "Georgia", "Tajawal"];

export function tickerDefaults(event: TickerEvent): TickerSettings {
  const meta = TICKER_EVENTS.find((e) => e.id === event) ?? TICKER_EVENTS[0];
  return {
    design: "classic",
    accentColor: meta.accent,
    textColor: "#ffffff",
    fontFamily: "Changa",
    msgFont: "Changa",
    message: "",
    avatarFrame: "neon",
    avatarScale: 100,
    nameScale: 100,
    msgScale: 100,
    nameAnim: "",
    label: true,
    replay: "pulse",
    replaySec: 12,
    burst: true,
  };
}

const clampScale = (n: number) => (Number.isFinite(n) ? Math.min(200, Math.max(50, Math.round(n))) : 100);
const hex = (v: string | null) => (v && /^#?[0-9a-fA-F]{3,8}$/.test(v) ? (v.startsWith("#") ? v : `#${v}`) : null);
const FRAME_IDS = new Set<string>(["none", ...RING_FRAMES.map((r) => r.id), ...AVATAR_FRAMES.map((f) => f.slug)]);

export function isRingFrame(f: string): f is RingFrame {
  return RING_FRAMES.some((r) => r.id === f);
}

/** Settings → URL query string (only non-default values are written). */
export function tickerToQuery(event: TickerEvent, s: TickerSettings): string {
  const d = tickerDefaults(event);
  const p = new URLSearchParams();
  p.set("design", s.design);
  if (s.accentColor !== d.accentColor) p.set("accent", s.accentColor.replace(/^#/, ""));
  if (s.textColor !== d.textColor) p.set("text", s.textColor.replace(/^#/, ""));
  if (s.fontFamily !== d.fontFamily) p.set("font", s.fontFamily);
  if (s.msgFont !== d.msgFont) p.set("mfont", s.msgFont);
  if (s.message.trim()) p.set("msg", s.message.slice(0, 80));
  if (s.avatarFrame !== d.avatarFrame) p.set("frame", s.avatarFrame);
  if (clampScale(s.avatarScale) !== 100) p.set("avs", String(clampScale(s.avatarScale)));
  if (clampScale(s.nameScale) !== 100) p.set("nms", String(clampScale(s.nameScale)));
  if (clampScale(s.msgScale) !== 100) p.set("mss", String(clampScale(s.msgScale)));
  if (s.nameAnim) p.set("nanim", s.nameAnim);
  if (!s.label) p.set("label", "0");
  if (s.replay !== d.replay) p.set("fx", s.replay);
  if (s.replaySec !== d.replaySec) p.set("every", String(s.replaySec));
  if (!s.burst) p.set("burst", "0");
  return `?${p.toString()}`;
}

/** URL query string → settings (unknown or missing values fall back to defaults). */
export function tickerFromQuery(event: TickerEvent, search: string | URLSearchParams): TickerSettings {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const d = tickerDefaults(event);
  const design = TICKER_DESIGNS.some((x) => x.id === p.get("design")) ? (p.get("design") as TickerDesign) : d.design;
  const frame = p.get("frame");
  const anim = p.get("nanim") ?? "";
  const fx = p.get("fx");
  const every = Number(p.get("every"));
  return {
    design,
    accentColor: hex(p.get("accent")) ?? d.accentColor,
    textColor: hex(p.get("text")) ?? d.textColor,
    fontFamily: p.get("font") || d.fontFamily,
    msgFont: p.get("mfont") || d.msgFont,
    message: (p.get("msg") ?? "").slice(0, 80),
    avatarFrame: frame && FRAME_IDS.has(frame) ? frame : d.avatarFrame,
    avatarScale: clampScale(Number(p.get("avs") ?? 100)),
    nameScale: clampScale(Number(p.get("nms") ?? 100)),
    msgScale: clampScale(Number(p.get("mss") ?? 100)),
    nameAnim: (NAME_ANIMATIONS as readonly string[]).includes(anim) ? anim : "",
    label: p.get("label") !== "0",
    replay: REPLAY_FX.includes(fx as ReplayFx) ? (fx as ReplayFx) : d.replay,
    replaySec: Number.isFinite(every) && every >= 4 && every <= 120 ? every : d.replaySec,
    burst: p.get("burst") !== "0",
  };
}

export interface TickerEventData {
  id: number;
  name: string;
  avatarUrl: string;
  frame?: string;
  giftName?: string | null;
  giftIcon?: string | null;
  coins?: number;
  likes?: number;
  at: number;
}

export const SAMPLE_TICKER_EVENTS: Record<TickerEvent, TickerEventData> = {
  follow: { id: -1, name: "Mira Lee", avatarUrl: "/avatars/a2.png", at: 0 },
  like: { id: -2, name: "Hoda K", avatarUrl: "/avatars/a4.png", likes: 250, at: 0 },
  gift: { id: -3, name: "LeoFlame", avatarUrl: "/avatars/a11.png", giftName: "Lion", giftIcon: "/assets/gifts/lion.png", coins: 29999, at: 0 },
  join: { id: -4, name: "Zeyad K", avatarUrl: "/avatars/a3.png", at: 0 },
  share: { id: -5, name: "Luna Vibe", avatarUrl: "/avatars/a6.png", at: 0 },
};
