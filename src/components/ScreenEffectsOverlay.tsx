"use client";

import type { LiveEvent, WidgetConfig } from "@/db/schema";
import { EffectsCanvas, type BurstSignal } from "@/components/EffectsCanvas";
import { isScreenEffect, normalizeAmbience, normalizeBursts, type ScreenEffectId } from "@/lib/screenEffects";
import React, { useEffect, useRef, useState } from "react";

/** Older effect keys used elsewhere in the app → screen effect ids. */
const LEGACY: Record<string, ScreenEffectId> = {
  "money-rain": "money",
  "sakura-petals": "sakura",
  "star-shower": "stars",
  "rose-storm": "hearts",
  "avatar-bubbles": "bubbles",
  "crown-drop": "newyear",
  "dragon-embers": "fireworks",
  "gg-hype": "confetti",
  "frost-freeze": "snow",
  lightning: "rain",
  "laser-rave": "sparkles",
};

export function toEffectId(key: string | null | undefined): ScreenEffectId | null {
  if (!key) return null;
  if (isScreenEffect(key)) return key;
  return LEGACY[key] ?? null;
}

/** OBS / LIVE Studio source: ambience + bursts from LIVE events. */
export function ScreenEffectsOverlay({ widget, events }: { widget?: WidgetConfig; events: LiveEvent[] }) {
  const settings = (widget?.customSettings ?? {}) as Record<string, unknown>;
  const ambience = normalizeAmbience(settings.ambience);
  const bursts = normalizeBursts(settings.bursts);
  const seen = useRef<number | null>(null);
  const [burst, setBurst] = useState<BurstSignal | null>(null);

  useEffect(() => {
    if (events.length === 0) return;
    const maxId = Math.max(...events.map((e) => e.id));
    if (seen.current === null) {
      seen.current = maxId; // don't replay anything that happened before the overlay opened
      return;
    }
    const fresh = events.filter((e) => e.id > (seen.current as number)).sort((a, b) => a.id - b.id);
    seen.current = maxId;
    for (const e of fresh) {
      let effect: ScreenEffectId | null = null;
      if (e.eventType === "effect") effect = toEffectId(e.effectKey);
      else if (bursts.autoGift && e.eventType === "gift" && e.coins >= bursts.autoGiftMinCoins) effect = bursts.autoGiftEffect;
      else if (bursts.autoFollow && e.eventType === "follow") effect = bursts.autoFollowEffect;
      if (effect) setBurst({ id: e.id, effect, size: bursts.size, durationSec: bursts.durationSec });
    }
  }, [events, bursts.autoGift, bursts.autoGiftMinCoins, bursts.autoGiftEffect, bursts.autoFollow, bursts.autoFollowEffect, bursts.size, bursts.durationSec]);

  return (
    <div className="overlay-root fixed inset-0">
      <EffectsCanvas ambience={ambience} burst={burst} />
    </div>
  );
}
