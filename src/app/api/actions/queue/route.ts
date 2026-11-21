import { db } from "@/db";
import { actionQueue, giftActions } from "@/db/schema";
import { and, asc, desc, eq, gt } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Items waiting to play on one screen.
 * Without `after`, only the latest id is returned so a freshly opened overlay skips the backlog.
 */
export async function GET(request: Request) {
  try {
    const params = new URL(request.url).searchParams;
    const screen = Math.min(6, Math.max(1, Number(params.get("screen")) || 1));
    const afterRaw = params.get("after");

    if (afterRaw === null) {
      const [last] = await db.select({ id: actionQueue.id }).from(actionQueue).orderBy(desc(actionQueue.id)).limit(1);
      return NextResponse.json({ latestId: last?.id ?? 0, items: [] });
    }

    const rows = await db
      .select({ item: actionQueue, action: giftActions })
      .from(actionQueue)
      .innerJoin(giftActions, eq(giftActions.id, actionQueue.actionId))
      .where(and(eq(actionQueue.screen, screen), gt(actionQueue.id, Number(afterRaw) || 0)))
      .orderBy(asc(actionQueue.id))
      .limit(10);

    const [last] = await db.select({ id: actionQueue.id }).from(actionQueue).orderBy(desc(actionQueue.id)).limit(1);
    return NextResponse.json({ latestId: last?.id ?? 0, items: rows });
  } catch (error) {
    console.error("GET /api/actions/queue failed:", error);
    return NextResponse.json({ error: "Failed to load queue" }, { status: 500 });
  }
}
