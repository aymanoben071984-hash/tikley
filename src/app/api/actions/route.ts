import { db } from "@/db";
import { giftActions } from "@/db/schema";
import { NEW_ACTION_DEFAULTS, sanitizeActionInput } from "@/lib/giftActions";
import { ensureGiftActions } from "@/lib/giftActionsServer";
import { ensureSeeded } from "@/lib/seed";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    await ensureGiftActions();
    const actions = await db.select().from(giftActions).orderBy(asc(giftActions.screen), asc(giftActions.id));
    return NextResponse.json({ actions });
  } catch (error) {
    console.error("GET /api/actions failed:", error);
    return NextResponse.json({ error: "Failed to load actions" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const [created] = await db
      .insert(giftActions)
      .values({ ...NEW_ACTION_DEFAULTS, ...sanitizeActionInput(body) })
      .returning();
    return NextResponse.json({ action: created });
  } catch (error) {
    console.error("POST /api/actions failed:", error);
    return NextResponse.json({ error: "Failed to create action" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    const patch = sanitizeActionInput(body);
    // changing the milestone resets progress toward it
    const reset = "threshold" in patch || "trigger" in patch ? { progress: 0 } : {};
    const [updated] = await db.update(giftActions).set({ ...patch, ...reset }).where(eq(giftActions.id, id)).returning();
    if (!updated) return NextResponse.json({ error: "Action not found" }, { status: 404 });
    return NextResponse.json({ action: updated });
  } catch (error) {
    console.error("PATCH /api/actions failed:", error);
    return NextResponse.json({ error: "Failed to update action" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db.delete(giftActions).where(eq(giftActions.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/actions failed:", error);
    return NextResponse.json({ error: "Failed to delete action" }, { status: 500 });
  }
}
