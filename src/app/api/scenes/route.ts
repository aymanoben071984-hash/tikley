import { db } from "@/db";
import { linkScenes, type SceneLayerItem } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const slug = String(body.slug || "");
    if (!slug) {
      return NextResponse.json({ error: "slug is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(linkScenes)
      .where(eq(linkScenes.slug, slug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Scene not found" }, { status: 404 });
    }

    const patch: Partial<typeof linkScenes.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.name === "string") patch.name = body.name;
    if (typeof body.aspectRatio === "string") patch.aspectRatio = body.aspectRatio;
    if (typeof body.platform === "string") patch.platform = body.platform;
    if (Array.isArray(body.layersJson)) {
      patch.layersJson = body.layersJson as SceneLayerItem[];
    }

    const [updated] = await db
      .update(linkScenes)
      .set(patch)
      .where(eq(linkScenes.id, existing.id))
      .returning();

    return NextResponse.json({ scene: updated });
  } catch (error) {
    console.error("PATCH /api/scenes failed:", error);
    return NextResponse.json({ error: "Failed to update scene" }, { status: 500 });
  }
}
