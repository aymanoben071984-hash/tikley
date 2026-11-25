"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import { pageHidden, pollMs } from "@/lib/poll";
import { FitScale, QuranView, useQuranPlayback } from "@/components/QuranView";
import { Section, Segmented, Toggle } from "@/components/TopListsStudio";
import {
  QURAN_DEFAULTS,
  QURAN_DESIGNS,
  QURAN_FONTS,
  QURAN_STATE_DEFAULT,
  RECITERS,
  arabicDigits,
  loadSurah,
  loadSurahIndex,
  normalizeQuranConfig,
  type QuranConfig,
  type QuranPayload,
  type QuranState,
  type SurahData,
  type SurahIndexItem,
} from "@/lib/quran";
import { BookOpen, Check, ChevronLeft, ChevronRight, Copy, ExternalLink, Headphones, Loader2, Mic, Pause, Play, RotateCcw, Save, Search, SkipBack, Volume2, VolumeX } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

const LINK = "/overlay/quran";

interface QuranStudioProps {
  onCopyUrl: (path: string, label: string) => void;
  onToast: (msg: string) => void;
}

function Range({ label, value, min, max, step, fmt, onChange }: { label: string; value: number; min: number; max: number; step: number; fmt?: (v: number) => string; onChange: (v: number) => void }) {
  return (
    <label className="block text-xs">
      <span className="flex justify-between font-semibold text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{fmt ? fmt(value) : value}</span>
      </span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="mt-1 w-full accent-cyan-400" />
    </label>
  );
}

export function QuranStudio({ onCopyUrl, onToast }: QuranStudioProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const [server, setServer] = useState<QuranPayload | null>(null);
  const [draft, setDraft] = useState<QuranConfig>(QURAN_DEFAULTS);
  const [index, setIndex] = useState<SurahIndexItem[]>([]);
  const [surahData, setSurahData] = useState<SurahData | null>(null);
  const [query, setQuery] = useState("");
  const [listen, setListen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  const loadedOnce = useRef(false);

  const dirty = !!server && JSON.stringify(draft) !== JSON.stringify(server.config);

  const refresh = useCallback(async () => {
    const res = await fetch("/api/quran", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as QuranPayload;
    setServer(json);
    if (!loadedOnce.current) {
      loadedOnce.current = true;
      setDraft(json.config);
    }
  }, []);

  useEffect(() => {
    refresh();
    loadSurahIndex().then(setIndex).catch(() => {});
    const t = setInterval(() => !pageHidden() && refresh(), pollMs(1500));
    return () => clearInterval(t);
  }, [refresh]);

  useEffect(() => {
    loadSurah(draft.surah).then(setSurahData).catch(() => {});
  }, [draft.surah]);

  const set = (p: Partial<QuranConfig>) => setDraft((d) => normalizeQuranConfig({ ...d, ...p }));

  const command = useCallback(
    async (cmd: string, ayah?: number) => {
      const res = await fetch("/api/quran", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ command: cmd, ayah }) });
      if (res.ok) {
        setServer((await res.json()) as QuranPayload);
        if (typeof BroadcastChannel !== "undefined") {
          const ch = new BroadcastChannel("overlaylive-sync");
          ch.postMessage({ type: "quran" });
          ch.close();
        }
      }
    },
    [],
  );

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/quran", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ config: draft }) });
      if (res.ok) {
        const json = (await res.json()) as QuranPayload;
        setServer(json);
        setDraft(json.config);
        onToast("Quran settings saved — your overlay updated");
      }
    } finally {
      setSaving(false);
    }
  };

  // keyboard: Space = play/pause, → / PageDown = next, ← / PageUp = previous
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;
      if (e.code === "Space") {
        e.preventDefault();
        command("toggle");
      } else if (e.key === "ArrowRight" || e.key === "PageDown") command("next");
      else if (e.key === "ArrowLeft" || e.key === "PageUp") command("prev");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [command]);

  const state: QuranState = server?.state ?? QURAN_STATE_DEFAULT;
  const preview = useQuranPlayback({ ...state, config: dirty ? draft : server?.config ?? draft }, { muted: !listen });
  const liveAyah = state.liveAyah ?? state.ayah;
  const surahs = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? index.filter((s) => s.en.toLowerCase().includes(q) || s.name.includes(query.trim()) || String(s.n) === q) : index;
  }, [index, query]);
  const maxAyah = surahData?.ayahs.length ?? 286;
  const currentSurah = index.find((s) => s.n === draft.surah);

  return (
    <div className="space-y-5 pb-24">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-gradient-to-r from-emerald-950/50 via-card to-amber-950/30 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Studio")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("Quran Recitation")}</h2>
            <p className="max-w-2xl text-xs text-muted-foreground">{tx("Show the surah you&apos;re reciting on stream — with a reciter&apos;s audio or your own voice, ayah-by-ayah tracking included.")}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => { onCopyUrl(LINK, "Quran Recitation"); setCopied(true); setTimeout(() => setCopied(false), 1800); }} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110">
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy overlay link
          </button>
          <a href={LINK} target="_blank" rel="noreferrer" aria-label="Open overlay" className="rounded-xl border border-border bg-secondary/50 p-2 text-foreground hover:bg-secondary"><ExternalLink className="h-4 w-4" /></a>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_1fr]">
        {/* Preview + controls */}
        <div className="space-y-3">
          <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-border" style={{ background: "url(/backgrounds/ramadan-lanterns.jpg) center 35%/cover" }}>
            <div className="absolute inset-0 bg-black/45" />
            <FitScale designW={960} maxScale={1}>
              <QuranView config={dirty ? draft : server?.config ?? draft} surah={preview.surah} ayah={preview.ayah} timing={preview.timing} line={preview.line} />
            </FitScale>
            <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur">
              <span className={`h-2 w-2 rounded-full ${state.playing ? "animate-pulse bg-emerald-400" : "bg-white/40"}`} />
              {state.playing ? "Reciting on stream" : "Paused"} · ayah {liveAyah}/{server?.config.toAyah ?? draft.toAyah}
              {state.ended && " · finished"}
            </div>
            <button type="button" onClick={() => setListen((v) => !v)} className="absolute right-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[11px] font-bold text-white backdrop-blur hover:bg-black/70">
              {listen ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />} {listen ? "Listening here" : "Listen here"}
            </button>
          </div>

          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button type="button" onClick={() => command("restart")} title="Back to first ayah" className="rounded-xl border border-border p-2.5 text-muted-foreground hover:bg-secondary hover:text-foreground"><SkipBack className="h-4 w-4" /></button>
              <button type="button" onClick={() => command("prev")} title="Previous ayah (←)" className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground hover:bg-secondary"><ChevronLeft className="h-4 w-4" /> {tx("Previous")}</button>
              <button type="button" onClick={() => command("toggle")} title="Play / pause (Space)" className={`inline-flex min-w-[140px] items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-black shadow ${state.playing ? "bg-amber-400 text-slate-950" : "bg-emerald-500 text-slate-950"} hover:brightness-110`}>
                {state.playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />} {state.playing ? "Pause" : state.ended ? "Recite again" : "Start reciting"}
              </button>
              <button type="button" onClick={() => command("next")} title="Next ayah (→)" className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2.5 text-xs font-bold text-foreground hover:bg-secondary">{tx("Next")} <ChevronRight className="h-4 w-4" /></button>
            </div>
            <p className="mt-2 text-center text-[10px] text-muted-foreground">
              Keyboard: <kbd className="rounded bg-secondary px-1">{tx("Space")}</kbd> {tx("play/pause ·")} <kbd className="rounded bg-secondary px-1">{tx("→")}</kbd> {tx("next ·")} <kbd className="rounded bg-secondary px-1">{tx("←")}</kbd> previous
              {!draft.soundEnabled && !draft.autoAdvance && " — reciting yourself: press Next as you finish each ayah."}
            </p>
            <div className="mt-3 max-h-40 overflow-y-auto rounded-xl border border-border bg-secondary/20 p-2">
              <div className="flex flex-wrap gap-1" dir="rtl">
                {Array.from({ length: (server?.config.toAyah ?? draft.toAyah) - (server?.config.fromAyah ?? draft.fromAyah) + 1 }, (_, i) => (server?.config.fromAyah ?? draft.fromAyah) + i).map((n) => (
                  <button key={n} type="button" onClick={() => command("goto", n)} title={`Go to ayah ${n}`} className={`min-w-9 rounded-lg px-2 py-1 font-bold transition ${n === liveAyah ? "bg-emerald-500 text-slate-950" : "bg-card text-muted-foreground hover:text-foreground"}`} style={{ fontFamily: "'Amiri Quran', serif", fontSize: 14 }}>
                    {arabicDigits(n)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="space-y-4">
          <Section title="Passage" hint="Which surah and ayahs to recite.">
            <div className="relative mb-2">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search surah (Arabic, English or number)…" className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-cyan" />
            </div>
            <div className="max-h-44 overflow-y-auto rounded-xl border border-border">
              {surahs.map((s) => (
                <button key={s.n} type="button" onClick={() => set({ surah: s.n, fromAyah: 1, toAyah: s.count })} className={`flex w-full items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5 text-left text-xs last:border-b-0 ${s.n === draft.surah ? "bg-emerald-500/15" : "hover:bg-secondary/50"}`}>
                  <span className="flex items-center gap-2">
                    <span className="w-7 text-center font-mono text-[10px] text-muted-foreground">{s.n}</span>
                    <span className="font-semibold text-foreground">{s.en}</span>
                    <span className="text-[10px] text-muted-foreground">{s.count} ayahs</span>
                  </span>
                  <span dir="rtl" style={{ fontFamily: "'Amiri Quran', serif" }} className="text-sm text-foreground">{s.name}</span>
                </button>
              ))}
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
              <label>
                <span className="font-semibold text-muted-foreground">{tx("From ayah")}</span>
                <input type="number" min={1} max={maxAyah} value={draft.fromAyah} onChange={(e) => set({ fromAyah: Math.min(maxAyah, Math.max(1, Number(e.target.value) || 1)) })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground" />
              </label>
              <label>
                <span className="font-semibold text-muted-foreground">{tx("To ayah")}</span>
                <input type="number" min={draft.fromAyah} max={maxAyah} value={draft.toAyah} onChange={(e) => set({ toAyah: Math.min(maxAyah, Math.max(draft.fromAyah, Number(e.target.value) || draft.fromAyah)) })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-bold text-foreground" />
              </label>
            </div>
            {currentSurah && <p className="mt-1 text-[10px] text-muted-foreground">{currentSurah.en} has {currentSurah.count} ayahs.</p>}
          </Section>

          <Section title="Recitation">
            <Segmented
              value={draft.soundEnabled ? "reciter" : "voice"}
              onChange={(v) => set({ soundEnabled: v === "reciter" })}
              options={[
                { id: "reciter", label: "Reciter audio", icon: <Headphones className="h-3.5 w-3.5" /> },
                { id: "voice", label: "My own voice", icon: <Mic className="h-3.5 w-3.5" /> },
              ]}
            />
            {draft.soundEnabled ? (
              <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {RECITERS.map((r) => (
                  <button key={r.id} type="button" onClick={() => set({ reciterId: r.id })} className={`flex items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-xs ${draft.reciterId === r.id ? "border-emerald-400 bg-emerald-500/10 text-foreground" : "border-border bg-secondary/25 text-muted-foreground hover:text-foreground"}`}>
                    <span className="font-semibold">{r.nameEn}</span>
                    <span dir="rtl" className="text-[11px]">{r.nameAr}</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[11px] text-muted-foreground">{tx("No audio plays. With auto-advance on, each ayah is timed from its length; turn it off to move ayah by ayah yourself with Next.")}</p>
            )}
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Range label="Speed" value={draft.speed} min={0.5} max={2} step={0.05} fmt={(v) => `${v.toFixed(2)}×`} onChange={(v) => set({ speed: v })} />
              <Range label="Volume" value={Math.round(draft.volume * 100)} min={0} max={100} step={1} fmt={(v) => `${v}%`} onChange={(v) => set({ volume: v / 100 })} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">{tx("Auto-advance")} <Toggle checked={draft.autoAdvance} onChange={(v) => set({ autoAdvance: v })} /></label>
              <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">{tx("Repeat ayah")} <Toggle checked={draft.loop} onChange={(v) => set({ loop: v })} /></label>
            </div>
          </Section>

          <Section title="Design">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {QURAN_DESIGNS.map((d) => (
                <button key={d.id} type="button" onClick={() => set({ design: d.id })} className={`overflow-hidden rounded-xl border text-left ${draft.design === d.id ? "border-emerald-400 ring-1 ring-emerald-400" : "border-border hover:border-emerald-400/40"}`}>
                  <div className="pointer-events-none flex h-20 items-center justify-center overflow-hidden px-1.5" style={{ background: d.id === "minimal" ? "url(/backgrounds/space-nebula.jpg) center/cover" : "#0b0f17" }}>
                    <QuranView config={{ ...draft, design: d.id, ayahsVisible: 1, lineHeight: 2 }} surah={surahData} ayah={draft.fromAyah} compact />
                  </div>
                  <div className="flex items-center justify-between bg-card px-2 py-1.5">
                    <span className="text-[11px] font-extrabold text-foreground">{d.nameEn}</span>
                    <span dir="rtl" className="text-[10px] text-muted-foreground">{d.nameAr}</span>
                  </div>
                </button>
              ))}
            </div>
          </Section>

          <Section title="Text & highlight">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-xs">
                <span className="font-semibold text-muted-foreground">{tx("Font")}</span>
                <select value={draft.fontFamily || QURAN_FONTS[0]} onChange={(e) => set({ fontFamily: e.target.value === QURAN_FONTS[0] ? "" : e.target.value })} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
                  {QURAN_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
                </select>
              </label>
              <Range label="Lines visible" value={draft.ayahsVisible} min={1} max={6} step={1} onChange={(v) => set({ ayahsVisible: v })} />
              <Range label="Text size" value={draft.fontSize} min={20} max={80} step={1} fmt={(v) => `${v}px`} onChange={(v) => set({ fontSize: v })} />
              <Range label="Line spacing" value={draft.lineHeight} min={1.6} max={3.6} step={0.1} fmt={(v) => v.toFixed(1)} onChange={(v) => set({ lineHeight: v })} />
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
              <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">{tx("Highlight current ayah")} <Toggle checked={draft.highlight} onChange={(v) => set({ highlight: v })} /></label>
              <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">{tx("Show surrounding ayahs")} <Toggle checked={draft.continuous} onChange={(v) => set({ continuous: v })} /></label>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-2 text-xs sm:grid-cols-3">
              {([
                ["highlightColor", "Highlight"],
                ["textColor", "Text"],
                ["activeTextColor", "Current ayah"],
              ] as const).map(([k, label]) => (
                <div key={k}>
                  <div className="mb-1 font-semibold text-muted-foreground">{label}</div>
                  <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2 py-1">
                    <input type="color" value={draft[k] || "#ffffff"} onChange={(e) => set({ [k]: e.target.value } as Partial<QuranConfig>)} className="h-6 w-7 cursor-pointer border-0 bg-transparent" />
                    <span className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground">{draft[k] || "Design"}</span>
                    {draft[k] && k !== "highlightColor" && <button type="button" onClick={() => set({ [k]: "" } as Partial<QuranConfig>)} className="text-[10px] font-bold text-muted-foreground hover:text-foreground">{tx("Reset")}</button>}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <p className="text-[11px] leading-relaxed text-muted-foreground">
            Add <code className="text-brand-cyan">{LINK}</code> {tx("as a full-screen source — OBS: Browser 1920 × 1080 with")} <strong className="text-foreground">{tx("Control audio via OBS")}</strong> on so the recitation is heard; TikTok LIVE Studio: Web 1080 × 1920. Quran text: Tanzil Uthmani. Audio: EveryAyah.com.
          </p>
        </div>
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(680px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? "Unsaved settings — the preview shows them, your stream doesn't yet" : "All settings saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" title="Restore defaults" onClick={() => setDraft(QURAN_DEFAULTS)} className="rounded-xl border border-border px-2.5 py-2 text-muted-foreground hover:bg-secondary hover:text-foreground"><RotateCcw className="h-3.5 w-3.5" /></button>
            <button type="button" disabled={!dirty || saving} onClick={() => server && setDraft(server.config)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">{tx("Discard")}</button>
            <button type="button" disabled={!dirty || saving} onClick={save} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
