import { db } from "@/db";
import {
  avatarPresets,
  liveEvents,
  streamerProfiles,
  widgetConfigs,
} from "@/db/schema";
import { GIFT_CATALOG } from "@/lib/catalog";
import { ensureSeeded } from "@/lib/seed";
import { evaluateGiftActions } from "@/lib/giftActionsServer";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile?.connectionStatus !== "live") return NextResponse.json({ events: [], live: false });
    const events = await db
      .select()
      .from(liveEvents)
      .orderBy(desc(liveEvents.id))
      .limit(40);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("GET /api/events failed:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;

    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile?.connectionStatus !== "live") return NextResponse.json({ error: "LIVE is not active" }, { status: 409 });
    const eventType = String(body.eventType || "gift");
    const username = typeof body.username === "string" ? body.username.trim() : "";
    if (!username || username.length > 80) {
      return NextResponse.json({ error: "A real TikTok username is required for LIVE events." }, { status: 400 });
    }
    const displayName = typeof body.displayName === "string" && body.displayName.trim()
      ? body.displayName.trim().slice(0, 120) : username;
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 2000) : "";
    const avatarFrame = typeof body.avatarFrame === "string" && body.avatarFrame.trim()
      ? body.avatarFrame.trim().slice(0, 80) : "ember-dragon";

    let giftId: string | null = null;
    let giftName: string | null = null;
    let giftIcon: string | null = null;
    let coins = Number(body.coins || 0);
    let likes = Number(body.likes || 0);
    let message = typeof body.message === "string" ? body.message : "";
    const effectKey = typeof body.effectKey === "string" ? body.effectKey : null;

    if (eventType === "gift") {
      const requestedGift = String(body.giftId || "rose");
      const found =
        GIFT_CATALOG.find((g) => g.id === requestedGift) ?? GIFT_CATALOG[0];
      giftId = found.id;
      giftName = found.name;
      giftIcon = found.icon;
      if (!coins || coins <= 0) coins = found.coins;
      if (!message) message = `Sent ${found.name} (${coins.toLocaleString()} coins)!`;
    } else if (eventType === "follow") {
      if (!message) message = "followed the LIVE!";
    } else if (eventType === "join") {
      if (!message) message = "joined the LIVE!";
    } else if (eventType === "like") {
      if (!likes || likes <= 0) likes = 50;
      if (!message) message = `sent ${likes} likes ❤️`;
    } else if (eventType === "share") {
      if (!message) message = "shared the LIVE stream!";
    } else if (eventType === "effect") {
      if (!message) message = `triggered ${effectKey || "confetti"} screen effect!`;
    }

    const [created] = await db
      .insert(liveEvents)
      .values({
        eventType,
        username,
        displayName,
        avatarUrl,
        avatarFrame,
        giftId,
        giftName,
        giftIcon,
        coins,
        likes,
        message,
        effectKey,
      })
      .returning();

    if (profile) {
      await db
        .update(streamerProfiles)
        .set({
          sessionCoins: profile.sessionCoins + coins,
          sessionGifts: profile.sessionGifts + (eventType === "gift" ? 1 : 0),
          sessionNewFollowers:
            profile.sessionNewFollowers + (eventType === "follow" ? 1 : 0),
          sessionLikes: profile.sessionLikes + likes,
          followersCount:
            profile.followersCount + (eventType === "follow" ? 1 : 0),
          likesCount: profile.likesCount + likes,
          updatedAt: new Date(),
        })
        .where(eq(streamerProfiles.id, profile.id));
    }

    const shares = eventType === "share" ? 1 : 0;
    if (coins > 0 || likes > 0 || shares > 0) {
      const existingPreset = await db
        .select()
        .from(avatarPresets)
        .where(eq(avatarPresets.tiktokUsername, username))
        .limit(1);

      if (existingPreset.length > 0) {
        await db
          .update(avatarPresets)
          .set({
            coinsTotal: sql`${avatarPresets.coinsTotal} + ${coins}`,
            weeklyCoins: sql`${avatarPresets.weeklyCoins} + ${coins}`,
            allTimeCoins: sql`${avatarPresets.allTimeCoins} + ${coins}`,
            likesTotal: sql`${avatarPresets.likesTotal} + ${likes}`,
            sharesTotal: sql`${avatarPresets.sharesTotal} + ${shares}`,
          })
          .where(eq(avatarPresets.id, existingPreset[0].id));
      }

      if (coins > 0) {
        const [goalWidget] = await db
          .select()
          .from(widgetConfigs)
          .where(eq(widgetConfigs.widgetKey, "goals"))
          .limit(1);

        if (goalWidget) {
          const settings = { ...(goalWidget.customSettings || {}) };
          const prevCurrent = Number(settings.current || 0);
          settings.current = prevCurrent + coins;
          await db
            .update(widgetConfigs)
            .set({ customSettings: settings, updatedAt: new Date() })
            .where(eq(widgetConfigs.id, goalWidget.id));
        }
      }
    }

    // Gift Videos: queue any interactive actions this event triggers
    try {
      await evaluateGiftActions({
        eventType,
        giftId,
        giftName,
        coins,
        likes,
        displayName,
        avatarUrl,
      });
    } catch (actionError) {
      console.error("Gift action evaluation failed:", actionError);
    }

    return NextResponse.json({ event: created });
  } catch (error) {
    console.error("POST /api/events failed:", error);
    return NextResponse.json({ error: "Failed to fire event" }, { status: 500 });
  }
}
