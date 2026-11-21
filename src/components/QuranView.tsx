"use client";

import { QuranAudioEngine } from "@/components/QuranAudio";
import {
  BASMALA,
  DEFAULT_QURAN_FONT,
  arabicDigits,
  ayahAudioUrl,
  ayahFallbackMs,
  ensureQuranFont,
  loadSurah,
  reciterById,
  type QuranConfig,
  type QuranState,
  type SurahData,
} from "@/lib/quran";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

const THEMES: Record<string, { frame: React.CSSProperties; ink: string; accent: string; soft: string }> = {
  mushaf: { frame: { background: "linear-gradient(160deg, #0d4a37 0%, #072e22 55%, #05231a 100%)", border: "3px double #c9a227", boxShadow: "inset 0 0 0 6px rgba(201,162,39,0.12), 0 12px 40px rgba(0,0,0,0.45)" }, ink: "#f7ecd0", accent: "#e8c04a", soft: "rgba(232,192,74,0.75)" },
  glass: { frame: { background: "rgba(9, 12, 22, 0.62)", border: "1px solid rgba(255,255,255,0.18)", boxShadow: "0 12px 40px rgba(0,0,0,0.35)", backdropFilter: "blur(8px)" }, ink: "#f4f6fb", accent: "#9ecbff", soft: "rgba(158,203,255,0.7)" },
  night: { frame: { background: "radial-gradient(1.5px 1.5px at 18% 22%, rgba(255,255,255,0.8) 50%, transparent 51%), radial-gradient(1px 1px at 72% 14%, rgba(255,255,255,0.7) 50%, transparent 51%), radial-gradient(1.5px 1.5px at 84% 68%, rgba(255,255,255,0.6) 50%, transparent 51%), radial-gradient(1px 1px at 34% 80%, rgba(255,255,255,0.55) 50%, transparent 51%), linear-gradient(170deg, #0a1230 0%, #050814 100%)", border: "1px solid rgba(127,180,255,0.35)", boxShadow: "0 12px 40px rgba(0,0,0,0.5)" }, ink: "#dce6ff", accent: "#7fb4ff", soft: "rgba(127,180,255,0.7)" },
  parchment: { frame: { background: "linear-gradient(165deg, #f6ecd0 0%, #eeddb5 100%)", border: "2px solid #b08d4f", boxShadow: "inset 0 0 0 5px rgba(176,141,79,0.18), 0 10px 32px rgba(60,40,10,0.3)" }, ink: "#41300f", accent: "#8a5a1e", soft: "rgba(138,90,30,0.75)" },
  emerald: { frame: { background: "linear-gradient(160deg, #04382b 0%, #021d16 100%)", border: "1px solid rgba(46,230,168,0.5)", boxShadow: "0 0 24px rgba(46,230,168,0.25), 0 12px 40px rgba(0,0,0,0.45)" }, ink: "#eafff5", accent: "#2ee6a8", soft: "rgba(46,230,168,0.7)" },
  royal: { frame: { background: "linear-gradient(160deg, #2a103f 0%, #12061f 100%)", border: "2px solid #d4af37", boxShadow: "inset 0 0 0 5px rgba(212,175,55,0.12), 0 12px 40px rgba(0,0,0,0.5)" }, ink: "#f3e8ff", accent: "#d4af37", soft: "rgba(212,175,55,0.75)" },
  minimal: { frame: { background: "transparent", border: "none", boxShadow: "none" }, ink: "#ffffff", accent: "#f5c542", soft: "rgba(255,255,255,0.65)" },
};

export interface Timing {
  startedAt: number;
  endsAt: number;
}

/* ───────────── fit-to-screen wrapper ───────────── */

export function FitScale({ designW = 960, maxScale = 1, children }: { designW?: number; maxScale?: number; children: React.ReactNode }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const w = outer.current?.clientWidth ?? 0;
      const h = outer.current?.clientHeight ?? 0;
      const iw = Math.max(designW, inner.current?.scrollWidth ?? 0);
      const ih = inner.current?.offsetHeight ?? 0;
      if (w && h && iw) setScale(Math.min(0.9 * Math.min(w / iw, ih > 0 ? h / ih : Infinity), maxScale));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (outer.current) ro.observe(outer.current);
    if (inner.current) ro.observe(inner.current);
    return () => ro.disconnect();
  }, [designW, maxScale]);
  return (
    <div ref={outer} aria-hidden className="pointer-events-none absolute inset-0 flex select-none items-center justify-center overflow-hidden">
      <div ref={inner} dir="ltr" style={{ width: designW, flexShrink: 0, transform: `scale(${scale})`, transformOrigin: "center center", opacity: scale > 0 ? 1 : 0 }}>
        {children}
      </div>
    </div>
  );
}

/* ───────────── renderer ───────────── */

interface ViewProps {
  config: QuranConfig;
  surah: SurahData | null;
  ayah: number;
  timing?: Timing | null;
  line?: number | null;
  compact?: boolean;
}

export function QuranView({ config: e, surah, ayah, timing = null, line = null, compact = false }: ViewProps) {
  const theme = THEMES[e.design] ?? THEMES.mushaf;
  const ink = e.textColor || theme.ink;
  const hl = e.highlightColor || theme.accent;
  const activeInk = e.activeTextColor || e.textColor || theme.ink;
  const family = e.fontFamily || DEFAULT_QURAN_FONT;
  const font = `'${family}', 'Amiri', 'Noto Naskh Arabic', serif`;
  const size = compact ? 15 : e.fontSize;
  const tracking = e.autoAdvance !== false ? timing : null;

  useEffect(() => ensureQuranFont(family), [family]);

  const ayahs = useMemo(() => {
    if (!surah) return [];
    const from = Math.max(1, e.fromAyah);
    const to = Math.min(surah.ayahs.length, Math.max(e.toAyah, from));
    const list = surah.ayahs.slice(from - 1, to);
    return e.continuous ? list : list.filter((a) => a.n === ayah);
  }, [surah, e.fromAyah, e.toAyah, e.continuous, ayah]);

  const first = ayahs[0];
  const showBasmala = !!surah && !!first && first.n === 1 && surah.n !== 1 && surah.n !== 9;
  const minimal = e.design === "minimal";
  const textRef = useRef<HTMLDivElement>(null);
  const [offset, setOffset] = useState(0);
  const scrollRef = useRef(0);
  const visible = Math.max(1, e.ayahsVisible);
  const lineH = size * (e.lineHeight || 2);

  useEffect(() => {
    const el = textRef.current;
    if (!el) return;
    const update = () => {
      const node = el.querySelector(`[data-ayah="${ayah}"]`);
      if (!node) {
        setOffset(0);
        return;
      }
      const box = el.getBoundingClientRect();
      const k = el.offsetHeight > 0 ? box.height / el.offsetHeight : 1;
      const rects = Array.from(node.getClientRects()).filter((r) => r.width > 0 && r.height > 0);
      if (!rects.length || !k) return;
      const lineOf = (r: DOMRect) => Math.floor(((r.top - box.top) / k + r.height / (2 * k)) / lineH);
      const firstL = lineOf(rects[0]);
      const lastL = Math.max(firstL, lineOf(rects[rects.length - 1]));
      const total = Math.max(1, Math.round(el.offsetHeight / lineH));
      const span = lastL - firstL + 1;
      const prevTop = Math.round(scrollRef.current / lineH);
      let top = prevTop;
      if (line != null && span > visible) {
        const l = Math.min(span - 1, Math.max(0, line));
        top = firstL + Math.min(span - visible, Math.max(0, l - Math.floor((visible - 1) / 2)));
      } else {
        let a = firstL;
        let b = lastL;
        if (span > visible) {
          if (!tracking || tracking.endsAt <= tracking.startedAt) {
            if (prevTop >= firstL && prevTop <= lastL - visible + 1) {
              a = prevTop;
              b = prevTop + visible - 1;
            } else a = b = firstL;
          } else {
            // follow the reciter through a long ayah, line by line
            const progress = Math.min(1, Math.max(0, (Date.now() - tracking.startedAt) / (tracking.endsAt - tracking.startedAt) + 0.08));
            const widths = Array(span).fill(0) as number[];
            for (const r of rects) {
              const idx = lineOf(r) - firstL;
              if (idx >= 0 && idx < span) widths[idx] += r.width;
            }
            const sum = widths.reduce((x, y) => x + y, 0) || 1;
            let acc = 0;
            let at = 0;
            for (let i = 0; i < span; i++) {
              acc += widths[i];
              at = i;
              if (progress * sum < acc) break;
            }
            a = b = firstL + at;
          }
        }
        if (b > top + visible - 1) top = b - visible + 1;
        if (a < top) top = a;
        if (lastL >= prevTop && firstL <= prevTop + visible - 1) top = Math.max(prevTop - 1, Math.min(prevTop + 1, top));
      }
      top = Math.min(Math.max(0, total - visible), Math.max(0, top));
      scrollRef.current = top * lineH;
      setOffset(top * lineH);
    };
    update();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    ro?.observe(el);
    const iv = tracking ? setInterval(update, 200) : null;
    return () => {
      ro?.disconnect();
      if (iv) clearInterval(iv);
    };
  }, [ayah, tracking, line, visible, lineH, ayahs, family, size]);

  const shadow = minimal ? "0 2px 12px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.9)" : undefined;

  return (
    <div dir="rtl" translate="no" className="notranslate flex h-full w-full items-center justify-center">
      <div className={compact ? "w-full rounded-lg px-3 py-2.5" : "w-[92%] max-w-[880px] rounded-3xl px-8 py-7"} style={theme.frame}>
        <div className={`flex items-center justify-center gap-3 ${compact ? "mb-1" : "mb-3"}`} style={{ color: theme.soft, textShadow: shadow }}>
          <span aria-hidden style={{ fontSize: 0.4 * size }}>✦</span>
          <span className="font-bold" style={{ fontFamily: font, fontSize: 0.62 * size, color: e.textColor || theme.accent }}>
            {surah ? `سُورَةُ ${surah.name}` : "…"}
          </span>
          <span aria-hidden style={{ fontSize: 0.4 * size }}>✦</span>
        </div>
        {showBasmala && (
          <div
            aria-hidden={ayah !== 1}
            className="overflow-hidden text-center"
            style={{ maxHeight: ayah === 1 ? 1.6 * size : 0, opacity: ayah === 1 ? 0.9 : 0, marginBottom: ayah === 1 ? (compact ? 4 : 16) : 0, transition: "max-height 700ms ease, opacity 700ms ease, margin-bottom 700ms ease" }}
          >
            <p style={{ margin: 0, fontFamily: font, fontSize: 0.72 * size, lineHeight: 1.5, color: ink, textShadow: shadow }}>{BASMALA}</p>
          </div>
        )}
        <div className={compact ? "rounded-md px-2" : "rounded-2xl px-5"} style={{ height: visible * lineH, overflow: "hidden", position: "relative" }}>
          <div ref={textRef} style={{ position: "relative", transform: `translateY(-${offset}px)`, transition: "transform 900ms cubic-bezier(0.22, 0.61, 0.36, 1)", willChange: "transform" }}>
            <p style={{ margin: 0, fontFamily: font, fontSize: size, lineHeight: `${lineH}px`, color: ink, textAlign: "center", textShadow: shadow }}>
              {ayahs.map((a) => {
                const active = a.n === ayah;
                const dim = e.highlight && !active;
                return (
                  <React.Fragment key={a.n}>
                    <span
                      data-ayah={a.n}
                      style={{
                        opacity: dim ? 0.45 : 1,
                        color: active ? activeInk : undefined,
                        background: e.highlight && active ? `${hl}24` : "transparent",
                        borderRadius: 6,
                        boxDecorationBreak: "clone",
                        WebkitBoxDecorationBreak: "clone",
                        transition: "opacity 500ms, background-color 500ms",
                      }}
                    >
                      {a.text}{" "}
                      <span className="whitespace-nowrap" style={{ color: active ? hl : theme.soft, fontSize: 0.8 * size, lineHeight: 1 }}>
                        ﴿{arabicDigits(a.n)}﴾
                      </span>
                    </span>{" "}
                  </React.Fragment>
                );
              })}
            </p>
          </div>
        </div>
        {!compact && (
          <div className="mt-4 flex items-center justify-center gap-3 font-semibold" style={{ color: theme.soft, fontSize: Math.max(13, 0.34 * size), textShadow: shadow }}>
            <span>
              الآية {arabicDigits(ayah)} / {arabicDigits(e.toAyah)}
            </span>
            {e.soundEnabled && e.reciterId && (
              <>
                <span aria-hidden>·</span>
                <span>بصوت {reciterById(e.reciterId).nameAr}</span>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ───────────── playback hook ───────────── */

/**
 * Drives the recitation: loads the surah, applies dashboard commands (by `rev`),
 * plays reciter audio ayah by ayah (or times the text when reciting yourself),
 * and reports each new ayah through `onProgress`.
 */
export function useQuranPlayback(payload: QuranState & { config: QuranConfig }, opts: { muted: boolean; onProgress?: (ayah: number, ended: boolean) => void }) {
  const cfg = payload.config;
  const [surah, setSurah] = useState<SurahData | null>(null);
  const [ayah, setAyah] = useState(cfg.fromAyah);
  const [ended, setEnded] = useState(false);
  const [timing, setTiming] = useState<Timing | null>(null);
  const [line, setLine] = useState<number | null>(null);
  const [loopTick, setLoopTick] = useState(0);
  const revRef = useRef<number | null>(null);
  const sound = !!cfg.soundEnabled && !!cfg.reciterId;
  const playing = payload.playing && !!surah;
  const progressRef = useRef(opts.onProgress);
  progressRef.current = opts.onProgress;

  useEffect(() => {
    let alive = true;
    loadSurah(cfg.surah).then((s) => alive && setSurah(s)).catch(() => {});
    return () => {
      alive = false;
    };
  }, [cfg.surah]);

  useEffect(() => {
    if (payload.rev === revRef.current) return;
    revRef.current = payload.rev;
    setAyah(Math.min(cfg.toAyah, Math.max(cfg.fromAyah, payload.ayah)));
    setLine(typeof payload.line === "number" ? payload.line : null);
    setEnded(false);
  }, [payload.rev, payload.ayah, payload.line, cfg.fromAyah, cfg.toAyah]);

  const live = useRef({ cfg, surah, muted: opts.muted });
  live.current = { cfg, surah, muted: opts.muted };
  const engineRef = useRef<QuranAudioEngine | null>(null);
  const engine = () => {
    if (engineRef.current) return engineRef.current;
    const e = new QuranAudioEngine({
      url: (n) => ayahAudioUrl(live.current.cfg.reciterId, live.current.cfg.surah, n),
      onAyah: (n) => {
        setAyah(n);
        setLine(null);
        setEnded(false);
        progressRef.current?.(n, false);
      },
      onEnded: () => {
        setEnded(true);
        setTiming(null);
        progressRef.current?.(live.current.cfg.toAyah, true);
      },
      onTiming: (t) => setTiming(t),
      fallbackMs: (n) => ayahFallbackMs(live.current.surah?.ayahs[n - 1]?.text ?? "", live.current.cfg.speed),
    });
    const c = live.current.cfg;
    e.setOptions({ speed: c.speed, volume: c.volume, muted: live.current.muted, loop: c.loop, autoAdvance: c.autoAdvance, from: c.fromAyah, to: c.toAyah });
    engineRef.current = e;
    return e;
  };

  useEffect(
    () => () => {
      engineRef.current?.dispose();
      engineRef.current = null;
    },
    [],
  );

  useEffect(() => {
    engineRef.current?.setOptions({ speed: cfg.speed, volume: cfg.volume, muted: opts.muted, loop: cfg.loop, autoAdvance: cfg.autoAdvance, from: cfg.fromAyah, to: cfg.toAyah });
  }, [cfg.speed, cfg.volume, opts.muted, cfg.loop, cfg.autoAdvance, cfg.fromAyah, cfg.toAyah]);

  useEffect(() => {
    if (!(playing && sound)) {
      engineRef.current?.stop();
      setTiming(null);
    }
  }, [playing, sound]);

  useEffect(() => {
    if (!playing && sound && cfg.surah) engine().warm([ayah, ayah + 1, ayah - 1]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sound, cfg.reciterId, cfg.surah, ayah, cfg.toAyah, cfg.fromAyah]);

  useEffect(() => {
    if (!playing || ended || !surah) return;
    if (sound) {
      engine().play(ayah);
      return;
    }
    // reciting yourself: time each ayah from its length (or wait for Next when auto-advance is off)
    if (!cfg.autoAdvance && !cfg.loop) {
      setTiming(null);
      return;
    }
    const text = surah.ayahs[ayah - 1]?.text ?? "";
    const ms = ayahFallbackMs(text, cfg.speed);
    const now = Date.now();
    setTiming({ startedAt: now, endsAt: now + ms });
    const t = setTimeout(() => {
      if (cfg.loop) setLoopTick((k) => k + 1);
      else if (ayah < cfg.toAyah) {
        setAyah(ayah + 1);
        progressRef.current?.(ayah + 1, false);
      } else {
        setEnded(true);
        setTiming(null);
        progressRef.current?.(ayah, true);
      }
    }, ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, ended, surah, sound, ayah, cfg.autoAdvance, cfg.loop, cfg.speed, cfg.toAyah, loopTick, cfg.reciterId, cfg.surah]);

  return { surah, ayah, timing, line, ended };
}
