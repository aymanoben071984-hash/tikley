import { db } from "@/db";
import { gameConfigs } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function PATCH(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const gameSlug = String(body.gameSlug || "");
    if (!gameSlug) {
      return NextResponse.json({ error: "gameSlug is required" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(gameConfigs)
      .where(eq(gameConfigs.gameSlug, gameSlug))
      .limit(1);

    if (!existing) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    const patch: Partial<typeof gameConfigs.$inferInsert> = {
      updatedAt: new Date(),
    };

    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    if (typeof body.cardTheme === "string") patch.cardTheme = body.cardTheme;
    if (typeof body.roundDurationSec === "number") {
      patch.roundDurationSec = body.roundDurationSec;
    }

    if (body.stateJson && typeof body.stateJson === "object") {
      patch.stateJson = {
        ...(existing.stateJson || {}),
        ...(body.stateJson as Record<string, unknown>),
      };
    }

    const [updated] = await db
      .update(gameConfigs)
      .set(patch)
      .where(eq(gameConfigs.id, existing.id))
      .returning();

    return NextResponse.json({ game: updated });
  } catch (error) {
    console.error("PATCH /api/games failed:", error);
    return NextResponse.json({ error: "Failed to update game" }, { status: 500 });
  }
}
