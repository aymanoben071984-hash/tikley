/** Social Media overlay — designs, settings and defaults (ported from OverlayLive). */
import { SOCIAL_PLATFORMS } from "@/lib/socialPlatforms";

const A = "/assets/social";
const INK = "#ffffff";
const LABEL = "rgba(255,255,255,0.72)";
const INK_SOFT = "#fff7fb";
const LABEL_SOFT = "rgba(255,240,246,0.8)";

export interface FrameDesign {
  id: string;
  label: string;
  frame: string;
  frameW: number;
  frameH: number;
  width: number;
  extraRight?: number;
  socket: { cx: number; cy: number; w: number; h: number; shape: "circle" | "hex"; discScale?: number; underFrame?: boolean };
  text: { x: number; y: number; px?: number; w?: number; h?: number; align?: "center"; plate?: boolean; clip?: string };
  labelSlot?: { x: number; y: number; w: number; h?: number; bare?: boolean; fill?: boolean; clip?: string };
  anim?: { src: string; x: number; y: number; w: number; motion: string; rotate?: number };
  font: string;
  ink: string;
  labelInk: string;
  glow: string;
  disc: "dark" | "glass";
}

export const FRAME_DESIGNS: FrameDesign[] = [
  { id: "overlaylive-badge", label: "OverlayLive Badge", frame: `${A}/overlaylive-badge-frame.png`, frameW: 1254, frameH: 1254, width: 230, extraRight: 300, socket: { cx: 50.3, cy: 49.5, w: 46.3, h: 46.7, shape: "hex", discScale: 0.9, underFrame: true }, text: { x: 91, y: 50, px: 42 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#2ba3ff", disc: "dark" },
  { id: "ember-dragon", label: "Ember Dragon", frame: `${A}/ember-dragon-frame.webp`, frameW: 1672, frameH: 941, width: 445, socket: { cx: 23.03, cy: 57.98, w: 23.39, h: 38.15, shape: "circle" }, text: { x: 41, y: 58 }, anim: { src: `${A}/ember-dragon-anim.webp`, x: 39, y: 62, w: 40, motion: "dragon" }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#fb923c", disc: "dark" },
  { id: "neon-arcade", label: "Neon Arcade", frame: `${A}/neon-arcade-frame.webp`, frameW: 1881, frameH: 836, width: 606, socket: { cx: 21.64, cy: 49.77, w: 17.17, h: 38.52, shape: "circle" }, text: { x: 36, y: 22 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#38bdf8", disc: "dark" },
  { id: "royal-anime", label: "Royal Anime", frame: `${A}/royal-anime-frame.webp`, frameW: 614, frameH: 488, width: 300, extraRight: 320, socket: { cx: 42.18, cy: 56.76, w: 37.62, h: 46.93, shape: "circle" }, text: { x: 99, y: 57, px: 40 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#fbbf24", disc: "dark" },
  { id: "crimson-flame", label: "Crimson Flame", frame: `${A}/crimson-flame-frame.webp`, frameW: 1736, frameH: 604, width: 536, socket: { cx: 16.79, cy: 52.52, w: 19.41, h: 56.46, shape: "circle" }, text: { x: 41.9, y: 53.2 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#fb923c", disc: "dark" },
  { id: "cyan-bolt", label: "Cyan Bolt", frame: `${A}/cyan-bolt-frame.webp`, frameW: 1672, frameH: 941, width: 619, socket: { cx: 14.71, cy: 51.81, w: 16.81, h: 34.33, shape: "hex" }, text: { x: 28, y: 24, w: 50, align: "center" }, anim: { src: `${A}/cyan-bolt-anim.webp`, x: 28, y: 18, w: 50, motion: "bolt" }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#22d3ee", disc: "dark" },
  { id: "aurora-trail", label: "Aurora Trail", frame: `${A}/aurora-trail-frame.webp`, frameW: 1410, frameH: 588, width: 410, extraRight: 200, socket: { cx: 32.01, cy: 55.26, w: 25.39, h: 59.35, shape: "circle" }, text: { x: 50.5, y: 22.8 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#67e8f9", disc: "dark" },
  { id: "celestial-comet", label: "Celestial Comet", frame: `${A}/celestial-comet-frame.webp`, frameW: 916, frameH: 272, width: 604, socket: { cx: 33.06, cy: 54.92, w: 17.26, h: 58.47, shape: "circle" }, text: { x: 44.73, y: 47.16 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#fcd34d", disc: "dark" },
  { id: "neon-hex-scan", label: "Neon Hex Scan", frame: `${A}/neon-hex-scan-frame.webp`, frameW: 1536, frameH: 1024, width: 668, socket: { cx: 15.68, cy: 47.51, w: 15.56, h: 20.31, shape: "hex" }, text: { x: 32, y: 33 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#60a5fa", disc: "dark" },
  { id: "neon-audio-pulse", label: "Neon Audio Pulse", frame: `${A}/neon-audio-pulse-frame.webp`, frameW: 1536, frameH: 1024, width: 627, socket: { cx: 17.26, cy: 48.85, w: 16.6, h: 25, shape: "circle" }, text: { x: 38, y: 40 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#e879f9", disc: "dark" },
  { id: "street-art", label: "Street Art", frame: `${A}/street-art-frame.webp`, frameW: 1305, frameH: 715, width: 492, extraRight: 160, socket: { cx: 28.34, cy: 49.72, w: 21.15, h: 43.92, shape: "hex" }, text: { x: 54.9, y: 24 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#2dd4bf", disc: "dark" },
  { id: "turquoise-wave", label: "Turquoise Wave", frame: `${A}/turquoise-wave-frame.webp`, frameW: 2172, frameH: 724, width: 578, socket: { cx: 19.55, cy: 53.67, w: 18, h: 53.31, shape: "circle" }, text: { x: 38, y: 46 }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#22d3ee", disc: "dark" },
  { id: "luminous-butterfly", label: "Luminous Butterfly", frame: `${A}/luminous-butterfly-frame.webp`, frameW: 1536, frameH: 1024, width: 614, socket: { cx: 20.14, cy: 51.81, w: 16.93, h: 25, shape: "circle" }, text: { x: 50, y: 43 }, font: "Orbitron", ink: INK_SOFT, labelInk: LABEL_SOFT, glow: "#f5b8cf", disc: "glass" },
  { id: "sakura-swoosh", label: "Sakura Swoosh", frame: `${A}/sakura-swoosh-frame.webp`, frameW: 2172, frameH: 724, width: 588, socket: { cx: 20.11, cy: 44.61, w: 17.68, h: 51.93, shape: "circle" }, text: { x: 38, y: 24 }, font: "Orbitron", ink: INK_SOFT, labelInk: LABEL_SOFT, glow: "#f9a8d4", disc: "glass" },
  { id: "dreamy-cloud", label: "Dreamy Cloud", frame: `${A}/dreamy-cloud-frame.webp`, frameW: 1536, frameH: 1024, width: 729, socket: { cx: 18.55, cy: 48.31, w: 14.26, h: 21.09, shape: "circle" }, text: { x: 30, y: 36 }, font: "Orbitron", ink: INK, labelInk: LABEL_SOFT, glow: "#c4b5fd", disc: "glass" },
  { id: "smiling-star", label: "Smiling Star", frame: `${A}/smiling-star-frame.webp`, frameW: 508, frameH: 555, width: 225, extraRight: 300, socket: { cx: 51.76, cy: 59.32, w: 41.73, h: 38.2, shape: "circle" }, text: { x: 105, y: 38 }, anim: { src: `${A}/smiling-star-anim.webp`, x: 102, y: 45, w: 92, motion: "cloud" }, font: "Orbitron", ink: INK, labelInk: LABEL_SOFT, glow: "#c7d2fe", disc: "glass" },
  { id: "kawaii-cat", label: "Kawaii Cat", frame: `${A}/kawaii-cat-frame.webp`, frameW: 1536, frameH: 1024, width: 594, socket: { cx: 17.02, cy: 50.75, w: 17.51, h: 26.37, shape: "circle" }, text: { x: 29, y: 42, w: 46, align: "center" }, anim: { src: `${A}/kawaii-cat-anim.webp`, x: 29, y: 24, w: 46, motion: "paws", rotate: 50 }, font: "Orbitron", ink: INK_SOFT, labelInk: LABEL_SOFT, glow: "#f9a8d4", disc: "glass" },
  { id: "mauve-cat-ear", label: "Mauve Cat Ear", frame: `${A}/mauve-cat-ear-frame.webp`, frameW: 1536, frameH: 1024, width: 514, socket: { cx: 18.6, cy: 46.08, w: 20.25, h: 30.18, shape: "circle" }, text: { x: 38, y: 33 }, font: "Orbitron", ink: INK_SOFT, labelInk: LABEL_SOFT, glow: "#e9a3b8", disc: "glass" },
  { id: "overlaylive", label: "OverlayLive", frame: `${A}/overlaylive-frame.png`, frameW: 1919, frameH: 820, width: 600, socket: { cx: 16.78, cy: 48.05, w: 18.81, h: 44, shape: "circle", discScale: 1.005, underFrame: true }, text: { x: 28.2, y: 51.2, w: 64.2, align: "center" }, labelSlot: { x: 32.4, y: 27.2, w: 34.6, h: 12, bare: true }, font: "Orbitron", ink: INK, labelInk: LABEL, glow: "#2ba3ff", disc: "dark" },
];

export const CLASSIC_SOCIAL: Record<string, { label: string; wrapper: string; item: string; icon: string; text: string; labelCls?: string; handlePx?: number }> = {
  "cyber-blade": { label: "Voltage", wrapper: "", item: "", icon: "", text: "" },
  glassy: { label: "Frost", wrapper: "sg-card sg-social", item: "flex items-center gap-5", icon: "sg-social-icon", text: "sg-social-handle", labelCls: "sg-social-label" },
  classic: { label: "Classic", wrapper: "flex gap-5 px-7 py-5 bg-white/95 rounded-3xl shadow-[0_10px_30px_rgba(0,0,0,0.25)] border border-gray-200", item: "flex items-center gap-4", icon: "text-3xl", text: "font-bold text-slate-800 leading-tight", labelCls: "font-bold uppercase tracking-[0.2em] text-slate-500", handlePx: 30 },
  taif: { label: "Lumen", wrapper: "flex gap-5 p-5 bg-black/60 rounded-3xl border border-white/10 shadow-lg", item: "flex items-center gap-3", icon: "text-3xl text-white", text: "font-bold text-white tracking-wide" },
  rose: { label: "Rose", wrapper: "flex gap-4 p-4 bg-pink-950/70 rounded-[30px] border border-pink-500/40", item: "flex items-center gap-2", icon: "text-2xl text-pink-400", text: "font-bold text-pink-100" },
};

export const SPECIAL_DESIGNS = ["bubble-pop", "flame"] as const;
export const SPECIAL_LABELS: Record<string, string> = { "bubble-pop": "Bubble Pop", flame: "Flame" };

/** Design order shown in the picker (same as OverlayLive). */
export const SOCIAL_DESIGN_IDS: string[] = [FRAME_DESIGNS[0].id, ...SPECIAL_DESIGNS, ...FRAME_DESIGNS.slice(1).map((d) => d.id), "cyber-blade", "glassy", "classic", "taif", "rose"];

export function socialDesignLabel(id: string) {
  return FRAME_DESIGNS.find((d) => d.id === id)?.label ?? CLASSIC_SOCIAL[id]?.label ?? SPECIAL_LABELS[id] ?? id;
}
export function frameDesign(id: string) {
  return FRAME_DESIGNS.find((d) => d.id === id);
}

export const SOCIAL_MOTIONS = ["none", "shake", "bounce", "pulse", "swing"] as const;
export const SOCIAL_PARTICLES = ["none", "hearts", "stars", "sparkles", "bubbles"] as const;
export type SocialPosition = "center" | "bottom-left" | "bottom-right" | "top-left" | "top-right" | "bottom" | "top";
export const SOCIAL_POSITIONS: SocialPosition[] = ["top-left", "top", "top-right", "center", "bottom-left", "bottom", "bottom-right"];

export interface SocialLink {
  platform: string;
  label: string;
  url: string;
}

export interface SocialConfig {
  links: SocialLink[];
  intervalMs: number;
  fontFamily: string;
  textColor: string;
  accentColor: string;
  design: string;
  scale: number;
  fontSize: number;
  showPlatform: boolean;
  handleGlow: boolean;
  handleGlowColor: string;
  cardGlow: boolean;
  cardGlowColor: string;
  particles: (typeof SOCIAL_PARTICLES)[number];
  motion: (typeof SOCIAL_MOTIONS)[number];
}

/** OverlayLive's defaults. */
export const SOCIAL_DEFAULTS: SocialConfig = {
  links: [
    { platform: "tiktok", label: "@yourname", url: "https://tiktok.com" },
    { platform: "instagram", label: "@yourname", url: "https://instagram.com" },
    { platform: "youtube", label: "Your Channel", url: "https://youtube.com" },
  ],
  intervalMs: 4000,
  fontFamily: "",
  textColor: "",
  accentColor: "#22d3ee",
  design: "overlaylive-badge",
  scale: 100,
  fontSize: 100,
  showPlatform: true,
  handleGlow: true,
  handleGlowColor: "",
  cardGlow: true,
  cardGlowColor: "",
  particles: "stars",
  motion: "pulse",
};

export const platformColor = (p: string, fallback = "#d946ef") => SOCIAL_PLATFORMS[p]?.color ?? fallback;
export const platformLabel = (p: string) => SOCIAL_PLATFORMS[p]?.label ?? p;

export function normalizeSocial(raw: unknown): SocialConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<SocialConfig>;
  const d = SOCIAL_DEFAULTS;
  const links = Array.isArray(c.links)
    ? c.links
        .filter((l): l is SocialLink => !!l && typeof l === "object")
        .slice(0, 12)
        .map((l) => ({ platform: String(l.platform || "tiktok"), label: String(l.label ?? "").slice(0, 60), url: String(l.url ?? "").slice(0, 200) }))
    : d.links;
  return {
    ...d,
    ...c,
    links,
    intervalMs: Math.min(30000, Math.max(1500, Number(c.intervalMs) || d.intervalMs)),
    design: SOCIAL_DESIGN_IDS.includes(String(c.design)) ? String(c.design) : d.design,
    scale: Math.min(200, Math.max(40, Number(c.scale) || d.scale)),
    fontSize: Math.min(200, Math.max(50, Number(c.fontSize) || d.fontSize)),
    particles: (SOCIAL_PARTICLES as readonly string[]).includes(String(c.particles)) ? (c.particles as SocialConfig["particles"]) : d.particles,
    motion: (SOCIAL_MOTIONS as readonly string[]).includes(String(c.motion)) ? (c.motion as SocialConfig["motion"]) : d.motion,
  };
}
