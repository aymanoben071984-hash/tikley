/** Gift Videos (Interactive Actions) — shared, client-safe definitions. */

export type ActionTrigger = "gift" | "coins" | "likes" | "follow" | "share" | "join";
export type ActionMedia = "effect" | "video" | "gif";
export type ActionPosition = "center" | "top" | "bottom" | "left" | "right" | "full";

export const SCREEN_COUNT = 6;

export const ACTION_TRIGGERS: Array<{ id: ActionTrigger; label: string; hint: string; icon: string }> = [
  { id: "gift", label: "Specific gift", hint: "When a chosen gift is sent", icon: "🎁" },
  { id: "coins", label: "Coin milestone", hint: "Every X coins received", icon: "🪙" },
  { id: "likes", label: "Like threshold", hint: "Every N likes", icon: "❤️" },
  { id: "follow", label: "New follow", hint: "Every new follower", icon: "⭐" },
  { id: "share", label: "Share", hint: "Every time the LIVE is shared", icon: "🔁" },
  { id: "join", label: "Join", hint: "Every viewer who joins", icon: "👋" },
];

export const BUILTIN_EFFECTS: Array<{ id: string; label: string; emoji: string }> = [
  { id: "fireworks", label: "Fireworks", emoji: "🎆" },
  { id: "confetti", label: "Confetti", emoji: "🎊" },
  { id: "hearts", label: "Heart rain", emoji: "💖" },
  { id: "coin-rain", label: "Coin rain", emoji: "🪙" },
  { id: "gift-zoom", label: "Giant gift", emoji: "🎁" },
  { id: "lion-roar", label: "Lion roar", emoji: "🦁" },
  { id: "lightning", label: "Lightning", emoji: "⚡" },
  { id: "snow", label: "Snowfall", emoji: "❄️" },
  { id: "rose-storm", label: "Rose storm", emoji: "🌹" },
  { id: "galaxy", label: "Galaxy warp", emoji: "🌌" },
];

export const ACTION_SOUNDS: Array<{ id: string; label: string }> = [
  { id: "fanfare", label: "Fanfare" },
  { id: "chime", label: "Chime" },
  { id: "follow", label: "Ding" },
  { id: "join", label: "Pop" },
  { id: "tick", label: "Tick" },
  { id: "url", label: "Custom sound link…" },
];

export const ACTION_POSITIONS: Array<{ id: ActionPosition; label: string }> = [
  { id: "full", label: "Full screen" },
  { id: "center", label: "Center" },
  { id: "top", label: "Top" },
  { id: "bottom", label: "Bottom" },
  { id: "left", label: "Left" },
  { id: "right", label: "Right" },
];

export interface GiftActionInput {
  name: string;
  enabled: boolean;
  screen: number;
  trigger: ActionTrigger;
  giftId: string | null;
  minCount: number;
  threshold: number;
  mediaType: ActionMedia;
  mediaUrl: string;
  effect: string;
  soundEnabled: boolean;
  soundName: string;
  soundUrl: string;
  volume: number;
  durationSec: number;
  size: number;
  position: ActionPosition;
  fit: "contain" | "cover";
  showCaption: boolean;
  caption: string;
  cooldownSec: number;
}

export const NEW_ACTION_DEFAULTS: GiftActionInput = {
  name: "New action",
  enabled: true,
  screen: 1,
  trigger: "gift",
  giftId: "rose",
  minCount: 1,
  threshold: 1000,
  mediaType: "effect",
  mediaUrl: "",
  effect: "hearts",
  soundEnabled: true,
  soundName: "chime",
  soundUrl: "",
  volume: 80,
  durationSec: 6,
  size: 100,
  position: "full",
  fit: "contain",
  showCaption: true,
  caption: "{name} sent {gift}!",
  cooldownSec: 0,
};

/** Fill in a caption template. */
export function renderCaption(template: string, vars: { name: string; gift: string; amount: number }) {
  return template
    .split("{name}").join(vars.name || "Someone")
    .split("{gift}").join(vars.gift || "a gift")
    .split("{amount}").join(vars.amount ? vars.amount.toLocaleString() : "");
}

export function sanitizeActionInput(raw: Record<string, unknown>): Partial<GiftActionInput> {
  const out: Partial<GiftActionInput> = {};
  const str = (k: string, max: number) => (typeof raw[k] === "string" ? (raw[k] as string).slice(0, max) : undefined);
  const int = (k: string, min: number, max: number) =>
    typeof raw[k] === "number" && Number.isFinite(raw[k]) ? Math.min(max, Math.max(min, Math.round(raw[k] as number))) : undefined;
  const bool = (k: string) => (typeof raw[k] === "boolean" ? (raw[k] as boolean) : undefined);
  const pick = <T extends string>(k: string, allowed: readonly T[]) =>
    typeof raw[k] === "string" && (allowed as readonly string[]).includes(raw[k] as string) ? (raw[k] as T) : undefined;

  const assign = <K extends keyof GiftActionInput>(k: K, v: GiftActionInput[K] | undefined) => {
    if (v !== undefined) out[k] = v;
  };
  assign("name", str("name", 120));
  assign("enabled", bool("enabled"));
  assign("screen", int("screen", 1, SCREEN_COUNT));
  assign("trigger", pick("trigger", ACTION_TRIGGERS.map((t) => t.id)));
  if (raw.giftId === null || typeof raw.giftId === "string") out.giftId = raw.giftId === null ? null : (raw.giftId as string).slice(0, 48);
  assign("minCount", int("minCount", 1, 9999));
  assign("threshold", int("threshold", 1, 10_000_000));
  assign("mediaType", pick("mediaType", ["effect", "video", "gif"] as const));
  assign("mediaUrl", str("mediaUrl", 2000));
  assign("effect", pick("effect", BUILTIN_EFFECTS.map((e) => e.id)));
  assign("soundEnabled", bool("soundEnabled"));
  assign("soundName", pick("soundName", ACTION_SOUNDS.map((s) => s.id)));
  assign("soundUrl", str("soundUrl", 2000));
  assign("volume", int("volume", 0, 100));
  assign("durationSec", int("durationSec", 1, 60));
  assign("size", int("size", 20, 100));
  assign("position", pick("position", ACTION_POSITIONS.map((p) => p.id)));
  assign("fit", pick("fit", ["contain", "cover"] as const));
  assign("showCaption", bool("showCaption"));
  assign("caption", str("caption", 160));
  assign("cooldownSec", int("cooldownSec", 0, 3600));
  return out;
}
