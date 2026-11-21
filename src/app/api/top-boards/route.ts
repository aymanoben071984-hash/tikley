import { db } from "@/db";
import { topBoards } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import {
  DEFAULT_BOARD_SETTINGS,
  getBoardMeta,
  normalizeBoardSettings,
  type BoardType,
} from "@/lib/topBoard";
import { listTopBoards, resetBoardTypes } from "@/lib/topBoardsServer";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    await ensureSeeded();
    return NextResponse.json({ boards: await listTopBoards() });
  } catch (error) {
    console.error("GET /api/top-boards failed:", error);
    return NextResponse.json({ error: "Failed to load boards" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await ensureSeeded();
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await listTopBoards();

    // Duplicate an existing board
    if (typeof body.duplicateId === "number") {
      const src = existing.find((b) => b.id === body.duplicateId);
      if (!src) return NextResponse.json({ error: "Board not found" }, { status: 404 });
      const [copy] = await db
        .insert(topBoards)
        .values({
          name: `${src.name} (copy)`.slice(0, 120),
          enabled: src.enabled,
          sortOrder: existing.length,
          settings: src.settings,
        })
        .returning();
      return NextResponse.json({ board: copy });
    }

    const type = (typeof body.type === "string" ? body.type : "top-gifters") as BoardType;
    const settings = normalizeBoardSettings({ ...DEFAULT_BOARD_SETTINGS, type });
    const [created] = await db
      .insert(topBoards)
      .values({
        name: (typeof body.name === "string" && body.name.trim()) || getBoardMeta(settings.type).label,
        sortOrder: existing.length,
        settings: settings as unknown as Record<string, unknown>,
      })
      .returning();
    return NextResponse.json({ board: created });
  } catch (error) {
    console.error("POST /api/top-boards failed:", error);
    return NextResponse.json({ error: "Failed to create board" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const [row] = await db.select().from(topBoards).where(eq(topBoards.id, id)).limit(1);
    if (!row) return NextResponse.json({ error: "Board not found" }, { status: 404 });

    if (body.action === "reset") {
      const s = normalizeBoardSettings(row.settings);
      await resetBoardTypes([s.type, ...(s.rotation.enabled ? s.rotation.boards : [])]);
      const [updated] = await db
        .update(topBoards)
        .set({ lastResetAt: new Date(), updatedAt: new Date() })
        .where(eq(topBoards.id, id))
        .returning();
      return NextResponse.json({ board: updated });
    }

    const patch: Partial<typeof topBoards.$inferInsert> = { updatedAt: new Date() };
    if (typeof body.name === "string" && body.name.trim()) patch.name = body.name.trim().slice(0, 120);
    if (typeof body.enabled === "boolean") patch.enabled = body.enabled;
    if (body.settings && typeof body.settings === "object") {
      patch.settings = normalizeBoardSettings(body.settings) as unknown as Record<string, unknown>;
    }

    const [updated] = await db.update(topBoards).set(patch).where(eq(topBoards.id, id)).returning();
    return NextResponse.json({ board: updated });
  } catch (error) {
    console.error("PATCH /api/top-boards failed:", error);
    return NextResponse.json({ error: "Failed to update board" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const id = Number(new URL(request.url).searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });
    await db.delete(topBoards).where(eq(topBoards.id, id));
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/top-boards failed:", error);
    return NextResponse.json({ error: "Failed to delete board" }, { status: 500 });
  }
}
