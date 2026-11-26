import { LOCK_TOP_BOARDS, db, withAdvisoryLock } from "@/db";
import { avatarPresets, topBoards } from "@/db/schema";
import {
  BOARD_TYPE_COLUMN,
  DEFAULT_BOARD_SETTINGS,
  normalizeBoardSettings,
  type BoardType,
} from "@/lib/topBoard";
import { asc, count } from "drizzle-orm";

let ensurePromise: Promise<void> | null = null;

export async function ensureTopBoards(): Promise<void> {
  if (!ensurePromise) {
    ensurePromise = withAdvisoryLock(LOCK_TOP_BOARDS, async () => {
      const [{ value }] = await db.select({ value: count() }).from(topBoards);
      if (value > 0) return;
      await db.insert(topBoards).values([
        {
          name: "Top Gifters",
          sortOrder: 0,
          settings: { ...DEFAULT_BOARD_SETTINGS, type: "top-gifters", variant: "spot-neon" },
        },
        {
          name: "Top Likers",
          sortOrder: 1,
          settings: {
            ...DEFAULT_BOARD_SETTINGS,
            type: "top-likers",
            variant: "energy",
            color: "#ff3366",
            resetMode: "on-live",
            rotation: { enabled: false, boards: ["top-shares"], intervalSec: 10, animation: "slide" },
          },
        },
      ]);
    }).catch((err) => {
      ensurePromise = null;
      throw err;
    });
  }
  return ensurePromise;
}

export async function listTopBoards() {
  await ensureTopBoards();
  return db.select().from(topBoards).orderBy(asc(topBoards.sortOrder), asc(topBoards.id));
}

/** Zero the scores behind one or more board types. */
export async function resetBoardTypes(types: BoardType[]): Promise<void> {
  const unique = Array.from(new Set(types));
  if (unique.length === 0) return;
  const patch: Partial<typeof avatarPresets.$inferInsert> = {};
  for (const t of unique) {
    patch[BOARD_TYPE_COLUMN[t]] = 0;
  }
  await db.update(avatarPresets).set(patch);
}

/** Called when the streamer goes LIVE: reset every board set to "on-live". */
export async function resetBoardsOnLive(): Promise<void> {
  const boards = await listTopBoards();
  // These two metrics represent the current LIVE only and must reset for every
  // new session, even when a board is disabled or has older saved settings.
  const types: BoardType[] = ["top-likers", "top-gifters"];
  for (const b of boards) {
    const s = normalizeBoardSettings(b.settings);
    if (b.enabled && s.resetMode === "on-live") {
      types.push(s.type, ...(s.rotation.enabled ? s.rotation.boards : []));
    }
  }
  // Weekly and all-time totals are historical periods and are never reset here.
  await resetBoardTypes(types.filter((t) => t !== "weekly-supporters" && t !== "alltime-supporters"));
}
