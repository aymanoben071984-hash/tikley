"use client";

import { pollMs } from "@/lib/poll";
import { EventTicker } from "@/components/EventTicker";
import {
  SAMPLE_TICKER_EVENTS,
  TICKER_EVENTS,
  tickerFromQuery,
  type TickerEvent,
  type TickerEventData,
} from "@/lib/eventTickers";
import React, { useCallback, useEffect, useState } from "react";

/** One OBS / LIVE Studio browser source showing the latest event of a single type. */
export function EventTickerOverlay({ event }: { event: string }) {
  const type = (TICKER_EVENTS.some((e) => e.id === event) ? event : "follow") as TickerEvent;
  const [search, setSearch] = useState("");
  const [data, setData] = useState<TickerEventData | null>(null);
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    setSearch(window.location.search);
  }, []);

  const settings = tickerFromQuery(type, search);
  const demo = new URLSearchParams(search).get("demo") === "1";

  const load = useCallback(async () => {
    try {
      const res = await fetch(`/api/events/latest?type=${type}`, { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as { event: TickerEventData | null };
      setData((prev) => (json.event && prev?.id === json.event.id ? prev : json.event));
    } catch {
      // keep showing the last event on network blips
    }
  }, [type]);

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs(2000));
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel("overlaylive-sync");
      ch.onmessage = () => load();
    }
    return () => {
      clearInterval(t);
      ch?.close();
    };
  }, [load]);

  useEffect(() => {
    if (settings.replay === "none") return;
    const t = setInterval(() => setReplayKey((k) => k + 1), settings.replaySec * 1000);
    return () => clearInterval(t);
  }, [settings.replay, settings.replaySec]);

  const shown = demo || !data ? SAMPLE_TICKER_EVENTS[type] : data;

  return (
    <div className="overlay-root fixed inset-0 flex items-center justify-center p-8">
      <EventTicker event={type} data={shown} settings={settings} replayKey={replayKey} />
    </div>
  );
}
