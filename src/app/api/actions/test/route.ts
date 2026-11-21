import { db } from "@/db";
import { giftActions } from "@/db/schema";
import { queueTestAction } from "@/lib/giftActionsServer";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Play one action on its screen right now. */
export async function POST(request: Request) {
  try {
    const { id } = (await request.json()) as { id?: number };
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const [action] = await db.select().from(giftActions).where(eq(giftActions.id, Number(id))).limit(1);
    if (!action) return NextResponse.json({ error: "Action not found" }, { status: 404 });
    await queueTestAction(action);
    return NextResponse.json({ ok: true, screen: action.screen });
  } catch (error) {
    console.error("POST /api/actions/test failed:", error);
    return NextResponse.json({ error: "Failed to test action" }, { status: 500 });
  }
}
