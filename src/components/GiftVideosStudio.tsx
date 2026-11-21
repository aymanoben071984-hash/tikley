"use client";

import { pageHidden, pollMs } from "@/lib/poll";
import type { GiftAction } from "@/db/schema";
import { GiftActionPlayback, type PlayItem } from "@/components/GiftActionPlayer";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import { GIFT_CATALOG } from "@/lib/catalog";
import {
  ACTION_POSITIONS,
  ACTION_SOUNDS,
  ACTION_TRIGGERS,
  BUILTIN_EFFECTS,
  SCREEN_COUNT,
  type ActionMedia,
  type ActionTrigger,
} from "@/lib/giftActions";
import { Check, Copy, ExternalLink, Film, Loader2, Play, Plus, Save, Trash2, Zap } from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface GiftVideosStudioProps {
  onCopyUrl: (path: string, label: string) => void;
  onToast: (msg: string) => void;
}

function triggerSummary(a: GiftAction) {
  if (a.trigger === "gift") {
    const g = GIFT_CATALOG.find((x) => x.id === a.giftId);
    return `${g ? g.name : "Any gift"}${a.minCount > 1 ? ` ×${a.minCount}+` : ""}`;
  }
  if (a.trigger === "coins") return `Every ${a.threshold.toLocaleString()} coins`;
  if (a.trigger === "likes") return `Every ${a.threshold.toLocaleString()} likes`;
  return ACTION_TRIGGERS.find((t) => t.id === a.trigger)?.label ?? a.trigger;
}

function mediaSummary(a: GiftAction) {
  if (a.mediaType === "effect") return `${BUILTIN_EFFECTS.find((e) => e.id === a.effect)?.emoji ?? "✨"} ${BUILTIN_EFFECTS.find((e) => e.id === a.effect)?.label ?? a.effect}`;
  return a.mediaType === "video" ? "🎬 Video" : "🖼️ GIF";
}

export function GiftVideosStudio({ onCopyUrl, onToast }: GiftVideosStudioProps) {
  const [actions, setActions] = useState<GiftAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | "all">("all");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<GiftAction | null>(null);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<PlayItem | null>(null);
  const [copied, setCopied] = useState<number | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/actions", { cache: "no-store" });
    if (res.ok) {
      const json = (await res.json()) as { actions: GiftAction[] };
      setActions(json.actions);
      return json.actions;
    }
    return [];
  }, []);

  useEffect(() => {
    load().then((list) => {
      setLoading(false);
      if (list[0]) {
        setSelectedId(list[0].id);
        setDraft(list[0]);
      }
    });
    const t = setInterval(() => !pageHidden() && load(), pollMs(6000)); // keep milestone progress fresh
    return () => clearInterval(t);
  }, [load]);

  const selected = actions.find((a) => a.id === selectedId) ?? null;
  const dirty = !!(draft && selected && JSON.stringify({ ...draft, progress: 0, lastFiredAt: null }) !== JSON.stringify({ ...selected, progress: 0, lastFiredAt: null }));
  const set = (p: Partial<GiftAction>) => setDraft((d) => (d ? { ...d, ...p } : d));

  const select = (a: GiftAction) => {
    if (dirty && !window.confirm("Discard unsaved changes to this action?")) return;
    setSelectedId(a.id);
    setDraft(a);
  };

  const api = async (method: string, body?: unknown, q = "") => {
    const res = await fetch(`/api/actions${q}`, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
    if (!res.ok) throw new Error("Request failed");
    return res.json();
  };

  const create = async () => {
    const screen = filter === "all" ? 1 : filter;
    const { action } = (await api("POST", { screen, name: `New action ${actions.length + 1}` })) as { action: GiftAction };
    await load();
    setSelectedId(action.id);
    setDraft(action);
    onToast("Action created");
  };

  const save = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      const { action } = (await api("PATCH", draft)) as { action: GiftAction };
      await load();
      setDraft(action);
      notifyOverlayChannel({ type: "gift-actions" });
      onToast("Action saved");
    } catch {
      onToast("Could not save — check the values and try again");
    } finally {
      setSaving(false);
    }
  };

  const test = async (a: GiftAction) => {
    await fetch("/api/actions/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id }) });
    notifyOverlayChannel({ type: "gift-actions" });
    playBroadcastSound("tick");
    onToast(`Sent “${a.name}” to Screen ${a.screen}`);
  };

  const toggleEnabled = async (a: GiftAction, enabled: boolean) => {
    await api("PATCH", { id: a.id, enabled });
    await load();
    if (draft?.id === a.id) set({ enabled });
  };

  const remove = async (a: GiftAction) => {
    if (!window.confirm(`Delete “${a.name}”?`)) return;
    await api("DELETE", undefined, `?id=${a.id}`);
    const list = await load();
    setSelectedId(list[0]?.id ?? null);
    setDraft(list[0] ?? null);
  };

  const runPreview = () => {
    if (!draft) return;
    const gift = GIFT_CATALOG.find((g) => g.id === draft.giftId);
    setPreview({
      key: Date.now(),
      action: draft,
      displayName: "Mira Lee",
      avatarUrl: "/avatars/a2.png",
      giftName: draft.trigger === "coins" ? `${draft.threshold.toLocaleString()} coins` : draft.trigger === "likes" ? `${draft.threshold.toLocaleString()} likes` : gift?.name ?? "Lion",
      amount: draft.threshold,
    });
  };

  const screenLink = (n: number) => `/overlay/gift-video/${n}`;
  const shown = actions.filter((a) => filter === "all" || a.screen === filter);

  return (
    <div className="space-y-5 pb-24">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-amber-950/40 via-card to-fuchsia-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/35">
              <Film className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Interactive Actions</div>
              <h2 className="text-2xl font-black text-foreground">Gift Videos</h2>
              <p className="max-w-3xl text-xs text-muted-foreground">
                Trigger full-screen video or GIF animations (with optional sound) on up to 6 independent overlays when specific gifts are sent, coin milestones are hit, or likes reach a threshold.
              </p>
            </div>
          </div>
          <button type="button" onClick={create} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-xs font-black text-white shadow hover:brightness-110">
            <Plus className="h-4 w-4" /> New action
          </button>
        </div>
      </div>

      {/* Screens */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: SCREEN_COUNT }, (_, i) => i + 1).map((n) => {
          const count = actions.filter((a) => a.screen === n).length;
          const on = filter === n;
          return (
            <div key={n} onClick={() => setFilter(on ? "all" : n)} className={`cursor-pointer rounded-2xl border p-3 transition ${on ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-card hover:border-brand-cyan/40"}`}>
              <div className="text-sm font-extrabold text-foreground">Screen {n}</div>
              <div className="text-[10px] text-muted-foreground">{count} action{count === 1 ? "" : "s"}</div>
              <div className="mt-2 flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                <button type="button" onClick={() => { onCopyUrl(screenLink(n), `Gift Video Screen ${n}`); setCopied(n); setTimeout(() => setCopied(null), 1800); }} className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-brand-cyan/20 px-2 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/30">
                  {copied === n ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />} {copied === n ? "Copied" : "Link"}
                </button>
                <a href={screenLink(n)} target="_blank" rel="noreferrer" aria-label={`Open screen ${n}`} className="rounded-lg border border-border px-2 py-1 text-muted-foreground hover:text-foreground">
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[380px_1fr]">
        {/* Actions list */}
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="mb-2 flex items-center justify-between px-1">
            <span className="text-sm font-extrabold text-foreground">Actions {filter !== "all" && `· Screen ${filter}`}</span>
            {filter !== "all" && (
              <button type="button" onClick={() => setFilter("all")} className="text-[11px] font-bold text-brand-cyan hover:underline">
                Show all
              </button>
            )}
          </div>
          {loading ? (
            <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : shown.length === 0 ? (
            <p className="px-2 py-8 text-center text-xs text-muted-foreground">No actions on this screen yet — click “New action”.</p>
          ) : (
            <div className="space-y-1.5">
              {shown.map((a) => (
                <div key={a.id} onClick={() => select(a)} className={`flex cursor-pointer items-center gap-2.5 rounded-xl border px-3 py-2.5 transition ${a.id === selectedId ? "border-brand-cyan bg-brand-cyan/10" : "border-border bg-secondary/20 hover:bg-secondary/40"} ${a.enabled ? "" : "opacity-60"}`}>
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-secondary text-lg">{ACTION_TRIGGERS.find((t) => t.id === a.trigger)?.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-extrabold text-foreground">{a.name}</div>
                    <div className="truncate text-[10px] text-muted-foreground">
                      {triggerSummary(a)} → {mediaSummary(a)} · S{a.screen}
                    </div>
                  </div>
                  <span onClick={(e) => e.stopPropagation()} className="flex items-center gap-1.5">
                    <button type="button" title="Test on stream" onClick={() => test(a)} className="rounded-lg bg-emerald-500/15 p-1.5 text-emerald-300 hover:bg-emerald-500/25">
                      <Zap className="h-3.5 w-3.5" />
                    </button>
                    <Toggle checked={a.enabled} onChange={(v) => toggleEnabled(a, v)} />
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Editor */}
        {draft ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-card p-4">
              <input value={draft.name} maxLength={120} onChange={(e) => set({ name: e.target.value })} aria-label="Action name" className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-lg font-black text-foreground outline-none hover:border-border focus:border-brand-cyan" />
              <select value={draft.screen} onChange={(e) => set({ screen: Number(e.target.value) })} aria-label="Screen" className="rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground">
                {Array.from({ length: SCREEN_COUNT }, (_, i) => <option key={i} value={i + 1}>Screen {i + 1}</option>)}
              </select>
              <button type="button" onClick={runPreview} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110">
                <Play className="h-3.5 w-3.5" /> Preview
              </button>
              <button type="button" onClick={() => remove(draft)} className="rounded-xl border border-red-500/30 bg-red-500/10 p-2 text-red-400 hover:bg-red-500/20" aria-label="Delete action">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="checkerboard-stage relative aspect-video w-full overflow-hidden rounded-2xl border border-border">
              <div className="pointer-events-none absolute inset-x-0 top-3 text-center text-[10px] font-bold uppercase tracking-widest text-white/30">Screen {draft.screen} · 16:9 preview</div>
              {preview ? <GiftActionPlayback key={preview.key} item={preview} onDone={() => setPreview(null)} /> : (
                <button type="button" onClick={runPreview} className="absolute inset-0 grid place-items-center text-sm font-bold text-white/60 hover:text-white">▶ Press Preview to play this action</button>
              )}
            </div>

            <Section title="When should it play?">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {ACTION_TRIGGERS.map((t) => (
                  <button key={t.id} type="button" onClick={() => set({ trigger: t.id as ActionTrigger })} className={`flex items-start gap-2 rounded-xl border p-2.5 text-left ${draft.trigger === t.id ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-secondary/25 hover:border-brand-cyan/40"}`}>
                    <span className="text-lg leading-none">{t.icon}</span>
                    <span>
                      <span className="block text-xs font-extrabold text-foreground">{t.label}</span>
                      <span className="block text-[10px] text-muted-foreground">{t.hint}</span>
                    </span>
                  </button>
                ))}
              </div>

              {draft.trigger === "gift" && (
                <div className="mt-3">
                  <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Gift</div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => set({ giftId: "any" })} className={`rounded-xl border px-3 py-2 text-xs font-bold ${draft.giftId === "any" || !draft.giftId ? "border-brand-cyan bg-brand-cyan/10 text-brand-cyan" : "border-border bg-secondary/25 text-muted-foreground"}`}>Any gift</button>
                    {GIFT_CATALOG.map((g) => (
                      <button key={g.id} type="button" onClick={() => set({ giftId: g.id })} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-xs font-bold ${draft.giftId === g.id ? "border-brand-cyan bg-brand-cyan/10 text-foreground" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={g.icon} alt="" className="h-6 w-6 object-contain" />
                        {g.name} <span className="text-[10px] text-amber-300">🪙{g.coins.toLocaleString()}</span>
                      </button>
                    ))}
                  </div>
                  <label className="mt-3 block max-w-xs text-xs">
                    <span className="font-semibold text-muted-foreground">Minimum number sent at once</span>
                    <input type="number" min={1} max={9999} value={draft.minCount} onChange={(e) => set({ minCount: Math.max(1, Number(e.target.value) || 1) })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground" />
                  </label>
                </div>
              )}

              {(draft.trigger === "coins" || draft.trigger === "likes") && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs">
                    <span className="font-semibold text-muted-foreground">Play every</span>
                    <div className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-1.5">
                      <input type="number" min={1} value={draft.threshold} onChange={(e) => set({ threshold: Math.max(1, Number(e.target.value) || 1) })} className="w-full bg-transparent font-bold text-foreground outline-none" />
                      <span className="text-[11px] text-muted-foreground">{draft.trigger === "coins" ? "coins" : "likes"}</span>
                    </div>
                  </label>
                  <div className="text-xs">
                    <div className="font-semibold text-muted-foreground">Progress to the next one</div>
                    <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-secondary">
                      <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-rose-500" style={{ width: `${Math.min(100, ((selected?.progress ?? 0) / Math.max(1, draft.threshold)) * 100)}%` }} />
                    </div>
                    <div className="mt-1 text-[10px] text-muted-foreground">{(selected?.progress ?? 0).toLocaleString()} / {draft.threshold.toLocaleString()}</div>
                  </div>
                </div>
              )}
            </Section>

            <Section title="What plays?">
              <Segmented value={draft.mediaType as ActionMedia} onChange={(v) => set({ mediaType: v })} options={[{ id: "effect", label: "Built-in animation" }, { id: "video", label: "Video link" }, { id: "gif", label: "GIF / image link" }]} />
              {draft.mediaType === "effect" ? (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                  {BUILTIN_EFFECTS.map((fx) => (
                    <button key={fx.id} type="button" onClick={() => set({ effect: fx.id })} className={`rounded-xl border p-2.5 text-center ${draft.effect === fx.id ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-secondary/25 hover:border-brand-cyan/40"}`}>
                      <div className="text-2xl">{fx.emoji}</div>
                      <div className="mt-1 text-[11px] font-bold text-foreground">{fx.label}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  <input value={draft.mediaUrl} onChange={(e) => set({ mediaUrl: e.target.value.trim() })} placeholder={draft.mediaType === "video" ? "https://…/celebration.mp4 (MP4 or WebM)" : "https://…/animation.gif"} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-brand-cyan" />
                  <p className="text-[10px] text-muted-foreground">Paste a direct link to the file. Videos with a transparent background (WebM) look best on stream.</p>
                </div>
              )}
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Position</span>
                  <select value={draft.position} onChange={(e) => set({ position: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                    {ACTION_POSITIONS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                  </select>
                </label>
                <label className={`block text-xs ${draft.position === "full" ? "opacity-50" : ""}`}>
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>Size</span><span className="text-foreground">{draft.size}%</span></span>
                  <input type="range" min={20} max={100} value={draft.size} disabled={draft.position === "full"} onChange={(e) => set({ size: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
                </label>
                <label className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>Duration</span><span className="text-foreground">{draft.durationSec}s</span></span>
                  <input type="range" min={1} max={30} value={draft.durationSec} onChange={(e) => set({ durationSec: Number(e.target.value) })} className="mt-2 w-full accent-cyan-400" />
                </label>
              </div>
              {draft.mediaType !== "effect" && (
                <div className="mt-3 max-w-xs text-xs">
                  <div className="mb-1 font-semibold text-muted-foreground">Fit</div>
                  <Segmented value={draft.fit === "cover" ? "cover" : "contain"} onChange={(v) => set({ fit: v })} options={[{ id: "contain", label: "Fit inside" }, { id: "cover", label: "Fill" }]} />
                </div>
              )}
            </Section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section title="Sound">
                <label className="mb-2 flex items-center justify-between text-xs font-bold text-foreground">
                  Play sound <Toggle checked={draft.soundEnabled} onChange={(v) => set({ soundEnabled: v })} />
                </label>
                <div className={`space-y-2 ${draft.soundEnabled ? "" : "pointer-events-none opacity-50"}`}>
                  {draft.mediaType === "video" ? (
                    <p className="text-[11px] text-muted-foreground">The video’s own audio plays.</p>
                  ) : (
                    <>
                      <select value={draft.soundName} onChange={(e) => set({ soundName: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground">
                        {ACTION_SOUNDS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
                      </select>
                      {draft.soundName === "url" && (
                        <input value={draft.soundUrl} onChange={(e) => set({ soundUrl: e.target.value.trim() })} placeholder="https://…/sound.mp3" className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs text-foreground" />
                      )}
                    </>
                  )}
                  <label className="block text-xs">
                    <span className="flex justify-between font-semibold text-muted-foreground"><span>Volume</span><span className="text-foreground">{draft.volume}%</span></span>
                    <input type="range" min={0} max={100} value={draft.volume} onChange={(e) => set({ volume: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                  </label>
                </div>
              </Section>
              <Section title="Caption & cooldown">
                <label className="mb-2 flex items-center justify-between text-xs font-bold text-foreground">
                  Show caption <Toggle checked={draft.showCaption} onChange={(v) => set({ showCaption: v })} />
                </label>
                <input value={draft.caption} maxLength={160} dir="auto" disabled={!draft.showCaption} onChange={(e) => set({ caption: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground disabled:opacity-50" />
                <p className="mt-1 text-[10px] text-muted-foreground">Placeholders: {"{name}"} {"{gift}"} {"{amount}"}</p>
                <label className="mt-3 block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>Cooldown</span><span className="text-foreground">{draft.cooldownSec ? `${draft.cooldownSec}s` : "None"}</span></span>
                  <input type="range" min={0} max={300} step={5} value={draft.cooldownSec} onChange={(e) => set({ cooldownSec: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                </label>
              </Section>
            </div>
          </div>
        ) : (
          !loading && <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">Create your first action to get started.</div>
        )}
      </div>

      {draft && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? `Unsaved changes to “${draft.name}”` : "All changes saved"}</span>
            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => draft && test(draft)} disabled={dirty} title={dirty ? "Save first" : "Play on its screen"} className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">
                <Zap className="h-3.5 w-3.5" /> Test on stream
              </button>
              <button type="button" disabled={!dirty || saving} onClick={() => selected && setDraft(selected)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">Discard</button>
              <button type="button" disabled={!dirty || saving} onClick={save} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
