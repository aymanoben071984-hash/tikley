"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { WidgetConfig } from "@/db/schema";
import { AutoScale } from "@/components/RefBoard";
import { PlatformIcon, SocialRotator } from "@/components/SocialOverlay";
import { notifyOverlayChannel } from "@/components/SoundEngine";
import { Section, Toggle } from "@/components/TopListsStudio";
import { SOCIAL_PLATFORMS } from "@/lib/socialPlatforms";
import {
  SOCIAL_DEFAULTS,
  SOCIAL_DESIGN_IDS,
  SOCIAL_MOTIONS,
  SOCIAL_PARTICLES,
  SOCIAL_POSITIONS,
  normalizeSocial,
  socialDesignLabel,
  type SocialConfig,
  type SocialLink,
  type SocialPosition,
} from "@/lib/socialMedia";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, Loader2, Plus, RotateCcw, Save, Share2, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface SocialMediaStudioProps {
  widget?: WidgetConfig;
  onSave: (customSettings: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const FONTS = ["", "Orbitron", "Changa", "Inter", "Cairo", "Roadster", "Poppins", "Bebas Neue", "Baloo 2", "Tajawal"];
const POS_LABEL: Record<SocialPosition, string> = { "top-left": "Top left", top: "Top", "top-right": "Top right", center: "Center", "bottom-left": "Bottom left", bottom: "Bottom", "bottom-right": "Bottom right" };

function ColorOpt({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <div className="text-xs">
      <div className="mb-1 font-semibold text-muted-foreground">{label}</div>
      <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
        <input type="color" value={value || "#ffffff"} onChange={(e) => onChange(e.target.value)} className="h-6 w-7 cursor-pointer border-0 bg-transparent" />
        <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-muted-foreground">{value || placeholder}</span>
        {value && (
          <button type="button" onClick={() => onChange("")} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">Reset</button>
        )}
      </div>
    </div>
  );
}

export function SocialMediaStudio({ widget, onSave, onCopyUrl }: SocialMediaStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const savedRaw = (widget?.customSettings as Record<string, unknown> | undefined)?.social;
  const saved = useMemo(() => normalizeSocial(savedRaw), [savedRaw]);
  const savedJson = JSON.stringify(saved);
  const [draft, setDraft] = useState<SocialConfig>(saved);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pos, setPos] = useState<SocialPosition>("center");
  const dirty = JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const set = (p: Partial<SocialConfig>) => setDraft((d) => ({ ...d, ...p }));
  const setLink = (i: number, p: Partial<SocialLink>) => set({ links: draft.links.map((l, j) => (j === i ? { ...l, ...p } : l)) });
  const moveLink = (i: number, d: -1 | 1) => {
    const next = [...draft.links];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    set({ links: next });
  };
  const link = `/overlay/social${pos === "center" ? "" : `?pos=${pos}`}`;

  const save = async () => {
    setSaving(true);
    try {
      await onSave({ social: draft });
      notifyOverlayChannel({ type: "widget-update", widgetKey: "social" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-sky-950/40 via-card to-fuchsia-950/30 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30">
            <Share2 className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Social Media")}</h2>
            <p className="text-xs text-muted-foreground">{tx("A rotating overlay of your handles.")}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_460px]">
        <div className="space-y-4">
          <Section title={`Your handles (${draft.links.length})`} hint="They show one at a time, in this order.">
            <div className="space-y-2">
              {draft.links.map((l, i) => (
                <div key={i} className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-secondary/20 p-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-slate-950">
                    <PlatformIcon platform={l.platform} size={20} />
                  </span>
                  <select value={l.platform} onChange={(e) => setLink(i, { platform: e.target.value })} aria-label="Platform" className="rounded-lg border border-border bg-background px-2 py-1.5 text-xs font-semibold text-foreground">
                    {Object.entries(SOCIAL_PLATFORMS).map(([id, p]) => <option key={id} value={id}>{p.label}</option>)}
                  </select>
                  <input value={l.label} maxLength={60} dir="auto" placeholder="@yourname" onChange={(e) => setLink(i, { label: e.target.value })} aria-label="Handle shown on stream" className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs font-bold text-foreground outline-none focus:border-brand-cyan" />
                  <input value={l.url} maxLength={200} placeholder="https://… (optional)" onChange={(e) => setLink(i, { url: e.target.value })} aria-label="Profile link" className="min-w-[140px] flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-muted-foreground outline-none focus:border-brand-cyan" />
                  <span className="flex items-center">
                    <button type="button" aria-label="Move up" onClick={() => moveLink(i, -1)} disabled={i === 0} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowUp className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Move down" onClick={() => moveLink(i, 1)} disabled={i === draft.links.length - 1} className="rounded p-1 text-muted-foreground hover:text-foreground disabled:opacity-30"><ArrowDown className="h-3.5 w-3.5" /></button>
                    <button type="button" aria-label="Remove" onClick={() => set({ links: draft.links.filter((_, j) => j !== i) })} className="rounded p-1 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                  </span>
                </div>
              ))}
              {draft.links.length < 12 && (
                <button type="button" onClick={() => set({ links: [...draft.links, { platform: "instagram", label: "@yourname", url: "" }] })} className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan/15 px-3 py-1.5 text-xs font-bold text-brand-cyan hover:bg-brand-cyan/25">
                  <Plus className="h-3.5 w-3.5" /> Add handle
                </button>
              )}
            </div>
            <label className="mt-3 block text-xs">
              <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Switch every")}</span><span className="text-foreground">{(draft.intervalMs / 1000).toFixed(1)}s</span></span>
              <input type="range" min={1500} max={15000} step={500} value={draft.intervalMs} onChange={(e) => set({ intervalMs: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
            </label>
          </Section>

          <Section title="Design" hint={`${SOCIAL_DESIGN_IDS.length} designs — painted frames, Bubble Pop, Flame and classic styles.`}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {SOCIAL_DESIGN_IDS.map((id) => (
                <button key={id} type="button" onClick={() => set({ design: id })} className={`overflow-hidden rounded-xl border text-left transition ${draft.design === id ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"}`}>
                  <div className="pointer-events-none flex h-20 items-center justify-center overflow-hidden px-1" style={{ background: "linear-gradient(160deg,#111827,#0b0f17)" }}>
                    <AutoScale maxScale={0.3}>
                      <div className="p-4">
                        <SocialRotator config={{ ...draft, design: id, scale: 100, particles: "none" }} forceIndex={0} />
                      </div>
                    </AutoScale>
                  </div>
                  <div className="bg-card px-2 py-1.5 text-[11px] font-extrabold text-foreground">{socialDesignLabel(id)}</div>
                </button>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Size & text">
              <div className="space-y-3 text-xs">
                <label className="block">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Card size")}</span><span className="text-foreground">{draft.scale}%</span></span>
                  <input type="range" min={40} max={200} step={5} value={draft.scale} onChange={(e) => set({ scale: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                </label>
                <label className="block">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Text size")}</span><span className="text-foreground">{draft.fontSize}%</span></span>
                  <input type="range" min={50} max={200} step={5} value={draft.fontSize} onChange={(e) => set({ fontSize: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                </label>
                <select value={draft.fontFamily} onChange={(e) => set({ fontFamily: e.target.value })} aria-label="Font" className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                  {FONTS.map((f) => <option key={f} value={f}>{f ? `Font: ${f}` : "Font: design default"}</option>)}
                </select>
                <ColorOpt label="Handle colour" value={draft.textColor} placeholder="Design default" onChange={(v) => set({ textColor: v })} />
                <label className="flex items-center justify-between font-bold text-foreground">{tx("Show platform name")} <Toggle checked={draft.showPlatform} onChange={(v) => set({ showPlatform: v })} /></label>
              </div>
            </Section>
            <Section title="Glow, motion & effects">
              <div className="space-y-3 text-xs">
                <label className="flex items-center justify-between font-bold text-foreground">{tx("Handle glow")} <Toggle checked={draft.handleGlow} onChange={(v) => set({ handleGlow: v })} /></label>
                {draft.handleGlow && <ColorOpt label="Glow colour" value={draft.handleGlowColor} placeholder="Platform colour" onChange={(v) => set({ handleGlowColor: v })} />}
                <label className="flex items-center justify-between font-bold text-foreground">{tx("Card halo")} <Toggle checked={draft.cardGlow} onChange={(v) => set({ cardGlow: v })} /></label>
                {draft.cardGlow && <ColorOpt label="Halo colour" value={draft.cardGlowColor} placeholder="Platform colour" onChange={(v) => set({ cardGlowColor: v })} />}
                <div>
                  <div className="mb-1 font-semibold text-muted-foreground">{tx("Motion")}</div>
                  <div className="flex flex-wrap gap-1">
                    {SOCIAL_MOTIONS.map((m) => <button key={m} type="button" onClick={() => set({ motion: m })} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${draft.motion === m ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>{m}</button>)}
                  </div>
                </div>
                <div>
                  <div className="mb-1 font-semibold text-muted-foreground">{tx("Particles")}</div>
                  <div className="flex flex-wrap gap-1">
                    {SOCIAL_PARTICLES.map((m) => <button key={m} type="button" onClick={() => set({ particles: m })} className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize ${draft.particles === m ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>{m}</button>)}
                  </div>
                </div>
                <p className="text-[10px] text-muted-foreground">{tx("Motion, particles and halo apply to the painted frame designs.")}</p>
              </div>
            </Section>
          </div>
        </div>

        <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
          <div className="text-sm font-extrabold text-foreground">{tx("Live preview")}</div>
          <div className="relative flex aspect-video w-full overflow-hidden rounded-2xl border border-border p-4" style={{ background: "url(/backgrounds/space-nebula.jpg) center/cover" }}>
            <div className="absolute inset-0 bg-black/30" />
            <div className={`relative flex w-full ${({ center: "items-center justify-center", "bottom-left": "items-end justify-start", "bottom-right": "items-end justify-end", "top-left": "items-start justify-start", "top-right": "items-start justify-end", bottom: "items-end justify-center", top: "items-start justify-center" } as Record<SocialPosition, string>)[pos]}`}>
              <div style={{ zoom: 0.5 }}>
                <SocialRotator config={draft} />
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3.5">
            <div className="mb-2 text-xs font-extrabold text-foreground">{tx("Position on screen")}</div>
            <div className="mb-3 grid grid-cols-3 gap-1.5">
              {SOCIAL_POSITIONS.map((p) => (
                <button key={p} type="button" onClick={() => setPos(p)} className={`rounded-lg px-2 py-1.5 text-[11px] font-bold ${pos === p ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"} ${p === "center" ? "col-span-3" : ""}`}>{POS_LABEL[p]}</button>
              ))}
            </div>
            <code className="block truncate rounded-lg bg-secondary/60 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">{link}</code>
            <div className="mt-2 flex gap-2">
              <button type="button" onClick={() => { onCopyUrl(link, "Social Media"); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-2 text-xs font-black text-white">
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy overlay link
              </button>
              <a href={link} target="_blank" rel="noreferrer" aria-label="Open overlay" className="rounded-lg border border-border px-3 py-2 text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">{tx("The position is part of the link. Add it as a full-screen source — OBS: Browser 1920 × 1080; TikTok LIVE Studio: Web 1080 × 1920.")}</p>
          </div>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? "Unsaved changes to Social Media" : "All changes saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore defaults" onClick={() => setDraft(SOCIAL_DEFAULTS)} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={!dirty || saving} onClick={() => setDraft(saved)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">{tx("Discard")}</button>
            <button type="button" disabled={!dirty || saving} onClick={save} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
