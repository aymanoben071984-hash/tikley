"use client";

import type { GameConfig, StreamerProfile } from "@/db/schema";
import { NewsTickerOverlay, StreamTimerOverlay } from "@/components/ExtraOverlays";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import {
  NEWS_TICKER_DEFAULTS,
  NEWS_TICKER_DESIGNS,
  STREAM_TIMER_DEFAULTS,
  STREAM_TIMER_DESIGNS,
  STORE_OVERLAYS,
  normalizeSimpleState,
  timerBonusSeconds,
  type NewsTickerConfig,
  type SimpleOverlayState,
  type StreamTimerConfig,
} from "@/lib/liveOverlays";
import { Check, Copy, ExternalLink, Loader2, Play, Plus, RotateCcw, Save, Square, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

type Slug = "news-ticker" | "stream-timer";

interface ExtraOverlayStudioProps {
  slug: Slug;
  game?: GameConfig;
  profile?: StreamerProfile;
  onSave: (stateJson: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const FONTS = ["", "Inter", "Changa", "Cairo", "Orbitron", "Roadster", "Bebas Neue", "Montserrat", "Poppins", "Georgia"];

function Color({ value, onChange, allowEmpty }: { value: string; onChange: (v: string) => void; allowEmpty?: boolean }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
      <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-6 w-7 cursor-pointer border-0 bg-transparent" />
      <input value={value} placeholder="Design default" onChange={(e) => onChange(e.target.value)} className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-muted-foreground outline-none" />
      {allowEmpty && value && (
        <button type="button" onClick={() => onChange("")} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">
          Reset
        </button>
      )}
    </div>
  );
}

function Num({ label, value, onChange, min = 0, max = 9999, suffix }: { label: string; value: number; onChange: (v: number) => void; min?: number; max?: number; suffix?: string }) {
  return (
    <label className="block text-xs">
      <span className="font-semibold text-muted-foreground">{label}</span>
      <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
        <input type="number" min={min} max={max} value={value} onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value) || 0)))} className="w-full bg-transparent font-bold text-foreground outline-none" />
        {suffix && <span className="text-[10px] text-muted-foreground">{suffix}</span>}
      </div>
    </label>
  );
}

export function ExtraOverlayStudio({ slug, game, profile, onSave, onCopyUrl }: ExtraOverlayStudioProps) {
  const meta = STORE_OVERLAYS.find((o) => o.slug === slug)!;
  const defaults = (slug === "news-ticker" ? NEWS_TICKER_DEFAULTS : STREAM_TIMER_DEFAULTS) as NewsTickerConfig & StreamTimerConfig;
  const saved = useMemo(() => normalizeSimpleState(game?.stateJson, defaults), [game?.stateJson, defaults]);
  const savedJson = JSON.stringify(saved.config);
  const [draft, setDraft] = useState(saved.config);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const dirty = JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const set = (p: Partial<NewsTickerConfig & StreamTimerConfig>) => setDraft((d) => ({ ...d, ...p }));
  const running = saved.phase === "running";
  const sessionNow = profile ? { coins: profile.sessionCoins, followers: profile.followersCount, likes: profile.sessionLikes } : null;

  const persist = async (next: Partial<SimpleOverlayState<unknown>>) => {
    await onSave({ ...saved, config: draft, ...next } as unknown as Record<string, unknown>);
    notifyOverlayChannel({ type: "game-update", gameSlug: slug });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await persist({});
      playBroadcastSound("follow");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const toggle = async () => {
    playBroadcastSound(running ? "tick" : "join");
    await persist(running ? { phase: "idle" } : { phase: "running", startedAt: Date.now(), baseline: sessionNow });
  };

  const previewState = { ...saved, config: draft, phase: "running" as const };
  const bonus = slug === "stream-timer" ? timerBonusSeconds(draft as StreamTimerConfig, sessionNow, saved.baseline) : 0;
  const link = `/overlay/game/${slug}`;

  const preview = (cfgOverride?: Partial<NewsTickerConfig & StreamTimerConfig>) =>
    slug === "news-ticker" ? (
      <NewsTickerOverlay state={{ ...previewState, config: { ...(draft as NewsTickerConfig), ...cfgOverride } as NewsTickerConfig }} forceVisible />
    ) : (
      <StreamTimerOverlay state={{ ...previewState, startedAt: saved.startedAt, config: { ...(draft as StreamTimerConfig), ...cfgOverride } as StreamTimerConfig }} bonusSec={bonus} forceVisible />
    );

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-cyan-950/40 via-card to-card p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-2xl ring-1 ring-brand-cyan/30">{meta.emoji}</div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Live Overlays</div>
            <h2 className="text-xl font-black text-foreground">{meta.title}</h2>
            <p className="text-xs text-muted-foreground">{meta.description}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${running ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-secondary text-muted-foreground"}`}>
            <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"}`} />
            {running ? "On stream" : "Stopped"}
          </span>
          <button type="button" onClick={toggle} className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow ${running ? "border border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-emerald-500 text-slate-950 hover:brightness-110"}`}>
            {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Stop" : slug === "stream-timer" ? "Start timer" : "Start"}
          </button>
        </div>
      </div>

      <div className="checkerboard-stage flex min-h-[220px] items-center justify-center overflow-hidden rounded-2xl border border-border p-6">
        <div className="w-full overflow-hidden" style={{ display: "flex", justifyContent: "center" }}>
          {preview()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Design">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {(slug === "news-ticker" ? NEWS_TICKER_DESIGNS : STREAM_TIMER_DESIGNS).map((d, i) => (
              <button key={d} type="button" onClick={() => set({ design: d } as Partial<NewsTickerConfig & StreamTimerConfig>)} className={`overflow-hidden rounded-xl border text-left transition ${draft.design === d ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"}`}>
                <div className="flex h-20 items-center justify-center overflow-hidden bg-slate-950">
                  <div style={{ zoom: slug === "news-ticker" ? 0.3 : 0.32 }} className="pointer-events-none">
                    {preview({ design: d } as Partial<NewsTickerConfig & StreamTimerConfig>)}
                  </div>
                </div>
                <div className="bg-card px-2 py-1.5 text-[11px] font-extrabold text-foreground">{meta.designs[i] ?? d}</div>
              </button>
            ))}
          </div>
        </Section>

        {slug === "news-ticker" ? (
          <>
            <Section title="Messages" hint="The ticker repeats these lines in a loop.">
              <div className="space-y-1.5">
                {draft.messages.map((m, i) => (
                  <div key={i} className="flex gap-2">
                    <input value={m} dir="auto" maxLength={160} onChange={(e) => set({ messages: draft.messages.map((x, j) => (j === i ? e.target.value : x)) })} className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-brand-cyan" />
                    <button type="button" aria-label="Remove message" onClick={() => set({ messages: draft.messages.filter((_, j) => j !== i) })} className="rounded-xl border border-border px-2.5 text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
                {draft.messages.length < 12 && (
                  <button type="button" onClick={() => set({ messages: [...draft.messages, ""] })} className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan/15 px-2.5 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/25">
                    <Plus className="h-3.5 w-3.5" /> Add message
                  </button>
                )}
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-xs">
                  <span className="flex items-center justify-between font-semibold text-muted-foreground">
                    Badge <Toggle checked={draft.showBadge} onChange={(v) => set({ showBadge: v })} />
                  </span>
                  <input value={draft.badgeText} maxLength={16} disabled={!draft.showBadge} onChange={(e) => set({ badgeText: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground disabled:opacity-50" />
                </label>
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Separator</span>
                  <input value={draft.separator} maxLength={4} onChange={(e) => set({ separator: e.target.value })} className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-1.5 text-center font-bold text-foreground" />
                </label>
              </div>
            </Section>
            <Section title="Style">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>Speed</span><span className="text-foreground">{draft.speed} px/s</span></span>
                  <input type="range" min={20} max={240} step={5} value={draft.speed} onChange={(e) => set({ speed: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
                </label>
                <label className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>Text size</span><span className="text-foreground">{draft.fontScale}%</span></span>
                  <input type="range" min={50} max={200} step={5} value={draft.fontScale} onChange={(e) => set({ fontScale: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
                </label>
                <div className="text-xs">
                  <div className="mb-1 font-semibold text-muted-foreground">Scroll direction</div>
                  <Segmented value={draft.direction} onChange={(v) => set({ direction: v })} options={[{ id: "auto", label: "Auto" }, { id: "ltr", label: "Left to right" }, { id: "rtl", label: "Right to left" }]} />
                </div>
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Font</span>
                  <select value={draft.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                    {FONTS.map((f) => <option key={f} value={f}>{f || "Design default"}</option>)}
                  </select>
                </label>
                <div className="text-xs"><div className="mb-1 font-semibold text-muted-foreground">Text colour</div><Color value={draft.textColor} onChange={(v) => set({ textColor: v })} allowEmpty /></div>
                <div className="text-xs"><div className="mb-1 font-semibold text-muted-foreground">Accent colour</div><Color value={draft.accentColor} onChange={(v) => set({ accentColor: v })} allowEmpty /></div>
              </div>
            </Section>
          </>
        ) : (
          <>
            <Section title="Mode" hint="Uptime counts up from Start. Countdown counts down and can be extended by viewers. Clock shows the time.">
              <Segmented value={draft.mode} onChange={(v) => set({ mode: v })} options={[{ id: "uptime", label: "Uptime" }, { id: "countdown", label: "Countdown" }, { id: "clock", label: "Clock" }]} />
              <div className="mt-3 grid grid-cols-2 gap-3">
                <label className="text-xs">
                  <span className="flex items-center justify-between font-semibold text-muted-foreground">Label <Toggle checked={draft.showLabel} onChange={(v) => set({ showLabel: v })} /></span>
                  <input value={draft.label} maxLength={20} disabled={!draft.showLabel} onChange={(e) => set({ label: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground disabled:opacity-50" />
                </label>
                {draft.mode === "countdown" && <Num label="Countdown length" value={draft.countdownMinutes} min={1} max={1440} suffix="min" onChange={(v) => set({ countdownMinutes: v })} />}
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs font-semibold text-muted-foreground">
                <label className="flex items-center gap-2"><Toggle checked={draft.showSeconds} onChange={(v) => set({ showSeconds: v })} /> Show seconds</label>
                {draft.mode === "clock" && <label className="flex items-center gap-2"><Toggle checked={draft.hour12} onChange={(v) => set({ hour12: v })} /> 12-hour clock</label>}
              </div>
            </Section>
            {draft.mode === "countdown" && (
              <Section title="Viewers add time" hint="Gifts, new followers and likes add seconds to the countdown while it runs.">
                <label className="mb-3 flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs font-bold">
                  Let viewers extend the timer <Toggle checked={draft.bonusEnabled} onChange={(v) => set({ bonusEnabled: v })} />
                </label>
                <div className={`grid grid-cols-2 gap-3 ${draft.bonusEnabled ? "" : "pointer-events-none opacity-50"}`}>
                  <Num label="Seconds per coin" value={draft.secPerCoin} max={600} onChange={(v) => set({ secPerCoin: v })} />
                  <Num label="Seconds per follow" value={draft.secPerFollow} max={3600} onChange={(v) => set({ secPerFollow: v })} />
                  <Num label="Likes per bonus" value={draft.likesPerBonus} min={1} max={100000} onChange={(v) => set({ likesPerBonus: v })} />
                  <Num label="Seconds per bonus" value={draft.secPerLikes} max={600} onChange={(v) => set({ secPerLikes: v })} />
                  <Num label="Max added time (0 = no limit)" value={draft.maxBonusMinutes} max={1440} suffix="min" onChange={(v) => set({ maxBonusMinutes: v })} />
                  <label className="flex items-end gap-2 pb-2 text-xs font-semibold text-muted-foreground"><Toggle checked={draft.showBonus} onChange={(v) => set({ showBonus: v })} /> Show “+time” chip</label>
                </div>
              </Section>
            )}
            <Section title="Style">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Font</span>
                  <select value={draft.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                    {FONTS.filter(Boolean).map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
                <div className="text-xs"><div className="mb-1 font-semibold text-muted-foreground">Accent colour</div><Color value={draft.accentColor} onChange={(v) => set({ accentColor: v })} /></div>
                <div className="text-xs"><div className="mb-1 font-semibold text-muted-foreground">Text colour</div><Color value={draft.textColor} onChange={(v) => set({ textColor: v })} /></div>
              </div>
            </Section>
          </>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 text-sm font-extrabold text-foreground">Overlay link</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">{link}</code>
          <button type="button" onClick={() => { onCopyUrl(link, meta.title); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan px-3 py-2 text-[11px] font-black text-slate-950">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy
          </button>
          <a href={link} target="_blank" rel="noreferrer" aria-label="Open overlay" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
        <p className="mt-2 text-[11px] text-muted-foreground">Add it as a Browser source in OBS / Streamlabs or a Web source in TikTok LIVE Studio. Press Start to show it on stream.</p>
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? `Unsaved changes to ${meta.title}` : justSaved ? "Saved — your overlay updated" : "All changes saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore OverlayLive defaults" onClick={() => setDraft(defaults)} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={!dirty || saving} onClick={() => setDraft(JSON.parse(savedJson))} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">Discard</button>
            <button type="button" disabled={!dirty || saving} onClick={handleSave} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : justSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : justSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
