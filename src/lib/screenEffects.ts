/** Screen Effects — full-screen ambience + instant bursts (effect list from OverlayLive). */

export type ScreenEffectId =
  | "snow"
  | "stars"
  | "confetti"
  | "hearts"
  | "rain"
  | "sakura"
  | "fireworks"
  | "bubbles"
  | "leaves"
  | "money"
  | "sparkles"
  | "fireflies"
  | "ramadan"
  | "eid"
  | "newyear";

export const SCREEN_EFFECT_LIST: Array<{ id: ScreenEffectId; label: string; emoji: string; tintable: boolean }> = [
  { id: "snow", label: "Snow", emoji: "❄️", tintable: true },
  { id: "stars", label: "Stars", emoji: "⭐", tintable: true },
  { id: "confetti", label: "Confetti", emoji: "🎊", tintable: false },
  { id: "hearts", label: "Hearts", emoji: "💖", tintable: true },
  { id: "rain", label: "Rain", emoji: "🌧️", tintable: true },
  { id: "sakura", label: "Sakura", emoji: "🌸", tintable: true },
  { id: "fireworks", label: "Fireworks", emoji: "🎆", tintable: false },
  { id: "bubbles", label: "Bubbles", emoji: "🫧", tintable: true },
  { id: "leaves", label: "Autumn leaves", emoji: "🍂", tintable: false },
  { id: "money", label: "Money rain", emoji: "💸", tintable: false },
  { id: "sparkles", label: "Sparkles", emoji: "✨", tintable: true },
  { id: "fireflies", label: "Fireflies", emoji: "🪲", tintable: true },
  { id: "ramadan", label: "Ramadan", emoji: "🏮", tintable: false },
  { id: "eid", label: "Eid", emoji: "🌙", tintable: false },
  { id: "newyear", label: "New Year", emoji: "🎇", tintable: false },
];

export interface AmbienceSettings {
  enabled: boolean;
  effect: ScreenEffectId;
  intensity: number; // 0–100
  speed: number; // 0.25–3
  tint: string | null;
}

export interface BurstSettings {
  size: number; // 20–100
  durationSec: number; // 1–8
  autoGift: boolean;
  autoGiftMinCoins: number;
  autoGiftEffect: ScreenEffectId;
  autoFollow: boolean;
  autoFollowEffect: ScreenEffectId;
}

/** OverlayLive's ambience defaults. */
export const AMBIENCE_DEFAULTS: AmbienceSettings = { enabled: false, effect: "snow", intensity: 50, speed: 1, tint: null };

export const BURST_DEFAULTS: BurstSettings = {
  size: 70,
  durationSec: 3,
  autoGift: true,
  autoGiftMinCoins: 1000,
  autoGiftEffect: "fireworks",
  autoFollow: false,
  autoFollowEffect: "hearts",
};

const IDS = new Set(SCREEN_EFFECT_LIST.map((e) => e.id));

export function normalizeAmbience(raw: unknown): AmbienceSettings {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<AmbienceSettings>;
  return {
    enabled: Boolean(s.enabled),
    effect: IDS.has(s.effect as ScreenEffectId) ? (s.effect as ScreenEffectId) : AMBIENCE_DEFAULTS.effect,
    intensity: Math.min(100, Math.max(0, Number(s.intensity ?? AMBIENCE_DEFAULTS.intensity))),
    speed: Math.min(3, Math.max(0.25, Number(s.speed ?? AMBIENCE_DEFAULTS.speed))),
    tint: typeof s.tint === "string" && /^#[0-9a-f]{6}$/i.test(s.tint) ? s.tint : null,
  };
}

export function normalizeBursts(raw: unknown): BurstSettings {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<BurstSettings>;
  return {
    size: Math.min(100, Math.max(20, Number(s.size ?? BURST_DEFAULTS.size))),
    durationSec: Math.min(8, Math.max(1, Number(s.durationSec ?? BURST_DEFAULTS.durationSec))),
    autoGift: s.autoGift ?? BURST_DEFAULTS.autoGift,
    autoGiftMinCoins: Math.max(1, Number(s.autoGiftMinCoins ?? BURST_DEFAULTS.autoGiftMinCoins)),
    autoGiftEffect: IDS.has(s.autoGiftEffect as ScreenEffectId) ? (s.autoGiftEffect as ScreenEffectId) : BURST_DEFAULTS.autoGiftEffect,
    autoFollow: s.autoFollow ?? BURST_DEFAULTS.autoFollow,
    autoFollowEffect: IDS.has(s.autoFollowEffect as ScreenEffectId) ? (s.autoFollowEffect as ScreenEffectId) : BURST_DEFAULTS.autoFollowEffect,
  };
}

export function isScreenEffect(v: unknown): v is ScreenEffectId {
  return IDS.has(v as ScreenEffectId);
}
