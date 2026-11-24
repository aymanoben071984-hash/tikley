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
        def __init__(self, **kwargs):
            pass

        def on(self, event_type):
            return lambda handler: handler

        def run(self):
            pass

    root.TikTokLiveClient = FakeClient
    events = types.ModuleType("TikTokLive.events")
    for name in ("LikeEvent", "CommentEvent", "GiftEvent", "FollowEvent", "ShareEvent", "JoinEvent"):
        setattr(events, name, type(name, (), {}))
    client = types.ModuleType("TikTokLive.client")
    client.__path__ = []
    errors = types.ModuleType("TikTokLive.client.errors")
    errors.UserOfflineError = type("UserOfflineError", (Exception,), {})
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
                # Model the server's UNIQUE(source_event_id) transaction.
                event_id = payload["sourceEventId"]
                if event_id not in server_committed_ids:
                    server_committed_ids.add(event_id)
                    server_counter["gift_coins"] += payload["coins"]

                if first_attempt["value"]:
                    first_attempt["value"] = False
                    # Server committed, but all HTTP response retries time out.
                    return "pending", 0, "response lost after server commit"
                return "delivered", 200, ""

            # Process A: enqueue, attempt delivery, and lose the response.
            worker_a = load_worker(spool, "tikley_worker_process_a")
            worker_a.enqueue(event)
            worker_a.deliver = simulated_delivery
            asyncio.run(worker_a.drain_spool())

            queued = worker_a.next_pending()
            self.assertIsNotNone(queued, "no ACK means event must remain in SQLite")
            self.assertEqual(queued[0], event["sourceEventId"])
            del worker_a

            # Process B: same persistent volume, same provider event ID.
            worker_b = load_worker(spool, "tikley_worker_process_b")
            worker_b.deliver = simulated_delivery
            asyncio.run(worker_b.drain_spool())

            self.assertEqual(len(server_committed_ids), 1, "server must persist one logical event")
            self.assertEqual(server_counter["gift_coins"], 25, "replay must not double-count coins")
            self.assertIsNone(worker_b.next_pending(), "ACK must remove the event after successful retry")


if __name__ == "__main__":
    unittest.main()
