"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { WidgetConfig } from "@/db/schema";
import { FlagHearts } from "@/components/FlagHearts";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import {
  ALL_FLAGS,
  FEATURED_FLAGS,
  FH_GAP,
  FH_MARGIN,
  FH_MAX_FLAGS,
  FH_POSITIONS,
  FH_SIZE,
  FH_SPEED,
  FLAG_HEARTS_DEFAULTS,
  flagImage,
  flagName,
  normalizeFlagHearts,
  type FlagHeartsConfig,
} from "@/lib/flagHearts";
import { ArrowLeft, ArrowRight, Check, Copy, ExternalLink, Heart, Loader2, Monitor, RotateCcw, Save, Search, Smartphone, X } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

const LINK = "/overlay/flag-hearts";
const POS_LABEL: Record<string, string> = { tl: "Top left", tc: "Top", tr: "Top right", ml: "Left", mc: "Center", mr: "Right", bl: "Bottom left", bc: "Bottom", br: "Bottom right" };

interface FlagHeartsStudioProps {
  widget?: WidgetConfig;
  onSave: (customSettings: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

function Range({ label, value, range, suffix, onChange }: { label: string; value: number; range: { min: number; max: number; step: number }; suffix: string; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">
          {value}
          {suffix}
        </span>
      </span>
      <input type="range" min={range.min} max={range.max} step={range.step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-cyan-400" />
    </label>
  );
}

export function FlagHeartsStudio({ widget, onSave, onCopyUrl }: FlagHeartsStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const savedRaw = (widget?.customSettings as Record<string, unknown> | undefined)?.flagHearts;
  const saved = useMemo(() => normalizeFlagHearts(savedRaw), [savedRaw]);
  const savedJson = JSON.stringify(saved);
  const [draft, setDraft] = useState<FlagHeartsConfig>(saved);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState<"16:9" | "9:16">("16:9");
  const dirty = JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const set = (p: Partial<FlagHeartsConfig>) => setDraft((d) => ({ ...d, ...p }));

  const persist = async (next: FlagHeartsConfig) => {
    setSaving(true);
    try {
      await onSave({ flagHearts: next });
      notifyOverlayChannel({ type: "widget-update", widgetKey: "flag-hearts" });
    } finally {
      setSaving(false);
    }
  };

  const toggleFlag = (code: string) => {
    if (draft.flags.includes(code)) set({ flags: draft.flags.filter((f) => f !== code) });
    else if (draft.flags.length < FH_MAX_FLAGS) set({ flags: [...draft.flags, code] });
  };
  const move = (i: number, d: -1 | 1) => {
    const next = [...draft.flags];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set({ flags: next });
  };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ALL_FLAGS;
    return ALL_FLAGS.filter((c) => c.includes(q) || flagName(c).toLowerCase().includes(q) || flagName(c, "ar").includes(q));
  }, [query]);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-rose-950/40 via-card to-emerald-950/30 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-rose-500/15 text-rose-400 ring-1 ring-rose-400/30">
            <Heart className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Flag Hearts")}</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">{tx("Glossy heart balloons wearing the flags you choose, turning gently in a corner of your stream.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/40 px-3 py-2 text-xs font-bold text-foreground">
            On stream
            <Toggle
              checked={draft.enabled}
              onChange={async (v) => {
                const next = { ...saved, enabled: v };
                set({ enabled: v });
                playBroadcastSound(v ? "join" : "tick");
                await persist(dirty ? { ...draft, enabled: v } : next);
              }}
            />
          </label>
          <button type="button" onClick={() => { onCopyUrl(LINK, "Flag Hearts"); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy overlay link
          </button>
          <a href={LINK} target="_blank" rel="noreferrer" aria-label="Open overlay" className="rounded-xl border border-border bg-secondary/50 p-2 text-foreground hover:bg-secondary">
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_420px]">
        <div className="space-y-4">
          <Section title={`Flags (${draft.flags.length}/${FH_MAX_FLAGS})`} hint="Pick up to 6. The order here is the order on stream.">
            <div className="mb-3 flex min-h-[52px] flex-wrap gap-2 rounded-xl border border-dashed border-border p-2">
              {draft.flags.length === 0 && <span className="px-2 py-2 text-xs text-muted-foreground">{tx("No flags yet — choose some below.")}</span>}
              {draft.flags.map((c, i) => (
                <span key={c} className="flex items-center gap-1.5 rounded-xl border border-brand-cyan/40 bg-brand-cyan/10 py-1 pe-1 ps-1.5 text-xs font-bold text-foreground">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={flagImage(c) ?? ""} alt="" className="h-4 w-6 rounded-sm object-cover" />
                  {flagName(c)}
                  <button type="button" aria-label="Move left" onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowLeft className="h-3 w-3" /></button>
                  <button type="button" aria-label="Move right" onClick={() => move(i, 1)} disabled={i === draft.flags.length - 1} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowRight className="h-3 w-3" /></button>
                  <button type="button" aria-label={`Remove ${flagName(c)}`} onClick={() => toggleFlag(c)} className="rounded p-0.5 text-muted-foreground hover:text-red-400"><X className="h-3.5 w-3.5" /></button>
                </span>
              ))}
            </div>
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={tx("Search a country (English or Arabic)…")} className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-cyan" />
            </div>
            <div className="grid max-h-72 grid-cols-3 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-4 lg:grid-cols-6">
              {list.map((c) => {
                const on = draft.flags.includes(c);
                const full = !on && draft.flags.length >= FH_MAX_FLAGS;
                return (
                  <button key={c} type="button" onClick={() => toggleFlag(c)} disabled={full} title={flagName(c)} className={`flex items-center gap-1.5 rounded-lg border px-1.5 py-1.5 text-left text-[10px] font-semibold transition ${on ? "border-brand-cyan bg-brand-cyan/15 text-foreground" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"} ${full ? "opacity-40" : ""} ${!query && FEATURED_FLAGS.includes(c) ? "" : ""}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={flagImage(c) ?? ""} alt="" loading="lazy" className="h-3.5 w-5 shrink-0 rounded-[2px] object-cover" />
                    <span className="truncate">{flagName(c)}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Look & motion">
              <div className="space-y-3">
                <Range label="Heart size" value={draft.size} range={FH_SIZE} suffix="px" onChange={(v) => set({ size: v })} />
                <Range label="Turning speed" value={draft.speed} range={FH_SPEED} suffix="×" onChange={(v) => set({ speed: v })} />
                <Range label="Gap between hearts" value={draft.gap} range={FH_GAP} suffix="%" onChange={(v) => set({ gap: v })} />
                <div className="text-xs">
                  <div className="mb-1 font-semibold text-muted-foreground">{tx("Line up")}</div>
                  <Segmented value={draft.direction} onChange={(v) => set({ direction: v })} options={[{ id: "row", label: "Side by side" }, { id: "column", label: "Stacked" }]} />
                </div>
              </div>
            </Section>
            <Section title="Position">
              <div className="mx-auto grid w-44 grid-cols-3 gap-1.5">
                {FH_POSITIONS.map((p) => (
                  <button key={p} type="button" title={POS_LABEL[p]} onClick={() => set({ position: p })} className={`grid aspect-square place-items-center rounded-lg border text-sm ${draft.position === p ? "border-brand-cyan bg-brand-cyan/20 text-brand-cyan" : "border-border bg-secondary/30 text-muted-foreground hover:text-foreground"}`}>
                    ♥
                  </button>
                ))}
              </div>
              <div className="mt-1 text-center text-[11px] font-bold text-foreground">{POS_LABEL[draft.position]}</div>
              <div className="mt-3">
                <Range label="Distance from edge" value={draft.margin} range={FH_MARGIN} suffix="px" onChange={(v) => set({ margin: v })} />
              </div>
            </Section>
          </div>
        </div>

        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="flex items-center justify-between">
            <span className="text-sm font-extrabold text-foreground">{tx("Live preview")}</span>
            <Segmented value={stage} onChange={setStage} options={[{ id: "16:9", label: "OBS", icon: <Monitor className="h-3.5 w-3.5" /> }, { id: "9:16", label: "LIVE Studio", icon: <Smartphone className="h-3.5 w-3.5" /> }]} />
          </div>
          <div className={`relative mx-auto overflow-hidden rounded-2xl border border-border bg-slate-900 ${stage === "16:9" ? "aspect-video w-full" : "aspect-[9/16] w-[260px]"}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={stage === "16:9" ? "/backgrounds/space-nebula.jpg" : "/backgrounds/cozy-bedroom.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
            <FlagHearts config={{ ...draft, enabled: true }} scale={stage === "16:9" ? 420 / 1920 : 260 / 1080} />
            {!draft.enabled && <div className="absolute inset-x-0 bottom-2 text-center text-[10px] font-bold text-white/80">{tx("Hidden on stream — preview only")}</div>}
          </div>
          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Add <code className="text-brand-cyan">{LINK}</code> as a full-screen source — OBS / Streamlabs: Browser 1920 × 1080; TikTok LIVE Studio: Web 1080 × 1920. The hearts render on your PC the first time (a second or two), then turn smoothly.
          </p>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? "Unsaved changes to Flag Hearts" : "All changes saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore defaults" onClick={() => setDraft({ ...FLAG_HEARTS_DEFAULTS, enabled: draft.enabled })} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={!dirty || saving} onClick={() => setDraft(saved)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">{tx("Discard")}</button>
            <button type="button" disabled={!dirty || saving} onClick={() => persist(draft)} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
