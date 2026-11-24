"""Tikley LIVE bridge worker with durable delivery and explicit block handling."""
import asyncio
import hashlib
import json
import logging
import os
import re
import sqlite3
import sys
import time
import uuid
from pathlib import Path

import aiohttp
from TikTokLive import TikTokLiveClient
from TikTokLive.events import (
    CommentEvent,
    ConnectEvent,
    DisconnectEvent,
    FollowEvent,
    GiftEvent,
    JoinEvent,
    LikeEvent,
    ShareEvent,
)
from TikTokLive.client.errors import UserOfflineError, WebcastBlockedError

logging.basicConfig(
    level=logging.INFO,
    stream=sys.stdout,
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
log = logging.getLogger("tikley-worker")

HANDLE = os.environ.get("TIKTOK_USERNAME", "").strip().lstrip("@")
APP_URL = os.environ.get("TIKLEY_APP_URL", "").rstrip("/")
TOKEN = os.environ.get("TIKTOK_INGEST_TOKEN", "")
SPOOL_PATH = Path(os.environ.get("TIKLEY_SPOOL_PATH", "./tikley-event-spool.sqlite3"))
RECONNECT_SECONDS = max(10, int(os.environ.get("TIKLEY_RECONNECT_SECONDS", "30")))
DEVICE_BLOCKED_COOLDOWN_SECONDS = max(
    300, int(os.environ.get("TIKLEY_DEVICE_BLOCKED_COOLDOWN_SECONDS", "1800"))
)

if not HANDLE or not APP_URL or not TOKEN:
    sys.exit("Set TIKTOK_USERNAME, TIKLEY_APP_URL and TIKTOK_INGEST_TOKEN.")

client = TikTokLiveClient(unique_id=HANDLE)
client.logger.setLevel(logging.INFO)

http_session = None
live_confirmed = False
delivery_lock = asyncio.Lock()


def init_spool():
    SPOOL_PATH.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute(
            """CREATE TABLE IF NOT EXISTS pending_events (
                source_event_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )
        conn.execute(
            """CREATE TABLE IF NOT EXISTS failed_events (
                source_event_id TEXT PRIMARY KEY,
                payload_json TEXT NOT NULL,
                http_status INTEGER NOT NULL,
                reason TEXT NOT NULL,
                failed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
            )"""
        )


def enqueue(payload):
    event_id = str(payload["sourceEventId"])
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute(
            "INSERT OR IGNORE INTO pending_events(source_event_id,payload_json) VALUES(?,?)",
            (event_id, json.dumps(payload, ensure_ascii=False, separators=(",", ":"))),
        )


def next_pending():
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        return conn.execute(
            "SELECT source_event_id,payload_json FROM pending_events ORDER BY created_at,source_event_id LIMIT 1"
        ).fetchone()


def acknowledge(event_id):
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute("DELETE FROM pending_events WHERE source_event_id=?", (event_id,))


def quarantine(event_id, payload, status, reason):
    with sqlite3.connect(SPOOL_PATH, timeout=10) as conn:
        conn.execute(
            """INSERT OR REPLACE INTO failed_events(source_event_id,payload_json,http_status,reason)
               VALUES(?,?,?,?)""",
            (event_id, json.dumps(payload, ensure_ascii=False, separators=(",", ":")), status, reason[:1000]),
        )
        conn.execute("DELETE FROM pending_events WHERE source_event_id=?", (event_id,))


async def deliver(payload):
    """Send using one pooled HTTP session for the entire TikTok client event loop."""
    if http_session is None or http_session.closed:
        return "pending", 0, "HTTP session is not initialized"

    event_type = str(payload.get("eventType", "unknown"))
    timeout = aiohttp.ClientTimeout(total=15, connect=5, sock_read=8)
    retryable_statuses = {408, 409, 425, 429, 500, 502, 503, 504}
    last_reason = "retry budget exhausted"

    for attempt in range(4):
        try:
            async with http_session.post(
                APP_URL + "/api/tiktok/ingest",
                json=payload,
                headers={"Authorization": "Bearer " + TOKEN},
                timeout=timeout,
            ) as response:
                if response.status < 300:
                    await response.read()
                    return "delivered", response.status, ""

                detail = (await response.text())[:500]
                log.warning(
                    "Ingestion rejected eventType=%s status=%s attempt=%s: %s",
                    event_type, response.status, attempt + 1, detail,
                )
                last_reason = detail or f"HTTP {response.status}"
                if response.status not in retryable_statuses:
                    return "rejected", response.status, last_reason

        except (aiohttp.ClientError, asyncio.TimeoutError) as exc:
            last_reason = f"{type(exc).__name__}: {exc}"
            log.warning(
                "Ingestion transport failure eventType=%s attempt=%s error=%s",
                event_type, attempt + 1, type(exc).__name__,
            )

        if attempt < 3:
            await asyncio.sleep(min(2 ** attempt, 6))

    return "pending", 0, last_reason


async def drain_spool():
    async with delivery_lock:
        while True:
            row = next_pending()
            if not row:
                return

            event_id, payload_json = row
            payload = json.loads(payload_json)
            state, status, reason = await deliver(payload)

            if state == "delivered":
                acknowledge(event_id)
                continue
            if state == "rejected":
                quarantine(event_id, payload, status, reason)
                log.error("Quarantined invalid event id=%s status=%s", event_id, status)
                continue

            # Preserve ordering and data; a later event must not overtake this one.
            log.warning("Event remains in durable spool id=%s reason=%s", event_id, reason)
            return


async def mark_live():
    global live_confirmed
    if live_confirmed:
        return True

    state, status, reason = await deliver({"eventType": "live_state", "status": "live"})
    live_confirmed = state == "delivered"
    if live_confirmed:
        log.info("LIVE state confirmed by Tikley API for @%s; room_id=%s", HANDLE, client.room_id)
    else:
        log.error(
            "LIVE state not confirmed for @%s (delivery=%s status=%s): %s",
            HANDLE, state, status, reason,
        )
    return live_confirmed


async def mark_waiting():
    global live_confirmed
    live_confirmed = False
    state, status, reason = await deliver({"eventType": "live_state", "status": "waiting"})
    if state != "delivered":
        log.warning("Could not confirm waiting state (delivery=%s status=%s): %s", state, status, reason)


def avatar_url_for(user):
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


def event_fields(event):
    user = getattr(event, "user", None)
    if user is None:
        return None

    username = getattr(user, "unique_id", None)
    nickname = getattr(user, "nickname", None)
    avatar_url = avatar_url_for(user)
    if not isinstance(username, str) or not username.strip():
        return None
    if not isinstance(nickname, str) or not nickname.strip() or not avatar_url:
        log.warning("Skipping event with incomplete TikTok user identity/avatar")
        return None

    provider_id = getattr(event, "msg_id", None) or getattr(event, "event_id", None)
    source_id = str(provider_id) if provider_id is not None else uuid.uuid4().hex
    if not re.fullmatch(r"[A-Za-z0-9:_-]{1,128}", source_id):
        source_id = hashlib.sha256(source_id.encode("utf-8")).hexdigest()

    return {
        "username": username.strip().lstrip("@"),
        "displayName": nickname.strip(),
        "avatarUrl": avatar_url,
        "sourceEventId": source_id,
    }


async def queue_event(payload):
    """Persist first; deliver only after the API has acknowledged LIVE state."""
    enqueue(payload)
    if not live_confirmed and not await mark_live():
        log.warning("Event queued until LIVE state is confirmed: %s", payload.get("sourceEventId"))
        return
    await drain_spool()


@client.on(ConnectEvent)
async def on_connect(event):
    await mark_live()
    if live_confirmed:
        await drain_spool()


@client.on(DisconnectEvent)
async def on_disconnect(event):
    log.warning("TikTok LIVE websocket disconnected for @%s", HANDLE)
    await mark_waiting()


@client.on(LikeEvent)
async def on_like(event):
    fields = event_fields(event)
    if fields:
        await queue_event({
            **fields,
            "eventType": "like",
            "likes": max(0, int(getattr(event, "count", 0) or 0)),
            "message": "sent likes",
        })


@client.on(CommentEvent)
async def on_comment(event):
    fields = event_fields(event)
    if fields:
        await queue_event({**fields, "eventType": "chat", "message": str(getattr(event, "comment", ""))})


@client.on(GiftEvent)
async def on_gift(event):
    fields = event_fields(event)
    if not fields:
        return
    gift = getattr(event, "gift", None)
    name = getattr(gift, "name", "gift") or "gift"
    repeat = max(1, int(getattr(event, "repeat_count", 1) or 1))
    diamonds = max(0, int(getattr(gift, "diamond_count", 0) or 0))
    await queue_event({
        **fields,
        "eventType": "gift",
        "giftId": str(getattr(gift, "id", "")),
        "coins": diamonds * repeat,
        "message": f"sent {name}",
    })


@client.on(FollowEvent)
async def on_follow(event):
    fields = event_fields(event)
    if fields:
        await queue_event({**fields, "eventType": "follow", "message": "followed the LIVE!"})


@client.on(ShareEvent)
async def on_share(event):
    fields = event_fields(event)
    if fields:
        await queue_event({**fields, "eventType": "share", "message": "shared the LIVE stream!"})


@client.on(JoinEvent)
async def on_join(event):
    fields = event_fields(event)
    if fields:
        await queue_event({**fields, "eventType": "join", "message": "joined the LIVE!"})


async def run_forever():
    global http_session
    init_spool()

    while True:
        reconnect_delay = RECONNECT_SECONDS
        timeout = aiohttp.ClientTimeout(total=15, connect=5, sock_read=8)
        connector = aiohttp.TCPConnector(limit=20, keepalive_timeout=30)

        async with aiohttp.ClientSession(timeout=timeout, connector=connector) as session:
            http_session = session
            try:
                log.info("Connecting to TikTok LIVE @%s", HANDLE)
                await mark_waiting()
                await client.connect()
                log.info("TikTok LIVE connection ended for @%s", HANDLE)
            except UserOfflineError:
                log.info("@%s is offline; waiting before checking again", HANDLE)
            except WebcastBlockedError as exc:
                # DEVICE_BLOCKED is a TikTok-side rejection, not a transient socket timeout.
                # Do not rotate fingerprints, spoof devices, or hammer the handshake.
                reconnect_delay = DEVICE_BLOCKED_COOLDOWN_SECONDS
                log.error(
                    "TikTok rejected the WebSocket for @%s (%s). "
                    "Pausing reconnects for %s seconds; use an approved ingestion path "
                    "or wait for TikTok to clear the block. Details: %s",
                    HANDLE, type(exc).__name__, reconnect_delay, str(exc)[:500],
                )
            except asyncio.CancelledError:
                raise
            except Exception:
                log.exception("TikTok LIVE connection failed for @%s", HANDLE)
            finally:
                await mark_waiting()
                http_session = None

        await asyncio.sleep(reconnect_delay)


if __name__ == "__main__":
    try:
        asyncio.run(run_forever())
    except KeyboardInterrupt:
        log.info("Worker stopped")
