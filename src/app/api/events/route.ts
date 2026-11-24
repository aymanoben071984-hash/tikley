import { createHash, randomUUID } from "node:crypto";
import { db } from "@/db";
import { avatarPresets, liveEvents, streamerProfiles, widgetConfigs } from "@/db/schema";
import { GIFT_CATALOG } from "@/lib/catalog";
import { ensureSeeded } from "@/lib/seed";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { evaluateGiftActions } from "@/lib/giftActionsServer";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile?.connectionStatus !== "live") {
      return NextResponse.json({ events: [], live: false }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    }
    const events = await db.select().from(liveEvents).orderBy(desc(liveEvents.id)).limit(40);
    return NextResponse.json({ events, live: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("GET /api/events failed:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });

  const workerSecret = process.env.TIKTOK_INGEST_TOKEN;
  const workerAuthorized = Boolean(workerSecret && request.headers.get("authorization") === `Bearer ${workerSecret}`);
  const admin = workerAuthorized ? null : await getSessionUser(request);
  if (!workerAuthorized && admin?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workerAuthorized && !isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });

  try {
    await ensureSeeded();
    const body = await request.json() as Record<string, unknown>;
    const eventType = String(body.eventType || "");
    if (!["gift", "like", "follow", "join", "chat", "share", "effect"].includes(eventType)) {
      return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
    }
    if (eventType === "effect" && workerAuthorized) {
      return NextResponse.json({ error: "Effects can only be triggered by an administrator" }, { status: 403 });
    }

    const isAdmin = admin?.role === "admin";
    if (!workerAuthorized && !isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const rawUsername = typeof body.username === "string" ? body.username.trim().replace(/^@/, "") : "";
    const username = rawUsername || (isAdmin ? "tikley_test" : "");
    if (!username || username.length > 80) return NextResponse.json({ error: "Real username required" }, { status: 400 });
    const rawDisplayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim().slice(0, 120) : "";
    const displayName = rawDisplayName || (isAdmin ? "Tikley Test Viewer" : username);
    const rawAvatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0, 2000) : "";
    // Keep events even when TikTok omits an avatar; preserve known real avatars on leaderboard profiles.
    const avatarUrl = rawAvatarUrl || "/avatars/a1.png";
    const avatarFrame = typeof body.avatarFrame === "string" && body.avatarFrame.trim() ? body.avatarFrame.trim().slice(0, 80) : "ember-dragon";
    let giftId: string | null = null;
    let giftName: string | null = null;
    let giftIcon: string | null = null;
    let coins = Math.max(0, Math.min(2_000_000_000, Math.floor(Number(body.coins) || 0)));
    const likes = Math.max(0, Math.min(2_000_000_000, Math.floor(Number(body.likes) || 0)));
    let message = typeof body.message === "string" ? body.message.slice(0, 2000) : "";
    const effectKey = typeof body.effectKey === "string" ? body.effectKey.slice(0, 48) : null;
    if (eventType === "effect" && !effectKey) {
      return NextResponse.json({ error: "Effect key is required" }, { status: 400 });
    }

    if (eventType === "gift") {
      const suppliedGiftId = typeof body.giftId === "string" ? body.giftId.trim().slice(0, 48) : "";
      const suppliedGiftName = typeof body.giftName === "string" ? body.giftName.trim().slice(0, 80) : "";
      const providerGiftName = suppliedGiftName || "TikTok gift";
      const providerFallbackId = "provider:" + createHash("sha256").update(providerGiftName.toLowerCase()).digest("hex").slice(0, 32);
      const found = GIFT_CATALOG.find((gift) => gift.id === suppliedGiftId);
      if (found) {
        giftId = found.id;
        giftName = found.name;
        giftIcon = found.icon;
        if (coins <= 0 && isAdmin) coins = found.coins;
      } else if (workerAuthorized) {
        // TikTok provider IDs may be absent in some SDK event variants. Preserve
        // the provider ID when present; otherwise use a stable name-derived ID.
        giftId = suppliedGiftId || providerFallbackId;
        giftName = providerGiftName;
        giftIcon = null;
      } else {
        return NextResponse.json({ error: "Unknown gift id" }, { status: 400 });
      }
      // TikTok may report valid free/zero-diamond gifts. Keep them as events;
      // admin-triggered test gifts still require a positive catalog coin value.
      if (coins <= 0 && !workerAuthorized) return NextResponse.json({ error: "Gift coin value required" }, { status: 400 });
      if (!message) message = `Sent ${giftName} (${coins.toLocaleString()} coins)!`;
    } else if (eventType === "follow") {
      if (!message) message = "followed the LIVE!";
    } else if (eventType === "join") {
      if (!message) message = "joined the LIVE!";
    } else if (eventType === "like") {
      if (likes <= 0) return NextResponse.json({ error: "Like count required" }, { status: 400 });
      if (!message) message = `sent ${likes} likes ❤️`;
    } else if (eventType === "share" && !message) {
      message = "shared the LIVE stream!";
    }

    const suppliedSourceEventId = typeof body.sourceEventId === "string" && /^[a-zA-Z0-9:_-]{1,128}$/.test(body.sourceEventId)
      ? body.sourceEventId
      : null;
    const sourceEventId = suppliedSourceEventId || (isAdmin ? `admin-test:${randomUUID()}` : null);
    if (!sourceEventId) return NextResponse.json({ error: "Valid sourceEventId is required for idempotent ingestion" }, { status: 400 });

    // The event row and every persisted counter/goal update commit or roll back together.
    // Locking the single streamer row also serializes session-stat updates and LIVE state changes.
    const result = await db.transaction(async (tx) => {
      const [profile] = await tx.select().from(streamerProfiles).for("update").limit(1);
      if (!profile || profile.connectionStatus !== "live") return { kind: "not_live" as const };

      const [created] = await tx.insert(liveEvents)
        .values({ sourceEventId, eventType, username, displayName, avatarUrl, avatarFrame, giftId, giftName, giftIcon, coins, likes, message, effectKey })
        .onConflictDoNothing({ target: liveEvents.sourceEventId })
        .returning();

      if (!created) return { kind: "duplicate" as const };

      // SQL-side increments avoid stale read/modify/write counter loss under concurrency.
      await tx.update(streamerProfiles).set({
        sessionCoins: sql`${streamerProfiles.sessionCoins} + ${coins}`,
        sessionGifts: sql`${streamerProfiles.sessionGifts} + ${(eventType === "gift" ? 1 : 0)}`,
        sessionNewFollowers: sql`${streamerProfiles.sessionNewFollowers} + ${(eventType === "follow" ? 1 : 0)}`,
        sessionLikes: sql`${streamerProfiles.sessionLikes} + ${likes}`,
        updatedAt: new Date(),
      }).where(eq(streamerProfiles.id, profile.id));

      const shares = eventType === "share" ? 1 : 0;
      if (coins > 0 || likes > 0 || shares > 0) {
        // TikTok sends usernames without "@", while seeded/manual presets store "@handle".
        // Match both forms case-insensitively so real scores update the correct profile.
        const [preset] = await tx.select({ id: avatarPresets.id })
          .from(avatarPresets)
          .where(sql`lower(ltrim(${avatarPresets.tiktokUsername}, '@')) = ${username.toLowerCase()}`)
          .for("update")
          .limit(1);
        if (preset) {
          await tx.update(avatarPresets).set({
            displayName,
            ...(rawAvatarUrl ? { avatarUrl: rawAvatarUrl } : {}),
            coinsTotal: sql`${avatarPresets.coinsTotal} + ${coins}`,
            weeklyCoins: sql`${avatarPresets.weeklyCoins} + ${coins}`,
            allTimeCoins: sql`${avatarPresets.allTimeCoins} + ${coins}`,
            likesTotal: sql`${avatarPresets.likesTotal} + ${likes}`,
            sharesTotal: sql`${avatarPresets.sharesTotal} + ${shares}`,
          }).where(eq(avatarPresets.id, preset.id));
        } else {
          // New real viewers need a profile row; otherwise TopBoard only sees demo seed profiles.
          await tx.insert(avatarPresets).values({
            displayName,
            tiktokUsername: `@${username}`,
            avatarUrl,
            avatarFrame,
            coinsTotal: coins,
            likesTotal: likes,
            sharesTotal: shares,
            weeklyCoins: coins,
            allTimeCoins: coins,
            isPinned: false,
          });
        }

        if (coins > 0) {
          const [goal] = await tx.select().from(widgetConfigs)
            .where(eq(widgetConfigs.widgetKey, "goals"))
            .limit(1)
            .for("update");
          if (goal) {
            const settings = { ...(goal.customSettings || {}) };
            const current = Number(settings.current);
            settings.current = (Number.isFinite(current) ? current : 0) + coins;
            await tx.update(widgetConfigs)
              .set({ customSettings: settings, updatedAt: new Date() })
              .where(eq(widgetConfigs.id, goal.id));
          }
        }
      }

      return { kind: "created" as const, event: created };
    });

    if (result.kind === "not_live") return NextResponse.json({ error: "LIVE is not active" }, { status: 409 });
    if (result.kind === "duplicate") return NextResponse.json({ duplicate: true }, { status: 200 });

    // Gift actions are deliberately post-commit: external/queue effects must not hold
    // the stats transaction open. A failure here cannot undo or partially apply counters.
    try {
      await evaluateGiftActions({ eventType, giftId, giftName, coins, likes, displayName, avatarUrl });
    } catch (err) {
      console.error("Gift action evaluation failed after event commit:", err);
    }

    return NextResponse.json({ event: result.event });
  } catch (error) {
    console.error("POST /api/events failed:", error);
    return NextResponse.json({ error: "Failed to fire event" }, { status: 500 });
  }
}
