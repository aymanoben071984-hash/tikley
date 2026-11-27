import { db, LOCK_OVERLAY_HEARTBEATS, withAdvisoryLock } from "@/db";
import {
  avatarPresets,
  gameConfigs,
  linkScenes,
  liveEvents,
  overlayHeartbeats,
  streamerProfiles,
  widgetConfigs,
} from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { listTopBoards } from "@/lib/topBoardsServer";
import { overlayDisplays } from "@/db/schema";
import { normalizeDisplay } from "@/lib/overlayDisplay";
import { count, desc, eq, inArray, lt } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const clientId = searchParams.get("clientId");
    const target = searchParams.get("target") || "scene";
    if (clientId && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(clientId)) {
      return NextResponse.json({ error: "Invalid clientId" }, { status: 400 });
    }
    if (!/^[a-z0-9_-]+(?:\/[a-z0-9_-]+)?$/i.test(target)) {
      return NextResponse.json({ error: "Invalid overlay target" }, { status: 400 });
    }
    const ua = (request.headers.get("user-agent") || "").slice(0, 256);
    const platformHint = ua.includes("OBS")
      ? "OBS Studio"
      : ua.includes("TikTok") || ua.includes("Electron")
        ? "TikTok LIVE Studio"
        : "Browser Source";

    if (clientId) {
      await withAdvisoryLock(LOCK_OVERLAY_HEARTBEATS, async () => {
        const now = new Date();
        // Bound attacker-controlled heartbeat rows and keep only recently active clients.
        await db.delete(overlayHeartbeats).where(lt(overlayHeartbeats.lastSeenAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));
        const [existing] = await db.select({ clientId: overlayHeartbeats.clientId })
          .from(overlayHeartbeats).where(eq(overlayHeartbeats.clientId, clientId)).limit(1);
        if (!existing) {
          const [rowCount] = await db.select({ value: count() }).from(overlayHeartbeats);
          if (rowCount.value < 100) {
            await db.insert(overlayHeartbeats)
              .values({ clientId, overlayTarget: target, platformHint, lastSeenAt: now });
          }
        } else {
          await db.update(overlayHeartbeats)
            .set({ overlayTarget: target, platformHint, lastSeenAt: now })
            .where(eq(overlayHeartbeats.clientId, clientId));
        }
      });
    }

    const displayKey = (searchParams.get("displayKey") || target).slice(0, 120);
    const [[profile], widgets, avatars, games, scenes, events, boards, [displayRow]] = await Promise.all([
      db.select().from(streamerProfiles).limit(1),
      db.select().from(widgetConfigs),
      db.select().from(avatarPresets).orderBy(desc(avatarPresets.coinsTotal)),
      db.select().from(gameConfigs),
      db.select().from(linkScenes),
      db.select().from(liveEvents)
        .where(inArray(liveEvents.eventType, ["gift", "like", "join", "follow", "share", "chat"]))
        .orderBy(desc(liveEvents.id))
        .limit(20),
      listTopBoards(),
      db.select().from(overlayDisplays).where(eq(overlayDisplays.overlayKey, displayKey)).limit(1),
    ]);
    // Top boards are scoped to the current LIVE counters, not historical event rows.
    // Counters are reset by the LIVE-session lifecycle; zero-score users stay hidden.
    const topListAvatars = avatars.filter((avatar) =>
      avatar.coinsTotal > 0 || avatar.likesTotal > 0,
    );
    const display = normalizeDisplay(displayRow?.settings);

    return NextResponse.json({
      display,
      profile,
      widgets,
      avatars,
      topListAvatars,
      games,
      scenes,
      events,
      boards,
    }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("GET /api/overlay/state failed:", error);
    return NextResponse.json({ error: "Overlay sync failed" }, { status: 500 });
  }
}
