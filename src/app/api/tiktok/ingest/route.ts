import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const secret = process.env.TIKTOK_INGEST_TOKEN;
  if (!secret) return NextResponse.json({ error: "TikTok ingestion is not configured" }, { status: 503 });
  if (request.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const allowed = new Set(["gift", "like", "follow", "join", "chat", "share"]);
  const eventType = typeof body.eventType === "string" ? body.eventType : "";
  if (!allowed.has(eventType)) return NextResponse.json({ error: "Unsupported eventType" }, { status: 400 });
  const payload: Record<string, unknown> = {
    eventType,
    username: typeof body.username === "string" ? body.username.slice(0, 80) : "TikTok user",
    displayName: typeof body.displayName === "string" ? body.displayName.slice(0, 120) : "TikTok user",
    avatarUrl: typeof body.avatarUrl === "string" ? body.avatarUrl.slice(0, 2000) : "",
    message: typeof body.message === "string" ? body.message.slice(0, 2000) : "",
  };
  if (eventType === "gift") { payload.giftId = typeof body.giftId === "string" ? body.giftId.slice(0, 48) : "rose"; payload.coins = Math.max(0, Math.floor(Number(body.coins) || 0)); }
  if (eventType === "like") payload.likes = Math.max(0, Math.floor(Number(body.likes) || 0));
  const origin = new URL(request.url).origin;
  const response = await fetch(origin + "/api/events", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload), cache: "no-store" });
  const result = await response.json().catch(() => ({}));
  return NextResponse.json(result, { status: response.status });
}