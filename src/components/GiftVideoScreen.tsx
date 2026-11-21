"use client";

import { pollMs } from "@/lib/poll";
import type { ActionQueueRow, GiftAction } from "@/db/schema";
import { GiftActionPlayback, type PlayItem } from "@/components/GiftActionPlayer";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface QueueResponse {
  latestId: number;
  items: Array<{ item: ActionQueueRow; action: GiftAction }>;
}

/** One of the 6 Gift Video screens — plays its queued actions one after another. */
export function GiftVideoScreen({ screen }: { screen: number }) {
  const lastId = useRef<number | null>(null);
  const [queue, setQueue] = useState<PlayItem[]>([]);
  const [current, setCurrent] = useState<PlayItem | null>(null);

  const poll = useCallback(async () => {
    try {
      const after = lastId.current === null ? "" : `&after=${lastId.current}`;
      const res = await fetch(`/api/actions/queue?screen=${screen}${after}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as QueueResponse;
      if (lastId.current === null) {
        lastId.current = json.latestId; // skip anything queued before this overlay opened
        return;
      }
      if (json.items.length > 0) {
        lastId.current = json.items[json.items.length - 1].item.id;
        setQueue((q) => [
          ...q,
          ...json.items.map(({ item, action }) => ({
            key: item.id,
            action,
            displayName: item.displayName,
            avatarUrl: item.avatarUrl,
            giftName: item.giftName,
            amount: item.amount,
          })),
        ]);
      }
    } catch {
      // try again on the next tick
    }
  }, [screen]);

  useEffect(() => {
    poll();
    const t = setInterval(poll, pollMs(1500));
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel("overlaylive-sync");
      ch.onmessage = () => setTimeout(poll, 150);
    }
    return () => {
      clearInterval(t);
      ch?.close();
    };
  }, [poll]);

  useEffect(() => {
    if (!current && queue.length > 0) {
      setCurrent(queue[0]);
      setQueue((q) => q.slice(1));
    }
  }, [current, queue]);

  const done = useCallback(() => setCurrent(null), []);

  return (
    <div className="overlay-root fixed inset-0 overflow-hidden">
      {current && <GiftActionPlayback key={current.key} item={current} onDone={done} />}
    </div>
  );
}
