/**
 * Breaking News live overlay — settings, designs and text helpers,
 * ported from OverlayLive's /overlay/games/breaking-news.
 */
import { GIFT_CATALOG } from "@/lib/catalog";

/** Coins per gift, used to work out the "×{n}" repeat count. */
export const GIFT_COINS: Record<string, number> = Object.fromEntries(GIFT_CATALOG.map((g) => [g.id, g.coins]));

export type BreakingNewsDesign = "classic" | "compact" | "ticker" | "pill" | "minimal" | "card";
export type BnEventType = "gift" | "like" | "follow" | "comment" | "join";

export interface BreakingNewsConfig {
  design: BreakingNewsDesign;
  badgeText: string;
  channelName: string;
  customHeadlines: string[];
  templates: Record<BnEventType, string>;
  showGifts: boolean;
  showLikes: boolean;
  showFollows: boolean;
  showComments: boolean;
  showJoins: boolean;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  tickerSpeed: number;
  headlineFontScale: number;
  headlineColor: string;
  headlineFont: string;
  leftFontScale: number;
  leftColor: string;
  leftFont: string;
  tickerFont: string;
  tickerIcon: string;
  showTickerIcon: boolean;
}

export interface BreakingNewsState {
  phase: "idle" | "running";
  startedAt: number | null;
  config: BreakingNewsConfig;
}

export interface BnEvent {
  id: number;
  type: BnEventType;
  nickname: string;
  avatarUrl: string;
  giftName?: string;
  repeatCount?: number;
  comment?: string;
  at: number;
}

export const BREAKING_NEWS_DEFAULTS: BreakingNewsConfig = {
  design: "classic",
  badgeText: "عاجل 🔴",
  channelName: "LIVE NEWS",
  customHeadlines: ["تابع القناة ليصلك كل جديد ⭐", "شارك البث مع أصدقائك 📣"],
  templates: {
    gift: "🎁 {name} أرسل {gift} ×{n}!",
    like: "❤️ {name} أعجب بالبث!",
    follow: "⭐ {name} تابع القناة!",
    comment: "💬 {name}: {comment}",
    join: "👋 {name} انضم للبث!",
  },
  showGifts: true,
  showLikes: true,
  showFollows: true,
  showComments: true,
  showJoins: true,
  accentColor: "#dc2626",
  textColor: "#ffffff",
  fontFamily: "Cairo",
  tickerSpeed: 90,
  headlineFontScale: 100,
  headlineColor: "",
  headlineFont: "",
  leftFontScale: 80,
  leftColor: "",
  leftFont: "",
  tickerFont: "",
  tickerIcon: "📰",
  showTickerIcon: true,
};

export const BREAKING_NEWS_DESIGNS: Array<{ id: BreakingNewsDesign; label: string; hint: string }> = [
  { id: "classic", label: "Classic bar", hint: "Badge, headline, clock and ticker" },
  { id: "compact", label: "Compact bar", hint: "Slim bar with small clock" },
  { id: "ticker", label: "Ticker only", hint: "Badge + scrolling headlines" },
  { id: "pill", label: "Floating pill", hint: "Rounded floating headline" },
  { id: "minimal", label: "Minimal text", hint: "Text and glowing line" },
  { id: "card", label: "Lower-third card", hint: "Card with header and ticker" },
];

/** Per-type throttle (ms) so likes and joins don't flood the headline. */
export const BN_THROTTLE: Partial<Record<BnEventType, number>> = { like: 4000, join: 2500 };

export const BN_FONTS = ["Cairo", "Changa", "Tajawal", "Inter", "Roadster", "Bebas Neue", "Montserrat", "Poppins", "Orbitron"];

export const BN_TEMPLATE_PRESETS: Record<"ar" | "en", Record<BnEventType, string>> = {
  ar: BREAKING_NEWS_DEFAULTS.templates,
  en: {
    gift: "🎁 {name} sent {gift} ×{n}!",
    like: "❤️ {name} liked the LIVE!",
    follow: "⭐ {name} followed the channel!",
    comment: "💬 {name}: {comment}",
    join: "👋 {name} joined the LIVE!",
  },
};

export function normalizeBnConfig(raw: unknown): BreakingNewsConfig {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<BreakingNewsConfig>;
  const merged = { ...BREAKING_NEWS_DEFAULTS, ...src } as BreakingNewsConfig;
  merged.templates = { ...BREAKING_NEWS_DEFAULTS.templates, ...(src.templates || {}) };
  merged.customHeadlines = Array.isArray(src.customHeadlines)
    ? src.customHeadlines.map(String)
    : BREAKING_NEWS_DEFAULTS.customHeadlines;
  if (!BREAKING_NEWS_DESIGNS.some((d) => d.id === merged.design)) merged.design = "classic";
  merged.tickerSpeed = Math.min(300, Math.max(20, Number(merged.tickerSpeed) || 90));
  return merged;
}

export function normalizeBnState(raw: unknown): BreakingNewsState {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<BreakingNewsState>;
  return {
    phase: src.phase === "running" ? "running" : "idle",
    startedAt: typeof src.startedAt === "number" ? src.startedAt : null,
    config: normalizeBnConfig(src.config),
  };
}

export function bnEventEnabled(e: BnEvent, c: BreakingNewsConfig): boolean {
  switch (e.type) {
    case "gift":
      return c.showGifts;
    case "like":
      return c.showLikes;
    case "follow":
      return c.showFollows;
    case "comment":
      return c.showComments;
    case "join":
      return c.showJoins;
    default:
      return false;
  }
}

const replaceAll = (s: string, a: string, b: string) => s.split(a).join(b);

export function bnHeadline(e: BnEvent, c: BreakingNewsConfig): string {
  let t = c.templates?.[e.type] ?? BREAKING_NEWS_DEFAULTS.templates[e.type];
  t = replaceAll(t, "{name}", e.nickname);
  t = replaceAll(t, "{gift}", e.type === "gift" ? e.giftName ?? "" : "");
  t = replaceAll(t, "{n}", e.type === "gift" ? String(Math.max(1, Number(e.repeatCount) || 1)) : "");
  t = replaceAll(t, "{comment}", e.type === "comment" ? e.comment ?? "" : "");
  return t.trim();
}

/** Append 2-digit alpha to a #rrggbb colour. */
export const withAlpha = (hex: string, a: string) => (/^#[0-9a-fA-F]{6}$/.test(hex) ? `${hex}${a}` : hex);

/** Darken a #rrggbb colour by multiplying each channel. */
export const darken = (hex: string, k: number) => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return "#0b0a0e";
  const ch = (i: number) =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * k)
      .toString(16)
      .padStart(2, "0");
  return `#${ch(1)}${ch(3)}${ch(5)}`;
};

/** Main bar background used by most designs. */
export const barBackground = (hex: string) =>
  `linear-gradient(105deg, ${withAlpha(hex, "66")}, ${withAlpha(darken(hex, 0.45), "8c")} 26%, ${withAlpha(
    darken(hex, 0.2),
    "59",
  )} 58%, ${withAlpha(darken(hex, 0.28), "80")}), linear-gradient(180deg, ${withAlpha(darken(hex, 0.16), "f2")}, ${withAlpha(
    darken(hex, 0.09),
    "f7",
  )})`;

const RTL_RE = /[\u0591-\u07FF\uFB1D-\uFDFD\uFE70-\uFEFC]/;
const LTR_RE = /[A-Za-z\u00C0-\u024F]/;

/** Text direction of a single string (first strong character wins). */
export function textDir(s: string): "rtl" | "ltr" {
  for (const ch of s) {
    if (RTL_RE.test(ch)) return "rtl";
    if (LTR_RE.test(ch)) return "ltr";
  }
  return "ltr";
}

/** Direction of a group of lines (majority wins). */
export function linesDir(lines: string[]): "rtl" | "ltr" {
  let r = 0;
  let l = 0;
  for (const s of lines) (textDir(s) === "rtl" ? r++ : l++);
  return r > l ? "rtl" : "ltr";
}
