"""Tikley LIVE bridge worker: forwards only real events with usable identity fields."""
import os, sys, time, logging, asyncio, aiohttp, uuid
from TikTokLive import TikTokLiveClient
from TikTokLive.events import LikeEvent, CommentEvent, GiftEvent, FollowEvent, ShareEvent, JoinEvent
from TikTokLive.client.errors import UserOfflineError

logging.basicConfig(level=logging.INFO)
log=logging.getLogger("tikley-worker")
HANDLE=os.environ.get("TIKTOK_USERNAME","").strip().lstrip("@")
APP_URL=os.environ.get("TIKLEY_APP_URL","").rstrip("/")
TOKEN=os.environ.get("TIKTOK_INGEST_TOKEN","")
if not HANDLE or not APP_URL or not TOKEN: sys.exit("Set TIKTOK_USERNAME, TIKLEY_APP_URL and TIKTOK_INGEST_TOKEN.")
client=TikTokLiveClient(unique_id=HANDLE)

async def send(payload):
    async with aiohttp.ClientSession() as s:
        async with s.post(APP_URL+"/api/tiktok/ingest",json=payload,headers={"Authorization":"Bearer "+TOKEN},timeout=aiohttp.ClientTimeout(total=15)) as r:
            if r.status>=300: log.warning("Ingestion %s: %s",r.status,await r.text())
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
    source_id = getattr(e, "msg_id", None) or getattr(e, "event_id", None)
    if source_id is None:
        source_id = uuid.uuid4().hex
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
