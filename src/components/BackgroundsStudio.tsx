"use client";

import { Segmented, Toggle } from "@/components/TopListsStudio";
import {
  BACKGROUNDS,
  BG_CATEGORIES,
  BG_SIZES,
  drawCover,
  drawProcedural,
  type BackgroundItem,
  type BgCategory,
  type BgOrientation,
} from "@/lib/backgrounds";
import { Download, Heart, ImageIcon, Loader2, MessageCircle, Monitor, Search, Share2, Smartphone, X } from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

function ProcCanvas({ id, accent, orientation, res = 360, className = "" }: { id: string; accent: string; orientation: BgOrientation; res?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = orientation === "vertical" ? Math.round((res * 9) / 16) : res;
  const h = orientation === "vertical" ? res : Math.round((res * 9) / 16);
  useEffect(() => {
    const c = ref.current;
    const ctx = c?.getContext("2d");
    if (ctx) drawProcedural(ctx, id, w, h, accent);
  }, [id, accent, w, h]);
  return <canvas ref={ref} width={w} height={h} className={className} aria-hidden />;
}

function BgVisual({ item, orientation, accent, res, className }: { item: BackgroundItem; orientation: BgOrientation; accent: string; res?: number; className?: string }) {
  if (item.kind === "image" && item.src) {
    /* eslint-disable-next-line @next/next/no-img-element */
    return <img src={item.src} alt={item.title} className={`object-cover ${className ?? ""}`} loading="lazy" />;
  }
  return <ProcCanvas id={item.id} accent={accent} orientation={orientation} res={res} className={className} />;
}

async function downloadBackground(item: BackgroundItem, orientation: BgOrientation, w: number, h: number, accent: string) {
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  let mime = "image/png";
  if (item.kind === "image" && item.src) {
    const img = new Image();
    img.src = item.src;
    await img.decode();
    drawCover(ctx, img, w, h);
    mime = "image/jpeg";
  } else {
    drawProcedural(ctx, item.id, w, h, accent);
  }
  const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, mime, 0.93));
  if (!blob) throw new Error("Could not create the file");
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `overlaylive-${item.id}-${orientation}-${w}x${h}.${mime === "image/png" ? "png" : "jpg"}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function BackgroundsStudio({ onToast }: { onToast: (msg: string) => void }) {
  const [category, setCategory] = useState<BgCategory | "All">("All");
  const [orientation, setOrientation] = useState<BgOrientation | "all">("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<BackgroundItem | null>(null);

  const items = useMemo(() => {
    const q = query.trim().toLowerCase();
    return BACKGROUNDS.filter(
      (b) =>
        (category === "All" || b.category === category) &&
        (orientation === "all" || b.orientations.includes(orientation)) &&
        (!q || b.title.toLowerCase().includes(q) || b.tags.some((t) => t.includes(q)) || b.category.toLowerCase().includes(q)),
    );
  }, [category, orientation, query]);

  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-border bg-gradient-to-r from-sky-950/40 via-card to-violet-950/40 p-5">
        <div className="flex items-center gap-3.5">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/30">
            <ImageIcon className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">Studio</div>
            <h2 className="text-2xl font-black text-foreground">Background Library</h2>
            <p className="max-w-3xl text-xs text-muted-foreground">
              Ready-made stream backgrounds — filter by category and orientation, preview them on a device frame, then download and drop them into TikTok LIVE Studio or OBS.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Segmented
            value={orientation}
            onChange={setOrientation}
            options={[
              { id: "all", label: "All" },
              { id: "vertical", label: "Vertical 9:16", icon: <Smartphone className="h-3.5 w-3.5" /> },
              { id: "horizontal", label: "Horizontal 16:9", icon: <Monitor className="h-3.5 w-3.5" /> },
            ]}
          />
          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search backgrounds…" className="w-full rounded-xl border border-border bg-background py-2 pl-8 pr-3 text-xs outline-none focus:border-brand-cyan" />
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(["All", ...BG_CATEGORIES] as const).map((c) => {
            const n = c === "All" ? BACKGROUNDS.length : BACKGROUNDS.filter((b) => b.category === c).length;
            return (
              <button key={c} type="button" onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 text-xs font-bold transition ${category === c ? "bg-brand-cyan text-slate-950" : "bg-secondary/60 text-muted-foreground hover:text-foreground"}`}>
                {c} <span className="opacity-60">{n}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-10 text-center text-sm text-muted-foreground">No backgrounds match these filters.</div>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {items.map((b) => {
            const o: BgOrientation = orientation === "all" ? b.orientations[0] : orientation;
            return (
              <button key={b.id} type="button" onClick={() => setOpen(b)} className="group overflow-hidden rounded-2xl border border-border bg-card text-left transition hover:-translate-y-0.5 hover:border-brand-cyan/50 hover:shadow-[0_12px_30px_-12px_rgba(40,199,250,.45)]">
                <div className={`relative overflow-hidden bg-slate-950 ${o === "vertical" ? "aspect-[9/16]" : "aspect-video"}`}>
                  <BgVisual item={b} orientation={o} accent={b.accent ?? "#28c7fa"} res={420} className="h-full w-full transition duration-500 group-hover:scale-105" />
                  <div className="absolute left-2 top-2 flex gap-1">
                    {b.orientations.map((x) => (
                      <span key={x} className="rounded-full bg-black/60 px-1.5 py-0.5 text-[9px] font-bold text-white backdrop-blur">
                        {x === "vertical" ? "9:16" : "16:9"}
                      </span>
                    ))}
                  </div>
                  <span className="absolute inset-x-2 bottom-2 rounded-lg bg-black/60 py-1 text-center text-[11px] font-bold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">Preview</span>
                </div>
                <div className="px-2.5 py-2">
                  <div className="truncate text-xs font-extrabold text-foreground">{b.title}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {b.category} · {b.kind === "image" ? "Painted" : "Any color"}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {open && <BackgroundPreview item={open} initialOrientation={orientation === "all" ? open.orientations[0] : orientation} onClose={() => setOpen(null)} onToast={onToast} />}
    </div>
  );
}

function BackgroundPreview({ item, initialOrientation, onClose, onToast }: { item: BackgroundItem; initialOrientation: BgOrientation; onClose: () => void; onToast: (m: string) => void }) {
  const [orientation, setOrientation] = useState<BgOrientation>(item.orientations.includes(initialOrientation) ? initialOrientation : item.orientations[0]);
  const [accent, setAccent] = useState(item.accent ?? "#28c7fa");
  const [sizeIdx, setSizeIdx] = useState(0);
  const [showUi, setShowUi] = useState(true);
  const [busy, setBusy] = useState(false);
  const sizes = BG_SIZES[orientation];
  const size = sizes[Math.min(sizeIdx, sizes.length - 1)];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = async () => {
    setBusy(true);
    try {
      await downloadBackground(item, orientation, size.w, size.h, accent);
      onToast(`Downloaded ${item.title} (${size.w} × ${size.h})`);
    } catch {
      onToast("Download failed — please try again");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label={`${item.title} preview`} onClick={onClose}>
      <div className="grid max-h-[94vh] w-full max-w-5xl grid-cols-1 gap-5 overflow-y-auto rounded-3xl border border-border bg-card p-5 lg:grid-cols-[1fr_320px]" onClick={(e) => e.stopPropagation()}>
        {/* Device frame */}
        <div className="flex items-center justify-center rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 p-6">
          {orientation === "vertical" ? (
            <div className="relative aspect-[9/16] w-[min(300px,70vw)] rounded-[42px] border-[10px] border-neutral-800 bg-black shadow-[0_30px_60px_-20px_rgba(0,0,0,.9),inset_0_0_0_2px_#3f3f46]">
              <div className="absolute left-1/2 top-2 z-20 h-5 w-24 -translate-x-1/2 rounded-full bg-black" />
              <div className="absolute inset-0 overflow-hidden rounded-[32px]">
                <BgVisual item={item} orientation="vertical" accent={accent} res={900} className="h-full w-full" />
                {showUi && (
                  <>
                    <div className="absolute left-3 right-3 top-8 flex items-center justify-between text-white">
                      <span className="flex items-center gap-1.5 rounded-full bg-black/40 py-0.5 pe-2.5 ps-0.5 text-[10px] font-bold backdrop-blur">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/avatars/a1.png" alt="" className="h-6 w-6 rounded-full" /> Ava Stone
                      </span>
                      <span className="rounded bg-rose-600 px-1.5 py-0.5 text-[9px] font-black">LIVE</span>
                    </div>
                    <div className="absolute bottom-24 right-2 flex flex-col items-center gap-3 text-white drop-shadow">
                      <Heart className="h-6 w-6" />
                      <MessageCircle className="h-6 w-6" />
                      <Share2 className="h-6 w-6" />
                    </div>
                    <div className="absolute inset-x-2 bottom-3 space-y-1">
                      {["Mira Lee: love this background 😍", "Zeyad: so clean!"].map((c) => (
                        <div key={c} className="w-fit max-w-[80%] rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-semibold text-white backdrop-blur">{c}</div>
                      ))}
                      <div className="h-7 rounded-full bg-black/40 px-3 text-[9px] leading-7 text-white/60">Add comment…</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full max-w-[560px]">
              <div className="rounded-xl border-[8px] border-b-[14px] border-neutral-800 bg-black shadow-[0_30px_60px_-20px_rgba(0,0,0,.9)]">
                <div className="relative aspect-video overflow-hidden">
                  <BgVisual item={item} orientation="horizontal" accent={accent} res={1200} className="h-full w-full" />
                  {showUi && (
                    <>
                      <div className="absolute inset-x-0 top-0 flex items-center gap-1.5 bg-black/60 px-2 py-1 text-[9px] font-bold text-white/80">
                        <span className="h-2 w-2 rounded-full bg-rose-500" /> OBS Studio — Scene: Live
                      </div>
                      <div className="absolute bottom-3 right-3 aspect-video w-1/4 rounded-md border-2 border-white/60 bg-black/40 text-center text-[8px] font-bold leading-[3] text-white/70 backdrop-blur">Camera</div>
                    </>
                  )}
                </div>
              </div>
              <div className="mx-auto h-5 w-24 bg-neutral-800" />
              <div className="mx-auto h-2 w-48 rounded-t-lg bg-neutral-700" />
            </div>
          )}
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-brand-cyan">{item.category}</div>
              <h3 className="text-xl font-black text-foreground">{item.title}</h3>
              <div className="mt-1 flex flex-wrap gap-1">
                {item.tags.map((t) => <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground">#{t}</span>)}
              </div>
            </div>
            <button type="button" onClick={onClose} aria-label="Close preview" className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          </div>

          {item.orientations.length > 1 && (
            <Segmented value={orientation} onChange={(v) => { setOrientation(v); setSizeIdx(0); }} options={[{ id: "vertical", label: "Phone 9:16", icon: <Smartphone className="h-3.5 w-3.5" /> }, { id: "horizontal", label: "Desktop 16:9", icon: <Monitor className="h-3.5 w-3.5" /> }]} />
          )}

          <label className="flex items-center justify-between rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs font-bold text-foreground">
            Show {orientation === "vertical" ? "TikTok app UI" : "OBS scene"} preview <Toggle checked={showUi} onChange={setShowUi} />
          </label>

          {item.kind === "procedural" && (
            <div className="text-xs">
              <div className="mb-1.5 font-semibold text-muted-foreground">Accent colour</div>
              <div className="flex flex-wrap items-center gap-1.5">
                {["#28c7fa", "#ec4899", "#a855f7", "#10b981", "#f59e0b", "#f43f5e", "#d4af37", "#ffffff"].map((c) => (
                  <button key={c} type="button" title={c} onClick={() => setAccent(c)} className={`h-6 w-6 rounded-full ${accent === c ? "ring-2 ring-brand-cyan ring-offset-2 ring-offset-card" : ""}`} style={{ background: c }} />
                ))}
                <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent" aria-label="Custom accent colour" />
              </div>
            </div>
          )}

          <label className="text-xs">
            <span className="font-semibold text-muted-foreground">Size</span>
            <select value={sizeIdx} onChange={(e) => setSizeIdx(Number(e.target.value))} className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold text-foreground">
              {sizes.map((s, i) => <option key={s.label} value={i}>{s.label}</option>)}
            </select>
          </label>

          <button type="button" disabled={busy} onClick={download} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-3 text-sm font-black text-white shadow hover:brightness-110 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Download {size.w} × {size.h}
          </button>

          <div className="rounded-xl border border-border bg-secondary/20 p-3 text-[11px] leading-relaxed text-muted-foreground">
            {orientation === "vertical" ? (
              <>
                <div className="mb-1 font-extrabold text-foreground">TikTok LIVE Studio</div>
                Add source → <strong className="text-foreground">Image</strong> → pick the file. Drag it to the bottom of the source list so your camera and overlays sit on top, then right-click → Fit to screen.
              </>
            ) : (
              <>
                <div className="mb-1 font-extrabold text-foreground">OBS Studio / Streamlabs</div>
                Sources → <strong className="text-foreground">+ → Image</strong> → browse to the file. Keep it at the bottom of the list, right-click → Transform → Fit to screen (Ctrl + F).
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
