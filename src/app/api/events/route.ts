import { db } from "@/db";
import { avatarPresets, liveEvents, streamerProfiles, widgetConfigs } from "@/db/schema";
import { GIFT_CATALOG } from "@/lib/catalog";
import { ensureSeeded } from "@/lib/seed";
import { getSessionUser, isSameOrigin } from "@/lib/auth";
import { evaluateGiftActions } from "@/lib/giftActionsServer";
import { desc, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await ensureSeeded();
    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile?.connectionStatus !== "live") return NextResponse.json({ events: [], live: false }, { headers: { "Cache-Control": "no-store, max-age=0" } });
    const events = await db.select().from(liveEvents).orderBy(desc(liveEvents.id)).limit(40);
    return NextResponse.json({ events, live: true }, { headers: { "Cache-Control": "no-store, max-age=0" } });
  } catch (error) {
    console.error("GET /api/events failed:", error);
    return NextResponse.json({ error: "Failed to fetch events" }, { status: 500 });
  }
}
export async function POST(request: Request) {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > 16 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const workerSecret = process.env.TIKTOK_INGEST_TOKEN;
  const workerAuthorized = Boolean(workerSecret && request.headers.get("authorization") === `Bearer ${workerSecret}`);
  const admin = workerAuthorized ? null : await getSessionUser(request);
  if (!workerAuthorized && admin?.role !== "admin") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!workerAuthorized && !isSameOrigin(request)) return NextResponse.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    await ensureSeeded();
    const body = await request.json() as Record<string, unknown>;
    const [profile] = await db.select().from(streamerProfiles).limit(1);
    if (profile?.connectionStatus !== "live") return NextResponse.json({ error: "LIVE is not active" }, { status: 409 });
    const eventType = String(body.eventType || "");
    if (!["gift", "like", "follow", "join", "chat", "share"].includes(eventType)) return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
    const username = typeof body.username === "string" ? body.username.trim().replace(/^@/, "") : "";
    if (!username || username.length > 80) return NextResponse.json({ error: "Real username required" }, { status: 400 });
    const displayName = typeof body.displayName === "string" && body.displayName.trim() ? body.displayName.trim().slice(0,120) : username;
    const avatarUrl = typeof body.avatarUrl === "string" ? body.avatarUrl.trim().slice(0,2000) : "";
    if (!avatarUrl) return NextResponse.json({ error: "Real avatar URL required" }, { status: 400 });
    const avatarFrame = typeof body.avatarFrame === "string" && body.avatarFrame.trim() ? body.avatarFrame.trim().slice(0,80) : "ember-dragon";
    let giftId: string|null=null, giftName:string|null=null, giftIcon:string|null=null;
    let coins=Math.max(0,Math.floor(Number(body.coins)||0)), likes=Math.max(0,Math.floor(Number(body.likes)||0));
    let message=typeof body.message==="string"?body.message:"";
    const effectKey=typeof body.effectKey==="string"?body.effectKey:null;
    if(eventType==="gift"){
      const found=GIFT_CATALOG.find(g=>g.id===String(body.giftId||""));
      if(!found) return NextResponse.json({error:"Unknown gift id"}, {status:400});
      giftId=found.id; giftName=found.name; giftIcon=found.icon;
      if(coins<=0) return NextResponse.json({error:"Gift coin value required"}, {status:400});
      if(!message) message=`Sent ${found.name} (${coins.toLocaleString()} coins)!`;
    } else if(eventType==="follow"){ if(!message) message="followed the LIVE!"; }
    else if(eventType==="join"){ if(!message) message="joined the LIVE!"; }
    else if(eventType==="like"){ if(likes<=0) return NextResponse.json({error:"Like count required"}, {status:400}); if(!message) message=`sent ${likes} likes ❤️`; }
    else if(eventType==="share"){ if(!message) message="shared the LIVE stream!"; }
    const sourceEventId = typeof body.sourceEventId === "string" && /^[a-zA-Z0-9:_-]{1,128}$/.test(body.sourceEventId)
      ? body.sourceEventId
      : null;
    const [created] = await db.insert(liveEvents)
      .values({ sourceEventId, eventType, username, displayName, avatarUrl, avatarFrame, giftId, giftName, giftIcon, coins, likes, message, effectKey })
      .onConflictDoNothing({ target: liveEvents.sourceEventId })
      .returning();
    if (!created) return NextResponse.json({ duplicate: true }, { status: 200 });
    await db.update(streamerProfiles).set({
      sessionCoins:profile.sessionCoins+coins, sessionGifts:profile.sessionGifts+(eventType==="gift"?1:0),
      sessionNewFollowers:profile.sessionNewFollowers+(eventType==="follow"?1:0),sessionLikes:profile.sessionLikes+likes,
      updatedAt:new Date()
    }).where(eq(streamerProfiles.id,profile.id));
    const shares=eventType==="share"?1:0;
    if(coins>0||likes>0||shares>0){
      const [preset]=await db.select().from(avatarPresets).where(eq(avatarPresets.tiktokUsername,username)).limit(1);
      if(preset) await db.update(avatarPresets).set({
        coinsTotal:sql`${avatarPresets.coinsTotal} + ${coins}`,weeklyCoins:sql`${avatarPresets.weeklyCoins} + ${coins}`,
        allTimeCoins:sql`${avatarPresets.allTimeCoins} + ${coins}`,likesTotal:sql`${avatarPresets.likesTotal} + ${likes}`,
        sharesTotal:sql`${avatarPresets.sharesTotal} + ${shares}`
      }).where(eq(avatarPresets.id,preset.id));
      if(coins>0){
        const [goal]=await db.select().from(widgetConfigs).where(eq(widgetConfigs.widgetKey,"goals")).limit(1);
        if(goal){const settings={...(goal.customSettings||{})};settings.current=Number(settings.current||0)+coins;await db.update(widgetConfigs).set({customSettings:settings,updatedAt:new Date()}).where(eq(widgetConfigs.id,goal.id));}
      }
    }
    try{await evaluateGiftActions({eventType,giftId,giftName,coins,likes,displayName,avatarUrl});}catch(err){console.error("Gift action evaluation failed:",err);}
    return NextResponse.json({event:created});
  }catch(error){console.error("POST /api/events failed:",error);return NextResponse.json({error:"Failed to fire event"},{status:500});}
}