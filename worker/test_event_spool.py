import asyncio
import importlib.util
import os
import sys
import tempfile
import types
import unittest
from pathlib import Path

WORKER_PATH = Path(__file__).with_name("tiktok_live_worker.py")


def install_tiktok_stubs():
    root = types.ModuleType("TikTokLive")
    root.__path__ = []

    class FakeClient:
        room_id = "test-room"

        def __init__(self, **kwargs):
            self.logger = types.SimpleNamespace(setLevel=lambda *_: None)

        def on(self, event_type):
            return lambda handler: handler

        async def connect(self):
            return None

    root.TikTokLiveClient = FakeClient
    events = types.ModuleType("TikTokLive.events")
    for name in (
        "ConnectEvent", "DisconnectEvent", "LikeEvent", "CommentEvent",
        "GiftEvent", "FollowEvent", "ShareEvent", "JoinEvent",
    ):
        setattr(events, name, type(name, (), {}))
    client = types.ModuleType("TikTokLive.client")
    client.__path__ = []
    errors = types.ModuleType("TikTokLive.client.errors")
    errors.UserOfflineError = type("UserOfflineError", (Exception,), {})
    errors.WebcastBlockedError = type("WebcastBlockedError", (Exception,), {})
    sys.modules.update({
        "TikTokLive": root,
        "TikTokLive.events": events,
        "TikTokLive.client": client,
        "TikTokLive.client.errors": errors,
    })


def load_worker(spool_path, module_name):
    os.environ.update({
        "TIKTOK_USERNAME": "test_user",
        "TIKLEY_APP_URL": "http://127.0.0.1:3000",
        "TIKTOK_INGEST_TOKEN": "test-token",
        "TIKLEY_SPOOL_PATH": str(spool_path),
    })
    install_tiktok_stubs()
    spec = importlib.util.spec_from_file_location(module_name, WORKER_PATH)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    module.init_spool()
    return module


class DurableReplayAfterLostResponseTest(unittest.TestCase):
    def test_restart_replays_committed_event_when_http_response_is_lost(self):
        with tempfile.TemporaryDirectory() as tmp:
            spool = Path(tmp) / "worker-spool.sqlite3"
            event = {
                "eventType": "gift",
                "sourceEventId": "provider:gift:restart-001",
                "username": "viewer",
                "displayName": "Viewer",
                "avatarUrl": "https://example.test/avatar.png",
                "coins": 25,
            }

            server_committed_ids = set()
            server_counter = {"gift_coins": 0}
            first_attempt = {"value": True}

            async def simulated_delivery(payload):
                event_id = payload["sourceEventId"]
                if event_id not in server_committed_ids:
                    server_committed_ids.add(event_id)
                    server_counter["gift_coins"] += payload["coins"]
                if first_attempt["value"]:
                    first_attempt["value"] = False
                    return "pending", 0, "response lost after server commit"
                return "delivered", 200, ""

            worker_a = load_worker(spool, "tikley_worker_process_a")
            worker_a.enqueue(event)
            worker_a.deliver = simulated_delivery
            asyncio.run(worker_a.drain_spool())
            queued = worker_a.next_pending()
            self.assertIsNotNone(queued)
            self.assertEqual(queued[0], event["sourceEventId"])
            del worker_a

            worker_b = load_worker(spool, "tikley_worker_process_b")
            worker_b.deliver = simulated_delivery
            asyncio.run(worker_b.drain_spool())
            self.assertEqual(len(server_committed_ids), 1)
            self.assertEqual(server_counter["gift_coins"], 25)
            self.assertIsNone(worker_b.next_pending())

    def test_permanent_http_rejection_is_quarantined_without_retry(self):
        with tempfile.TemporaryDirectory() as tmp:
            worker = load_worker(Path(tmp) / "spool.sqlite3", "tikley_worker_reject")
            event = {
                "eventType": "chat",
                "sourceEventId": "provider:chat:bad-001",
                "username": "viewer",
                "displayName": "Viewer",
                "avatarUrl": "https://example.test/avatar.png",
            }
            worker.enqueue(event)
            calls = {"count": 0}

            async def reject(_payload):
                calls["count"] += 1
                return "rejected", 400, "invalid payload"

            worker.deliver = reject
            asyncio.run(worker.drain_spool())
            self.assertEqual(calls["count"], 1)
            self.assertIsNone(worker.next_pending())
            with __import__("sqlite3").connect(worker.SPOOL_PATH) as conn:
                row = conn.execute("SELECT http_status FROM failed_events").fetchone()
            self.assertEqual(row[0], 400)

    def test_events_are_not_delivered_until_live_state_is_confirmed(self):
        with tempfile.TemporaryDirectory() as tmp:
            worker = load_worker(Path(tmp) / "spool.sqlite3", "tikley_worker_live_gate")
            event = {
                "eventType": "chat",
                "sourceEventId": "provider:chat:queued-001",
                "username": "viewer",
                "displayName": "Viewer",
                "avatarUrl": "https://example.test/avatar.png",
            }
            calls = []

            async def fake_deliver(payload):
                calls.append(payload["eventType"])
                if payload["eventType"] == "live_state":
                    return "pending", 0, "timeout"
                return "delivered", 200, ""

            worker.deliver = fake_deliver
            asyncio.run(worker.queue_event(event))
            self.assertEqual(calls, ["live_state"])
            self.assertIsNotNone(worker.next_pending())


if __name__ == "__main__":
    unittest.main()
