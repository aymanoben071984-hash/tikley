"use client";

import { linesDir, textDir } from "@/lib/breakingNews";
import {
  NEWS_TICKER_DEFAULTS,
  NEWS_TICKER_DESIGNS,
  STREAM_TIMER_DESIGNS,
  STREAM_TIMER_MODES,
  type NewsTickerConfig,
  type SimpleOverlayState,
  type StreamTimerConfig,
  type TickerDesign,
  type TimerDesign,
} from "@/lib/liveOverlays";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

/* ═══════════════════════════ NEWS TICKER ═══════════════════════════ */

interface TickerTokens {
  bar: React.CSSProperties;
  badge: React.CSSProperties;
  text: string;
  accent: string;
  font: string;
  fade: string;
  decor?: "pulse-dot" | "sheen" | "gradient" | "scanlines";
}

const TICKER_TOKENS: Record<TickerDesign, TickerTokens> = {
  breaking: { bar: { background: "linear-gradient(180deg, rgba(16,16,22,0.96), rgba(8,8,12,0.97))", border: "1px solid rgba(239,68,68,0.45)", borderRadius: 12 }, badge: { background: "linear-gradient(180deg, #ef4444, #b91c1c)", color: "#fff", borderRadius: 8 }, text: "#ffffff", accent: "#ef4444", font: "Inter, system-ui, sans-serif", fade: "rgba(10,10,14,0.95)", decor: "pulse-dot" },
  glass: { bar: { background: "linear-gradient(160deg, rgba(20,26,44,0.92), rgba(6,9,18,0.94))", border: "1px solid rgba(255,255,255,0.14)", borderRadius: 999 }, badge: { background: "rgba(255,255,255,0.1)", color: "#fff", border: "1px solid rgba(255,255,255,0.18)", borderRadius: 999 }, text: "#f1f5f9", accent: "#22d3ee", font: "Inter, system-ui, sans-serif", fade: "rgba(12,16,28,0.93)" },
  neon: { bar: { background: "linear-gradient(180deg, rgba(3,7,18,0.97), rgba(2,6,23,0.98))", border: "1px solid rgba(34,211,238,0.7)", borderRadius: 14, boxShadow: "0 0 22px -4px rgba(34,211,238,0.5), inset 0 0 18px -8px rgba(34,211,238,0.4)" }, badge: { background: "rgba(34,211,238,0.14)", color: "#22d3ee", border: "1px solid rgba(34,211,238,0.6)", borderRadius: 10, textShadow: "0 0 10px rgba(34,211,238,0.8)" }, text: "#e0faff", accent: "#22d3ee", font: "Inter, system-ui, sans-serif", fade: "rgba(3,7,18,0.96)" },
  gold: { bar: { background: "linear-gradient(160deg, #221230, #17091f)", border: "1px solid rgba(212,175,55,0.65)", borderRadius: 12, boxShadow: "0 0 24px -8px rgba(212,175,55,0.5)" }, badge: { background: "linear-gradient(180deg, #f5d061, #b8860b)", color: "#241304", borderRadius: 8 }, text: "#f8ecc9", accent: "#d4af37", font: "Georgia, 'Times New Roman', serif", fade: "rgba(28,15,38,0.95)", decor: "sheen" },
  gradient: { bar: { border: "1px solid rgba(255,255,255,0.22)", borderRadius: 999 }, badge: { background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999 }, text: "#ffffff", accent: "#fde68a", font: "Inter, system-ui, sans-serif", fade: "rgba(0,0,0,0.18)", decor: "gradient" },
  led: { bar: { background: "#050505", border: "1px solid rgba(251,191,36,0.35)", borderRadius: 6 }, badge: { background: "#131107", color: "#fbbf24", border: "1px solid rgba(251,191,36,0.5)", borderRadius: 4, letterSpacing: 2 }, text: "#fbbf24", accent: "#fde68a", font: "'Courier New', ui-monospace, monospace", fade: "rgba(5,5,5,0.96)", decor: "scanlines" },
  paper: { bar: { background: "linear-gradient(180deg, #faf5e6, #efe6cd)", border: "1px solid #c9b98a", borderRadius: 8, boxShadow: "0 6px 18px -8px rgba(60,45,20,0.5)" }, badge: { background: "#b91c1c", color: "#fdf6e3", borderRadius: 4, letterSpacing: 1.5 }, text: "#231d12", accent: "#b91c1c", font: "Georgia, 'Times New Roman', serif", fade: "rgba(247,240,220,0.95)" },
  cyber: { bar: { background: "linear-gradient(105deg, #12041f 70%, #1c0630)", border: "1px solid rgba(232,121,249,0.55)", borderRadius: 4, boxShadow: "0 0 20px -6px rgba(232,121,249,0.5)" }, badge: { background: "linear-gradient(105deg, #e879f9, #7c3aed)", color: "#12041f", borderRadius: 3, transform: "skewX(-10deg)" }, text: "#f3e8ff", accent: "#22d3ee", font: "Inter, system-ui, sans-serif", fade: "rgba(18,4,31,0.95)" },
};

const TICKER_KEYFRAMES = `
@keyframes nt-marquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes nt-marquee-rtl { from { transform: translateX(0); } to { transform: translateX(50%); } }
@keyframes nt-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes nt-sheen { 0% { transform: translateX(-120%); } 100% { transform: translateX(120%); } }
@keyframes nt-gradient { 0% { transform: translateX(0); } 50% { transform: translateX(-66.667%); } 100% { transform: translateX(0); } }
`;

export function NewsTickerOverlay({ state, forceVisible = false }: { state: SimpleOverlayState<NewsTickerConfig>; forceVisible?: boolean }) {
  const f = { ...NEWS_TICKER_DEFAULTS, ...state.config };
  const design = NEWS_TICKER_DESIGNS.includes(f.design) ? f.design : "breaking";
  const g = TICKER_TOKENS[design];
  const text = f.textColor || g.text;
  const accent = f.accentColor || g.accent;
  const font = f.fontFamily || g.font;
  const h = (15 * Math.max(50, Math.min(200, Number(f.fontScale) || 100))) / 100;

  const lines = useMemo(() => {
    const msgs = (f.messages ?? []).map((m) => String(m).trim()).filter(Boolean);
    const base = msgs.length ? msgs : NEWS_TICKER_DEFAULTS.messages;
    const out: string[] = [];
    let chars = 0;
    while (out.length < 4 || chars < 90) {
      for (const m of base) {
        out.push(m);
        chars += m.length;
      }
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(f.messages)]);

  const chosen = f.direction === "ltr" || f.direction === "rtl" ? f.direction : f.reverse ? "rtl" : "auto";
  const dir = chosen === "auto" ? linesDir(lines) : chosen;
  const rtl = dir === "rtl";

  const runRef = useRef<HTMLDivElement>(null);
  const [runW, setRunW] = useState(0);
  useLayoutEffect(() => {
    const el = runRef.current;
    if (!el) return;
    const measure = () => setRunW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lines, h, f.separator]);

  if (state.phase !== "running" && !forceVisible) return null;
  const duration = runW > 0 ? Math.max(1, Math.min(600, runW / Math.max(10, f.speed))) : 0;

  return (
    <div dir={dir} style={{ width: 880, maxWidth: "100%", display: "flex", alignItems: "stretch", overflow: "hidden", position: "relative", fontFamily: font, minHeight: Math.round(2.9 * h), ...g.bar }}>
      <style>{TICKER_KEYFRAMES}</style>
      {g.decor === "gradient" && (
        <span aria-hidden style={{ position: "absolute", inset: 0, overflow: "hidden", direction: "ltr" }}>
          <span style={{ position: "absolute", insetBlock: 0, left: 0, width: "300%", background: "linear-gradient(100deg, #7c3aed, #2563eb, #db2777, #7c3aed)", animation: "nt-gradient 14s ease infinite", willChange: "transform" }} />
        </span>
      )}
      {f.showBadge && f.badgeText.trim() && (
        <span dir="auto" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: Math.round(0.5 * h), margin: Math.round(0.45 * h), padding: `0 ${Math.round(0.9 * h)}px`, fontWeight: 900, fontSize: 0.85 * h, letterSpacing: 1.2, textTransform: "uppercase", whiteSpace: "nowrap", flexShrink: 0, ...g.badge }}>
          {g.decor === "pulse-dot" && <span style={{ width: Math.max(6, 0.45 * h), height: Math.max(6, 0.45 * h), borderRadius: 999, background: "#fff", animation: "nt-pulse 1.1s ease-in-out infinite", flexShrink: 0 }} />}
          {f.badgeText}
        </span>
      )}
      <div dir={dir} style={{ position: "relative", zIndex: 1, flex: 1, minWidth: 0, overflow: "hidden", display: "flex", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", width: "max-content", flexShrink: 0, animation: duration ? `${rtl ? "nt-marquee-rtl" : "nt-marquee"} ${duration}s linear infinite` : undefined }}>
          {[0, 1].map((copy) => (
            <div key={copy} ref={copy === 0 ? runRef : undefined} aria-hidden={copy === 1} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
              {lines.map((line, i) => (
                <span key={`${copy}-${i}`} style={{ display: "flex", alignItems: "center", whiteSpace: "nowrap" }}>
                  <span dir={textDir(line)} style={{ fontSize: h, fontWeight: 700, color: text, padding: `0 ${Math.round(0.4 * h)}px` }}>
                    {line}
                  </span>
                  {f.separator.trim() ? (
                    <span style={{ fontSize: 0.75 * h, color: accent, opacity: 0.9, padding: `0 ${Math.round(0.55 * h)}px` }}>{f.separator}</span>
                  ) : (
                    <span style={{ width: Math.round(1.2 * h) }} />
                  )}
                </span>
              ))}
            </div>
          ))}
        </div>
        {g.decor === "scanlines" && <span aria-hidden style={{ pointerEvents: "none", position: "absolute", inset: 0, background: "repeating-linear-gradient(0deg, rgba(0,0,0,0.35) 0 1px, transparent 1px 3px)" }} />}
        {g.decor === "sheen" && <span aria-hidden style={{ pointerEvents: "none", position: "absolute", insetBlock: 0, width: "40%", background: "linear-gradient(105deg, transparent, rgba(255,235,170,0.14), transparent)", animation: "nt-sheen 5.5s ease-in-out infinite" }} />}
        <span aria-hidden style={{ pointerEvents: "none", position: "absolute", insetBlock: 0, left: 0, width: 26, background: `linear-gradient(90deg, ${g.fade}, transparent)` }} />
        <span aria-hidden style={{ pointerEvents: "none", position: "absolute", insetBlock: 0, right: 0, width: 26, background: `linear-gradient(270deg, ${g.fade}, transparent)` }} />
      </div>
    </div>
  );
}

/* ═══════════════════════════ STREAM TIMER ═══════════════════════════ */

const pad = (n: number) => String(n).padStart(2, "0");

function rgba(hex: string, a: number) {
  let n = hex.replace("#", "").trim();
  if (n.length === 3) n = n.split("").map((c) => c + c).join("");
  const v = parseInt(n, 16);
  return Number.isFinite(v) && n.length === 6 ? `rgba(${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}, ${a})` : `rgba(34, 211, 238, ${a})`;
}

interface TimeParts {
  h: string;
  m: string;
  s: string;
  suffix: string;
  totalSec: number;
  done: boolean;
}

function computeTime(cfg: StreamTimerConfig, startedAt: number | null, now: number, bonus: number): TimeParts {
  if (cfg.mode === "clock") {
    const d = new Date(now);
    let hr = d.getHours();
    let suffix = "";
    if (cfg.hour12) {
      suffix = hr >= 12 ? "PM" : "AM";
      hr = hr % 12 || 12;
    }
    return { h: pad(hr), m: pad(d.getMinutes()), s: pad(d.getSeconds()), suffix, totalSec: d.getHours() * 3600 + d.getMinutes() * 60 + d.getSeconds(), done: false };
  }
  let sec = Math.max(0, Math.floor((now - (startedAt ?? now)) / 1000));
  let done = false;
  if (cfg.mode === "countdown") {
    const left = 60 * Math.max(1, Math.floor(Number(cfg.countdownMinutes) || 0)) + Math.max(0, bonus) - sec;
    done = left <= 0;
    sec = Math.max(0, left);
  }
  return { h: pad(Math.floor(sec / 3600)), m: pad(Math.floor((sec % 3600) / 60)), s: pad(sec % 60), suffix: "", totalSec: sec, done };
}

interface TimerViewProps {
  cfg: StreamTimerConfig;
  t: TimeParts;
  accent: string;
  text: string;
  glow: string;
  dim: string;
  border: string;
}

function Label({ cfg, accent, dim, border, inline }: { cfg: StreamTimerConfig; accent: string; dim: string; border: string; inline?: boolean }) {
  if (!cfg.showLabel || !cfg.label.trim()) return null;
  return (
    <span dir="auto" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: accent, background: dim, border: `1px solid ${border}`, borderRadius: 999, padding: "3px 12px", marginBottom: inline ? 0 : 8, whiteSpace: "nowrap" }}>
      <span style={{ width: 7, height: 7, borderRadius: 999, background: accent, animation: "st-pulse 1.6s ease-in-out infinite" }} />
      {cfg.label}
    </span>
  );
}

function Digits({ t, cfg, size, weight = 900, color, colonColor, shadow }: { t: TimeParts; cfg: StreamTimerConfig; size: number; weight?: number; color: string; colonColor: string; shadow: string }) {
  const parts = cfg.showSeconds ? [t.h, t.m, t.s] : [t.h, t.m];
  return (
    <span className={t.done ? "st-done" : undefined} style={{ display: "inline-flex", alignItems: "baseline", lineHeight: 1 }}>
      {parts.map((p, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "baseline" }}>
          {i > 0 && <span className="st-colon" style={{ fontSize: 0.82 * size, fontWeight: weight, color: colonColor, margin: "0 6px", textShadow: shadow }}>:</span>}
          <span style={{ fontSize: size, fontWeight: weight, color, textShadow: shadow, fontVariantNumeric: "tabular-nums" }}>{p}</span>
        </span>
      ))}
      {t.suffix && <span style={{ fontSize: 0.34 * size, fontWeight: 800, color: colonColor, marginLeft: 8 }}>{t.suffix}</span>}
    </span>
  );
}

function NeonTimer({ cfg, t, accent, glow }: TimerViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 10 }}>
      <Label cfg={cfg} accent={accent} dim={rgba(accent, 0.14)} border={rgba(accent, 0.5)} />
      <Digits t={t} cfg={cfg} size={64} color={cfg.textColor} colonColor={accent} shadow={`0 0 12px ${glow}, 0 0 34px ${glow}, 0 3px 2px rgba(0,0,0,0.6)`} />
    </div>
  );
}

function LcdTimer({ cfg, t, accent, dim, border }: TimerViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: "14px 22px 16px", borderRadius: 18, background: "linear-gradient(180deg, rgba(24,28,38,0.96), rgba(10,12,18,0.96))", border: `1px solid ${border}`, boxShadow: "0 12px 34px rgba(0,0,0,0.5)" }}>
      <Label cfg={cfg} accent={accent} dim={dim} border={border} inline />
      <div style={{ borderRadius: 10, padding: "10px 18px", background: `linear-gradient(180deg, ${rgba(accent, 0.08)}, rgba(0,0,0,0.5))`, border: `1px solid ${rgba(accent, 0.3)}`, boxShadow: `inset 0 2px 10px rgba(0,0,0,0.65), inset 0 0 24px ${rgba(accent, 0.1)}` }}>
        <Digits t={t} cfg={cfg} size={44} color={accent} colonColor={accent} shadow={`0 0 10px ${rgba(accent, 0.6)}`} />
      </div>
    </div>
  );
}

function FlipTimer({ cfg, t, accent, dim, border, text }: TimerViewProps) {
  const parts = cfg.showSeconds ? [t.h, t.m, t.s] : [t.h, t.m];
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 8 }}>
      <Label cfg={cfg} accent={accent} dim={dim} border={border} />
      <div className={t.done ? "st-done" : undefined} style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {parts.map((p, i) => (
          <div key={i} className="st-flip-card" style={{ width: 86, height: 92, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "linear-gradient(180deg, #2b303c 0%, #222735 49%, #191d29 51%, #141824 100%)", border: "1px solid rgba(255,255,255,0.09)", boxShadow: `0 10px 26px rgba(0,0,0,0.5), 0 0 0 1px rgba(0,0,0,0.4), 0 0 22px ${rgba(accent, 0.14)}` }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: text, textShadow: "0 2px 3px rgba(0,0,0,0.7)", fontVariantNumeric: "tabular-nums" }}>{p}</span>
          </div>
        ))}
        {t.suffix && <span style={{ fontSize: 18, fontWeight: 900, color: accent }}>{t.suffix}</span>}
      </div>
    </div>
  );
}

function CapsuleTimer({ cfg, t, accent, border, text }: TimerViewProps) {
  return (
    <div className={t.done ? "st-done" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 12, padding: "10px 22px 10px 16px", borderRadius: 999, background: "linear-gradient(180deg, rgba(22,26,36,0.95), rgba(9,11,17,0.95))", border: `1px solid ${border}`, boxShadow: `0 10px 28px rgba(0,0,0,0.5), 0 0 24px ${rgba(accent, 0.16)}` }}>
      {cfg.showLabel && cfg.label.trim() && (
        <span dir="auto" style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 14, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: accent, paddingRight: 12, borderRight: `1px solid ${rgba(accent, 0.3)}` }}>
          <span style={{ width: 9, height: 9, borderRadius: 999, background: accent, boxShadow: `0 0 10px ${accent}`, animation: "st-pulse 1.6s ease-in-out infinite" }} />
          {cfg.label}
        </span>
      )}
      <Digits t={t} cfg={cfg} size={30} color={text} colonColor={accent} shadow="0 2px 3px rgba(0,0,0,0.6)" />
    </div>
  );
}

function MinimalTimer({ cfg, t, accent, text }: TimerViewProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 8 }}>
      {cfg.showLabel && cfg.label.trim() && (
        <span dir="auto" style={{ fontSize: 12, fontWeight: 700, letterSpacing: 6, textTransform: "uppercase", color: accent, marginBottom: 4, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>{cfg.label}</span>
      )}
      <Digits t={t} cfg={cfg} size={58} weight={300} color={text} colonColor={rgba(accent, 0.9)} shadow="0 2px 8px rgba(0,0,0,0.75)" />
    </div>
  );
}

function AnalogTimer({ cfg, t, accent, glow, border, text }: TimerViewProps) {
  const total = t.totalSec;
  const hand = (deg: number, len: number, w: number, color: string, blur = 0): React.CSSProperties => ({ position: "absolute", left: "50%", bottom: "50%", width: w, height: len, marginLeft: -w / 2, borderRadius: w, background: color, transformOrigin: "50% 100%", transform: `rotate(${deg}deg)`, boxShadow: blur ? `0 0 ${blur}px ${glow}` : undefined });
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, padding: 6 }}>
      <div className={t.done ? "st-done" : undefined} style={{ position: "relative", width: 210, height: 210, borderRadius: "50%", background: "radial-gradient(circle at 50% 34%, rgba(30,36,50,0.97), rgba(8,10,16,0.97) 78%)", border: `2px solid ${border}`, boxShadow: `0 14px 36px rgba(0,0,0,0.55), 0 0 28px ${rgba(accent, 0.18)}, inset 0 0 24px rgba(0,0,0,0.6)` }}>
        {Array.from({ length: 12 }, (_, i) => (
          <div key={i} aria-hidden style={{ position: "absolute", inset: 0, transform: `rotate(${30 * i}deg)` }}>
            <span style={{ position: "absolute", top: 8, left: "50%", width: i % 3 === 0 ? 4 : 2, height: i % 3 === 0 ? 14 : 8, marginLeft: i % 3 === 0 ? -2 : -1, borderRadius: 2, background: i % 3 === 0 ? accent : "rgba(255,255,255,0.35)" }} />
          </div>
        ))}
        <div style={hand((total / 3600) * 30, 50.4, 6, text)} />
        <div style={hand((total / 60) * 6, 71.4, 4, text)} />
        {cfg.showSeconds && <div style={hand(6 * total, 84, 2, accent, 8)} />}
        <div style={{ position: "absolute", left: "50%", top: "50%", width: 12, height: 12, margin: -6, borderRadius: 999, background: accent, boxShadow: `0 0 10px ${glow}` }} />
      </div>
      <Label cfg={cfg} accent={accent} dim={rgba(accent, 0.14)} border={border} inline />
      {!(cfg.mode === "clock" && cfg.showLabel) && <Digits t={t} cfg={cfg} size={20} color={text} colonColor={accent} shadow="0 2px 4px rgba(0,0,0,0.7)" />}
    </div>
  );
}

const TIMER_KEYFRAMES = `
@keyframes st-blink { 0%, 49% { opacity: 1; } 50%, 100% { opacity: 0.25; } }
@keyframes st-pulse { 0%, 100% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.35); opacity: 0.6; } }
@keyframes st-alarm { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.st-colon { animation: st-blink 1s steps(1) infinite; }
.st-done { animation: st-alarm 0.8s ease-in-out infinite; }
.st-flip-card { position: relative; overflow: hidden; }
.st-flip-card::after { content: ""; position: absolute; left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; background: rgba(0,0,0,0.55); }
@keyframes st-bonus-pop { 0% { transform: translateY(6px) scale(.85); opacity: 0; } 55% { transform: translateY(-2px) scale(1.08); opacity: 1; } 100% { transform: none; opacity: 1; } }
.st-bonus { animation: st-bonus-pop 520ms cubic-bezier(.2,.9,.3,1.3) both; }
`;

export function StreamTimerOverlay({ state, bonusSec = 0, forceVisible = false }: { state: SimpleOverlayState<StreamTimerConfig>; bonusSec?: number; forceVisible?: boolean }) {
  const cfg = state.config;
  const design: TimerDesign = STREAM_TIMER_DESIGNS.includes(cfg.design) ? cfg.design : "neon";
  const mode = STREAM_TIMER_MODES.includes(cfg.mode) ? cfg.mode : "uptime";
  const [now, setNow] = useState(() => Date.now());
  const running = state.phase === "running" || forceVisible;

  useEffect(() => {
    if (!running) return;
    setNow(Date.now());
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  if (!running) return null;
  const t = computeTime({ ...cfg, mode }, state.startedAt ?? (forceVisible ? now - 754_000 : now), now, mode === "countdown" ? bonusSec : 0);
  const accent = cfg.accentColor || "#22d3ee";
  const text = cfg.textColor || "#ffffff";
  const props: TimerViewProps = { cfg: { ...cfg, mode }, t, accent, text, glow: rgba(accent, 0.75), dim: rgba(accent, 0.16), border: rgba(accent, 0.45) };
  const width = design === "analog" ? 280 : design === "capsule" ? 420 : 460;
  const showBonus = mode === "countdown" && cfg.bonusEnabled && cfg.showBonus && bonusSec > 0;

  return (
    <div dir="ltr" style={{ width, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, fontFamily: cfg.fontFamily || "Orbitron", color: text }}>
      <style>{TIMER_KEYFRAMES}</style>
      {design === "analog" ? <AnalogTimer {...props} /> : design === "flip" ? <FlipTimer {...props} /> : design === "lcd" ? <LcdTimer {...props} /> : design === "capsule" ? <CapsuleTimer {...props} /> : design === "minimal" ? <MinimalTimer {...props} /> : <NeonTimer {...props} />}
      {showBonus && (
        <span key={bonusSec} className="st-bonus" dir="ltr" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 900, letterSpacing: 1, color: accent, background: props.dim, border: `1px solid ${props.border}`, borderRadius: 999, padding: "3px 12px", whiteSpace: "nowrap", textShadow: `0 0 10px ${props.glow}` }}>
          +{pad(Math.floor(bonusSec / 3600))}:{pad(Math.floor((bonusSec % 3600) / 60))}:{pad(bonusSec % 60)}
        </span>
      )}
    </div>
  );
}
