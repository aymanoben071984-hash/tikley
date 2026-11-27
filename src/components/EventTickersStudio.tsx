"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { LiveEvent } from "@/db/schema";
import { EventTicker } from "@/components/EventTicker";
import { NameAnimationPicker } from "@/components/NameAnimationPicker";
import { AutoScale } from "@/components/RefBoard";
import { playBroadcastSound } from "@/components/SoundEngine";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import { AVATAR_FRAMES } from "@/lib/catalog";
import {
  REPLAY_FX,
  RING_FRAMES,
  SAMPLE_TICKER_EVENTS,
  TICKER_DESIGNS,
  TICKER_EVENTS,
  TICKER_FONTS,
  tickerDefaults,
  tickerFromQuery,
  tickerToQuery,
  type TickerEvent,
  type TickerEventData,
  type TickerSettings,
} from "@/lib/eventTickers";
import { Check, Copy, ExternalLink, Link2, RotateCcw, Zap } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface EventTickersStudioProps {
  events: LiveEvent[];
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const storeKey = (e: TickerEvent) => `ol-ticker-${e}`;

function loadSettings(e: TickerEvent): TickerSettings {
  if (typeof window === "undefined") return tickerDefaults(e);
  const q = window.localStorage.getItem(storeKey(e));
  return q ? tickerFromQuery(e, q) : tickerDefaults(e);
}

function latestOf(events: LiveEvent[], type: TickerEvent): TickerEventData | null {
  const row = events.find((ev) => ev.eventType === type);
  if (!row) return null;
  return {
    id: row.id,
    name: row.displayName || row.username,
    avatarUrl: row.avatarUrl,
    giftName: row.giftName,
    giftIcon: row.giftIcon,
    coins: row.coins,
    likes: row.likes,
    at: new Date(row.createdAt).getTime(),
  };
}

export function EventTickersStudio({ events, onFireEvent, onCopyUrl }: EventTickersStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const [active, setActive] = useState<TickerEvent>("follow");
  const [all, setAll] = useState<Record<TickerEvent, TickerSettings>>(() =>
    Object.fromEntries(TICKER_EVENTS.map((e) => [e.id, tickerDefaults(e.id)])) as Record<TickerEvent, TickerSettings>,
  );
  const [useLive, setUseLive] = useState(false);
  const [replayKey, setReplayKey] = useState(0);
  const [copied, setCopied] = useState<TickerEvent | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setAll(Object.fromEntries(TICKER_EVENTS.map((e) => [e.id, loadSettings(e.id)])) as Record<TickerEvent, TickerSettings>);
    setOrigin(window.location.origin);
  }, []);

  const s = all[active];
  const set = (p: Partial<TickerSettings>) =>
    setAll((prev) => {
      const next = { ...prev, [active]: { ...prev[active], ...p } };
      window.localStorage.setItem(storeKey(active), tickerToQuery(active, next[active]));
      return next;
    });

  useEffect(() => {
    if (s.replay === "none") return;
    const t = setInterval(() => setReplayKey((k) => k + 1), s.replaySec * 1000);
    return () => clearInterval(t);
  }, [s.replay, s.replaySec]);

  const path = (e: TickerEvent) => `/overlay/ticker/${e}${tickerToQuery(e, all[e])}`;
  const meta = TICKER_EVENTS.find((e) => e.id === active)!;
  const data = (useLive ? latestOf(events, active) : null) ?? SAMPLE_TICKER_EVENTS[active];
  const frameOptions = useMemo(() => AVATAR_FRAMES, []);

  const copy = (e: TickerEvent) => {
    onCopyUrl(path(e), `${TICKER_EVENTS.find((x) => x.id === e)?.label} ticker`);
    setCopied(e);
    setTimeout(() => setCopied(null), 1800);
  };

  const fire = () => {
    playBroadcastSound(active === "gift" ? "gift" : active === "follow" ? "follow" : "join");
    setUseLive(true);
    if (active === "gift") onFireEvent({ eventType: "gift", giftId: "lion" });
    else if (active === "like") onFireEvent({ eventType: "like", likes: 120 });
    else onFireEvent({ eventType: active });
  };

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-fuchsia-950/40 via-card to-cyan-950/40 p-5">
        <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
        <h2 className="text-2xl font-black text-foreground">{tx("Latest Events")}</h2>
        <p className="mt-1 max-w-3xl text-xs text-muted-foreground">
          Design individual single-event tickers — last follow, like, gift, join and share — with premium neon frames. Each ticker is its own OBS / TikTok LIVE Studio browser source, and its settings live in its URL.
        </p>
      </div>

      {/* One card per event, each with its own link */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {TICKER_EVENTS.map((e) => {
          const on = e.id === active;
          return (
            <div key={e.id} onClick={() => setActive(e.id)} className={`cursor-pointer rounded-2xl border p-3 transition ${on ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-card hover:border-brand-cyan/40"}`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-extrabold text-foreground">
                  {e.icon} {e.label}
                </span>
                <span className="h-3 w-3 rounded-full" style={{ background: all[e.id].accentColor, boxShadow: `0 0 8px ${all[e.id].accentColor}` }} />
              </div>
              <div className="mt-1 truncate text-[10px] text-muted-foreground">
                {TICKER_DESIGNS.find((d) => d.id === all[e.id].design)?.label} · {all[e.id].avatarFrame} frame
              </div>
              <div className="mt-2 flex gap-1.5" onClick={(ev) => ev.stopPropagation()}>
                <button type="button" onClick={() => copy(e.id)} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-cyan/20 px-2 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/30">
                  {copied === e.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  {copied === e.id ? "Copied" : "Copy link"}
                </button>
                <a href={path(e.id)} target="_blank" rel="noreferrer" aria-label={`Open ${e.label} ticker`} className="rounded-lg border border-border px-2 py-1 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_520px]">
        <div className="space-y-4">
          <Section title="Design">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {TICKER_DESIGNS.map((d) => (
                <button key={d.id} type="button" onClick={() => set({ design: d.id })} className={`overflow-hidden rounded-xl border text-left transition ${s.design === d.id ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"}`}>
                  <div className="pointer-events-none flex h-24 items-center justify-center overflow-hidden bg-slate-950 px-1">
                    <AutoScale maxScale={0.32}>
                      <EventTicker event={active} data={SAMPLE_TICKER_EVENTS[active]} settings={{ ...s, design: d.id, burst: false, replay: "none" }} />
                    </AutoScale>
                  </div>
                  <div className="bg-card px-2 py-1.5">
                    <div className="text-[11px] font-extrabold text-foreground">{d.label}</div>
                    <div className="truncate text-[9px] text-muted-foreground">{d.hint}</div>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Premium neon frame" hint="Animated neon rings, or any of the 68 avatar frames.">
            <div className="mb-2 grid grid-cols-5 gap-2">
              {[{ id: "none", label: "None" }, ...RING_FRAMES].map((r) => (
                <button key={r.id} type="button" onClick={() => set({ avatarFrame: r.id })} className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-[10px] font-bold ${s.avatarFrame === r.id ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                  <span className="grid h-12 place-items-center">
                    <EventFramePreview frame={r.id} accent={s.accentColor} />
                  </span>
                  {r.label}
                </button>
              ))}
            </div>
            <select value={RING_FRAMES.some((r) => r.id === s.avatarFrame) || s.avatarFrame === "none" ? "" : s.avatarFrame} onChange={(e) => e.target.value && set({ avatarFrame: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground">
              <option value="">{tx("Or pick an image frame…")}</option>
              {frameOptions.map((f) => (
                <option key={f.slug} value={f.slug}>
                  {f.name}
                </option>
              ))}
            </select>
          </Section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Colours">
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-muted-foreground">{tx("Accent")}</span>
                  <input type="color" value={s.accentColor} onChange={(e) => set({ accentColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
                </label>
                <label className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-muted-foreground">{tx("Text")}</span>
                  <input type="color" value={s.textColor} onChange={(e) => set({ textColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" />
                </label>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["#398dc0", "#ff426d", "#f5b301", "#22d3ee", "#a855f7", "#10b981", "#f97316", "#e879f9"].map((c) => (
                    <button key={c} type="button" title={c} onClick={() => set({ accentColor: c })} className={`h-6 w-6 rounded-full ${s.accentColor === c ? "ring-2 ring-brand-cyan ring-offset-2 ring-offset-card" : ""}`} style={{ background: c }} />
                  ))}
                </div>
              </div>
            </Section>
            <Section title="Text">
              <div className="space-y-2 text-xs">
                <input value={s.message} maxLength={80} dir="auto" placeholder={meta.defaultMessage} onChange={(e) => set({ message: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground outline-none focus:border-brand-cyan" />
                <div className="grid grid-cols-2 gap-2">
                  <select value={s.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} className="rounded-xl border border-border bg-background px-2 py-2 font-semibold text-foreground" aria-label={tx("Name font")}>
                    {TICKER_FONTS.map((f) => <option key={f} value={f}>Name: {f}</option>)}
                  </select>
                  <select value={s.msgFont} onChange={(e) => set({ msgFont: e.target.value })} className="rounded-xl border border-border bg-background px-2 py-2 font-semibold text-foreground" aria-label={tx("Message font")}>
                    {TICKER_FONTS.map((f) => <option key={f} value={f}>Message: {f}</option>)}
                  </select>
                </div>
                <label className="flex items-center justify-between font-semibold text-muted-foreground">
                  Event label ({meta.label}) <Toggle checked={s.label} onChange={(v) => set({ label: v })} />
                </label>
              </div>
            </Section>
          </div>

          <Section title="Sizes">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {([
                ["avatarScale", "Avatar"],
                ["nameScale", "Name"],
                ["msgScale", "Message"],
              ] as const).map(([k, label]) => (
                <label key={k} className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>{label}</span><span className="text-foreground">{s[k]}%</span></span>
                  <input type="range" min={50} max={200} step={5} value={s[k]} onChange={(e) => set({ [k]: Number(e.target.value) } as Partial<TickerSettings>)} className="mt-1 w-full accent-cyan-400" />
                </label>
              ))}
            </div>
          </Section>

          <Section title="Name animation">
            <NameAnimationPicker value={s.nameAnim || "none"} accent={s.accentColor} onChange={(v) => set({ nameAnim: v === "none" ? "" : v })} />
          </Section>

          <Section title="Periodic animation" hint="Replays an animation across the whole ticker every few seconds, with an optional hearts-and-stars burst, so it never looks static.">
            <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-9">
              {REPLAY_FX.map((fx) => (
                <button key={fx} type="button" onClick={() => set({ replay: fx })} className={`rounded-lg px-2 py-1.5 text-[11px] font-bold capitalize ${s.replay === fx ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                  {fx}
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className={`block text-xs ${s.replay === "none" ? "opacity-50" : ""}`}>
                <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Every")}</span><span className="text-foreground">{s.replaySec}s</span></span>
                <input type="range" min={4} max={60} value={s.replaySec} disabled={s.replay === "none"} onChange={(e) => set({ replaySec: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
              </label>
              <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs font-bold">
                Hearts & stars burst <Toggle checked={s.burst} onChange={(v) => set({ burst: v })} />
              </label>
            </div>
          </Section>
        </div>

        {/* Preview + link */}
        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="checkerboard-stage flex min-h-[320px] flex-col rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between gap-2 text-xs">
              <span className="font-extrabold uppercase tracking-wider text-cyan-300">
                {meta.icon} {meta.label} preview
              </span>
              <Segmented value={useLive ? "live" : "sample"} onChange={(v) => setUseLive(v === "live")} options={[{ id: "sample", label: "Sample" }, { id: "live", label: "Live data" }]} />
            </div>
            <div className="my-auto">
              <AutoScale>
                <EventTicker event={active} data={data} settings={s} replayKey={replayKey} />
              </AutoScale>
            </div>
            <div className="mt-3 flex items-center justify-between gap-2">
              <button type="button" onClick={fire} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:brightness-110">
                <Zap className="h-3.5 w-3.5" /> Send test {active}
              </button>
              <button type="button" onClick={() => { setAll((p) => ({ ...p, [active]: tickerDefaults(active) })); window.localStorage.removeItem(storeKey(active)); }} className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                <RotateCcw className="h-3.5 w-3.5" /> Reset
              </button>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-foreground">
              <Link2 className="h-3.5 w-3.5 text-brand-cyan" /> {meta.label} browser source
            </div>
            <code className="block break-all rounded-lg bg-secondary/60 px-2.5 py-2 font-mono text-[10px] leading-relaxed text-muted-foreground">
              {origin}
              {path(active)}
            </code>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => copy(active)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-2 text-xs font-black text-white">
                {copied === active ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied === active ? "Copied" : "Copy link"}
              </button>
              <a href={`${path(active)}&demo=1`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-bold text-muted-foreground hover:text-foreground">
                <ExternalLink className="h-3.5 w-3.5" /> Open demo
              </a>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              Every setting is stored in this link — copy it again after changes. OBS / Streamlabs: Sources → + → Browser (800 × 400). TikTok LIVE Studio: Add source → Web. Add one source per event you want on screen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function EventFramePreview({ frame, accent }: { frame: string; accent: string }) {
  if (frame === "none") {
    return <span className="block h-9 w-9 rounded-full border-2" style={{ borderColor: accent }} />;
  }
  return (
    <span className="relative block h-11 w-11">
      <span
        className="pointer-events-none absolute"
        style={{ left: "50%", top: "50%", width: 220, height: 220, transform: "translate(-50%,-50%) scale(0.22)", "--le-main": accent, "--le-main-alpha": `${accent}80` } as React.CSSProperties}
      >
        <span className={`le-ring le-ring-${frame}`} />
      </span>
    </span>
  );
}
