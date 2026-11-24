import importlib.util
import os
import sqlite3
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

            # Worker process A persists the event before attempting delivery.
            worker_a = load_worker(spool, "tikley_worker_process_a")
            worker_a.enqueue(event)
            queued = worker_a.next_pending()
            self.assertIsNotNone(queued)
            self.assertEqual(queued[0], event["sourceEventId"])

            # The server commits the event, but the connection drops before
            # the worker receives an HTTP response. Therefore no ACK is sent.
            server_committed_ids = set()
            server_counter = {"gift_coins": 0}

            def server_accept(payload):
                event_id = payload["sourceEventId"]
                if event_id not in server_committed_ids:
                    server_committed_ids.add(event_id)
                    server_counter["gift_coins"] += payload["coins"]
                # Simulate a lost response after the durable server-side commit.
                raise TimeoutError("server committed; response connection was lost")

            with self.assertRaises(TimeoutError):
                server_accept(event)

            # Abrupt process death: deliberately do not call acknowledge().
            del worker_a

            # Worker process B starts with the same persistent SQLite volume.
            worker_b = load_worker(spool, "tikley_worker_process_b")
            replay = worker_b.next_pending()
            self.assertIsNotNone(replay, "unacknowledged event must survive worker restart")
            replay_event = __import__("json").loads(replay[1])

            # Server receives the same provider event ID again. Its unique
            # idempotency key must make the retry a no-op.
            server_accept_id = replay_event["sourceEventId"]
            if server_accept_id not in server_committed_ids:
                server_committed_ids.add(server_accept_id)
                server_counter["gift_coins"] += replay_event["coins"]

            worker_b.acknowledge(replay[0])

            self.assertEqual(len(server_committed_ids), 1)
            self.assertEqual(server_counter["gift_coins"], 25)
            self.assertIsNone(worker_b.next_pending(), "event should be removed only after successful ACK")

            # A second enqueue of the same provider event ID is also ignored
            # by the local durable spool's primary key.
            worker_b.enqueue(event)
            self.assertIsNone(worker_b.next_pending())


if __name__ == "__main__":
    unittest.main()
