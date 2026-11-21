import { db } from "@/db";
import { liveEvents } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { and, desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const TYPES = new Set(["follow", "like", "gift", "join", "share"]);

/** Latest single event of one type — powers the per-event tickers. */
export async function GET(request: Request) {
  try {
    await ensureSeeded();
    const type = new URL(request.url).searchParams.get("type") ?? "";
    if (!TYPES.has(type)) {
      return NextResponse.json({ error: "type must be follow, like, gift, join or share" }, { status: 400 });
    }
    const [row] = await db
      .select()
      .from(liveEvents)
      .where(and(eq(liveEvents.eventType, type)))
      .orderBy(desc(liveEvents.id))
      .limit(1);

    return NextResponse.json({
      event: row
        ? {
            id: row.id,
            name: row.displayName || row.username,
            avatarUrl: row.avatarUrl,
            frame: row.avatarFrame,
            giftName: row.giftName,
            giftIcon: row.giftIcon,
            coins: row.coins,
            likes: row.likes,
            at: new Date(row.createdAt).getTime(),
          }
        : null,
    });
  } catch (error) {
    console.error("GET /api/events/latest failed:", error);
    return NextResponse.json({ error: "Failed to load latest event" }, { status: 500 });
  }
}
