import { db } from "@/db";
import { avatarPresets } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;

    const displayName = String(body.displayName || "New VIP").slice(0, 120);
    const rawHandle = String(body.tiktokUsername || "@vip_viewer").trim();
    const tiktokUsername = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;

    const [created] = await db
      .insert(avatarPresets)
      .values({
        displayName,
        tiktokUsername,
        avatarUrl: String(body.avatarUrl || "/avatars/a1.png"),
        frameSlug: String(body.frameSlug || "ember-dragon"),
        nameAnimation: String(body.nameAnimation || "aurora"),
        particleFx: String(body.particleFx || "sparkles"),
        role: String(body.role || "vip"),
        glowColor: String(body.glowColor || "#ff7a18"),
        welcomeMessage: String(body.welcomeMessage || "VIP entered the LIVE!"),
        coinsTotal: Number(body.coinsTotal || 500),
        likesTotal: Number(body.likesTotal || 1200),
        isPinned: true,
      })
      .returning();

    return NextResponse.json({ preset: created });
  } catch (error) {
    console.error("POST /api/avatars failed:", error);
    return NextResponse.json({ error: "Failed to create avatar preset" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const patch: Partial<typeof avatarPresets.$inferInsert> = {};
    if (typeof body.displayName === "string") patch.displayName = body.displayName;
    if (typeof body.tiktokUsername === "string") patch.tiktokUsername = body.tiktokUsername;
    if (typeof body.avatarUrl === "string") patch.avatarUrl = body.avatarUrl;
    if (typeof body.frameSlug === "string") patch.frameSlug = body.frameSlug;
    if (typeof body.nameAnimation === "string") patch.nameAnimation = body.nameAnimation;
    if (typeof body.particleFx === "string") patch.particleFx = body.particleFx;
    if (typeof body.role === "string") patch.role = body.role;
    if (typeof body.glowColor === "string") patch.glowColor = body.glowColor;
    if (typeof body.welcomeMessage === "string") patch.welcomeMessage = body.welcomeMessage;
    if (typeof body.coinsTotal === "number") patch.coinsTotal = body.coinsTotal;
    if (typeof body.isPinned === "boolean") patch.isPinned = body.isPinned;

    const [updated] = await db
      .update(avatarPresets)
      .set(patch)
      .where(eq(avatarPresets.id, id))
      .returning();

    return NextResponse.json({ preset: updated });
  } catch (error) {
    console.error("PATCH /api/avatars failed:", error);
    return NextResponse.json({ error: "Failed to update avatar preset" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    await ensureSeeded();
    const { searchParams } = new URL(request.url);
    const id = Number(searchParams.get("id"));
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    await db.delete(avatarPresets).where(eq(avatarPresets.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/avatars failed:", error);
    return NextResponse.json({ error: "Failed to delete avatar preset" }, { status: 500 });
  }
}
