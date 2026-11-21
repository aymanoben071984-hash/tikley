import { LOCK_GIFT_ACTIONS, db, withAdvisoryLock } from "@/db";
import { actionQueue, giftActions, type GiftAction } from "@/db/schema";
import { GIFT_CATALOG } from "@/lib/catalog";
import { count, eq, lt } from "drizzle-orm";

let seeded: Promise<void> | null = null;

/** Starter actions so the feature works out of the box. */
export function ensureGiftActions(): Promise<void> {
  if (!seeded) {
    seeded = withAdvisoryLock(LOCK_GIFT_ACTIONS, async () => {
      const [{ value }] = await db.select({ value: count() }).from(giftActions);
      if (value > 0) return;
      await db.insert(giftActions).values([
        { name: "Lion fireworks", screen: 1, trigger: "gift", giftId: "lion", effect: "lion-roar", soundName: "fanfare", durationSec: 8, caption: "🦁 {name} sent a LION!" },
        { name: "Rose hearts", screen: 1, trigger: "gift", giftId: "rose", effect: "rose-storm", soundName: "chime", durationSec: 5, minCount: 1, caption: "🌹 {name} sent a Rose" },
        { name: "Every 1,000 coins", screen: 2, trigger: "coins", threshold: 1000, effect: "coin-rain", soundName: "fanfare", durationSec: 7, caption: "🪙 1,000 more coins — thank you!" },
        { name: "Every 5,000 likes", screen: 2, trigger: "likes", threshold: 5000, effect: "hearts", soundName: "chime", durationSec: 6, caption: "❤️ Another 5,000 likes!" },
        { name: "New follower confetti", screen: 3, trigger: "follow", effect: "confetti", soundName: "follow", durationSec: 4, caption: "⭐ Welcome {name}!", enabled: false },
      ]);
    }).catch((e) => {
      seeded = null;
      throw e;
    });
  }
  return seeded;
}

export interface ActionEvent {
  eventType: string;
  giftId?: string | null;
  giftName?: string | null;
  coins: number;
  likes: number;
  displayName: string;
  avatarUrl: string;
}

/** Check a new LIVE event against every enabled action and queue the ones that fire. */
export async function evaluateGiftActions(ev: ActionEvent): Promise<number> {
  await ensureGiftActions();
  const actions = await db.select().from(giftActions).where(eq(giftActions.enabled, true));
  const now = Date.now();
  const gift = GIFT_CATALOG.find((g) => g.id === ev.giftId);
  const repeat = gift && ev.coins > 0 ? Math.max(1, Math.round(ev.coins / gift.coins)) : 1;
  let queued = 0;

  for (const a of actions) {
    let fires = 0;
    let progress = a.progress;
    if (a.trigger === "gift") {
      if (ev.eventType === "gift" && (!a.giftId || a.giftId === "any" || a.giftId === ev.giftId) && repeat >= a.minCount) fires = 1;
    } else if (a.trigger === "coins") {
      if (ev.eventType === "gift" && ev.coins > 0) {
        progress += ev.coins;
        fires = Math.min(3, Math.floor(progress / Math.max(1, a.threshold)));
        progress -= fires * a.threshold;
        if (progress >= a.threshold) progress = progress % a.threshold;
      }
    } else if (a.trigger === "likes") {
      if (ev.likes > 0) {
        progress += ev.likes;
        fires = Math.min(3, Math.floor(progress / Math.max(1, a.threshold)));
        progress -= fires * a.threshold;
        if (progress >= a.threshold) progress = progress % a.threshold;
      }
    } else if (ev.eventType === a.trigger) {
      fires = 1;
    }

    const cooling = a.cooldownSec > 0 && a.lastFiredAt && now - new Date(a.lastFiredAt).getTime() < a.cooldownSec * 1000;
    if (cooling) fires = 0;

    if (fires > 0) {
      await db.insert(actionQueue).values(
        Array.from({ length: fires }, () => ({
          actionId: a.id,
          screen: a.screen,
          displayName: ev.displayName,
          avatarUrl: ev.avatarUrl,
          giftName: ev.giftName ?? (a.trigger === "coins" ? `${a.threshold.toLocaleString()} coins` : a.trigger === "likes" ? `${a.threshold.toLocaleString()} likes` : ""),
          amount: a.trigger === "coins" || a.trigger === "likes" ? a.threshold : ev.coins,
        })),
      );
      queued += fires;
    }
    if (fires > 0 || progress !== a.progress) {
      await db
        .update(giftActions)
        .set({ progress, ...(fires > 0 ? { lastFiredAt: new Date() } : {}) })
        .where(eq(giftActions.id, a.id));
    }
  }

  // keep the queue small
  if (queued > 0 && Math.random() < 0.1) {
    await db.delete(actionQueue).where(lt(actionQueue.createdAt, new Date(now - 6 * 3600 * 1000)));
  }
  return queued;
}

/** Queue one action manually (dashboard "Test" button). */
export async function queueTestAction(a: GiftAction): Promise<void> {
  await db.insert(actionQueue).values({
    actionId: a.id,
    screen: a.screen,
    displayName: "Mira Lee",
    avatarUrl: "/avatars/a2.png",
    giftName: a.giftId ? GIFT_CATALOG.find((g) => g.id === a.giftId)?.name ?? "Gift" : a.trigger === "coins" ? `${a.threshold} coins` : "Lion",
    amount: a.threshold,
  });
}
