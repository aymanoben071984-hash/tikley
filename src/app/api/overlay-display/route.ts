import { db } from "@/db";
import { overlayDisplays } from "@/db/schema";
import { normalizeDisplay } from "@/lib/overlayDisplay";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const cleanKey = (k: unknown) => (typeof k === "string" ? k.trim().slice(0, 120) : "");

/** GET → all saved display settings ({ displays: { [overlayKey]: settings } }), or one with ?key= */
export async function GET(request: Request) {
  try {
    const key = cleanKey(new URL(request.url).searchParams.get("key"));
    if (key) {
      const [row] = await db.select().from(overlayDisplays).where(eq(overlayDisplays.overlayKey, key)).limit(1);
      return NextResponse.json({ key, display: normalizeDisplay(row?.settings) });
    }
    const rows = await db.select().from(overlayDisplays);
    return NextResponse.json({ displays: Object.fromEntries(rows.map((r) => [r.overlayKey, normalizeDisplay(r.settings)])) });
  } catch (error) {
    console.error("GET /api/overlay-display failed:", error);
    return NextResponse.json({ error: "Failed to load display settings" }, { status: 500 });
  }
}

/** PATCH { key, display } → save (create or replace) one overlay's 9:16 / 16:9 settings. */
export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as { key?: unknown; display?: unknown };
    const key = cleanKey(body.key);
    if (!key) return NextResponse.json({ error: "key is required" }, { status: 400 });
    const display = normalizeDisplay(body.display);
    const settings = display as unknown as Record<string, unknown>;
    await db
      .insert(overlayDisplays)
      .values({ overlayKey: key, settings, updatedAt: new Date() })
      .onConflictDoUpdate({ target: overlayDisplays.overlayKey, set: { settings, updatedAt: new Date() } });
    return NextResponse.json({ key, display });
  } catch (error) {
    console.error("PATCH /api/overlay-display failed:", error);
    return NextResponse.json({ error: "Failed to save display settings" }, { status: 500 });
  }
}
