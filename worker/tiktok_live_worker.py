"""Tikley LIVE bridge worker: forwards real events through a durable local outbox."""
import os, sys, time, logging, asyncio, aiohttp, uuid, sqlite3, json
from pathlib import Path
from TikTokLive import TikTokLiveClient
from TikTokLive.events import LikeEvent, CommentEvent, GiftEvent, FollowEvent, ShareEvent, JoinEvent
from TikTokLive.client.errors import UserOfflineError

logging.basicConfig(level=logging.INFO)
log=logging.getLogger("tikley-worker")
HANDLE=os.environ.get("TIKTOK_USERNAME","").strip().lstrip("@")
APP_URL=os.environ.get("TIKLEY_APP_URL","").rstrip("/")
TOKEN=os.environ.get("TIKTOK_INGEST_TOKEN","")
SPOOL_PATH=Path(os.environ.get("TIKLEY_SPOOL_PATH","./tikley-event-spool.sqlite3"))
if not HANDLE or not APP_URL or not TOKEN: sys.exit("Set TIKTOK_USERNAME, TIKLEY_APP_URL and TIKTOK_INGEST_TOKEN.")
client=TikTokLiveClient(unique_id=HANDLE)
delivery_lock=None
delivery_lock_loop=None

def get_delivery_lock():
    global delivery_lock, delivery_lock_loop
    loop=asyncio.get_running_loop()
    if delivery_lock is None or delivery_lock_loop is not loop:
        delivery_lock=asyncio.Lock()
        delivery_lock_loop=loop
    return delivery_lock

def init_spool():
    SPOOL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("""CREATE TABLE IF NOT EXISTS pending_events (
            source_event_id TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")
        conn.execute("""CREATE TABLE IF NOT EXISTS failed_events (
            source_event_id TEXT PRIMARY KEY,
            payload_json TEXT NOT NULL,
            http_status INTEGER NOT NULL,
            reason TEXT NOT NULL,
            failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        )""")

init_spool()

def enqueue(payload):
    event_id=str(payload["sourceEventId"])
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO pending_events(source_event_id,payload_json) VALUES(?,?)",
            (event_id,json.dumps(payload,ensure_ascii=False,separators=(",",":"))),
        )

def next_pending():
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        row=conn.execute(
            "SELECT source_event_id,payload_json FROM pending_events ORDER BY created_at,source_event_id LIMIT 1"
        ).fetchone()
    return row

def acknowledge(event_id):
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute("DELETE FROM pending_events WHERE source_event_id=?",(event_id,))

def quarantine(event_id,payload,status,reason):
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute(
            """INSERT OR REPLACE INTO failed_events(source_event_id,payload_json,http_status,reason)
               VALUES(?,?,?,?)""",
            (event_id,json.dumps(payload,ensure_ascii=False,separators=(",",":")),status,reason[:1000]),
        )
        conn.execute("DELETE FROM pending_events WHERE source_event_id=?",(event_id,))

async def deliver(payload):
    timeout=aiohttp.ClientTimeout(total=15)
    for attempt in range(4):
        try:
            async with aiohttp.ClientSession(timeout=timeout) as session:
                async with session.post(
                    APP_URL+"/api/tiktok/ingest",
                    json=payload,
                    headers={"Authorization":"Bearer "+TOKEN},
                ) as response:
                    if response.status < 300:
                        await response.read()
                        return "delivered", response.status, ""
                    detail=await response.text()
                    retryable=response.status in (409,429) or response.status >= 500
                    log.warning("Ingestion %s (attempt %s): %s",response.status,attempt+1,detail[:500])
                    if not retryable:
                        return "rejected", response.status, detail
        except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
            detail=str(exc)
            log.warning("Ingestion transport error (attempt %s): %s",attempt+1,exc)
        if attempt < 3:
            await asyncio.sleep(min(2 ** attempt,8))
    return "pending", 0, detail if "detail" in locals() else "retry budget exhausted"

async def drain_spool():
    async with get_delivery_lock():
        while True:
            row=next_pending()
            if not row: return
            event_id,payload_json=row
            payload=json.loads(payload_json)
            state,status,reason=await deliver(payload)
            if state=="delivered":
                acknowledge(event_id)
                continue
            if state=="rejected":
                quarantine(event_id,payload,status,reason)
                log.error("Quarantined rejected event id=%s status=%s",event_id,status)
                continue
            # Keep the oldest event queued; later events cannot overtake it.
            log.error("Event remains in durable spool after retries: id=%s",event_id)
            return

async def send(payload):
    if payload.get("eventType")=="live_state":
        await deliver(payload)
        return
    event_id=payload.get("sourceEventId")
    if not event_id:
        log.error("Refusing to enqueue an event without sourceEventId")
        return
    enqueue(payload)
    await drain_spool()

async def live(): await send({"eventType":"live_state","status":"live"})
async def waiting(): await send({"eventType":"live_state","status":"waiting"})

def fields(e):
    u=getattr(e,"user",None)
    if not u: return None
    username=getattr(u,"unique_id",None)
    nickname=getattr(u,"nickname",None)
    avatar=getattr(u,"avatar",None)
    avatar_url=getattr(avatar,"url",None) or getattr(avatar,"url_list",None)
    if isinstance(avatar_url,(list,tuple)): avatar_url=avatar_url[0] if avatar_url else None
    if not username or not nickname or not avatar_url: return None
    source_id=getattr(e,"msg_id",None) or getattr(e,"event_id",None)
    if source_id is None:
        # Stable for this handler invocation and its retries; provider IDs are preferred.
        source_id=uuid.uuid4().hex
    return {"username":str(username).lstrip("@"),"displayName":str(nickname),"avatarUrl":str(avatar_url),"sourceEventId":str(source_id)[:128]}

@client.on(LikeEvent)
async def like(e):
    f=fields(e)
    if not f: return
    await live()
    await send({**f,"eventType":"like","likes":max(0,int(getattr(e,"count",0) or 0)),"message":"sent likes"})
@client.on(CommentEvent)
async def comment(e):
    f=fields(e)
    if not f: return
    await live()
    await send({**f,"eventType":"chat","message":str(getattr(e,"comment",""))})
@client.on(GiftEvent)
async def gift(e):
    f=fields(e)
    if not f: return
    await live()
    g=getattr(e,"gift",None)
    name=getattr(g,"name","gift") or "gift"
    count=int(getattr(e,"repeat_count",1) or 1)
    diamonds=int(getattr(g,"diamond_count",0) or 0)
    coins=max(0,diamonds*count)
    await send({**f,"eventType":"gift","giftId":str(getattr(g,"id","")),"coins":coins,"message":f"sent {name}"})
@client.on(FollowEvent)
async def follow(e):
    f=fields(e)
    if not f: return
    await live()
    await send({**f,"eventType":"follow","message":"followed the LIVE!"})
@client.on(ShareEvent)
async def share(e):
    f=fields(e)
    if not f: return
    await live()
    await send({**f,"eventType":"share","message":"shared the LIVE stream!"})
@client.on(JoinEvent)
async def join(e):
    f=fields(e)
    if not f: return
    await live()
    await send({**f,"eventType":"join","message":"joined the LIVE!"})

if __name__=="__main__":
    while True:
        try:
            log.info("Connecting to @%s",HANDLE)
            client.run()
        except UserOfflineError:
            log.info("Account offline")
        except Exception:
            log.exception("Worker error")
        try: asyncio.run(waiting())
        except Exception: log.exception("Status update failed")
        time.sleep(30)
