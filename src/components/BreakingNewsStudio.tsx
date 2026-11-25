"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { GameConfig, LiveEvent } from "@/db/schema";
import { BreakingNewsOverlay, toBnEvents } from "@/components/BreakingNewsOverlay";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import {
  BN_FONTS,
  BN_TEMPLATE_PRESETS,
  BREAKING_NEWS_DEFAULTS,
  BREAKING_NEWS_DESIGNS,
  normalizeBnState,
  type BnEventType,
  type BreakingNewsConfig,
  type BreakingNewsState,
} from "@/lib/breakingNews";
import {
  Check,
  Copy,
  ExternalLink,
  Loader2,
  Monitor,
  Newspaper,
  Play,
  Plus,
  RotateCcw,
  Save,
  Smartphone,
  Square,
  Trash2,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface BreakingNewsStudioProps {
  game?: GameConfig;
  events: LiveEvent[];
  onSave: (stateJson: Record<string, unknown>) => Promise<void>;
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const EVENT_ROWS: Array<{ type: BnEventType; label: string; showKey: keyof BreakingNewsConfig; vars: string }> = [
  { type: "gift", label: "Gift", showKey: "showGifts", vars: "{name} {gift} {n}" },
  { type: "like", label: "Like", showKey: "showLikes", vars: "{name}" },
  { type: "follow", label: "Follow", showKey: "showFollows", vars: "{name}" },
  { type: "comment", label: "Comment", showKey: "showComments", vars: "{name} {comment}" },
  { type: "join", label: "Join", showKey: "showJoins", vars: "{name}" },
];

function FontSelect({ value, onChange, allowInherit }: { value: string; onChange: (v: string) => void; allowInherit?: boolean }) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
    >
      {allowInherit && <option value="">{tx("Same as main font")}</option>}
      {BN_FONTS.map((f) => (
        <option key={f} value={f}>
          {f}
        </option>
      ))}
    </select>
  );
}

function ColorField({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
      <input
        type="color"
        value={value || "#ffffff"}
        onChange={(e) => onChange(e.target.value)}
        className="h-6 w-7 cursor-pointer border-0 bg-transparent"
      />
      <input
        value={value}
        placeholder={placeholder ?? "Default"}
        onChange={(e) => onChange(e.target.value)}
        className="min-w-0 flex-1 bg-transparent font-mono text-[11px] text-muted-foreground outline-none"
      />
      {value && placeholder !== undefined && (
        <button type="button" onClick={() => onChange("")} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">
          Reset
        </button>
      )}
    </div>
  );
}

function ScaleField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}%</span>
      </span>
      <input type="range" min={60} max={180} step={5} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-cyan-400" />
    </label>
  );
}

export function BreakingNewsStudio({ game, events, onSave, onFireEvent, onCopyUrl }: BreakingNewsStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const saved = useMemo(() => normalizeBnState(game?.stateJson), [game?.stateJson]);
  const savedJson = JSON.stringify(saved.config);
  const [draft, setDraft] = useState<BreakingNewsConfig>(saved.config);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [stage, setStage] = useState<"16:9" | "9:16">("16:9");
  const dirty = JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson) as BreakingNewsConfig);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const set = (p: Partial<BreakingNewsConfig>) => setDraft((d) => ({ ...d, ...p }));
  const running = saved.phase === "running";
  const previewState: BreakingNewsState = { ...saved, config: draft };
  const bnEvents = toBnEvents(events, previewState);

  const persist = async (next: Partial<BreakingNewsState>) => {
    await onSave({ ...saved, config: draft, ...next } as unknown as Record<string, unknown>);
    notifyOverlayChannel({ type: "game-update", gameSlug: "breaking-news" });
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

  const toggleRunning = async () => {
    playBroadcastSound(running ? "tick" : "join");
    await persist(running ? { phase: "idle", startedAt: null } : { phase: "running", startedAt: Date.now() });
  };

  const link = `/overlay/game/breaking-news`;

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-red-950/50 via-card to-card p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-red-500/15 text-red-400 ring-1 ring-red-500/35">
            <Newspaper className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Live Overlays")}</div>
            <h2 className="text-xl font-black text-foreground">{tx("Breaking News")}</h2>
            <p className="text-xs text-muted-foreground">
              A TV news bar for the bottom of your scene: every gift, follow, like, join and comment becomes a breaking headline, with a scrolling ticker and a live clock.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black ${
              running ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30" : "bg-secondary text-muted-foreground"
            }`}
          >
            <span className={`h-2 w-2 rounded-full ${running ? "animate-pulse bg-emerald-400" : "bg-muted-foreground"}`} />
            {running ? "On stream" : "Stopped"}
          </span>
          <button
            type="button"
            onClick={toggleRunning}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-black shadow ${
              running ? "border border-red-500/40 bg-red-500/15 text-red-300 hover:bg-red-500/25" : "bg-emerald-500 text-slate-950 hover:brightness-110"
            }`}
          >
            {running ? <Square className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            {running ? "Stop" : "Start"}
          </button>
        </div>
      </div>

      {/* Live preview */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="text-sm font-extrabold text-foreground">{tx("Live preview")}</div>
          <div className="flex items-center gap-2">
            <Segmented
              value={stage}
              onChange={setStage}
              options={[
                { id: "16:9", label: "OBS 16:9", icon: <Monitor className="h-3.5 w-3.5" /> },
                { id: "9:16", label: "LIVE Studio 9:16", icon: <Smartphone className="h-3.5 w-3.5" /> },
              ]}
            />
          </div>
        </div>
        <div
          className={`checkerboard-stage relative mx-auto flex flex-col justify-end overflow-hidden rounded-xl border border-white/10 ${
            stage === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-full max-w-[360px]"
          }`}
        >
          <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/30">
            Your camera / game
          </div>
          <div style={{ zoom: stage === "16:9" ? 0.62 : 0.4 }}>
            <BreakingNewsOverlay state={previewState} events={bnEvents} forceVisible />
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-muted-foreground">{tx("Test a headline:")}</span>
          <button type="button" onClick={() => onFireEvent({ eventType: "gift", giftId: "lion" })} className="rounded-lg bg-amber-500/15 px-2.5 py-1 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25">{tx("🎁 Gift")}</button>
          <button type="button" onClick={() => onFireEvent({ eventType: "follow" })} className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-[11px] font-bold text-cyan-300 hover:bg-cyan-500/25">{tx("⭐ Follow")}</button>
          <button type="button" onClick={() => onFireEvent({ eventType: "like", likes: 30 })} className="rounded-lg bg-rose-500/15 px-2.5 py-1 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25">{tx("❤️ Like")}</button>
          <button type="button" onClick={() => onFireEvent({ eventType: "join" })} className="rounded-lg bg-emerald-500/15 px-2.5 py-1 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25">{tx("👋 Join")}</button>
          <button type="button" onClick={() => onFireEvent({ eventType: "chat", message: "خبر عاجل! البث رهيب 🔥" })} className="rounded-lg bg-violet-500/15 px-2.5 py-1 text-[11px] font-bold text-violet-300 hover:bg-violet-500/25">{tx("💬 Comment")}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="Design" hint="How the news bar looks at the bottom of your scene.">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {BREAKING_NEWS_DESIGNS.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => set({ design: d.id })}
                className={`overflow-hidden rounded-xl border text-left transition ${
                  draft.design === d.id ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"
                }`}
              >
                <div className="relative flex h-16 flex-col justify-end overflow-hidden bg-slate-950">
                  <div style={{ zoom: 0.22 }} className="pointer-events-none">
                    <BreakingNewsOverlay state={{ ...previewState, config: { ...draft, design: d.id } }} events={bnEvents} forceVisible />
                  </div>
                </div>
                <div className="bg-card px-2 py-1.5">
                  <div className="text-[11px] font-extrabold text-foreground">{d.label}</div>
                  <div className="truncate text-[9px] text-muted-foreground">{d.hint}</div>
                </div>
              </button>
            ))}
          </div>
        </Section>

        <Section title="Text" hint="Badge, channel name and your own headlines that mix into the ticker.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="text-xs">
              <span className="font-semibold text-muted-foreground">{tx("Badge text")}</span>
              <input value={draft.badgeText} maxLength={24} onChange={(e) => set({ badgeText: e.target.value })} dir="auto" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-brand-cyan" />
            </label>
            <label className="text-xs">
              <span className="font-semibold text-muted-foreground">{tx("Channel name")}</span>
              <input value={draft.channelName} maxLength={32} onChange={(e) => set({ channelName: e.target.value })} dir="auto" className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-bold text-foreground outline-none focus:border-brand-cyan" />
            </label>
          </div>
          <div className="mt-3">
            <div className="mb-1 text-xs font-semibold text-muted-foreground">{tx("Custom headlines")}</div>
            <div className="space-y-1.5">
              {draft.customHeadlines.map((h, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    value={h}
                    dir="auto"
                    maxLength={120}
                    onChange={(e) => set({ customHeadlines: draft.customHeadlines.map((x, j) => (j === i ? e.target.value : x)) })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground outline-none focus:border-brand-cyan"
                  />
                  <button type="button" aria-label="Remove headline" onClick={() => set({ customHeadlines: draft.customHeadlines.filter((_, j) => j !== i) })} className="rounded-xl border border-border px-2.5 text-muted-foreground hover:text-red-400">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {draft.customHeadlines.length < 10 && (
                <button type="button" onClick={() => set({ customHeadlines: [...draft.customHeadlines, ""] })} className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan/15 px-2.5 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/25">
                  <Plus className="h-3.5 w-3.5" /> Add headline
                </button>
              )}
            </div>
          </div>
        </Section>

        <Section title="Events & headline templates" hint="Choose which LIVE events make headlines and how each one reads.">
          <div className="mb-2 flex items-center gap-2 text-[11px]">
            <span className="font-semibold text-muted-foreground">{tx("Presets:")}</span>
            <button type="button" onClick={() => set({ templates: BN_TEMPLATE_PRESETS.ar })} className="rounded-lg bg-secondary/60 px-2 py-1 font-bold hover:bg-secondary">{tx("العربية")}</button>
            <button type="button" onClick={() => set({ templates: BN_TEMPLATE_PRESETS.en })} className="rounded-lg bg-secondary/60 px-2 py-1 font-bold hover:bg-secondary">{tx("English")}</button>
          </div>
          <div className="space-y-2">
            {EVENT_ROWS.map((row) => (
              <div key={row.type} className="rounded-xl border border-border bg-secondary/20 p-2.5">
                <div className="mb-1.5 flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">{row.label}</span>
                  <Toggle checked={Boolean(draft[row.showKey])} onChange={(v) => set({ [row.showKey]: v } as Partial<BreakingNewsConfig>)} />
                </div>
                <input
                  value={draft.templates[row.type]}
                  dir="auto"
                  disabled={!draft[row.showKey]}
                  onChange={(e) => set({ templates: { ...draft.templates, [row.type]: e.target.value } })}
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-brand-cyan disabled:opacity-50"
                />
                <div className="mt-1 text-[10px] text-muted-foreground">Placeholders: {row.vars}</div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-muted-foreground">{tx("Likes show at most once every 4 seconds and joins once every 2.5 seconds, so they never flood the bar.")}</p>
        </Section>

        <Section title="Style" hint="Colours, fonts and ticker speed.">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">{tx("Accent colour")}</div>
              <ColorField value={draft.accentColor} onChange={(v) => set({ accentColor: v })} />
              <div className="mt-1.5 flex gap-1.5">
                {["#dc2626", "#f97316", "#eab308", "#16a34a", "#0ea5e9", "#7c3aed", "#db2777"].map((c) => (
                  <button key={c} type="button" title={c} onClick={() => set({ accentColor: c })} className={`h-5 w-5 rounded-full ${draft.accentColor === c ? "ring-2 ring-brand-cyan ring-offset-1 ring-offset-card" : ""}`} style={{ backgroundColor: c }} />
                ))}
              </div>
            </div>
            <div className="text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">{tx("Text colour")}</div>
              <ColorField value={draft.textColor} onChange={(v) => set({ textColor: v })} />
            </div>
            <div className="text-xs">
              <div className="mb-1 font-semibold text-muted-foreground">{tx("Main font")}</div>
              <FontSelect value={draft.fontFamily} onChange={(v) => set({ fontFamily: v })} />
            </div>
            <label className="block text-xs">
              <span className="flex justify-between font-semibold text-muted-foreground">
                <span>{tx("Ticker speed")}</span>
                <span className="text-foreground">{draft.tickerSpeed} px/s</span>
              </span>
              <input type="range" min={30} max={240} step={5} value={draft.tickerSpeed} onChange={(e) => set({ tickerSpeed: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
            </label>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">{tx("Headline")}</div>
              <ScaleField label="Size" value={draft.headlineFontScale} onChange={(v) => set({ headlineFontScale: v })} />
              <ColorField value={draft.headlineColor} placeholder="" onChange={(v) => set({ headlineColor: v })} />
              <FontSelect value={draft.headlineFont} allowInherit onChange={(v) => set({ headlineFont: v })} />
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">{tx("Badge & channel")}</div>
              <ScaleField label="Size" value={draft.leftFontScale} onChange={(v) => set({ leftFontScale: v })} />
              <ColorField value={draft.leftColor} placeholder="" onChange={(v) => set({ leftColor: v })} />
              <FontSelect value={draft.leftFont} allowInherit onChange={(v) => set({ leftFont: v })} />
            </div>
            <div className="space-y-2 rounded-xl border border-border bg-secondary/20 p-2.5">
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-foreground">{tx("Ticker")}</div>
              <FontSelect value={draft.tickerFont} allowInherit onChange={(v) => set({ tickerFont: v })} />
              <label className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground">{tx("Show icon")}</span>
                <Toggle checked={draft.showTickerIcon} onChange={(v) => set({ showTickerIcon: v })} />
              </label>
              <input value={draft.tickerIcon} maxLength={12} disabled={!draft.showTickerIcon} onChange={(e) => set({ tickerIcon: e.target.value })} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-center text-sm disabled:opacity-50" />
            </div>
          </div>
        </Section>
      </div>

      {/* Link */}
      <div className="rounded-2xl border border-border bg-card p-4">
        <div className="mb-2 text-sm font-extrabold text-foreground">{tx("Overlay link")}</div>
        <div className="flex flex-wrap items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary/60 px-3 py-2 font-mono text-[11px] text-muted-foreground">{link}</code>
          <button
            type="button"
            onClick={() => {
              onCopyUrl(link, "Breaking News");
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan px-3 py-2 text-[11px] font-black text-slate-950"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy
          </button>
          <a href={link} target="_blank" rel="noreferrer" aria-label="Open overlay" className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground">
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
          Add it as a full-width source at the bottom of your scene — OBS / Streamlabs: Sources → + → Browser (1920 × 1080). TikTok LIVE Studio: Add source → Web (1080 × 1920). Add <code>{tx("?design=pill")}</code> (or classic, compact, ticker, minimal, card) to force a design on one source.
        </p>
      </div>

      {/* Save bar */}
      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">
            {dirty ? "Unsaved changes to Breaking News" : justSaved ? "Saved — your overlay updated" : "All changes saved"}
          </span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore OverlayLive defaults" onClick={() => setDraft(BREAKING_NEWS_DEFAULTS)} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={!dirty || saving} onClick={() => setDraft(JSON.parse(savedJson) as BreakingNewsConfig)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">
              Discard
            </button>
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
