import { db } from "@/db";
import { widgetConfigs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const widgetKey = String(body.widgetKey || "");
    if (!widgetKey) {
      return NextResponse.json({ error: "widgetKey is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(widgetConfigs)
      .where(eq(widgetConfigs.widgetKey, widgetKey))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Widget not found" }, { status: 404 });
    }

    const patch: Partial<typeof widgetConfigs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    if (typeof body.theme === "string") patch.theme = body.theme;
    if (typeof body.animation === "string") patch.animation = body.animation;
    if (typeof body.avatarFrame === "string") patch.avatarFrame = body.avatarFrame;
    if (typeof body.primaryColor === "string") patch.primaryColor = body.primaryColor;
    if (typeof body.secondaryColor === "string") patch.secondaryColor = body.secondaryColor;
    if (typeof body.fontFamily === "string") patch.fontFamily = body.fontFamily;
    if (typeof body.scale === "number") patch.scale = body.scale;
    if (typeof body.soundEnabled === "boolean") patch.soundEnabled = body.soundEnabled;
    if (typeof body.volume === "number") patch.volume = body.volume;

    if (body.customSettings && typeof body.customSettings === "object") {
      patch.customSettings = {
        ...(existing.customSettings || {}),
        ...(body.customSettings as Record<string, unknown>),
      };
    }

    const [updated] = await db
      .update(widgetConfigs)
      .set(patch)
      .where(eq(widgetConfigs.id, existing.id))
      .returning();

    return NextResponse.json({ widget: updated });
  } catch (error) {
    console.error("PATCH /api/widgets failed:", error);
    return NextResponse.json({ error: "Failed to update widget" }, { status: 500 });
  }
}
