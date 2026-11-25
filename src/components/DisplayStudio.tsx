"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type { TopBoardRow, WidgetConfig } from "@/db/schema";
import { Toggle } from "@/components/TopListsStudio";
import { FREE_GAMES_CATALOG } from "@/lib/catalog";
import { normalizeBoardSettings, getBoardMeta } from "@/lib/topBoard";
import { normalizeNotesConfig, NOTE_DESIGN_LABELS } from "@/lib/streamNotes";
import {
  ANCHORS,
  ANCHOR_LABEL,
  CANVAS,
  DISPLAY_DEFAULT,
  PLACEMENT_DEFAULT,
  TIKTOK_SAFE,
  normalizeDisplay,
  withFormat,
  type DefaultFormat,
  type DisplayFormat,
  type FormatPlacement,
  type OverlayDisplay,
} from "@/lib/overlayDisplay";
import { Check, Copy, CopyCheck, ExternalLink, Loader2, Monitor, MonitorSmartphone, RotateCcw, Save, Search, Smartphone } from "lucide-react";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";

interface Source {
  key: string;
  label: string;
  group: string;
  path: string;
}

const TICKERS = [
  { id: "follow", label: "Last Follow" },
  { id: "like", label: "Last Like" },
  { id: "gift", label: "Last Gift" },
  { id: "join", label: "Last Join" },
  { id: "share", label: "Last Share" },
];

function buildSources(boards: TopBoardRow[], widgets: WidgetConfig[]): Source[] {
  const out: Source[] = [];
  const add = (group: string, key: string, label: string, path: string) => out.push({ group, key, label, path });

  add("Alerts & widgets", "gift-alerts", "Gift Alerts", "/overlay/gift-alerts");
  add("Alerts & widgets", "follow-join", "Follow & VIP Join Alerts", "/overlay/follow-join");
  add("Alerts & widgets", "chat-box", "Chat Box", "/overlay/chat-box");
  add("Alerts & widgets", "goals", "Goals", "/overlay/goals");
  add("Alerts & widgets", "event-feed", "Event Feed Ticker", "/overlay/event-feed");
  add("Alerts & widgets", "branding", "Branding & Note", "/overlay/branding");
  add("Alerts & widgets", "badge", "OverlayLive Badge", "/overlay/badge");

  add("Top Lists", "top-lists", "Top Lists (Option A)", "/overlay/top-lists");
  for (const b of boards) {
    const t = getBoardMeta(normalizeBoardSettings(b.settings).type);
    add("Top Lists", `top/${b.id}`, `${b.name} · ${t.label}`, `/overlay/top/${b.id}`);
  }

  for (const t of TICKERS) {
    const q = typeof window !== "undefined" ? window.localStorage.getItem(`ol-ticker-${t.id}`) ?? "" : "";
    add("Latest Events tickers", `ticker/${t.id}`, t.label, `/overlay/ticker/${t.id}${q}`);
  }

  for (let n = 1; n <= 6; n++) add("Gift Videos", `gift-video/${n}`, `Gift Video · Screen ${n}`, `/overlay/gift-video/${n}`);

  for (const g of FREE_GAMES_CATALOG) add("Live Overlays & games", `game/${g.slug}`, g.title, `/overlay/game/${g.slug}`);

  add("Studio overlays", "effects", "Screen Effects", "/overlay/effects");
  add("Studio overlays", "flag-hearts", "Flag Hearts", "/overlay/flag-hearts");
  add("Studio overlays", "social", "Social Media", "/overlay/social");
  add("Studio overlays", "quran", "Quran Recitation", "/overlay/quran");
  add("Studio overlays", "notes", "Stream Notes · all notes", "/overlay/notes");
  const notes = normalizeNotesConfig((widgets.find((w) => w.widgetKey === "notes")?.customSettings as Record<string, unknown> | undefined)?.notesConfig).notes;
  for (const n of notes) {
    add("Studio overlays", `notes/${n.id}`, `Note · ${n.text.slice(0, 22) || NOTE_DESIGN_LABELS[n.design]}`, `/overlay/notes?note=${encodeURIComponent(n.id)}`);
  }

  add("Link Scenes", "scene/tiktok-studio", "Scene · TikTok LIVE Studio", "/overlay/scene/tiktok-studio");
  add("Link Scenes", "scene/obs-studio", "Scene · OBS Studio", "/overlay/scene/obs-studio");
  return out;
}

/* ───────────── live preview (real overlay in an iframe) ───────────── */

function PreviewFrame({ source, format, display, showGuide, width }: { source: Source; format: DisplayFormat; display: OverlayDisplay; showGuide: boolean; width: number }) {
  const ref = useRef<HTMLIFrameElement>(null);
  const { w: W, h: H } = CANVAS[format];
  const k = width / W;
  const height = Math.round(H * k);
  const src = `${withFormat(source.path, format)}&preview=1&demo=1`;

  const send = useCallback(() => {
    ref.current?.contentWindow?.postMessage({ type: "ol-display-draft", key: source.key, display }, window.location.origin);
  }, [source.key, display]);

  useEffect(() => {
    send();
  }, [send]);

  useEffect(() => {
    const onMsg = (e: MessageEvent) => {
      if (e.origin === window.location.origin && e.source === ref.current?.contentWindow && (e.data as { type?: string })?.type === "ol-display-ready") send();
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, [send]);

  const p = display.formats[format];
  return (
    <div className="relative mx-auto overflow-hidden rounded-xl border border-white/15 bg-slate-950 shadow-lg" style={{ width, height }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={format === "9:16" ? "/backgrounds/cozy-bedroom.jpg" : "/backgrounds/podcast-studio.jpg"} alt="" className="absolute inset-0 h-full w-full object-cover opacity-45" />
      <iframe
        key={src}
        ref={ref}
        src={src}
        title={`${source.label} ${format}`}
        onLoad={send}
        style={{ position: "absolute", left: 0, top: 0, width: W, height: H, border: 0, transform: `scale(${k})`, transformOrigin: "0 0", background: "transparent", pointerEvents: "none" }}
      />
      {format === "9:16" && showGuide && (
        <div className="pointer-events-none absolute inset-0 text-[8px] font-bold uppercase tracking-wide text-rose-100/80">
          <div className="absolute inset-x-0 top-0 flex items-center justify-center border-b border-dashed border-rose-400/60 bg-rose-500/15" style={{ height: `${TIKTOK_SAFE.top * 100}%` }}>TikTok top bar</div>
          <div className="absolute right-0 flex items-center justify-center border-l border-dashed border-rose-400/60 bg-rose-500/15 [writing-mode:vertical-rl]" style={{ top: "38%", bottom: `${TIKTOK_SAFE.bottom * 100}%`, width: `${TIKTOK_SAFE.right * 100}%` }}>Buttons</div>
          <div className="absolute inset-x-0 bottom-0 flex items-center justify-center border-t border-dashed border-rose-400/60 bg-rose-500/15" style={{ height: `${TIKTOK_SAFE.bottom * 100}%` }}>Comments & gift tray</div>
          {p.safeZone && (
            <div className="absolute border-2 border-dashed border-emerald-400/80" style={{ top: `${TIKTOK_SAFE.top * 100}%`, bottom: `${TIKTOK_SAFE.bottom * 100}%`, left: `${TIKTOK_SAFE.left * 100}%`, right: `${TIKTOK_SAFE.right * 100}%` }} />
          )}
        </div>
      )}
      <span className="absolute bottom-1.5 left-1.5 rounded bg-black/60 px-1.5 py-0.5 font-mono text-[9px] text-white/80">
        {W}×{H}
      </span>
    </div>
  );
}

/* ───────────── one format column ───────────── */

function FormatColumn({
  format,
  source,
  display,
  onChange,
  onCopy,
  copied,
}: {
  format: DisplayFormat;
  source: Source;
  display: OverlayDisplay;
  onChange: (p: Partial<FormatPlacement>) => void;
  onCopy: (path: string, label: string, id: string) => void;
  copied: string | null;
}) {
  const [guide, setGuide] = useState(true);
  const p = display.formats[format];
  const vertical = format === "9:16";
  const link = withFormat(source.path, format);
  return (
    <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`grid h-9 w-9 place-items-center rounded-xl ${vertical ? "bg-pink-500/15 text-pink-300" : "bg-sky-500/15 text-sky-300"}`}>
            {vertical ? <Smartphone className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
          </span>
          <div>
            <div className="text-sm font-extrabold text-foreground">{CANVAS[format].app}</div>
            <div className="text-[10px] text-muted-foreground">
              {CANVAS[format].label} · {CANVAS[format].w} × {CANVAS[format].h}
            </div>
          </div>
        </div>
        <button type="button" title="Reset this format" onClick={() => onChange({ ...PLACEMENT_DEFAULT })} className="rounded-lg border border-border p-1.5 text-muted-foreground hover:text-foreground">
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>

      <PreviewFrame source={source} format={format} display={display} showGuide={guide} width={vertical ? 230 : 420} />

      <div className="grid grid-cols-[auto_1fr] items-start gap-4">
        <div>
          <div className="mb-1 text-[11px] font-semibold text-muted-foreground">Position</div>
          <div className="grid w-[102px] grid-cols-3 gap-1">
            {ANCHORS.map((a) => (
              <button key={a} type="button" title={ANCHOR_LABEL[a]} aria-label={ANCHOR_LABEL[a]} onClick={() => onChange({ anchor: a })} className={`grid aspect-square place-items-center rounded-md border text-[10px] ${p.anchor === a ? "border-brand-cyan bg-brand-cyan/25 text-brand-cyan" : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"}`}>
                ●
              </button>
            ))}
          </div>
          <div className="mt-1 text-center text-[10px] font-bold text-foreground">{ANCHOR_LABEL[p.anchor]}</div>
        </div>
        <div className="space-y-2 text-xs">
          <label className="block">
            <span className="flex justify-between font-semibold text-muted-foreground"><span>Size</span><span className="text-foreground">{p.scale}%</span></span>
            <input type="range" min={30} max={250} step={5} value={p.scale} onChange={(e) => onChange({ scale: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>
          <label className="block">
            <span className="flex justify-between font-semibold text-muted-foreground"><span>Move left / right</span><span className="text-foreground">{p.offsetX}%</span></span>
            <input type="range" min={-50} max={50} value={p.offsetX} onChange={(e) => onChange({ offsetX: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>
          <label className="block">
            <span className="flex justify-between font-semibold text-muted-foreground"><span>Move up / down</span><span className="text-foreground">{p.offsetY}%</span></span>
            <input type="range" min={-50} max={50} value={p.offsetY} onChange={(e) => onChange({ offsetY: Number(e.target.value) })} className="w-full accent-cyan-400" />
          </label>
        </div>
      </div>

      {vertical && (
        <div className="grid grid-cols-1 gap-2 text-xs sm:grid-cols-2">
          <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">Keep inside safe zone <Toggle checked={p.safeZone} onChange={(v) => onChange({ safeZone: v })} /></label>
          <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 font-bold text-foreground">Show TikTok UI guide <Toggle checked={guide} onChange={setGuide} /></label>
        </div>
      )}

      <div className="rounded-xl border border-border bg-secondary/20 p-2.5">
        <code className="block truncate font-mono text-[10px] text-muted-foreground">{link}</code>
        <div className="mt-2 flex gap-2">
          <button type="button" onClick={() => onCopy(link, `${source.label} (${format})`, `${source.key}-${format}`)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-2 text-xs font-black text-white">
            {copied === `${source.key}-${format}` ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />} Copy {vertical ? "TikTok LIVE Studio" : "OBS"} link
          </button>
          <a href={link} target="_blank" rel="noreferrer" aria-label="Open" className="rounded-lg border border-border px-2.5 py-2 text-muted-foreground hover:text-foreground"><ExternalLink className="h-3.5 w-3.5" /></a>
        </div>
        <p className="mt-1.5 text-[10px] text-muted-foreground">
          {vertical ? "TikTok LIVE Studio → Add source → Link (Web) · size 1080 × 1920." : "OBS → Sources → + → Browser · width 1920, height 1080."}
        </p>
      </div>
    </div>
  );
}

/* ───────────── page ───────────── */

export function DisplayStudio({ boards, widgets, onCopyUrl, onToast }: { boards: TopBoardRow[]; widgets: WidgetConfig[]; onCopyUrl: (path: string, label: string) => void; onToast: (m: string) => void }) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const [saved, setSaved] = useState<Record<string, OverlayDisplay>>({});
  const [loaded, setLoaded] = useState(false);
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedKey, setSelectedKey] = useState("gift-alerts");
  const [draft, setDraft] = useState<OverlayDisplay>(DISPLAY_DEFAULT);
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [bulk, setBulk] = useState(false);

  useEffect(() => setSources(buildSources(boards, widgets)), [boards, widgets]);

  useEffect(() => {
    fetch("/api/overlay-display", { cache: "no-store" })
      .then((r) => r.json())
      .then((j: { displays?: Record<string, unknown> }) => {
        const map: Record<string, OverlayDisplay> = {};
        for (const [k, v] of Object.entries(j.displays ?? {})) map[k] = normalizeDisplay(v);
        setSaved(map);
        setDraft(map["gift-alerts"] ?? DISPLAY_DEFAULT);
        setLoaded(true);
      })
      .catch(() => setLoaded(true));
  }, []);

  const source = sources.find((s) => s.key === selectedKey) ?? sources[0];
  const savedDisplay = saved[selectedKey] ?? DISPLAY_DEFAULT;
  const dirty = JSON.stringify(draft) !== JSON.stringify(savedDisplay);

  const select = (key: string) => {
    if (key === selectedKey) return;
    if (dirty && !window.confirm("Discard unsaved display changes for this overlay?")) return;
    setSelectedKey(key);
    setDraft(saved[key] ?? DISPLAY_DEFAULT);
  };

  const setFormat = (fmt: DisplayFormat, p: Partial<FormatPlacement>) => setDraft((d) => ({ ...d, formats: { ...d.formats, [fmt]: { ...d.formats[fmt], ...p } } }));

  const persist = async (key: string, display: OverlayDisplay) => {
    const res = await fetch("/api/overlay-display", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ key, display }) });
    if (!res.ok) throw new Error("save failed");
    const j = (await res.json()) as { display: OverlayDisplay };
    return normalizeDisplay(j.display);
  };

  const save = async () => {
    setSaving(true);
    try {
      const d = await persist(selectedKey, draft);
      setSaved((m) => ({ ...m, [selectedKey]: d }));
      setDraft(d);
      if (typeof BroadcastChannel !== "undefined") {
        const ch = new BroadcastChannel("overlaylive-sync");
        ch.postMessage({ type: "display-update", key: selectedKey });
        ch.close();
      }
      onToast(`Display saved for ${source?.label ?? "overlay"}`);
    } catch {
      onToast("Could not save — please try again");
    } finally {
      setSaving(false);
    }
  };

  const applyToAll = async () => {
    if (!window.confirm(`Apply these 9:16 and 16:9 settings to all ${sources.length} overlays?`)) return;
    setBulk(true);
    try {
      const next: Record<string, OverlayDisplay> = { ...saved };
      for (const s of sources) next[s.key] = await persist(s.key, draft);
      setSaved(next);
      onToast(`Applied to ${sources.length} overlays`);
    } catch {
      onToast("Some overlays could not be updated");
    } finally {
      setBulk(false);
    }
  };

  const copy = (path: string, label: string, id: string) => {
    onCopyUrl(path, label);
    setCopied(id);
    setTimeout(() => setCopied(null), 1800);
  };

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q ? sources.filter((s) => s.label.toLowerCase().includes(q) || s.key.includes(q)) : sources;
    const m = new Map<string, Source[]>();
    for (const s of list) m.set(s.group, [...(m.get(s.group) ?? []), s]);
    return [...m.entries()];
  }, [sources, query]);

  const customised = (key: string) => {
    const d = saved[key];
    return !!d && JSON.stringify(d) !== JSON.stringify(DISPLAY_DEFAULT);
  };

  return (
    <div className="space-y-5 pb-24">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-pink-950/40 via-card to-sky-950/40 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30">
            <MonitorSmartphone className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">{tx("Studio")}</div>
            <h2 className="text-2xl font-black text-foreground">{tx("9:16 & 16:9 Display")}</h2>
            <p className="max-w-3xl text-xs text-muted-foreground">
              Every overlay works in TikTok LIVE Studio (9:16 · 1080 × 1920) and OBS Studio (16:9 · 1920 × 1080). Set the size and position for each format, preview them side by side, save, and copy the right link for each app — use both at once for dual output.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[300px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-3">
          <div className="relative mb-2">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search overlays…" className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-cyan" />
          </div>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto pr-1">
            {groups.map(([g, list]) => (
              <div key={g}>
                <div className="mb-1 px-1 text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">{g}</div>
                {list.map((s) => (
                  <button key={s.key} type="button" onClick={() => select(s.key)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-left text-xs ${s.key === selectedKey ? "bg-brand-cyan/15 font-bold text-foreground" : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"}`}>
                    <span className="truncate">{s.label}</span>
                    {customised(s.key) && <span className="shrink-0 rounded-full bg-emerald-500/20 px-1.5 text-[9px] font-black text-emerald-300">{tx("SET")}</span>}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>

        {source && loaded ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card p-4">
              <div>
                <div className="text-lg font-black text-foreground">{source.label}</div>
                <code className="text-[10px] text-muted-foreground">{source.path}</code>
              </div>
              <div className="text-xs">
                <div className="mb-1 font-semibold text-muted-foreground">{tx("Plain link (without ?format) shows")}</div>
                <div className="inline-flex rounded-xl bg-secondary/60 p-1">
                  {([
                    ["auto", "Match the source"],
                    ["9:16", "Always 9:16"],
                    ["16:9", "Always 16:9"],
                  ] as Array<[DefaultFormat, string]>).map(([id, label]) => (
                    <button key={id} type="button" onClick={() => setDraft((d) => ({ ...d, defaultFormat: id }))} className={`rounded-lg px-2.5 py-1.5 text-[11px] font-bold ${draft.defaultFormat === id ? "bg-brand-cyan text-slate-950" : "text-muted-foreground hover:text-foreground"}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
              <FormatColumn format="9:16" source={source} display={draft} onChange={(p) => setFormat("9:16", p)} onCopy={copy} copied={copied} />
              <FormatColumn format="16:9" source={source} display={draft} onChange={(p) => setFormat("16:9", p)} onCopy={copy} copied={copied} />
            </div>

            <p className="text-[11px] leading-relaxed text-muted-foreground">
              The overlay is drawn on a fixed 1080 × 1920 or 1920 × 1080 canvas, so it looks the same at any source size. &ldquo;Keep inside safe zone&rdquo; keeps it clear of the top bar, the action buttons and the comments that the TikTok app draws over your stream on viewers&apos; phones.
            </p>
          </div>
        ) : (
          <div className="grid place-items-center rounded-2xl border border-border bg-card p-10 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" /></div>
        )}
      </div>

      <div className="fixed bottom-4 left-1/2 z-40 w-[min(760px,calc(100%-2rem))] -translate-x-1/2">
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-popover/95 px-4 py-3 shadow-2xl backdrop-blur-md">
          <span className="truncate text-xs font-semibold text-muted-foreground">{dirty ? `Unsaved display changes for ${source?.label ?? ""}` : "All display settings saved"}</span>
          <div className="flex shrink-0 items-center gap-2">
            <button type="button" disabled={bulk} onClick={applyToAll} title="Copy these settings to every overlay" className="inline-flex items-center gap-1 rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-50">
              {bulk ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CopyCheck className="h-3.5 w-3.5" />} Apply to all
            </button>
            <button type="button" disabled={!dirty || saving} onClick={() => setDraft(savedDisplay)} className="rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary disabled:opacity-40">{tx("Discard")}</button>
            <button type="button" disabled={!dirty || saving} onClick={save} className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-5 py-2 text-xs font-black text-white shadow hover:brightness-110 disabled:opacity-50">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />} {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
