"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { WidgetConfig } from "@/db/schema";
import { NameAnimationPicker } from "@/components/NameAnimationPicker";
import { AutoScale } from "@/components/RefBoard";
import { NoteView, NotesGroup } from "@/components/StreamNote";
import { notifyOverlayChannel } from "@/components/SoundEngine";
import { Section, Segmented } from "@/components/TopListsStudio";
import {
  CUTE_DESIGNS,
  NOTE_DEFAULTS,
  NOTE_DESIGN_LABELS,
  NOTE_ENTERS,
  NOTE_FONTS,
  NOTE_ICONS,
  NOTE_LOOPS,
  SHAPE_DESIGNS,
  TEXT_DESIGNS,
  newNoteId,
  normalizeNotesConfig,
  recolorForDesign,
  type NoteDesign,
  type NotesConfig,
  type StreamNote,
} from "@/lib/streamNotes";
import { Check, Copy, CopyPlus, ExternalLink, Loader2, Play, Plus, Save, StickyNote, Trash2 } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";

interface StreamNotesStudioProps {
  widget?: WidgetConfig;
  onSave: (customSettings: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const ALL_LINK = "/overlay/notes";
const noteLink = (id: string) => `/overlay/notes?note=${encodeURIComponent(id)}`;

export function StreamNotesStudio({ widget, onSave, onCopyUrl }: StreamNotesStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const savedRaw = (widget?.customSettings as Record<string, unknown> | undefined)?.notesConfig;
  const saved = useMemo(() => normalizeNotesConfig(savedRaw), [savedRaw]);
  const savedJson = JSON.stringify(saved);
  const [draft, setDraft] = useState<NotesConfig>(saved);
  const [selectedId, setSelectedId] = useState<string>(saved.notes[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [replay, setReplay] = useState(0);
  const [previewAll, setPreviewAll] = useState(false);
  const dirty = JSON.stringify(draft) !== savedJson;

  useEffect(() => {
    if (!dirty) setDraft(JSON.parse(savedJson));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedJson]);

  const note = draft.notes.find((n) => n.id === selectedId) ?? draft.notes[0];
  const setNote = (p: Partial<StreamNote>) => setDraft((d) => ({ ...d, notes: d.notes.map((n) => (n.id === note?.id ? { ...n, ...p } : n)) }));

  const add = () => {
    const n: StreamNote = { id: newNoteId(), ...NOTE_DEFAULTS, text: "New note ✨" };
    setDraft((d) => ({ ...d, notes: [...d.notes, n] }));
    setSelectedId(n.id);
  };
  const duplicate = (src: StreamNote) => {
    const n = { ...src, id: newNoteId() };
    setDraft((d) => ({ ...d, notes: [...d.notes, n] }));
    setSelectedId(n.id);
  };
  const remove = (id: string) => {
    setDraft((d) => {
      const notes = d.notes.filter((n) => n.id !== id);
      if (selectedId === id) setSelectedId(notes[0]?.id ?? "");
      return { ...d, notes };
    });
  };
  const copy = (path: string, label: string, key: string) => {
    onCopyUrl(path, label);
    setCopied(key);
    setTimeout(() => setCopied(null), 1800);
  };
  const save = async () => {
    setSaving(true);
    try {
      await onSave({ notesConfig: draft });
      notifyOverlayChannel({ type: "widget-update", widgetKey: "notes" });
    } finally {
      setSaving(false);
    }
  };

  const designGroup = (title: string, list: NoteDesign[]) => (
    <div>
      <div className="mb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{title}</div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {list.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => note && setNote({ design: d, ...recolorForDesign(note, d) })}
            className={`overflow-hidden rounded-xl border text-left transition ${note?.design === d ? "border-brand-cyan ring-1 ring-brand-cyan" : "border-border hover:border-brand-cyan/40"}`}
          >
            <div className="pointer-events-none flex h-20 items-center justify-center overflow-hidden px-2" style={{ background: "linear-gradient(160deg,#1e293b,#0b1220)" }}>
              {note && (
                <AutoScale maxScale={0.5}>
                  <div className="p-3">
                    <NoteView note={{ ...note, design: d, ...recolorForDesign(note, d), text: note.text.length > 18 ? `${note.text.slice(0, 16)}…` : note.text, size: 100 }} still />
                  </div>
                </AutoScale>
              )}
            </div>
            <div className="bg-card px-2 py-1.5 text-[11px] font-extrabold text-foreground">{NOTE_DESIGN_LABELS[d]}</div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-amber-950/40 via-card to-pink-950/30 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/30">
            <StickyNote className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Overlays")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Stream Notes")}</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">{tx("Pin your own notes on the stream — text only, a shape or a cute one, with motion. Each note can be its own source.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={add} className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary">
            <Plus className="h-3.5 w-3.5" /> New note
          </button>
          <button type="button" onClick={() => copy(ALL_LINK, "All notes", "all")} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110">
            {copied === "all" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy “all notes” link
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[340px_1fr]">
        {/* Notes list */}
        <div className="space-y-3">
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="mb-2 px-1 text-sm font-extrabold text-foreground">Your notes ({draft.notes.length})</div>
            <div className="space-y-1.5">
              {draft.notes.map((n) => (
                <div key={n.id} onClick={() => setSelectedId(n.id)} className={`cursor-pointer rounded-xl border p-2 transition ${n.id === note?.id ? "border-brand-cyan bg-brand-cyan/10" : "border-border bg-secondary/20 hover:bg-secondary/40"}`}>
                  <div className="pointer-events-none flex h-14 items-center overflow-hidden rounded-lg px-2" style={{ background: "linear-gradient(160deg,#1e293b,#0b1220)" }}>
                    <AutoScale maxScale={0.45}>
                      <div className="p-3">
                        <NoteView note={n} still />
                      </div>
                    </AutoScale>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[11px] font-bold text-foreground">{NOTE_DESIGN_LABELS[n.design]}</span>
                    <span className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button type="button" title={tx("Copy this note's own link")} onClick={() => copy(noteLink(n.id), "Note", n.id)} className="rounded-md bg-brand-cyan/20 px-1.5 py-1 text-[10px] font-bold text-brand-cyan hover:bg-brand-cyan/30">
                        {copied === n.id ? "Copied" : "Link"}
                      </button>
                      <a href={noteLink(n.id)} target="_blank" rel="noreferrer" aria-label={tx("Open note")} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><ExternalLink className="h-3 w-3" /></a>
                      <button type="button" title={tx("Duplicate")} onClick={() => duplicate(n)} className="rounded-md p-1 text-muted-foreground hover:text-foreground"><CopyPlus className="h-3 w-3" /></button>
                      <button type="button" title={tx("Delete")} onClick={() => remove(n.id)} className="rounded-md p-1 text-muted-foreground hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Section title="“All notes” source" hint="One source that shows every note — stacked, or one at a time.">
            <Segmented value={draft.display.mode} onChange={(v) => setDraft((d) => ({ ...d, display: { ...d.display, mode: v } }))} options={[{ id: "stack", label: "Stack" }, { id: "rotate", label: "Rotate" }]} />
            {draft.display.mode === "rotate" && (
              <div className="mt-3 space-y-2">
                <label className="block text-xs">
                  <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Change every")}</span><span className="text-foreground">{draft.display.interval}s</span></span>
                  <input type="range" min={1} max={30} value={draft.display.interval} onChange={(e) => setDraft((d) => ({ ...d, display: { ...d.display, interval: Number(e.target.value) } }))} className="mt-1 w-full accent-cyan-400" />
                </label>
                <select value={draft.display.effect} onChange={(e) => setDraft((d) => ({ ...d, display: { ...d.display, effect: e.target.value as NotesConfig["display"]["effect"] } }))} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold capitalize text-foreground">
                  {NOTE_ENTERS.filter((x) => x !== "none").map((x) => <option key={x} value={x}>Switch: {x}</option>)}
                </select>
              </div>
            )}
          </Section>
        </div>

        {/* Editor */}
        {note ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-foreground">{tx("Preview")}</span>
                <div className="flex items-center gap-2">
                  <Segmented value={previewAll ? "all" : "one"} onChange={(v) => setPreviewAll(v === "all")} options={[{ id: "one", label: "This note" }, { id: "all", label: "All notes" }]} />
                  <button type="button" onClick={() => setReplay((r) => r + 1)} className="inline-flex items-center gap-1 rounded-xl bg-emerald-500 px-3 py-1.5 text-xs font-black text-slate-950 hover:brightness-110">
                    <Play className="h-3.5 w-3.5" /> Replay
                  </button>
                </div>
              </div>
              <div className="relative flex min-h-[220px] items-center justify-center overflow-hidden rounded-xl p-8" style={{ background: "url(/backgrounds/cozy-bedroom.jpg) center/cover" }}>
                <div className="absolute inset-0 bg-black/35" />
                <div key={`${replay}-${previewAll}`} className="relative">
                  {previewAll ? <NotesGroup notes={draft.notes} display={draft.display} /> : <NoteView note={note} />}
                </div>
              </div>
            </div>

            <Section title="Text">
              <input value={note.text} maxLength={140} dir="auto" onChange={(e) => setNote({ text: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm font-bold text-foreground outline-none focus:border-brand-cyan" />
              <div className="mt-2 flex flex-wrap gap-1.5">
                {NOTE_ICONS.map((ic) => (
                  <button key={ic || "none"} type="button" onClick={() => setNote({ icon: ic })} className={`grid h-8 min-w-8 place-items-center rounded-lg px-1.5 text-base ${note.icon === ic ? "bg-brand-cyan/20 ring-1 ring-brand-cyan" : "bg-secondary/50 hover:bg-secondary"}`}>
                    {ic || <span className="text-[10px] font-bold text-muted-foreground">{tx("None")}</span>}
                  </button>
                ))}
              </div>
            </Section>

            <Section title="Design">
              <div className="space-y-4">
                {designGroup("Text only", TEXT_DESIGNS)}
                {designGroup("Shape", SHAPE_DESIGNS)}
                {designGroup("Cute", CUTE_DESIGNS)}
              </div>
            </Section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Section title="Colours & font">
                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between"><span className="font-semibold text-muted-foreground">{tx("Accent")}</span><input type="color" value={note.accentColor} onChange={(e) => setNote({ accentColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" /></label>
                  <label className="flex items-center justify-between"><span className="font-semibold text-muted-foreground">{tx("Text")}</span><input type="color" value={note.textColor} onChange={(e) => setNote({ textColor: e.target.value })} className="h-7 w-10 cursor-pointer rounded border-0 bg-transparent" /></label>
                  <select value={note.fontFamily} onChange={(e) => setNote({ fontFamily: e.target.value })} className="w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                    {NOTE_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                  <label className="block">
                    <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Size")}</span><span className="text-foreground">{note.size}%</span></span>
                    <input type="range" min={50} max={200} step={5} value={note.size} onChange={(e) => setNote({ size: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                  </label>
                </div>
              </Section>
              <Section title="Motion">
                <div className="space-y-3 text-xs">
                  <div>
                    <div className="mb-1 font-semibold text-muted-foreground">{tx("Entrance")}</div>
                    <div className="flex flex-wrap gap-1">
                      {NOTE_ENTERS.map((x) => (
                        <button key={x} type="button" onClick={() => { setNote({ enter: x }); setReplay((r) => r + 1); }} className={`rounded-lg px-2 py-1 text-[11px] font-bold capitalize ${note.enter === x ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>{x}</button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1 font-semibold text-muted-foreground">{tx("Loop")}</div>
                    <div className="flex flex-wrap gap-1">
                      {NOTE_LOOPS.map((x) => (
                        <button key={x} type="button" onClick={() => setNote({ loop: x })} className={`rounded-lg px-2 py-1 text-[11px] font-bold capitalize ${note.loop === x ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>{x}</button>
                      ))}
                    </div>
                  </div>
                  <label className={`block ${note.enter === "none" ? "opacity-50" : ""}`}>
                    <span className="flex justify-between font-semibold text-muted-foreground"><span>{tx("Replay entrance every")}</span><span className="text-foreground">{note.replayEvery ? `${note.replayEvery}s` : "Never"}</span></span>
                    <input type="range" min={0} max={60} value={note.replayEvery} disabled={note.enter === "none"} onChange={(e) => setNote({ replayEvery: Number(e.target.value) })} className="mt-1 w-full accent-cyan-400" />
                  </label>
                </div>
              </Section>
            </div>

            <Section title="Text animation">
              <NameAnimationPicker value={note.textAnim || "none"} accent={note.accentColor} sampleName={note.text.slice(0, 14) || "Note"} onChange={(v) => setNote({ textAnim: v === "none" ? "" : v })} />
            </Section>

            <p className="text-[11px] text-muted-foreground">
              Each note’s <strong className="text-foreground">{tx("Link")}</strong> {tx("is its own browser source (")}<code className="text-brand-cyan">{tx("/overlay/notes?note=…")}</code>) so you can place notes anywhere. The “all notes” link shows them together. OBS: Browser source; TikTok LIVE Studio: Web source.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">{tx("Add a note to get started.")}</div>
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? "Unsaved changes to Stream Notes" : "All changes saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
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
