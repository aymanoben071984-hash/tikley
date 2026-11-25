"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { AvatarPreset, TopBoardRow } from "@/db/schema";
import { TopBoard } from "@/components/TopBoard";
import { CROWNS, NAMEPLATES, isOlTheme, olTheme, themeThumb } from "@/lib/olThemes";
import { NameAnimationPicker } from "@/components/NameAnimationPicker";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import { AVATAR_FRAMES } from "@/lib/catalog";
import {
  BOARD_FONTS,
  BOARD_TYPES,
  DESIGN_GROUPS,
  DESIGN_VARIANTS,
  DISPLAY_OPTION_LABELS,
  SCORE_POSITIONS,
  LEADERBOARD_COLORS,
  SWITCH_ANIMATIONS,
  getBoardMeta,
  normalizeBoardSettings,
  sampleSupporters,
  type BoardType,
  type SwitchAnimation,
  type TopBoardSettings,
} from "@/lib/topBoard";
import {
  AlignLeft,
  AlignRight,
  Check,
  Columns3,
  Copy,
  CopyPlus,
  Eraser,
  ExternalLink,
  LayoutList,
  Link2,
  Loader2,
  Palette,
  Plus,
  Repeat,
  RotateCcw,
  Save,
  Sparkles,
  Trash2,
  Trophy,
  Type,
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface TopBoardsManagerProps {
  boards: TopBoardRow[];
  avatars: AvatarPreset[];
  onRefresh: () => Promise<void>;
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
  onToast: (msg: string) => void;
}

interface Draft {
  name: string;
  settings: TopBoardSettings;
}

async function api(method: string, body?: unknown, query = "") {
  const res = await fetch(`/api/top-boards${query}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Request failed (${res.status})`);
  return res.json() as Promise<{ board?: TopBoardRow }>;
}

/** Rotation switch preview built with OverlayLive's own `sw-mini` animations. */
function SwitchMini({ animation, color }: { animation: SwitchAnimation; types: BoardType[]; color: string }) {
  const cls = animation === "podium" ? "sw-mini-podium" : `sw-mini-${animation}`;
  if (animation === "podium") {
    return (
      <div className="flex h-16 w-28 items-end justify-center gap-1.5 rounded-lg border border-white/10 bg-slate-950 px-3 pb-2">
        {[{ r: 2, h: 60 }, { r: 1, h: 85 }, { r: 3, h: 45 }].map(({ r, h }) => (
          <span
            key={r}
            className={`sw-mini ${cls} sw-mini-r${r} w-5 rounded-t-md`}
            style={{ height: `${h}%`, backgroundColor: r === 1 ? color : "rgba(255,255,255,0.35)" }}
          />
        ))}
      </div>
    );
  }
  return (
    <div className="flex h-16 w-28 flex-col justify-center gap-1.5 overflow-hidden rounded-lg border border-white/10 bg-slate-950 px-2.5 [perspective:400px]">
      {[1, 2, 3].map((r) => (
        <span key={r} className={`sw-mini ${cls} sw-mini-r${r} flex items-center gap-1`}>
          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: r === 1 ? color : "rgba(255,255,255,0.4)" }} />
          <span className="h-2 rounded-full bg-white/30" style={{ width: `${78 - r * 14}%` }} />
        </span>
      ))}
    </div>
  );
}

export function TopBoardsManager({ boards, avatars, onRefresh, onFireEvent, onCopyUrl, onToast }: TopBoardsManagerProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const [selectedId, setSelectedId] = useState<number | null>(boards[0]?.id ?? null);
  const selected = boards.find((b) => b.id === selectedId) ?? boards[0];

  const savedDraft = useMemo<Draft | null>(
    () => (selected ? { name: selected.name, settings: normalizeBoardSettings(selected.settings) } : null),
    [selected],
  );
  const savedJson = JSON.stringify(savedDraft);

  const [draft, setDraft] = useState<Draft | null>(savedDraft);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showNewMenu, setShowNewMenu] = useState(false);
  const [previewData, setPreviewData] = useState<"sample" | "live">("sample");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  const dirty = draft !== null && JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!selectedId && boards[0]) setSelectedId(boards[0].id);
  }, [boards, selectedId]);

  // Reload draft when the selected board changes on the server (and nothing is being edited)
  useEffect(() => {
    if (!dirty) setDraft(savedJson === "null" ? null : (JSON.parse(savedJson) as Draft));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const samples = useMemo(() => sampleSupporters(), []);
  const previewAvatars = previewData === "sample" ? samples : avatars;

  const selectBoard = (id: number) => {
    if (id === selected?.id) return;
    if (dirty && !window.confirm("Discard unsaved changes to this board?")) return;
    setSelectedId(id);
    const b = boards.find((x) => x.id === id);
    if (b) setDraft({ name: b.name, settings: normalizeBoardSettings(b.settings) });
  };

  const setS = (p: Partial<TopBoardSettings>) =>
    setDraft((prev) => (prev ? { ...prev, settings: { ...prev.settings, ...p } } : prev));

  const copyLink = (id: number, name: string) => {
    onCopyUrl(`/overlay/top/${id}`, name);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const run = async (fn: () => {tx("Promise")}<void>) => {
    setBusy(true);
    try {
      await fn();
      await onRefresh();
      notifyOverlayChannel({ type: "widget-update", widgetKey: "top-boards" });
    } catch {
      onToast("Something went wrong — please try again");
    } finally {
      setBusy(false);
    }
  };

  const createBoard = (type: BoardType) =>
    run(async () => {
      const { board } = await api("POST", { type });
      if (board) {
        setSelectedId(board.id);
        setDraft({ name: board.name, settings: normalizeBoardSettings(board.settings) });
      }
      setShowNewMenu(false);
      onToast(`Created ${getBoardMeta(type).label} board`);
    });

  const handleSave = async () => {
    if (!selected || !draft) return;
    setSaving(true);
    try {
      await api("PATCH", { id: selected.id, name: draft.name, settings: draft.settings });
      await onRefresh();
      notifyOverlayChannel({ type: "widget-update", widgetKey: "top-boards" });
      playBroadcastSound("follow");
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
    } catch {
      onToast("Could not save — please try again");
    } finally {
      setSaving(false);
    }
  };

  const s = draft?.settings;
  const meta = s ? getBoardMeta(s.type) : BOARD_TYPES[1];

  return (
    <div className="space-y-5 pb-24">
      {/* PAGE HEADER */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Top Lists")}</h2>
            <p className="text-xs text-muted-foreground">
              Live leaderboards of your top gifters and likers, ranked in real time, with podium and list designs for every vibe.
            </p>
          </div>
        </div>
        <div className="relative">
          <button
            type="button"
            disabled={busy}
            onClick={() => setShowNewMenu((v) => !v)}
            className={`inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2.5 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-60 ${boards.length <= 2 ? "lo-hint-pulse" : ""}`}
          >
            <Plus className="h-4 w-4" />
            New board
          </button>
          {showNewMenu && (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
              {BOARD_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => createBoard(t.id)}
                  className="flex w-full items-start gap-2.5 rounded-xl px-3 py-2 text-left hover:bg-secondary"
                >
                  <span className="text-lg leading-none">{t.icon}</span>
                  <span>
                    <span className="block text-xs font-extrabold text-foreground">{t.label}</span>
                    <span className="block text-[10px] text-muted-foreground">{t.description}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* BOARDS STRIP */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {boards.map((b) => {
          const bs = normalizeBoardSettings(b.settings);
          const bm = getBoardMeta(bs.type);
          const active = b.id === selected?.id;
          return (
            <div
              key={b.id}
              onClick={() => selectBoard(b.id)}
              className={`cursor-pointer overflow-hidden rounded-2xl border transition ${
                active ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"
              } ${b.enabled ? "" : "opacity-60"}`}
            >
              <div className="checkerboard-stage relative h-32 overflow-hidden">
                <div className="pointer-events-none absolute left-1/2 top-2 w-[440px] origin-top -translate-x-1/2 scale-[0.5]">
                  <TopBoard settings={{ ...bs, rotation: { ...bs.rotation, enabled: false } }} avatars={samples} compact />
                </div>
                {bs.rotation.enabled && (
                  <span className="absolute left-2 top-2 inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-2 py-0.5 text-[9px] font-bold text-cyan-300">
                    <Repeat className="h-2.5 w-2.5" /> {1 + bs.rotation.boards.length} boards
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between gap-2 bg-card px-3 py-2.5">
                <div className="min-w-0">
                  <div className="truncate text-xs font-extrabold text-foreground">{b.name}</div>
                  <div className="truncate text-[10px] text-muted-foreground">
                    {bm.icon} {bm.label} · {DESIGN_VARIANTS.find((v) => v.id === bs.variant)?.name}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Copy overlay link"
                    onClick={() => copyLink(b.id, b.name)}
                    className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                  >
                    {copiedId === b.id ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Link2 className="h-3.5 w-3.5" />}
                  </button>
                  <Toggle
                    checked={b.enabled}
                    onChange={(v) => run(async () => { await api("PATCH", { id: b.id, enabled: v }); })}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <button
          type="button"
          onClick={() => setShowNewMenu(true)}
          className="flex min-h-[180px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border text-xs font-bold text-muted-foreground hover:border-brand-cyan/50 hover:text-brand-cyan"
        >
          <Plus className="h-6 w-6" />
          Add a board
        </button>
      </div>

      {!selected || !draft || !s ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">
          Create your first board to start ranking your supporters.
        </div>
      ) : (
        <div key={selected.id} className="animate-fade-up grid grid-cols-1 gap-5 xl:grid-cols-[1fr_440px]">
          {/* SETTINGS */}
          <div className="space-y-4">
            {/* Board name + actions */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <input
                value={draft.name}
                maxLength={120}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="min-w-0 flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-lg font-black text-foreground outline-none hover:border-border focus:border-brand-cyan"
                aria-label="Board name"
              />
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => run(async () => {
                    const { board } = await api("POST", { duplicateId: selected.id });
                    if (board) setSelectedId(board.id);
                    onToast("Board duplicated");
                  })}
                  className="inline-flex items-center gap-1 rounded-xl border border-border px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                >
                  <CopyPlus className="h-3.5 w-3.5" /> Duplicate
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Delete "${selected.name}"? Its overlay link will stop working.`)) return;
                    run(async () => {
                      await api("DELETE", undefined, `?id=${selected.id}`);
                      setSelectedId(boards.find((b) => b.id !== selected.id)?.id ?? null);
                      onToast("Board deleted");
                    });
                  }}
                  className="inline-flex items-center gap-1 rounded-xl border border-red-500/30 bg-red-500/10 px-2.5 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>

            <Section title="Type" hint="Which ranking this board shows. With rotation on, this one shows first.">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {BOARD_TYPES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setS({ type: t.id, rotation: { ...s.rotation, boards: s.rotation.boards.filter((b) => b !== t.id) } })}
                    className={`flex items-start gap-2.5 rounded-xl border p-3 text-left transition ${
                      s.type === t.id ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan" : "border-border bg-secondary/30 hover:border-brand-cyan/40"
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

            <Section title="Design Variant" icon={<Sparkles className="h-4 w-4 text-brand-cyan" />} hint="A podium shows the top places side by side with framed photos; a list shows rows and suits a narrow column.">
              <div className="space-y-4">
                {DESIGN_GROUPS.map((g) => (
                  <div key={g}>
                    <div className="mb-1.5 flex items-center gap-2 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">
                      {g}
                      {g !== "Extra themes" && g !== "Flags" && g !== "PUBG Mobile" && (
                        <span className="rounded-full bg-brand-cyan/15 px-1.5 py-0.5 text-[9px] text-brand-cyan">{tx("OverlayLive")}</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
                      {DESIGN_VARIANTS.filter((v) => v.group === g).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setS({ variant: v.id })}
                    className={`overflow-hidden rounded-xl border text-left transition ${
                      s.variant === v.id ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"
                    }`}
                  >
                    <div className="relative h-24 overflow-hidden" style={{ background: v.preview }}>
                      {isOlTheme(v.id) ? (
                        <div className="flex h-full w-full items-center justify-center p-2">
                          {themeThumb(olTheme(v.id)!) ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img src={themeThumb(olTheme(v.id)!) as string} alt="" loading="lazy" className="max-h-full max-w-full object-contain drop-shadow-[0_4px_10px_rgba(0,0,0,.6)]" />
                          ) : (
                            <span className="text-center text-sm font-black text-white/85">{v.name}</span>
                          )}
                        </div>
                      ) : (
                      <div className="pointer-events-none absolute left-1/2 top-1 w-[440px] origin-top -translate-x-1/2 scale-[0.36]">
                        <TopBoard
                          settings={{ ...s, variant: v.id, layout: "vertical", rotation: { ...s.rotation, enabled: false }, display: { ...s.display, maxRows: 3 } }}
                          avatars={samples}
                          compact
                        />
                      </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between bg-card px-2 py-1.5">
                      <span className="truncate text-[11px] font-extrabold text-foreground">{v.name}</span>
                      {v.id === "spot-neon" ? (
                        <span className="popular-badge inline-flex items-center gap-0.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-400 px-1.5 py-0.5 text-[9px] font-black uppercase text-white">
                          <span className="popular-flame">{tx("🔥")}</span> Popular
                        </span>
                      ) : (
                        <span className="text-[9px] font-bold uppercase text-muted-foreground">{v.tag}</span>
                      )}
                    </div>
                  </button>
                ))}
                    </div>
                  </div>
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
                      onClick={() => setS({ color: c })}
                      className={`h-7 w-7 rounded-full ring-offset-2 ring-offset-card transition ${s.color === c ? "scale-110 ring-2 ring-brand-cyan" : "ring-1 ring-white/20"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                  <label className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-2 py-1">
                    <input type="color" value={s.color} onChange={(e) => setS({ color: e.target.value })} className="h-6 w-7 cursor-pointer border-0 bg-transparent" />
                    <span className="font-mono text-[11px] text-muted-foreground">{s.color}</span>
                  </label>
                </div>
              </Section>

              <Section title="Card Title (on stream)" icon={<Type className="h-4 w-4 text-brand-cyan" />} hint={`Shown above the ${meta.label} board.`}>
                <div className="flex gap-2">
                  <input
                    value={s.titles[s.type]}
                    maxLength={40}
                    onChange={(e) => setS({ titles: { ...s.titles, [s.type]: e.target.value } })}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold text-foreground outline-none focus:border-brand-cyan"
                  />
                  <button
                    type="button"
                    title="Reset title"
                    onClick={() => setS({ titles: { ...s.titles, [s.type]: meta.defaultTitle } })}
                    className="rounded-xl border border-border px-2.5 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </Section>

              <Section title="List Direction">
                <Segmented
                  value={s.direction}
                  onChange={(v) => setS({ direction: v })}
                  options={[
                    { id: "ltr", label: "Left to right", icon: <AlignLeft className="h-3.5 w-3.5" /> },
                    { id: "rtl", label: "Right to left", icon: <AlignRight className="h-3.5 w-3.5" /> },
                  ]}
                />
              </Section>

              <Section title="Layout">
                <Segmented
                  value={s.layout}
                  onChange={(v) => setS({ layout: v })}
                  options={[
                    { id: "vertical", label: "Vertical", icon: <LayoutList className="h-3.5 w-3.5" /> },
                    { id: "horizontal", label: "Horizontal", icon: <Columns3 className="h-3.5 w-3.5" /> },
                  ]}
                />
              </Section>

              <Section title="Font Family">
                <select
                  value={s.fontFamily}
                  onChange={(e) => setS({ fontFamily: e.target.value })}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground"
                >
                  {BOARD_FONTS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>
              </Section>

              <Section title="Name animation" hint="How supporter names move on the board.">
                <NameAnimationPicker
                  value={s.nameAnimation}
                  accent={s.color}
                  onChange={(v) => setS({ nameAnimation: v })}
                />
              </Section>
            </div>

            <Section title="Display" hint="What the board shows besides the ranks.">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {DISPLAY_OPTION_LABELS.map((opt) => (
                  <label key={opt.key} className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-border bg-secondary/25 px-3 py-2">
                    <span className="min-w-0">
                      <span className="block text-xs font-bold text-foreground">{opt.label}</span>
                      <span className="block truncate text-[10px] text-muted-foreground">{opt.hint}</span>
                    </span>
                    <Toggle checked={s.display[opt.key]} onChange={(v) => setS({ display: { ...s.display, [opt.key]: v } })} />
                  </label>
                ))}
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="text-xs">
                  <div className="mb-1 font-semibold text-muted-foreground">{tx("Places on the board")}</div>
                  <div className="grid grid-cols-8 gap-1">
                    {[3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => setS({ display: { ...s.display, maxRows: n } })}
                        className={`rounded-lg py-1.5 text-xs font-black ${s.display.maxRows === n ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}
                      >
                        {n}
                      </button>
                    ))}
                  </div>
                  <p className="mt-1 text-[10px] text-muted-foreground">{tx("Three to five names reads best on a phone.")}</p>
                </div>
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">{tx("Avatar frame")}</span>
                  <select
                    value={s.frameSlug}
                    disabled={!s.display.showFrame}
                    onChange={(e) => setS({ frameSlug: e.target.value })}
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-semibold disabled:opacity-50"
                  >
                    <option value="user">{tx("Each supporter&apos;s own frame")}</option>
                    {AVATAR_FRAMES.map((f) => (
                      <option key={f.slug} value={f.slug}>{f.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              {s.variant.startsWith("crown-") && (
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <label className="text-xs">
                    <span className="font-semibold text-muted-foreground">{tx("Animated nameplate (plate background)")}</span>
                    <select value={s.nameplate} onChange={(e) => setS({ nameplate: e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-semibold">
                      <option value="">{tx("None")}</option>
                      {NAMEPLATES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                    </select>
                  </label>
                  <div className="text-xs">
                    <div className="font-semibold text-muted-foreground">{tx("Crown for #1")}</div>
                    <div className="mt-1 flex max-h-28 flex-wrap gap-1 overflow-y-auto rounded-xl border border-border p-1.5">
                      <button type="button" onClick={() => setS({ crownStyle: "" })} className={`grid h-10 w-10 place-items-center rounded-lg text-lg ${!s.crownStyle ? "bg-brand-cyan/20 ring-1 ring-brand-cyan" : "bg-secondary/40"}`} title="Emoji crown">{tx("👑")}</button>
                      {CROWNS.map((c) => (
                        <button key={c.id} type="button" title={c.label} onClick={() => setS({ crownStyle: c.id })} className={`grid h-10 w-10 place-items-center rounded-lg ${s.crownStyle === c.id ? "bg-brand-cyan/20 ring-1 ring-brand-cyan" : "bg-secondary/40"}`}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={c.file} alt="" loading="lazy" className="max-h-8 max-w-8 object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              {s.variant.startsWith("crown-") && (
                <div className="mt-3">
                  <div className="mb-1 text-xs font-semibold text-muted-foreground">{tx("Score position (Crown List)")}</div>
                  <Segmented value={s.scorePosition} onChange={(v) => setS({ scorePosition: v })} options={SCORE_POSITIONS.map((p) => ({ id: p.id, label: p.label }))} />
                </div>
              )}
            </Section>

            <Section
              title="Rotation"
              icon={<Repeat className="h-4 w-4 text-brand-cyan" />}
              hint="Show two or three boards in turn on a single OBS / LIVE Studio source, with a switch animation between them. (Type above sets which shows first.)"
            >
              <label className="mb-3 flex cursor-pointer items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2.5">
                <span className="text-xs font-bold text-foreground">{tx("Rotate boards")}</span>
                <Toggle checked={s.rotation.enabled} onChange={(v) => setS({ rotation: { ...s.rotation, enabled: v } })} />
              </label>
              <div className={s.rotation.enabled ? "space-y-3" : "pointer-events-none space-y-3 opacity-50"}>
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-brand-cyan px-3 py-1 text-xs font-black text-slate-950">
                    1 · {meta.icon} {meta.label}
                  </span>
                  {BOARD_TYPES.filter((t) => t.id !== s.type).map((t) => {
                    const pos = s.rotation.boards.indexOf(t.id);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => {
                          let next = pos >= 0 ? s.rotation.boards.filter((x) => x !== t.id) : [...s.rotation.boards, t.id];
                          if (next.length > 2) next = next.slice(next.length - 2);
                          setS({ rotation: { ...s.rotation, boards: next } });
                        }}
                        className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                          pos >= 0 ? "bg-brand-cyan/20 text-brand-cyan ring-1 ring-brand-cyan" : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {pos >= 0 ? `${pos + 2} · ` : "+ "}
                        {t.icon} {t.label}
                      </button>
                    );
                  })}
                </div>

                <label className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground">
                    <span>{tx("Switch every")}</span>
                    <span className="text-foreground">{s.rotation.intervalSec}s</span>
                  </span>
                  <input
                    type="range"
                    min={4}
                    max={60}
                    value={s.rotation.intervalSec}
                    onChange={(e) => setS({ rotation: { ...s.rotation, intervalSec: Number(e.target.value) } })}
                    className="mt-1 w-full accent-cyan-400"
                  />
                </label>

                <div>
                  <div className="mb-1.5 text-xs font-semibold text-muted-foreground">{tx("Switch animation")}</div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {SWITCH_ANIMATIONS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setS({ rotation: { ...s.rotation, animation: a.id } })}
                        className={`flex flex-col items-center gap-1.5 rounded-xl border p-2 transition ${
                          s.rotation.animation === a.id ? "border-brand-cyan bg-brand-cyan/10" : "border-border bg-secondary/25 hover:border-brand-cyan/40"
                        }`}
                      >
                        <SwitchMini animation={a.id} types={[s.type, ...s.rotation.boards]} color={s.color} />
                        <span className="text-[11px] font-bold text-foreground">{a.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            <Section title="Reset" icon={<Eraser className="h-4 w-4 text-brand-cyan" />} hint="Keep a running ranking so loyal supporters stay on top, or start every LIVE with a fresh race.">
              <Segmented
                value={s.resetMode}
                onChange={(v) => setS({ resetMode: v })}
                options={[
                  { id: "never", label: "Keep running" },
                  { id: "on-live", label: "Reset when I go LIVE" },
                ]}
              />
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border bg-secondary/20 px-3 py-2.5">
                <span className="text-[11px] text-muted-foreground">
                  {selected.lastResetAt
                    ? `Last reset ${new Date(selected.lastResetAt).toLocaleString()}`
                    : "This board has never been reset."}
                </span>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    if (!window.confirm(`Reset the ${meta.label} scores to zero now?`)) return;
                    run(async () => {
                      await api("PATCH", { id: selected.id, action: "reset" });
                      setPreviewData("live");
                      onToast(`${meta.label} reset — a fresh race starts now`);
                    });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                >
                  <Eraser className="h-3.5 w-3.5" /> Reset scores now
                </button>
              </div>
            </Section>
          </div>

          {/* PREVIEW + LINK */}
          <div className="space-y-3 xl:sticky xl:top-20 xl:self-start">
            <div className="checkerboard-stage flex min-h-[440px] flex-col rounded-2xl border border-border p-4">
              <div className="mb-3 flex items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-cyan-300">
                  <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
                  Preview
                </span>
                <div className="flex rounded-lg bg-black/40 p-0.5 text-[10px] font-bold">
                  {(["sample", "live"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPreviewData(m)}
                      className={`rounded-md px-2 py-1 ${previewData === m ? "bg-brand-cyan text-slate-950" : "text-white/70"}`}
                    >
                      {m === "sample" ? "Sample supporters" : "Live data"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="my-auto">
                <TopBoard settings={s} avatars={previewAvatars} />
              </div>
              {dirty && (
                <p className="mt-3 text-center text-[10px] font-bold text-amber-300">
                  Preview shows unsaved changes — press Save to update your stream.
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-3">
              <div className="mb-2 text-[11px] font-bold text-muted-foreground">{tx("Test with an event")}</div>
              <div className="grid grid-cols-4 gap-1.5">
                <button type="button" onClick={() => { setPreviewData("live"); playBroadcastSound("gift"); onFireEvent({ eventType: "gift", giftId: "tiktok" }); }} className="rounded-lg bg-amber-500/15 px-2 py-1.5 text-[11px] font-bold text-amber-300 hover:bg-amber-500/25">{tx("🪙 Gift")}</button>
                <button type="button" onClick={() => { setPreviewData("live"); playBroadcastSound("lion"); onFireEvent({ eventType: "gift", giftId: "lion" }); }} className="rounded-lg bg-orange-500/15 px-2 py-1.5 text-[11px] font-bold text-orange-300 hover:bg-orange-500/25">{tx("🦁 Lion")}</button>
                <button type="button" onClick={() => { setPreviewData("live"); onFireEvent({ eventType: "like", likes: 1500 }); }} className="rounded-lg bg-rose-500/15 px-2 py-1.5 text-[11px] font-bold text-rose-300 hover:bg-rose-500/25">{tx("❤️ Likes")}</button>
                <button type="button" onClick={() => { setPreviewData("live"); onFireEvent({ eventType: "share" }); }} className="rounded-lg bg-emerald-500/15 px-2 py-1.5 text-[11px] font-bold text-emerald-300 hover:bg-emerald-500/25">{tx("🔁 Share")}</button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-3.5">
              <div className="mb-2 flex items-center gap-1.5 text-xs font-extrabold text-foreground">
                <Link2 className="h-3.5 w-3.5 text-brand-cyan" /> Overlay link
              </div>
              <div className="flex items-center gap-2">
                <code className="min-w-0 flex-1 truncate rounded-lg bg-secondary/60 px-2.5 py-2 font-mono text-[11px] text-muted-foreground">
                  /overlay/top/{selected.id}
                </code>
                <button
                  type="button"
                  onClick={() => copyLink(selected.id, draft.name)}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan px-3 py-2 text-[11px] font-black text-slate-950"
                >
                  {copiedId === selected.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  Copy
                </button>
                <a
                  href={`/overlay/top/${selected.id}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground"
                  aria-label="Open overlay"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
                OBS / Streamlabs: Sources → + → Browser. TikTok LIVE Studio: Add source → Web. Suggested size{" "}
                {s.layout === "horizontal" ? "800 × 400" : "500 × 700"}. The link never changes — every saved edit shows up on stream automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SAVE BAR */}
      {selected && draft && (
        <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
            <span className="truncate text-xs font-semibold text-muted-foreground">
              {dirty ? `Unsaved changes to “${draft.name}”` : justSaved ? "Saved — your overlay updated" : "All changes saved"}
            </span>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                disabled={!dirty || saving}
                onClick={() => setDraft(JSON.parse(savedJson) as Draft)}
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
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> {tx(": justSaved ?")} <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving…" : justSaved ? "Saved" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
