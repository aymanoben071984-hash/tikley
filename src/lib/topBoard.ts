import type { AvatarPreset } from "@/db/schema";
import { OL_THEMES, isOlTheme } from "@/lib/olThemes";

export type BoardType =
  | "top-likers"
  | "top-gifters"
  | "top-shares"
  | "weekly-supporters"
  | "alltime-supporters";

export type RefDesign =
  | "energy"
  | "crown-rounded"
  | "crown-pill"
  | "crown-bevel"
  | "crown-blade"
  | "crown-ribbon"
  | "crown-notch"
  | "crown-hexagon"
  | "crown-tag"
  | "crown-frost"
  | "crown-glowpill"
  | "spot-neon"
  | "spot-accent"
  | "spot-frost"
  | "spot-pill"
  | "spot-bevel"
  | "spot-shield"
  | "spot-minimal"
  | "classic-podium";

export type ThemeDesign = `theme-${string}`;

export type DesignVariant =
  | RefDesign
  | ThemeDesign
  | "podium"
  | "classic"
  | "voltage"
  | "glass"
  | "royal"
  | "ember"
  | "kawaii"
  | "metro"
  | "cyber"
  | "music"
  | "cards";

export type ScorePosition = "inside" | "beside" | "above";

export type SwitchAnimation = "fade" | "slide" | "flip" | "zoom" | "podium";

export interface BoardDisplayOptions {
  showTitle: boolean;
  showAvatar: boolean;
  showFrame: boolean;
  showScore: boolean;
  showUnit: boolean;
  showCrown: boolean;
  showHandle: boolean;
  showRankBadge: boolean;
  highlightTop3: boolean;
  maxRows: number;
}

export interface BoardRotation {
  enabled: boolean;
  boards: BoardType[]; // extra boards shown after the main type (1 or 2)
  intervalSec: number;
  animation: SwitchAnimation;
}

export interface TopBoardSettings {
  type: BoardType;
  variant: DesignVariant;
  color: string;
  titles: Record<BoardType, string>;
  direction: "ltr" | "rtl";
  layout: "vertical" | "horizontal";
  fontFamily: string;
  nameAnimation: string;
  frameSlug: string; // "user" = each supporter's own frame
  display: BoardDisplayOptions;
  rotation: BoardRotation;
  resetMode: ResetMode;
  scorePosition: ScorePosition;
  /** Crown List: animated nameplate video id ("" = none). */
  nameplate: string;
  /** Crown picture id for #1 ("" = emoji crown). */
  crownStyle: string;
}

export type ResetMode = "never" | "on-live";

export const BOARD_TYPES: Array<{
  id: BoardType;
  label: string;
  description: string;
  unit: string;
  icon: string;
  defaultTitle: string;
}> = [
  {
    id: "top-likers",
    label: "Top Likers",
    description: "Viewers who tapped the most hearts this LIVE",
    unit: "likes",
    icon: "❤️",
    defaultTitle: "TOP LIKERS",
  },
  {
    id: "top-gifters",
    label: "Top Gifters",
    description: "Ranked by coins gifted this LIVE",
    unit: "coins",
    icon: "🪙",
    defaultTitle: "TOP GIFTERS",
  },
  {
    id: "top-shares",
    label: "Top Shares",
    description: "Viewers who shared your LIVE the most",
    unit: "shares",
    icon: "🔁",
    defaultTitle: "TOP SHARERS",
  },
  {
    id: "weekly-supporters",
    label: "Weekly Supporters (coins)",
    description: "Coins gifted across the last 7 days",
    unit: "coins",
    icon: "📅",
    defaultTitle: "WEEKLY SUPPORTERS",
  },
  {
    id: "alltime-supporters",
    label: "All-Time Supporters (coins)",
    description: "Every coin ever gifted on your channel",
    unit: "coins",
    icon: "👑",
    defaultTitle: "ALL-TIME LEGENDS",
  },
];

export type DesignGroup = "Painted boards" | "Classic boards" | "Flags" | "PUBG Mobile" | "Energy" | "Crown List" | "Spotlight Podium" | "Podium" | "Extra themes";

export const DESIGN_VARIANTS: Array<{
  id: DesignVariant;
  name: string;
  tag: string;
  group: DesignGroup;
  preview: string; // gradient used in the picker tile
}> = [
  { id: "energy", name: "Energy Rows", tag: "Animated", group: "Energy", preview: "linear-gradient(135deg,#0b0b14,#1a1a2e)" },
  { id: "spot-neon", name: "Spotlight · Neon", tag: "Popular", group: "Spotlight Podium", preview: "linear-gradient(135deg,#140a1f,#2a0f3d)" },
  { id: "spot-accent", name: "Spotlight · Accent", tag: "Bold", group: "Spotlight Podium", preview: "linear-gradient(135deg,#0f172a,#1e293b)" },
  { id: "spot-frost", name: "Spotlight · Frost", tag: "Glass", group: "Spotlight Podium", preview: "linear-gradient(135deg,#1e293b,#475569)" },
  { id: "spot-pill", name: "Spotlight · Pill", tag: "Lap ring", group: "Spotlight Podium", preview: "linear-gradient(135deg,#0c1424,#16263f)" },
  { id: "spot-bevel", name: "Spotlight · Bevel", tag: "Gaming", group: "Spotlight Podium", preview: "linear-gradient(135deg,#1e1226,#0e0914)" },
  { id: "spot-shield", name: "Spotlight · Shield", tag: "Royal", group: "Spotlight Podium", preview: "linear-gradient(135deg,#1e1226,#2d1b3d)" },
  { id: "spot-minimal", name: "Spotlight · Minimal", tag: "Clean", group: "Spotlight Podium", preview: "linear-gradient(135deg,#0a0a0f,#18181b)" },
  { id: "crown-rounded", name: "Crown List · Rounded", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#241b3a,#141019)" },
  { id: "crown-pill", name: "Crown List · Pill", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#1b2340,#101420)" },
  { id: "crown-bevel", name: "Crown List · Bevel", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#1d2a24,#0e1612)" },
  { id: "crown-blade", name: "Crown List · Blade", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#2a1d1d,#140d0d)" },
  { id: "crown-ribbon", name: "Crown List · Ribbon", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#2a2440,#120f1f)" },
  { id: "crown-notch", name: "Crown List · Notch", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#132a33,#0a161b)" },
  { id: "crown-hexagon", name: "Crown List · Hexagon", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#2b2412,#15110a)" },
  { id: "crown-tag", name: "Crown List · Tag", tag: "Plates", group: "Crown List", preview: "linear-gradient(135deg,#251433,#120a1a)" },
  { id: "crown-frost", name: "Crown List · Frost", tag: "Lap ring", group: "Crown List", preview: "linear-gradient(135deg,#334155,#1e293b)" },
  { id: "crown-glowpill", name: "Crown List · Glow Pill", tag: "Lap ring", group: "Crown List", preview: "linear-gradient(135deg,#0c1a2b,#13263d)" },
  { id: "classic-podium", name: "Classic Podium", tag: "Pedestals", group: "Podium", preview: "linear-gradient(135deg,#0a0a0f,#1f1f2e)" },
  { id: "podium", name: "Framed Podium", tag: "Top 3", group: "Extra themes", preview: "linear-gradient(135deg,#1e293b,#0f172a)" },
  { id: "classic", name: "Classic Rows", tag: "Clean", group: "Extra themes", preview: "linear-gradient(135deg,#0f172a,#1e293b)" },
  { id: "voltage", name: "Voltage Neon", tag: "Neon", group: "Extra themes", preview: "linear-gradient(135deg,#020617,#164e63)" },
  { id: "glass", name: "Frosted Glass", tag: "Glass", group: "Extra themes", preview: "linear-gradient(135deg,#334155,#64748b)" },
  { id: "royal", name: "Royal Gold", tag: "VIP", group: "Extra themes", preview: "linear-gradient(135deg,#422006,#a16207)" },
  { id: "ember", name: "Ember Dragon Frames", tag: "Mythic", group: "Extra themes", preview: "linear-gradient(135deg,#431407,#9a3412)" },
  { id: "kawaii", name: "Kawaii Bubbles", tag: "Cute", group: "Extra themes", preview: "linear-gradient(135deg,#831843,#a855f7)" },
  { id: "metro", name: "Metro Line", tag: "Minimal", group: "Extra themes", preview: "linear-gradient(135deg,#111827,#374151)" },
  { id: "cyber", name: "Cyber HUD", tag: "Gaming", group: "Extra themes", preview: "linear-gradient(135deg,#052e16,#065f46)" },
  { id: "music", name: "Music Equalizer", tag: "Music", group: "Extra themes", preview: "linear-gradient(135deg,#2e1065,#be185d)" },
  { id: "cards", name: "High Roller Cards", tag: "Cards", group: "Extra themes", preview: "linear-gradient(135deg,#1e1b4b,#7c3aed)" },
];

const THEME_PREVIEW: Record<string, string> = {
  "Painted boards": "linear-gradient(135deg,#1e1033,#3b1d5c)",
  "Classic boards": "linear-gradient(135deg,#0b1220,#16263f)",
  Flags: "linear-gradient(135deg,#0f2a1a,#3a0f0f)",
  "PUBG Mobile": "linear-gradient(135deg,#2a1d05,#4a3410)",
};
for (const t of OL_THEMES) {
  DESIGN_VARIANTS.push({ id: t.id as ThemeDesign, name: t.label, tag: t.group === "Flags" ? "Flag" : t.group === "PUBG Mobile" ? "PUBG" : "OverlayLive", group: t.group, preview: THEME_PREVIEW[t.group] });
}

export const DESIGN_GROUPS: DesignGroup[] = ["Painted boards", "Classic boards", "Energy", "Spotlight Podium", "Crown List", "Flags", "PUBG Mobile", "Podium", "Extra themes"];

export function isThemeDesign(v: DesignVariant): v is ThemeDesign {
  return typeof v === "string" && v.startsWith("theme-") && isOlTheme(v);
}

export function isRefDesign(v: DesignVariant): v is RefDesign {
  if (typeof v === "string" && v.startsWith("theme-")) return false;
  return v === "energy" || v === "classic-podium" || v.startsWith("crown-") || v.startsWith("spot-");
}


export const LEADERBOARD_COLORS = [
  "#28c7fa",
  "#ff8a2b",
  "#ffd700",
  "#ff006e",
  "#b24bf3",
  "#00ff88",
  "#ff3366",
  "#0099ff",
  "#ffffff",
  "#f472b6",
];

export const BOARD_FONTS: Array<{ id: string; label: string; css: string; google?: string }> = [
  { id: "Inter", label: "Inter (Default)", css: "Inter, ui-sans-serif, system-ui, sans-serif", google: "Inter:wght@500;700;900" },
  { id: "Changa", label: "Changa (OverlayLive dashboard)", css: "Changa, 'Changa Fallback', sans-serif" },
  { id: "Roadster", label: "Roadster (OverlayLive)", css: "Roadster, sans-serif" },
  { id: "Montserrat", label: "Montserrat", css: "Montserrat, sans-serif", google: "Montserrat:wght@600;800;900" },
  { id: "Poppins", label: "Poppins", css: "Poppins, sans-serif", google: "Poppins:wght@500;700;900" },
  { id: "Bebas Neue", label: "Bebas Neue", css: "'Bebas Neue', sans-serif", google: "Bebas+Neue" },
  { id: "Orbitron", label: "Orbitron (Sci-fi)", css: "Orbitron, sans-serif", google: "Orbitron:wght@600;800" },
  { id: "Press Start 2P", label: "Press Start 2P (Pixel)", css: "'Press Start 2P', monospace", google: "Press+Start+2P" },
  { id: "Baloo 2", label: "Baloo 2 (Rounded)", css: "'Baloo 2', sans-serif", google: "Baloo+2:wght@600;800" },
  { id: "Cairo", label: "Cairo (Arabic)", css: "Cairo, sans-serif", google: "Cairo:wght@600;800" },
  { id: "Tajawal", label: "Tajawal (Arabic)", css: "Tajawal, sans-serif", google: "Tajawal:wght@500;800" },
];

export const SCORE_POSITIONS: Array<{ id: ScorePosition; label: string }> = [
  { id: "beside", label: "Beside" },
  { id: "inside", label: "Inside" },
  { id: "above", label: "Above" },
];

export const SWITCH_ANIMATIONS: Array<{ id: SwitchAnimation; label: string }> = [
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "flip", label: "Flip" },
  { id: "zoom", label: "Zoom" },
  { id: "podium", label: "Rise" },
];

export const DISPLAY_OPTION_LABELS: Array<{
  key: Exclude<keyof BoardDisplayOptions, "maxRows">;
  label: string;
  hint: string;
}> = [
  { key: "showTitle", label: "Card title", hint: "Title bar above the board" },
  { key: "showAvatar", label: "Profile photos", hint: "TikTok avatar of each supporter" },
  { key: "showFrame", label: "Avatar frames", hint: "Ornate frame around photos" },
  { key: "showScore", label: "Score", hint: "Coins, likes or shares value" },
  { key: "showUnit", label: "Unit icon", hint: "🪙 / ❤️ / 🔁 next to the score" },
  { key: "showCrown", label: "Crown on #1", hint: "Animated crown on the leader" },
  { key: "showHandle", label: "@username", hint: "Handle under the display name" },
  { key: "showRankBadge", label: "Rank badges", hint: "#1, #2, #3 badges" },
  { key: "highlightTop3", label: "Gold / silver / bronze", hint: "Medal colours for the top 3" },
];

function defaultTitles(): Record<BoardType, string> {
  return BOARD_TYPES.reduce(
    (acc, t) => ({ ...acc, [t.id]: t.defaultTitle }),
    {} as Record<BoardType, string>,
  );
}

export const DEFAULT_BOARD_SETTINGS: TopBoardSettings = {
  type: "top-gifters",
  variant: "energy",
  color: "#28c7fa",
  titles: defaultTitles(),
  direction: "ltr",
  layout: "vertical",
  fontFamily: "Inter",
  nameAnimation: "none",
  frameSlug: "user",
  display: {
    showTitle: true,
    showAvatar: true,
    showFrame: true,
    showScore: true,
    showUnit: true,
    showCrown: true,
    showHandle: false,
    showRankBadge: true,
    highlightTop3: true,
    maxRows: 5,
  },
  rotation: {
    enabled: false,
    boards: ["top-likers"],
    intervalSec: 10,
    animation: "flip",
  },
  resetMode: "never",
  scorePosition: "beside",
  nameplate: "",
  crownStyle: "",
};

const TYPE_IDS = new Set(BOARD_TYPES.map((t) => t.id));
const VARIANT_IDS = new Set(DESIGN_VARIANTS.map((v) => v.id));

export function normalizeBoardSettings(raw: unknown): TopBoardSettings {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<TopBoardSettings>;
  const d = DEFAULT_BOARD_SETTINGS;
  const type = TYPE_IDS.has(src.type as BoardType) ? (src.type as BoardType) : d.type;
  const variant = VARIANT_IDS.has(src.variant as DesignVariant)
    ? (src.variant as DesignVariant)
    : d.variant;
  const rotationSrc = (src.rotation || {}) as Partial<BoardRotation>;
  const boards = Array.isArray(rotationSrc.boards)
    ? rotationSrc.boards.filter((b) => TYPE_IDS.has(b) && b !== type).slice(0, 2)
    : d.rotation.boards.filter((b) => b !== type);

  return {
    type,
    variant,
    color: typeof src.color === "string" ? src.color : d.color,
    titles: { ...defaultTitles(), ...(src.titles || {}) },
    direction: src.direction === "rtl" ? "rtl" : "ltr",
    layout: src.layout === "horizontal" ? "horizontal" : "vertical",
    fontFamily: typeof src.fontFamily === "string" ? src.fontFamily : d.fontFamily,
    nameAnimation: typeof src.nameAnimation === "string" ? src.nameAnimation : d.nameAnimation,
    frameSlug: typeof src.frameSlug === "string" ? src.frameSlug : d.frameSlug,
    display: {
      ...d.display,
      ...(src.display || {}),
      maxRows: Math.min(10, Math.max(3, Number(src.display?.maxRows ?? d.display.maxRows))),
    },
    rotation: {
      enabled: Boolean(rotationSrc.enabled),
      boards,
      intervalSec: Math.min(120, Math.max(4, Number(rotationSrc.intervalSec ?? d.rotation.intervalSec))),
      animation: (["fade", "slide", "flip", "zoom", "podium"] as const).includes(
        rotationSrc.animation as SwitchAnimation,
      )
        ? (rotationSrc.animation as SwitchAnimation)
        : d.rotation.animation,
    },
    resetMode: src.resetMode === "on-live" ? "on-live" : "never",
    scorePosition: src.scorePosition === "inside" || src.scorePosition === "above" ? src.scorePosition : "beside",
    nameplate: typeof src.nameplate === "string" ? src.nameplate : "",
    crownStyle: typeof src.crownStyle === "string" ? src.crownStyle : "",
  };
}

/** Database column that stores each board type's score. */
export const BOARD_TYPE_COLUMN: Record<BoardType, "likesTotal" | "coinsTotal" | "sharesTotal" | "weeklyCoins" | "allTimeCoins"> = {
  "top-likers": "likesTotal",
  "top-gifters": "coinsTotal",
  "top-shares": "sharesTotal",
  "weekly-supporters": "weeklyCoins",
  "alltime-supporters": "allTimeCoins",
};

const SAMPLE_NAMES = [
  ["mira_lee", "Mira Lee", "sakura-fox"],
  ["hoda.k", "Hoda K", "arcade-bunny"],
  ["zeyad.gg", "Zeyad", "stormfang-wolf"],
  ["kairos_live", "Kairos", "volt-fox"],
  ["luna.vibe", "Luna Vibe", "moonpaw-cat"],
  ["nour.gg", "Nour", "astral-raven"],
  ["sora.tt", "Sora", "cloudwing-halo"],
  ["tariq99", "Tariq", "blue-dragon"],
  ["yuna_live", "Yuna", "honeybee-royale"],
  ["leoflame", "LeoFlame", "ember-koi"],
] as const;

/** Sample supporters that fill the preview before the first real gift. */
export function sampleSupporters(): AvatarPreset[] {
  const now = new Date(0);
  return SAMPLE_NAMES.map(([handle, name, frame], i) => ({
    id: -(i + 1),
    displayName: name,
    tiktokUsername: `@${handle}`,
    avatarUrl: `/avatars/a${i + 2}.png`,
    frameSlug: frame,
    nameAnimation: "none",
    particleFx: "sparkles",
    role: "vip",
    glowColor: "#28c7fa",
    welcomeMessage: "",
    coinsTotal: Math.round(8420 / (1 + i * 0.55)),
    likesTotal: Math.round(31200 / (1 + i * 0.42)),
    sharesTotal: Math.round(148 / (1 + i * 0.5)),
    weeklyCoins: Math.round(15800 / (1 + i * 0.5)),
    allTimeCoins: Math.round(96400 / (1 + i * 0.6)),
    isPinned: true,
    createdAt: now,
  }));
}

export function getBoardValue(a: AvatarPreset, type: BoardType): number {
  switch (type) {
    case "top-likers":
      return a.likesTotal;
    case "top-shares":
      return a.sharesTotal;
    case "weekly-supporters":
      return a.weeklyCoins;
    case "alltime-supporters":
      return a.allTimeCoins;
    default:
      return a.coinsTotal;
  }
}

export function getBoardMeta(type: BoardType) {
  return BOARD_TYPES.find((t) => t.id === type) ?? BOARD_TYPES[1];
}

export function rankBoard(avatars: AvatarPreset[], type: BoardType, maxRows: number) {
  return [...avatars]
    .map((a) => ({ preset: a, value: getBoardValue(a, type) }))
    .filter((row) => row.value > 0)
    .sort((x, y) => y.value - x.value)
    .slice(0, maxRows);
}

export function formatBoardValue(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 100_000) return `${Math.round(n / 1000)}K`;
  return n.toLocaleString();
}
