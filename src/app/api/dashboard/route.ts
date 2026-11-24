import { db } from "@/db";
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
import { listTopBoards, resetBoardsOnLive } from "@/lib/topBoardsServer";
import { desc, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();

    const cutoff = new Date(Date.now() - 20_000);
    const [[profile], widgets, avatars, games, scenes, events, boards, activeOverlays] = await Promise.all([
      db.select().from(streamerProfiles).limit(1),
      db.select().from(widgetConfigs),
      db.select().from(avatarPresets).orderBy(desc(avatarPresets.coinsTotal)),
      db.select().from(gameConfigs),
      db.select().from(linkScenes),
      db.select().from(liveEvents).orderBy(desc(liveEvents.id)).limit(35),
      listTopBoards(),
      db.select().from(overlayHeartbeats).where(gt(overlayHeartbeats.lastSeenAt, cutoff)),
    ]);

    return NextResponse.json({
      profile,
      widgets,
      avatars,
      games,
      scenes,
      events: profile?.connectionStatus === "live" ? events : [],
      activeOverlays,
      boards,
    });
  } catch (error) {
    console.error("GET /api/dashboard failed:", error);
    return NextResponse.json(
      { error: "Failed to load dashboard state" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const [current] = await db.select().from(streamerProfiles).limit(1);
    if (!current) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    if (body.action === "reset_stats") {
      const [resetProfile] = await db
        .update(streamerProfiles)
        .set({
          sessionCoins: 0,
          sessionNewFollowers: 0,
          sessionGifts: 0,
          sessionLikes: 0,
          updatedAt: new Date(),
        })
        .where(eq(streamerProfiles.id, current.id))
        .returning();
      return NextResponse.json({ profile: resetProfile });
    }

    const patch: Partial<typeof streamerProfiles.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.displayName === "string") patch.displayName = body.displayName.slice(0, 120);
    if (typeof body.tiktokHandle === "string") {
      const raw = body.tiktokHandle.trim();
      patch.tiktokHandle = raw.startsWith("@") ? raw : `@${raw}`;
    }
    if (typeof body.avatarUrl === "string") patch.avatarUrl = body.avatarUrl;
    if (typeof body.avatarFrame === "string") patch.avatarFrame = body.avatarFrame;
    if (typeof body.bio === "string") patch.bio = body.bio;
    if (typeof body.connectionStatus === "string") {
      patch.connectionStatus = body.connectionStatus;
      if (body.connectionStatus === "live" && current.connectionStatus !== "live") {
        await resetBoardsOnLive();
      }
    }
    if (typeof body.locale === "string") patch.locale = body.locale;
    if (typeof body.accentPreset === "string") patch.accentPreset = body.accentPreset;
    if (typeof body.canvasFormat === "string") patch.canvasFormat = body.canvasFormat;
    if (typeof body.ttsEnabled === "boolean") patch.ttsEnabled = body.ttsEnabled;
    if (typeof body.soundAlertsEnabled === "boolean") {
      patch.soundAlertsEnabled = body.soundAlertsEnabled;
    }

    const [updated] = await db
      .update(streamerProfiles)
      .set(patch)
      .where(eq(streamerProfiles.id, current.id))
      .returning();

    return NextResponse.json({ profile: updated });
  } catch (error) {
    console.error("PATCH /api/dashboard failed:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
