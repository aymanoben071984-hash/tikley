/** 9:16 (TikTok LIVE Studio) and 16:9 (OBS Studio) display settings for every overlay. */

export type DisplayFormat = "9:16" | "16:9";
export type DefaultFormat = "auto" | DisplayFormat;
export type Anchor = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

export interface FormatPlacement {
  scale: number; // 30–250 %
  anchor: Anchor;
  offsetX: number; // -50…50 % of the canvas
  offsetY: number;
  safeZone: boolean; // 9:16 only: keep clear of TikTok's on-phone buttons and comments
}

export interface OverlayDisplay {
  defaultFormat: DefaultFormat;
  formats: Record<DisplayFormat, FormatPlacement>;
}

export const CANVAS: Record<DisplayFormat, { w: number; h: number; label: string; app: string }> = {
  "9:16": { w: 1080, h: 1920, label: "9:16 vertical", app: "TikTok LIVE Studio" },
  "16:9": { w: 1920, h: 1080, label: "16:9 horizontal", app: "OBS Studio" },
};

/** Areas the TikTok app draws over on viewers' phones (fractions of the 9:16 canvas). */
export const TIKTOK_SAFE = { top: 0.09, bottom: 0.24, left: 0.03, right: 0.14 };

export const ANCHORS: Anchor[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];
export const ANCHOR_LABEL: Record<Anchor, string> = {
  tl: "Top left", tc: "Top", tr: "Top right", ml: "Left", mc: "Center", mr: "Right", bl: "Bottom left", bc: "Bottom", br: "Bottom right",
};
export const ANCHOR_ORIGIN: Record<Anchor, string> = {
  tl: "0% 0%", tc: "50% 0%", tr: "100% 0%", ml: "0% 50%", mc: "50% 50%", mr: "100% 50%", bl: "0% 100%", bc: "50% 100%", br: "100% 100%",
};

export const PLACEMENT_DEFAULT: FormatPlacement = { scale: 100, anchor: "mc", offsetX: 0, offsetY: 0, safeZone: false };

export const DISPLAY_DEFAULT: OverlayDisplay = {
  defaultFormat: "auto",
  formats: { "9:16": { ...PLACEMENT_DEFAULT }, "16:9": { ...PLACEMENT_DEFAULT } },
};

const num = (v: unknown, min: number, max: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

function normalizePlacement(raw: unknown): FormatPlacement {
  const p = (raw && typeof raw === "object" ? raw : {}) as Partial<FormatPlacement>;
  return {
    scale: Math.round(num(p.scale, 30, 250, 100)),
    anchor: ANCHORS.includes(p.anchor as Anchor) ? (p.anchor as Anchor) : "mc",
    offsetX: Math.round(num(p.offsetX, -50, 50, 0)),
    offsetY: Math.round(num(p.offsetY, -50, 50, 0)),
    safeZone: Boolean(p.safeZone),
  };
}

export function normalizeDisplay(raw: unknown): OverlayDisplay {
  const d = (raw && typeof raw === "object" ? raw : {}) as Partial<OverlayDisplay>;
  const f = (d.formats && typeof d.formats === "object" ? d.formats : {}) as Partial<Record<DisplayFormat, unknown>>;
  return {
    defaultFormat: d.defaultFormat === "9:16" || d.defaultFormat === "16:9" ? d.defaultFormat : "auto",
    formats: { "9:16": normalizePlacement(f["9:16"]), "16:9": normalizePlacement(f["16:9"]) },
  };
}

export function parseFormatParam(v: string | null): DefaultFormat | null {
  if (!v) return null;
  const s = v.replace(/\s/g, "").replace("x", ":").replace("-", ":");
  if (s === "9:16" || s === "vertical" || s === "tiktok") return "9:16";
  if (s === "16:9" || s === "horizontal" || s === "obs") return "16:9";
  if (s === "auto") return "auto";
  return null;
}

/** Add `format=…` to an overlay link. */
export function withFormat(path: string, format: DisplayFormat) {
  return `${path}${path.includes("?") ? "&" : "?"}format=${format}`;
}
