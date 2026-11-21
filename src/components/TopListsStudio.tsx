"use client";

import type { AvatarPreset, WidgetConfig } from "@/db/schema";
import { TopBoard } from "@/components/TopBoard";
import { NameAnimationPicker } from "@/components/NameAnimationPicker";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { AVATAR_FRAMES } from "@/lib/catalog";
import {
  BOARD_FONTS,
  BOARD_TYPES,
  DESIGN_VARIANTS,
  DISPLAY_OPTION_LABELS,
  LEADERBOARD_COLORS,
  SCORE_POSITIONS,
  SWITCH_ANIMATIONS,
  normalizeBoardSettings,
  type BoardType,
  type TopBoardSettings,
} from "@/lib/topBoard";
import {
  AlignLeft,
  AlignRight,
  Check,
  Columns3,
  Copy,
  ExternalLink,
  LayoutList,
  Loader2,
  Palette,
  Repeat,
  RotateCcw,
  Save,
  Sparkles,
  Trophy,
  Type,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface TopListsStudioProps {
  widget?: WidgetConfig;
  avatars: AvatarPreset[];
  onSave: (board: TopBoardSettings) => Promise<void>;
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

export function Section({
  title,
  hint,
  icon,
  children,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-3">
        <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
          {icon}
          {title}
        </div>
        {hint && <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 rounded-full transition ${checked ? "bg-brand-cyan" : "bg-secondary"}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${checked ? "left-[18px]" : "left-0.5"}`}
      />
    </button>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: Array<{ id: T; label: string; icon?: React.ReactNode }>;
  onChange: (v: T) => void;
}) {
  return (
    <div className="grid gap-1 rounded-xl bg-secondary/60 p-1" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          onClick={() => onChange(o.id)}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-bold transition ${
            value === o.id ? "bg-brand-cyan text-slate-950 shadow" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function TopListsStudio({ widget, avatars, onSave, onFireEvent, onCopyUrl }: TopListsStudioProps) {
  const savedRaw = (widget?.customSettings as Record<string, unknown> | undefined)?.board;
  const saved = useMemo(() => normalizeBoardSettings(savedRaw), [savedRaw]);
  const savedJson = JSON.stringify(saved);

  const [draft, setDraft] = useState<TopBoardSettings>(saved);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  const dirty = JSON.stringify(draft) !== savedJson;

  // Pick up server changes only when nothing is being edited
  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson) as TopBoardSettings);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const patch = (p: Partial<TopBoardSettings>) => setDraft((prev) => ({ ...prev, ...p }));

  const setType = (type: BoardType) =>
    setDraft((prev) => ({
      ...prev,
      type,
      rotation: { ...prev.rotation, boards: prev.rotation.boards.filter((b) => b !== type) },
    }));

  const toggleRotationBoard = (b: BoardType) =>
    setDraft((prev) => {
      const has = prev.rotation.boards.includes(b);
      let boards = has ? prev.rotation.boards.filter((x) => x !== b) : [...prev.rotation.boards, b];
      if (boards.length > 2) boards = boards.slice(boards.length - 2);
      return { ...prev, rotation: { ...prev.rotation, boards } };
    });

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(draft);
      notifyOverlayChannel({ type: "widget-update", widgetKey: "top-lists" });
      playBroadcastSound("follow");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  const currentMeta = BOARD_TYPES.find((t) => t.id === draft.type) ?? BOARD_TYPES[1];
  const rotationTypes = [draft.type, ...draft.rotation.boards];

  return (
    <div className="space-y-5 pb-24">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-amber-950/40 via-card to-cyan-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-400 ring-1 ring-amber-400/35">
              <Trophy className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">Top Lists</h2>
              <p className="text-xs text-muted-foreground">
                Live leaderboards of your top likers, gifters, sharers and supporters — ranked in real time for OBS and TikTok LIVE Studio.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onCopyUrl("/overlay/top-lists", "Top Lists");
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy overlay link
            </button>
            <a
              href="/overlay/top-lists"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_440px]">
        {/* SETTINGS COLUMN */}
        <div className="space-y-4">
          <Section title="Type" hint="Which ranking this board shows. With rotation on, this one shows first.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {BOARD_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                    draft.type === t.id
                      ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan"
                      : "border-border bg-secondary/30 hover:border-brand-cyan/40"
                  }`}
                >
                  <span className="text-xl leading-none">{t.icon}</span>
                  <span className="min-w-0">
                    <span className="block text-xs font-extrabold text-foreground">{t.label}</span>
                    <span className="block text-[10px] leading-snug text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Design Variant" icon={<Sparkles className="h-4 w-4 text-brand-cyan" />}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
              {DESIGN_VARIANTS.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => patch({ variant: v.id })}
                  className={`overflow-hidden rounded-xl border text-left transition ${
                    draft.variant === v.id ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"
                  }`}
                >
                  <div className="flex h-12 flex-col justify-center gap-1 px-2" style={{ background: v.preview }}>
                    {[0, 1, 2].map((i) => (
                      <span
                        key={i}
                        className="h-1.5 rounded-full"
                        style={{ width: `${88 - i * 18}%`, backgroundColor: i === 0 ? draft.color : "rgba(255,255,255,0.35)" }}
                      />
                    ))}
                  </div>
                  <div className="bg-card px-2 py-1.5">
                    <div className="truncate text-[11px] font-extrabold text-foreground">{v.name}</div>
                    <div className="text-[9px] font-bold uppercase text-muted-foreground">{v.tag}</div>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Leaderboard color" icon={<Palette className="h-4 w-4 text-brand-cyan" />}>
              <div className="flex flex-wrap items-center gap-2">
                {LEADERBOARD_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    title={c}
                    onClick={() => patch({ color: c })}
                    className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition ${draft.color === c ? "ring-2 ring-brand-cyan scale-110" : "ring-1 ring-white/20"}`}
                    style={{ backgroundColor: c }}
                  />
                ))}
                <label className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1">
                  <input
                    type="color"
                    value={draft.color}
                    onChange={(e) => patch({ color: e.target.value })}
                    className="h-6 w-7 cursor-pointer border-0 bg-transparent"
                  />
                  <span className="font-mono text-[11px] text-muted-foreground">{draft.color}</span>
                </label>
              </div>
            </Section>

            <Section title="Card Title (on stream)" hint={`Title shown above the ${currentMeta.label} board.`} icon={<Type className="h-4 w-4 text-brand-cyan" />}>
              <div className="flex gap-2">
                <input
                  value={draft.titles[draft.type]}
                  maxLength={40}
                  onChange={(e) => patch({ titles: { ...draft.titles, [draft.type]: e.target.value } })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-brand-cyan"
                />
                <button
                  type="button"
                  title="Reset title"
                  onClick={() => patch({ titles: { ...draft.titles, [draft.type]: currentMeta.defaultTitle } })}
                  className="rounded-xl border border-border px-2.5 text-muted-foreground hover:text-foreground"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                </button>
              </div>
            </Section>

            <Section title="List Direction">
              <Segmented
                value={draft.direction}
                onChange={(v) => patch({ direction: v })}
                options={[
                  { id: "ltr", label: "Left to right", icon: <AlignLeft className="h-3.5 w-3.5" /> },
                  { id: "rtl", label: "Right to left", icon: <AlignRight className="h-3.5 w-3.5" /> },
                ]}
              />
            </Section>

            <Section title="Layout">
              <Segmented
                value={draft.layout}
                onChange={(v) => patch({ layout: v })}
                options={[
                  { id: "vertical", label: "Vertical", icon: <LayoutList className="h-3.5 w-3.5" /> },
                  { id: "horizontal", label: "Horizontal", icon: <Columns3 className="h-3.5 w-3.5" /> },
                ]}
              />
            </Section>

            <Section title="Font Family">
              <select
                value={draft.fontFamily}
                onChange={(e) => patch({ fontFamily: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
              >
                {BOARD_FONTS.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Section>

            <Section title="Name animation" hint="How supporter names move on the board.">
                <NameAnimationPicker
                  value={draft.nameAnimation}
                  accent={draft.color}
                  onChange={(v) => patch({ nameAnimation: v })}
                />
              </Section>
          </div>

          <Section title="Display" hint="What the board shows besides the ranks.">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {DISPLAY_OPTION_LABELS.map((opt) => (
                <label
                  key={opt.key}
                  className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-secondary/25 px-3 py-2"
                >
                  <span className="min-w-0">
                    <span className="block text-xs font-bold text-foreground">{opt.label}</span>
                    <span className="block truncate text-[10px] text-muted-foreground">{opt.hint}</span>
                  </span>
                  <Toggle
                    checked={draft.display[opt.key]}
                    onChange={(v) => patch({ display: { ...draft.display, [opt.key]: v } })}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs">
                <span className="flex justify-between font-semibold text-muted-foreground">
                  <span>Rows on the board</span>
                  <span className="text-foreground">{draft.display.maxRows}</span>
                </span>
                <input
                  type="range"
                  min={3}
                  max={10}
                  value={draft.display.maxRows}
                  onChange={(e) => patch({ display: { ...draft.display, maxRows: Number(e.target.value) } })}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>
              <label className="text-xs">
                <span className="font-semibold text-muted-foreground">Avatar frame</span>
                <select
                  value={draft.frameSlug}
                  disabled={!draft.display.showFrame}
                  onChange={(e) => patch({ frameSlug: e.target.value })}
                  className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-semibold disabled:opacity-50"
                >
                  <option value="user">Each supporter&apos;s own frame</option>
                  {AVATAR_FRAMES.map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {draft.variant.startsWith("crown-") && (
              <div className="mt-3">
                <div className="mb-1 text-xs font-semibold text-muted-foreground">Score position (Crown List)</div>
                <Segmented value={draft.scorePosition} onChange={(v) => patch({ scorePosition: v })} options={SCORE_POSITIONS.map((p) => ({ id: p.id, label: p.label }))} />
              </div>
            )}
          </Section>

          <Section
            title="Rotation"
            icon={<Repeat className="h-4 w-4 text-brand-cyan" />}
            hint="Show two or three boards in turn on a single OBS / LIVE Studio source, with a switch animation between them. (Type above sets which shows first.)"
          >
            <label className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
              <span className="text-xs font-bold text-foreground">Rotate boards</span>
              <Toggle
                checked={draft.rotation.enabled}
                onChange={(v) => patch({ rotation: { ...draft.rotation, enabled: v } })}
              />
            </label>

            <div className={draft.rotation.enabled ? "space-y-3" : "pointer-events-none space-y-3 opacity-50"}>
              <div>
                <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  Boards in the rotation (pick 1 or 2 more)
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-cyan px-3 py-1 text-xs font-black text-slate-950">
                    1 · {currentMeta.icon} {currentMeta.label}
                  </span>
                  {BOARD_TYPES.filter((t) => t.id !== draft.type).map((t) => {
                    const pos = draft.rotation.boards.indexOf(t.id);
                    const on = pos >= 0;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleRotationBoard(t.id)}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          on ? "bg-brand-cyan/20 text-brand-cyan ring-1 ring-brand-cyan" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {on ? `${pos + 2} · ` : "+ "}
                        {t.icon} {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="block text-xs">
                <span className="flex justify-between font-semibold text-muted-foreground">
                  <span>Switch every</span>
                  <span className="text-foreground">{draft.rotation.intervalSec}s</span>
                </span>
                <input
                  type="range"
                  min={4}
                  max={60}
                  value={draft.rotation.intervalSec}
                  onChange={(e) => patch({ rotation: { ...draft.rotation, intervalSec: Number(e.target.value) } })}
                  className="mt-1 w-full accent-cyan-400"
                />
              </label>

              <div>
                <div className="mb-1.5 text-xs font-semibold text-muted-foreground">Switch animation</div>
                <Segmented
                  value={draft.rotation.animation}
                  onChange={(v) => patch({ rotation: { ...draft.rotation, animation: v } })}
                  options={SWITCH_ANIMATIONS.map((a) => ({ id: a.id, label: a.label }))}
                />
              </div>
            </div>
          </Section>
        </div>

        {/* LIVE PREVIEW COLUMN */}
        <div className="xl:sticky xl:top-20 xl:self-start space-y-3">
          <div className="checkerboard-stage flex min-h-[420px] flex-col rounded-2xl border border-border p-4">
            <div className="mb-3 flex items-center justify-between text-xs">
              <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-cyan-300">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                Live preview
              </span>
              {dirty && (
                <span className="rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                  Unsaved changes
                </span>
              )}
            </div>
            <div className="my-auto">
              <TopBoard settings={draft} avatars={avatars} />
            </div>
            {draft.rotation.enabled && rotationTypes.length > 1 && (
              <p className="mt-3 text-center text-[10px] text-white/60">
                Rotating {rotationTypes.length} boards every {draft.rotation.intervalSec}s ·{" "}
                {draft.rotation.animation} transition
              </p>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 text-[11px] font-bold text-muted-foreground">Test the ranking live</div>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              <button type="button" onClick={() => { playBroadcastSound("gift"); onFireEvent({ eventType: "gift", giftId: "tiktok" }); }} className="rounded-lg bg-amber-500/15 px-2 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25">🪙 Gift</button>
              <button type="button" onClick={() => { playBroadcastSound("lion"); onFireEvent({ eventType: "gift", giftId: "lion" }); }} className="rounded-lg bg-orange-500/15 px-2 py-1.5 text-[11px] font-bold text-orange-300 hover:bg-orange-500/25">🦁 Lion</button>
              <button type="button" onClick={() => onFireEvent({ eventType: "like", likes: 1500 })} className="rounded-lg bg-rose-500/15 px-2 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25">❤️ Likes</button>
              <button type="button" onClick={() => onFireEvent({ eventType: "share" })} className="rounded-lg bg-emerald-500/15 px-2 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25">🔁 Share</button>
            </div>
          </div>
        </div>
      </div>

      {/* STICKY SAVE BAR */}
      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="text-xs font-semibold text-muted-foreground">
            {dirty ? "You have unsaved changes" : justSaved ? "Saved — your overlay updated" : "All changes saved"}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={() => setDraft(JSON.parse(savedJson) as TopBoardSettings)}
              className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={!dirty || saving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50"
            >
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : justSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {saving ? "Saving…" : justSaved ? "Saved" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
