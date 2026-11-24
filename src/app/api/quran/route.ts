import { db } from "@/db";
import { widgetConfigs } from "@/db/schema";
import {
  QURAN_DEFAULTS,
  QURAN_STATE_DEFAULT,
  normalizeQuranConfig,
  normalizeQuranState,
  type QuranConfig,
  type QuranState,
} from "@/lib/quran";
import { ensureSeeded } from "@/lib/seed";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

async function readRow() {
  await ensureSeeded();
  let [row] = await db.select().from(widgetConfigs).where(eq(widgetConfigs.widgetKey, "quran")).limit(1);
  if (!row) {
    [row] = await db
      .insert(widgetConfigs)
      .values({ widgetKey: "quran", title: "Quran Recitation", theme: "minimal", customSettings: { config: QURAN_DEFAULTS, state: QURAN_STATE_DEFAULT } })
      .onConflictDoNothing()
      .returning();
    if (!row) [row] = await db.select().from(widgetConfigs).where(eq(widgetConfigs.widgetKey, "quran")).limit(1);
  }
  const cs = (row?.customSettings ?? {}) as Record<string, unknown>;
  const config = normalizeQuranConfig(cs.config);
  const state = normalizeQuranState(cs.state, config);
  return { id: row.id, config, state };
}

async function write(id: number, config: QuranConfig, state: QuranState) {
  await db.update(widgetConfigs).set({ customSettings: { config, state }, updatedAt: new Date() }).where(eq(widgetConfigs.id, id));
}

export async function GET() {
  try {
    const { config, state } = await readRow();
    return NextResponse.json({ config, state });
  } catch (error) {
    console.error("GET /api/quran failed:", error);
    return NextResponse.json({ error: "Failed to load Quran settings" }, { status: 500 });
  }
}

/**
 * Body:
 *  - { config }                                 save settings (resets position if the passage changed)
 *  - { command: "play"|"pause"|"toggle"|"next"|"prev"|"restart"|"goto", ayah? }
 *  - { progress: { rev, ayah, ended } }         an overlay reporting where it is
 */
export async function PATCH(request: Request) {
  let authBody: Record<string, unknown>;
  try { authBody = await request.clone().json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const isOverlayProgress = Boolean(authBody.progress && typeof authBody.progress === "object" && !authBody.config && !authBody.command);
  if (!isOverlayProgress) {
    const user = await getSessionUser(request);
    if (user?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    if (!isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const row = await readRow();
    let { config, state } = row;

    if (body.progress && typeof body.progress === "object") {
      const p = body.progress as { rev?: number; ayah?: number; ended?: boolean };
      if (p.rev === state.rev && typeof p.ayah === "number") {
        state = { ...state, liveAyah: Math.min(config.toAyah, Math.max(config.fromAyah, Math.round(p.ayah))), ended: Boolean(p.ended) };
        await write(row.id, config, state);
      }
      return NextResponse.json({ config, state });
    }

    if (body.config && typeof body.config === "object") {
      const next = normalizeQuranConfig({ ...config, ...(body.config as object) });
      const passageChanged = next.surah !== config.surah || next.fromAyah !== config.fromAyah || next.toAyah !== config.toAyah || next.reciterId !== config.reciterId || next.soundEnabled !== config.soundEnabled;
      if (passageChanged) {
        state = { ...state, ayah: next.fromAyah, liveAyah: next.fromAyah, ended: false, line: null, rev: state.rev + 1 };
      } else {
        state = normalizeQuranState(state, next);
      }
      config = next;
    }

    if (typeof body.command === "string") {
      const cur = state.liveAyah ?? state.ayah;
      const bump = (patch: Partial<QuranState>) => {
        state = { ...state, ...patch, rev: state.rev + 1, line: null };
      };
      switch (body.command) {
        case "play":
          bump({ playing: true, ayah: state.ended ? config.fromAyah : cur, ended: false });
          break;
        case "pause":
          bump({ playing: false, ayah: cur });
          break;
        case "toggle":
          bump(state.playing ? { playing: false, ayah: cur } : { playing: true, ayah: state.ended ? config.fromAyah : cur, ended: false });
          break;
        case "next":
          bump({ ayah: Math.min(config.toAyah, cur + 1), ended: false });
          break;
        case "prev":
          bump({ ayah: Math.max(config.fromAyah, cur - 1), ended: false });
          break;
        case "restart":
          bump({ ayah: config.fromAyah, ended: false });
          break;
        case "goto":
          bump({ ayah: Math.min(config.toAyah, Math.max(config.fromAyah, Math.round(Number(body.ayah) || config.fromAyah))), ended: false });
          break;
      }
      state.liveAyah = state.ayah;
    }

    await write(row.id, config, state);
    return NextResponse.json({ config, state });
  } catch (error) {
    console.error("PATCH /api/quran failed:", error);
    return NextResponse.json({ error: "Failed to update Quran recitation" }, { status: 500 });
  }
}
