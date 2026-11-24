import { db } from "@/db";
import { streamerProfiles } from "@/db/schema";
import { ensureSeeded } from "@/lib/seed";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const MAX_BODY_BYTES = 16 * 1024;

export async function POST(request: Request) {
  const secret = process.env.TIKTOK_INGEST_TOKEN;
  if (!secret) return NextResponse.json({ error: "TikTok ingestion is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    const raw = await request.text();
    if (Buffer.byteLength(raw, "utf8") > MAX_BODY_BYTES) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
    body = JSON.parse(raw) as Record<string, unknown>;
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Expected object");
  } catch {
    return NextResponse.json({ error: "Invalid or oversized JSON" }, { status: 400 });
  }

  await ensureSeeded();
  if (body.eventType === "live_state") {
    const status = body.status === "live" ? "live" : "waiting";
    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile) await db.update(streamerProfiles).set({ connectionStatus: status, updatedAt: new Date() }).where(eq(streamerProfiles.id, profile.id));
    return NextResponse.json({ status });
  }

  const allowed = new Set(["gift", "like", "follow", "join", "chat", "share"]);
  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  if (!allowed.has(eventType)) return NextResponse.json({ error: "Unsupported eventType" }, { status: 400 });

  const [profile] = await db.select().from(streamerProfiles).limit(1);
  if (!profile || profile.connectionStatus !== "live") return NextResponse.json({ error: "LIVE session is not confirmed" }, { status: 409 });

  const sourceEventId = typeof body.sourceEventId === "string" && /^[a-zA-Z0-9:_-]{1,128}$/.test(body.sourceEventId)
    ? body.sourceEventId
    : null;
  const payload: Record<string, unknown> = {
    eventType,
    sourceEventId,
    username: typeof body.username === "string" && body.username.trim() ? body.username.trim().replace(/^@/, "").slice(0, 80) : "",
    displayName: typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim().slice(0, 120) : "",
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl.slice(0, 2000) : "",
    message: typeof body.message === "string" ? body.message.slice(0, 2000) : "",
  };
  if (!payload.username || !payload.displayName || !payload.avatarUrl) {
    return NextResponse.json({ error: "Missing real user identity/avatar" }, { status: 400 });
  }
  if (eventType === "gift") {
    payload.giftId = typeof body.giftId === "string" ? body.giftId.slice(0, 48) : "";
    payload.coins = Math.max(0, Math.floor(Number(body.coins) || 0));
  }
  if (eventType === "like") payload.likes = Math.max(0, Math.floor(Number(body.likes) || 0));

  const origin = new URL(request.url).origin;
  const response = await fetch(origin + "/api/events", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${secret}` },
    body: JSON.stringify(payload),
    cache: "no-store",
  });
  const result = await response.json().catch(() => ({}));
  return NextResponse.json(result, { status: response.status });
}
