"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { WidgetConfig } from "@/db/schema";
import { EffectsCanvas, type BurstSignal } from "@/components/EffectsCanvas";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { Section, Toggle } from "@/components/TopListsStudio";
import {
  AMBIENCE_DEFAULTS,
  BURST_DEFAULTS,
  SCREEN_EFFECT_LIST,
  normalizeAmbience,
  normalizeBursts,
  type AmbienceSettings,
  type BurstSettings,
  type ScreenEffectId,
} from "@/lib/screenEffects";
import { Check, Copy, ExternalLink, Loader2, RotateCcw, Save, Sparkles } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface ScreenEffectsStudioProps {
  widget?: WidgetConfig;
  onSave: (customSettings: Record<string, unknown>) => Promise<void>;
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const LINK = "/overlay/effects";

export function ScreenEffectsStudio({ widget, onSave, onFireEvent, onCopyUrl }: ScreenEffectsStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const cs = (widget?.customSettings ?? {}) as Record<string, unknown>;
  const saved = useMemo(() => ({ ambience: normalizeAmbience(cs.ambience), bursts: normalizeBursts(cs.bursts) }), [cs.ambience, cs.bursts]);
  const savedJson = JSON.stringify(saved);
  const [amb, setAmb] = useState<AmbienceSettings>(saved.ambience);
  const [bur, setBur] = useState<BurstSettings>(saved.bursts);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [previewBurst, setPreviewBurst] = useState<BurstSignal | null>(null);
  const dirty = JSON.stringify({ ambience: amb, bursts: bur }) !== savedJson;

  useEffect(() => {
    if (!dirty) {
      const s = JSON.parse(savedJson) as { ambience: AmbienceSettings; bursts: BurstSettings };
      setAmb(s.ambience);
      setBur(s.bursts);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const setA = (p: Partial<AmbienceSettings>) => setAmb((a) => ({ ...a, ...p }));
  const setB = (p: Partial<BurstSettings>) => setBur((b) => ({ ...b, ...p }));
  const tintable = SCREEN_EFFECT_LIST.find((e) => e.id === amb.effect)?.tintable;

  const persist = async (next?: { ambience?: AmbienceSettings; bursts?: BurstSettings }) => {
    setSaving(true);
    try {
      await onSave({ ambience: next?.ambience ?? amb, bursts: next?.bursts ?? bur });
      notifyOverlayChannel({ type: "widget-update", widgetKey: "effects" });
    } finally {
      setSaving(false);
    }
  };

  /** The on/off switch applies instantly, like a live control. */
  const toggleLive = async (enabled: boolean) => {
    const next = { ...amb, enabled };
    setAmb(next);
    playBroadcastSound(enabled ? "join" : "tick");
    await persist({ ambience: next, bursts: saved.bursts });
  };

  const fireBurst = (effect: ScreenEffectId) => {
    playBroadcastSound("effect");
    setPreviewBurst({ id: Date.now(), effect, size: bur.size, durationSec: bur.durationSec });
    onFireEvent({ eventType: "effect", effectKey: effect });
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-indigo-950/50 via-card to-pink-950/40 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Screen Effects")}</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">{tx("Full-screen ambience over your whole stream — snow, hearts, fireworks and more, plus instant bursts.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { onCopyUrl(LINK, "Screen Effects"); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy overlay link
          </button>
          <a href={LINK} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary">
            <ExternalLink className="h-3.5 w-3.5" /> Open
          </a>
        </div>
      </div>

      {/* Live preview */}
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border" style={{ background: "linear-gradient(160deg,#0b1220,#1a1033 60%,#0b0f17)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/backgrounds/podcast-studio.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
        <div className="absolute inset-0">
          <EffectsCanvas ambience={{ ...amb, enabled: true }} burst={previewBurst} />
        </div>
        <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
          <span className={`h-2 w-2 rounded-full ${saved.ambience.enabled ? "animate-pulse bg-emerald-400" : "bg-white/40"}`} />
          {saved.ambience.enabled ? `On stream: ${SCREEN_EFFECT_LIST.find((e) => e.id === saved.ambience.effect)?.label}` : "Ambience is off on stream — preview only"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_1fr]">
        <Section title="Ambience" hint="One effect that runs continuously over your whole stream.">
          <label className="mb-3 flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
            <span className="text-xs font-bold text-foreground">{tx("Show ambience on stream")}</span>
            <Toggle checked={amb.enabled} onChange={toggleLive} />
          </label>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
            {SCREEN_EFFECT_LIST.map((fx) => (
              <button key={fx.id} type="button" onClick={() => setA({ effect: fx.id })} className={`rounded-xl border p-2.5 text-center transition ${amb.effect === fx.id ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-secondary/25 hover:border-brand-cyan/40"}`}>
                <div className="text-2xl">{fx.emoji}</div>
                <div className="mt-1 text-[11px] font-bold text-foreground">{fx.label}</div>
              </button>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block text-xs">
              <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Intensity")}</span><span className="text-foreground">{amb.intensity}%</span></span>
              <input type="range" min={0} max={100} value={amb.intensity} onChange={(e) => setA({ intensity: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
            </label>
            <label className="block text-xs">
              <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Speed")}</span><span className="text-foreground">{amb.speed.toFixed(2)}×</span></span>
              <input type="range" min={0.25} max={3} step={0.05} value={amb.speed} onChange={(e) => setA({ speed: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
            </label>
          </div>
          <div className={`mt-3 flex flex-wrap items-center gap-2 text-xs ${tintable ? "" : "pointer-events-none opacity-50"}`}>
            <span className="font-semibold text-muted-foreground">{tx("Tint")}</span>
            <button type="button" onClick={() => setA({ tint: null })} className={`rounded-lg px-2.5 py-1 font-bold ${amb.tint === null ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground"}`}>{tx("Natural")}</button>
            {["#ffffff", "#22d3ee", "#f472b6", "#facc15", "#a855f7", "#10b981", "#f43f5e"].map((c) => (
              <button key={c} type="button" title={c} onClick={() => setA({ tint: c })} className={`h-6 w-6 rounded-full ${amb.tint === c ? "ring-2 ring-brand-cyan ring-offset-2 ring-offset-card" : ""}`} style={{ background: c }} />
            ))}
            <input type="color" value={amb.tint ?? "#ffffff"} onChange={(e) => setA({ tint: e.target.value })} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" aria-label="Custom tint" />
            {!tintable && <span className="text-[10px] text-muted-foreground">{tx("(this effect uses its own colours)")}</span>}
          </div>
        </Section>

        <div className="space-y-4">
          <Section title="Instant bursts" hint="One tap plays a short, dense burst on top of everything — on stream and here.">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
              {SCREEN_EFFECT_LIST.map((fx) => (
                <button key={fx.id} type="button" onClick={() => fireBurst(fx.id)} className="rounded-xl border border-border bg-slate-950 p-2 text-center shadow transition hover:scale-[1.04] hover:border-brand-cyan active:scale-95">
                  <div className="text-xl">{fx.emoji}</div>
                  <div className="mt-0.5 truncate text-[10px] font-bold text-white/85">{fx.label}</div>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <label className="block text-xs">
                <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Burst size")}</span><span className="text-foreground">{bur.size}%</span></span>
                <input type="range" min={20} max={100} value={bur.size} onChange={(e) => setB({ size: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
              </label>
              <label className="block text-xs">
                <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Burst length")}</span><span className="text-foreground">{bur.durationSec}s</span></span>
                <input type="range" min={1} max={8} value={bur.durationSec} onChange={(e) => setB({ durationSec: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
              </label>
            </div>
          </Section>

          <Section title="Automatic bursts" hint="Let your LIVE fire bursts by itself.">
            <div className="space-y-3 text-xs">
              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                <label className="flex items-center justify-between font-bold text-foreground">
                  Big gifts <Toggle checked={bur.autoGift} onChange={(v) => setB({ autoGift: v })} />
                </label>
                <div className={`mt-2 grid grid-cols-2 gap-2 ${bur.autoGift ? "" : "pointer-events-none opacity-50"}`}>
                  <label>
                    <span className="text-[10px] font-semibold text-muted-foreground">{tx("From (coins)")}</span>
                    <input type="number" min={1} value={bur.autoGiftMinCoins} onChange={(e) => setB({ autoGiftMinCoins: Math.max(1, Number(e.target.value) || 1) })} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 font-bold text-foreground" />
                  </label>
                  <label>
                    <span className="text-[10px] font-semibold text-muted-foreground">{tx("Effect")}</span>
                    <select value={bur.autoGiftEffect} onChange={(e) => setB({ autoGiftEffect: e.target.value as ScreenEffectId })} className="mt-0.5 w-full rounded-lg border border-border bg-background px-2 py-1.5 font-semibold text-foreground">
                      {SCREEN_EFFECT_LIST.map((fx) => <option key={fx.id} value={fx.id}>{fx.emoji} {fx.label}</option>)}
                    </select>
                  </label>
                </div>
              </div>
              <div className="rounded-xl border border-border bg-secondary/20 p-3">
                <label className="flex items-center justify-between font-bold text-foreground">
                  New followers <Toggle checked={bur.autoFollow} onChange={(v) => setB({ autoFollow: v })} />
                </label>
                <select value={bur.autoFollowEffect} disabled={!bur.autoFollow} onChange={(e) => setB({ autoFollowEffect: e.target.value as ScreenEffectId })} className="mt-2 w-full rounded-lg border border-border bg-background px-2 py-1.5 font-semibold text-foreground disabled:opacity-50">
                  {SCREEN_EFFECT_LIST.map((fx) => <option key={fx.id} value={fx.id}>{fx.emoji} {fx.label}</option>)}
                </select>
              </div>
            </div>
          </Section>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground">
        Add <code className="text-brand-cyan">{LINK}</code> as a full-screen source on top of everything — OBS / Streamlabs: Browser source 1920 × 1080; TikTok LIVE Studio: Web source 1080 × 1920. One source runs the ambience and every burst.
      </p>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? "Unsaved changes to Screen Effects" : "All changes saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore defaults" onClick={() => { setAmb({ ...AMBIENCE_DEFAULTS, enabled: amb.enabled }); setBur(BURST_DEFAULTS); }} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <RotateCcw className="h-3.5 w-3.5" />
            </button>
            <button type="button" disabled={!dirty || saving} onClick={() => { setAmb(saved.ambience); setBur(saved.bursts); }} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">{tx("Discard")}</button>
            <button type="button" disabled={!dirty || saving} onClick={() => persist()} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
