"""Tikley TikTok LIVE bridge worker (unofficial TikTokLive client)."""
import os
import sys
import time
import logging
import aiohttp

from TikTokLive import TikTokLiveClient
from TikTokLive.events import ConnectEvent, LikeEvent, CommentEvent, GiftEvent, FollowEvent, ShareEvent, JoinEvent
from TikTokLive.client.errors import UserOfflineError

logging.basicConfig(level=logging.INFO)
log = logging.getLogger("tikley-worker")

HANDLE = os.environ.get("TIKTOK_USERNAME", "").strip().lstrip("@")
APP_URL = os.environ.get("TIKLEY_APP_URL", "").rstrip("/")
TOKEN = os.environ.get("TIKTOK_INGEST_TOKEN", "")
if not HANDLE or not APP_URL or not TOKEN:
    sys.exit("Set TIKTOK_USERNAME, TIKLEY_APP_URL and TIKTOK_INGEST_TOKEN.")

client = TikTokLiveClient(unique_id=HANDLE)
# Enable library-level diagnostics to expose room resolution and websocket failures.
client.logger.setLevel(logging.DEBUG)


async def send(payload):
    async with aiohttp.ClientSession() as session:
        async with session.post(
            APP_URL + "/api/tiktok/ingest",
            json=payload,
            headers={"Authorization": "Bearer " + TOKEN},
            timeout=aiohttp.ClientTimeout(total=15),
        ) as response:
            if response.status >= 300:
                detail = await response.text()
                log.warning("Ingestion returned %s: %s", response.status, detail[:500])
                return False
            return True


@client.on(ConnectEvent)
async def on_connect(event):
    # The API gates event ingestion on this explicit connection-state transition.
    confirmed = await send({"eventType": "live_state", "status": "live"})
    if confirmed:
        log.info("LIVE state confirmed by Tikley API for @%s; room_id=%s", HANDLE, getattr(client, "room_id", None))
    else:
        log.error("Tikley API did not confirm LIVE state for @%s; incoming events may be rejected", HANDLE)


def _avatar_url(user):
    """TikTokLive exposes user images as ImageModel objects (usually avatar_thumb)."""
    for field in ("avatar_thumb", "avatar_medium", "avatar_large", "avatar"):
        image = getattr(user, field, None)
        if image is None:
            continue
        urls = getattr(image, "url_list", None)
        if isinstance(urls, (list, tuple)):
            for url in urls:
                if isinstance(url, str) and url.startswith(("https://", "http://")):
                    return url
        url = getattr(image, "url", None)
        if isinstance(url, str) and url.startswith(("https://", "http://")):
            return url
    return ""


def user_fields(event):
    user = getattr(event, "user", None)
    if user is None:
        return {"username": "", "displayName": "", "avatarUrl": ""}
    username = getattr(user, "unique_id", None)
    nickname = getattr(user, "nickname", None)
    return {
        # Never fabricate a username: the API requires a real TikTok identity.
        "username": username.strip().lstrip("@") if isinstance(username, str) else "",
        "displayName": nickname.strip() if isinstance(nickname, str) and nickname.strip() else (username or ""),
        "avatarUrl": _avatar_url(user),
    }


@client.on(LikeEvent)
async def on_like(event):
    await send({**user_fields(event), "eventType": "like", "likes": int(getattr(event, "count", 0) or 0), "message": "sent likes"})


@client.on(CommentEvent)
async def on_comment(event):
    await send({**user_fields(event), "eventType": "chat", "message": str(getattr(event, "comment", ""))})


@client.on(GiftEvent)
async def on_gift(event):
    gift = getattr(event, "gift", None)
    repeat = int(getattr(event, "repeat_count", 1) or 1)
    coins = int(getattr(gift, "diamond_count", 0) or 0) * repeat
    name = getattr(gift, "name", "gift") or "gift"
    await send({**user_fields(event), "eventType": "gift", "giftId": str(getattr(gift, "id", "rose")), "coins": coins, "message": f"sent {name}"})


@client.on(FollowEvent)
async def on_follow(event):
    await send({**user_fields(event), "eventType": "follow", "message": "followed the LIVE!"})


@client.on(ShareEvent)
async def on_share(event):
    await send({**user_fields(event), "eventType": "share", "message": "shared the LIVE stream!"})


@client.on(JoinEvent)
async def on_join(event):
    await send({**user_fields(event), "eventType": "join", "message": "joined the LIVE!"})


if __name__ == "__main__":
    while True:
        try:
            log.info("Connecting to LIVE @%s; waiting if the account is offline.", HANDLE)
            client.run()
            log.warning("TikTokLive client stopped; marking session as waiting.")
        except UserOfflineError:
            log.info("@%s is offline. Marking session as waiting.", HANDLE)
        except Exception:
            log.exception("TikTokLive connection failed. Marking session as waiting.")
        try:
            awaitable = None
            import asyncio
            asyncio.run(send({"eventType": "live_state", "status": "waiting"}))
        except Exception:
            log.exception("Failed to mark LIVE session as waiting")
        time.sleep(30)
