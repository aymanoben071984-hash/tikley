"use client";

import { pollMs } from "@/lib/poll";
import { FitScale, QuranView, useQuranPlayback } from "@/components/QuranView";
import { QURAN_DEFAULTS, QURAN_STATE_DEFAULT, type QuranPayload } from "@/lib/quran";
import React, { useCallback, useEffect, useRef, useState } from "react";

/** OBS / TikTok LIVE Studio source: shows the surah and plays the recitation. */
export function QuranOverlay() {
  const [data, setData] = useState<QuranPayload | null>(null);
  const revRef = useRef(0);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/quran", { cache: "no-store" });
      if (!res.ok) return;
      const json = (await res.json()) as QuranPayload;
      // ignore our own progress echoes: only react to new commands or settings
      setData((prev) => (prev && prev.state.rev === json.state.rev && JSON.stringify(prev.config) === JSON.stringify(json.config) ? prev : json));
    } catch {
      /* retry on next tick */
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(load, pollMs(900));
    let ch: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      ch = new BroadcastChannel("overlaylive-sync");
      ch.onmessage = (e) => (e.data?.type === "quran" ? load() : undefined);
    }
    return () => {
      clearInterval(t);
      ch?.close();
    };
  }, [load]);

  if (data) revRef.current = data.state.rev;

  const report = useCallback((ayah: number, ended: boolean) => {
    fetch("/api/quran", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ progress: { rev: revRef.current, ayah, ended } }) }).catch(() => {});
  }, []);

  const payload = data ?? { config: { ...QURAN_DEFAULTS }, state: QURAN_STATE_DEFAULT };
  const pb = useQuranPlayback({ ...payload.state, config: payload.config }, { muted: false, onProgress: report });

  return (
    <div className="overlay-root fixed inset-0">
      {data && (
        <FitScale designW={960} maxScale={1}>
          <QuranView config={data.config} surah={pb.surah} ayah={pb.ayah} timing={pb.timing} line={pb.line} />
        </FitScale>
      )}
    </div>
  );
}
