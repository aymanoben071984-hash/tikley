"use client";

/** Stream Notes renderer — port of OverlayLive's note designs, entrances and loop motions. */
import { AnimatedOverlayName } from "@/components/FramedAvatar";
import type { NoteDesign, NoteEnter, NotesDisplay, StreamNote } from "@/lib/streamNotes";
import React, { useEffect, useState } from "react";

function rgb(hex: string): [number, number, number] | null {
  const m = /^#([0-9a-f]{6})$/i.exec((hex ?? "").trim());
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const alpha = (hex: string, a: string) => (rgb(hex) ? `${hex.trim()}${a}` : hex);
/** Lighten (t > 0) or darken (t < 0). */
function mix(hex: string, t: number) {
  const c = rgb(hex);
  if (!c) return hex;
  const target = t < 0 ? 0 : 255;
  const k = Math.min(1, Math.abs(t));
  return `rgb(${c.map((v) => Math.round(v + (target - v) * k)).join(",")})`;
}

const IN = "560ms cubic-bezier(0.22, 1, 0.36, 1) both";
const OUT = "320ms cubic-bezier(0.55, 0, 0.8, 0.4) both";
const CSS = `
@keyframes ns-in-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ns-in-up { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: none; } }
@keyframes ns-in-down { from { opacity: 0; transform: translateY(-30px); } to { opacity: 1; transform: none; } }
@keyframes ns-in-left { from { opacity: 0; transform: translateX(48px); } to { opacity: 1; transform: none; } }
@keyframes ns-in-right { from { opacity: 0; transform: translateX(-48px); } to { opacity: 1; transform: none; } }
@keyframes ns-in-pop { 0% { opacity: 0; transform: scale(0.55); } 60% { opacity: 1; transform: scale(1.08); } 100% { opacity: 1; transform: scale(1); } }
@keyframes ns-in-zoom { from { opacity: 0; transform: scale(1.5); } to { opacity: 1; transform: scale(1); } }
@keyframes ns-in-drop { 0% { opacity: 0; transform: translateY(-64px); } 55% { opacity: 1; transform: translateY(8px); } 75% { transform: translateY(-4px); } 100% { opacity: 1; transform: none; } }
@keyframes ns-in-flip { from { opacity: 0; transform: perspective(700px) rotateX(-85deg); } to { opacity: 1; transform: perspective(700px) rotateX(0deg); } }
@keyframes ns-in-swing { 0% { opacity: 0; transform: rotate(-16deg); } 40% { opacity: 1; transform: rotate(8deg); } 70% { transform: rotate(-4deg); } 100% { opacity: 1; transform: rotate(0deg); } }
@keyframes ns-in-unfold { from { opacity: 0; transform: scaleX(0.08); } to { opacity: 1; transform: scaleX(1); } }
@keyframes ns-out-fade { from { opacity: 1; } to { opacity: 0; } }
@keyframes ns-out-up { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(-30px); } }
@keyframes ns-out-down { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(30px); } }
@keyframes ns-out-left { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(-48px); } }
@keyframes ns-out-right { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateX(48px); } }
@keyframes ns-out-pop { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(0.6); } }
@keyframes ns-out-zoom { from { opacity: 1; transform: scale(1); } to { opacity: 0; transform: scale(1.4); } }
@keyframes ns-out-drop { from { opacity: 1; transform: none; } to { opacity: 0; transform: translateY(48px); } }
@keyframes ns-out-flip { from { opacity: 1; transform: perspective(700px) rotateX(0deg); } to { opacity: 0; transform: perspective(700px) rotateX(85deg); } }
@keyframes ns-out-swing { from { opacity: 1; transform: rotate(0deg); } to { opacity: 0; transform: rotate(12deg); } }
@keyframes ns-out-unfold { from { opacity: 1; transform: scaleX(1); } to { opacity: 0; transform: scaleX(0.08); } }
.ns-in-fade { animation: ns-in-fade ${IN}; } .ns-in-up { animation: ns-in-up ${IN}; } .ns-in-down { animation: ns-in-down ${IN}; }
.ns-in-left { animation: ns-in-left ${IN}; } .ns-in-right { animation: ns-in-right ${IN}; } .ns-in-pop { animation: ns-in-pop ${IN}; }
.ns-in-zoom { animation: ns-in-zoom ${IN}; } .ns-in-drop { animation: ns-in-drop 700ms cubic-bezier(0.3, 0.7, 0.4, 1) both; }
.ns-in-flip { animation: ns-in-flip ${IN}; transform-origin: 50% 0; } .ns-in-swing { animation: ns-in-swing 800ms ease-out both; transform-origin: 50% 0; }
.ns-in-unfold { animation: ns-in-unfold ${IN}; transform-origin: 0 50%; }
.ns-out-fade { animation: ns-out-fade ${OUT}; } .ns-out-up { animation: ns-out-up ${OUT}; } .ns-out-down { animation: ns-out-down ${OUT}; }
.ns-out-left { animation: ns-out-left ${OUT}; } .ns-out-right { animation: ns-out-right ${OUT}; } .ns-out-pop { animation: ns-out-pop ${OUT}; }
.ns-out-zoom { animation: ns-out-zoom ${OUT}; } .ns-out-drop { animation: ns-out-drop ${OUT}; }
.ns-out-flip { animation: ns-out-flip ${OUT}; transform-origin: 50% 0; } .ns-out-swing { animation: ns-out-swing ${OUT}; transform-origin: 50% 0; }
.ns-out-unfold { animation: ns-out-unfold ${OUT}; transform-origin: 0 50%; }
@keyframes ns-loop-float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-7px); } }
@keyframes ns-loop-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.06); } }
@keyframes ns-loop-wiggle { 0%, 100% { transform: rotate(-2.5deg); } 50% { transform: rotate(2.5deg); } }
@keyframes ns-loop-sway { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes ns-loop-beat { 0%, 30%, 60%, 100% { transform: scale(1); } 15% { transform: scale(1.1); } 45% { transform: scale(1.06); } }
@keyframes ns-loop-hop { 0%, 70%, 100% { transform: translateY(0); } 80% { transform: translateY(-14px); } 90% { transform: translateY(0); } 95% { transform: translateY(-5px); } }
@keyframes ns-loop-shake { 0%, 78%, 100% { transform: translateX(0); } 82% { transform: translateX(-6px); } 86% { transform: translateX(6px); } 90% { transform: translateX(-4px); } 94% { transform: translateX(4px); } }
.ns-loop-float { animation: ns-loop-float 3.2s ease-in-out infinite; } .ns-loop-pulse { animation: ns-loop-pulse 2s ease-in-out infinite; }
.ns-loop-wiggle { animation: ns-loop-wiggle 1.5s ease-in-out infinite; } .ns-loop-sway { animation: ns-loop-sway 3.6s ease-in-out infinite; transform-origin: 50% 0; }
.ns-loop-beat { animation: ns-loop-beat 1.3s ease-in-out infinite; } .ns-loop-hop { animation: ns-loop-hop 2.6s ease-in-out infinite; }
.ns-loop-shake { animation: ns-loop-shake 3.4s ease-in-out infinite; }
@keyframes ns-sweep { 0% { transform: translateX(-140%); } 60%, 100% { transform: translateX(480%); } }
@keyframes ns-flicker { 0%, 18%, 22%, 62%, 66%, 100% { opacity: 1; } 20%, 64% { opacity: 0.55; } }
@keyframes ns-twinkle { 0%, 100% { opacity: 0.2; transform: scale(0.7); } 50% { opacity: 1; transform: scale(1); } }
@keyframes ns-tilt { 0%, 100% { transform: rotate(-4deg); } 50% { transform: rotate(4deg); } }
@keyframes ns-rise { 0% { transform: translateY(0) scale(0.6); opacity: 0; } 20% { opacity: 1; } 100% { transform: translateY(-34px) scale(1); opacity: 0; } }
@keyframes ns-march { to { transform: translateX(var(--ns-period, 24px)); } }
.ns-sweep { animation: ns-sweep 4.4s ease-in-out infinite; } .ns-flicker { animation: ns-flicker 3.6s linear infinite; }
.ns-twinkle { animation: ns-twinkle 1.8s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.ns-tilt { animation: ns-tilt 3.2s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.ns-beat { animation: ns-loop-beat 1.3s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
.ns-rise { animation: ns-rise 2.8s ease-out infinite; } .ns-march { animation: ns-march 1s linear infinite; }
.ns-still, .ns-still * { animation: none !important; }
@media (prefers-reduced-motion: reduce) {
  .ns [class*="ns-in-"] { animation: ns-in-fade 240ms linear both; }
  .ns [class*="ns-out-"] { animation: ns-out-fade 240ms linear both; }
  .ns [class*="ns-loop-"], .ns .ns-amb { animation: none; }
}
`;

const CREAM = "#fff7fb";
const STAR = "M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2 Z";
const HEART = "M256 448 C 120 340 32 260 32 160 C 32 96 84 48 148 48 C 196 48 236 76 256 116 C 276 76 316 48 364 48 C 428 48 480 96 480 160 C 480 260 392 340 256 448 Z";
const ABS: React.CSSProperties = { position: "absolute" };
const FILL: React.CSSProperties = { position: "absolute", top: 0, right: 0, bottom: 0, left: 0 };

interface Kit {
  u: (n: number) => number;
  accent: string;
  emoji: string;
  words: (o?: RowOpts) => React.ReactNode;
  row: (o?: RowOpts) => React.ReactNode;
}
interface RowOpts {
  size?: number;
  weight?: number;
  bare?: boolean;
  glow?: string;
}

function Design({ design, d }: { design: NoteDesign; d: Kit }) {
  const { u: n, accent: i } = d;
  const shadow = `drop-shadow(0 ${n(9)}px ${n(10)}px rgba(0,0,0,0.42))`;
  switch (design) {
    case "text":
      return <span style={{ display: "inline-block", padding: `${n(4)}px ${n(6)}px` }}>{d.row({ size: 28, weight: 900, bare: true })}</span>;
    case "underline":
      return (
        <span style={{ display: "inline-flex", flexDirection: "column", gap: n(7), padding: `${n(4)}px ${n(6)}px` }}>
          {d.row({ size: 28, weight: 900, bare: true })}
          <span style={{ position: "relative", height: n(6), borderRadius: 999, overflow: "hidden", backgroundImage: `linear-gradient(90deg, ${i}, ${mix(i, 0.35)} 55%, ${alpha(i, "00")})`, boxShadow: `0 0 ${n(10)}px ${alpha(i, "88")}` }}>
            <span className="ns-amb ns-sweep" aria-hidden style={{ ...ABS, top: 0, bottom: 0, left: 0, width: "26%", backgroundImage: "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.85), rgba(255,255,255,0))" }} />
          </span>
        </span>
      );
    case "marker":
      return (
        <span style={{ position: "relative", display: "inline-block", padding: `${n(8)}px ${n(18)}px` }}>
          <span aria-hidden style={{ ...ABS, left: n(8), right: n(-4), top: n(16), bottom: n(-2), background: alpha(i, "77"), borderRadius: `${n(10)}px ${n(4)}px ${n(12)}px ${n(3)}px`, transform: "skewX(-9deg) rotate(1deg)" }} />
          <span aria-hidden style={{ ...ABS, left: 0, right: 0, top: n(5), bottom: n(4), background: i, borderRadius: `${n(3)}px ${n(12)}px ${n(4)}px ${n(10)}px`, transform: "skewX(-9deg) rotate(-1deg)", boxShadow: `0 ${n(5)}px ${n(10)}px rgba(0,0,0,0.35)` }} />
          <span style={{ position: "relative" }}>{d.row({ size: 24, weight: 900 })}</span>
        </span>
      );
    case "pill":
      return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: n(12), padding: `${n(9)}px ${n(26)}px ${n(9)}px ${d.emoji ? n(9) : n(26)}px`, borderRadius: 999, backgroundImage: "linear-gradient(180deg, #1d2338, #0a0c14 75%)", boxShadow: `0 0 0 ${n(2.5)}px ${i}, 0 0 ${n(22)}px ${alpha(i, "66")}, 0 ${n(12)}px ${n(22)}px -${n(10)}px rgba(0,0,0,0.85)` }}>
          <span aria-hidden style={{ ...ABS, left: n(28), right: n(28), top: n(3), height: n(12), borderRadius: 999, backgroundImage: "linear-gradient(180deg, rgba(255,255,255,0.22), rgba(255,255,255,0))" }} />
          {d.emoji && (
            <span aria-hidden style={{ position: "relative", width: n(40), height: n(40), borderRadius: 999, display: "grid", placeItems: "center", flexShrink: 0, backgroundImage: `radial-gradient(circle at 35% 28%, ${mix(i, 0.35)}, ${mix(i, -0.45)})`, boxShadow: "inset 0 1px 0 rgba(255,255,255,0.4)", fontSize: n(20), lineHeight: 1 }}>
              {d.emoji}
            </span>
          )}
          <span style={{ position: "relative", padding: d.emoji ? undefined : `${n(7)}px 0` }}>{d.words()}</span>
        </span>
      );
    case "glass":
      return (
        <span style={{ position: "relative", display: "inline-block", padding: `${n(17)}px ${n(26)}px ${n(17)}px ${n(30)}px`, borderRadius: n(18), overflow: "hidden", backgroundImage: "linear-gradient(135deg, rgba(255,255,255,0.26), rgba(255,255,255,0.08))", boxShadow: `inset 0 0 0 1.5px rgba(255,255,255,0.42), inset 0 ${n(1.5)}px 0 rgba(255,255,255,0.6), 0 ${n(14)}px ${n(26)}px -${n(12)}px rgba(0,0,0,0.6)`, backdropFilter: "blur(6px)" }}>
          <span aria-hidden style={{ ...ABS, left: n(11), top: n(12), bottom: n(12), width: n(5), borderRadius: 999, background: i, boxShadow: `0 0 ${n(10)}px ${i}` }} />
          <span className="ns-amb ns-sweep" aria-hidden style={{ ...ABS, top: 0, bottom: 0, left: 0, width: "22%", backgroundImage: "linear-gradient(100deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))" }} />
          <span style={{ position: "relative" }}>{d.row({ glow: "0 1px 3px rgba(0,0,0,0.55)" })}</span>
        </span>
      );
    case "neon":
      return (
        <span style={{ position: "relative", display: "inline-block", padding: `${n(19)}px ${n(30)}px`, borderRadius: n(18), background: "rgba(8,6,16,0.84)" }}>
          <span className="ns-amb ns-flicker" aria-hidden style={{ ...FILL, borderRadius: n(18), border: `${n(3)}px solid ${mix(i, 0.4)}`, boxShadow: `0 0 ${n(6)}px ${i}, 0 0 ${n(18)}px ${i}, 0 0 ${n(34)}px ${alpha(i, "99")}, inset 0 0 ${n(14)}px ${alpha(i, "88")}` }} />
          <span aria-hidden style={{ ...ABS, top: n(8), right: n(8), bottom: n(8), left: n(8), borderRadius: n(11), border: "1.5px solid rgba(255,255,255,0.75)", boxShadow: "0 0 8px rgba(255,255,255,0.45)" }} />
          <span style={{ position: "relative" }}>{d.row({ glow: `0 0 ${n(3)}px #ffffff, 0 0 ${n(10)}px ${i}` })}</span>
        </span>
      );
    case "ribbon":
      return (
        <span style={{ position: "relative", display: "inline-block", padding: `0 ${n(26)}px ${n(10)}px`, filter: shadow }}>
          {(["left", "right"] as const).map((side) => (
            <span key={side} aria-hidden style={{ ...ABS, [side]: 0, top: n(10), bottom: 0, width: n(44), background: mix(i, -0.35), clipPath: side === "left" ? "polygon(0 0, 100% 0, 100% 100%, 0 100%, 28% 50%)" : "polygon(0 0, 100% 0, 72% 50%, 100% 100%, 0 100%)" }} />
          ))}
          <span aria-hidden style={{ ...ABS, left: n(26), bottom: 0, width: 0, height: 0, borderTop: `${n(10)}px solid ${mix(i, -0.62)}`, borderRight: `${n(18)}px solid transparent` }} />
          <span aria-hidden style={{ ...ABS, right: n(26), bottom: 0, width: 0, height: 0, borderTop: `${n(10)}px solid ${mix(i, -0.62)}`, borderLeft: `${n(18)}px solid transparent` }} />
          <span style={{ position: "relative", display: "block", padding: `${n(14)}px ${n(30)}px`, borderRadius: n(3), backgroundImage: `linear-gradient(180deg, ${mix(i, 0.16)}, ${i} 50%, ${mix(i, -0.18)})` }}>
            <span aria-hidden style={{ ...ABS, left: n(8), right: n(8), top: n(5), height: 0, borderTop: "1.5px dashed rgba(255,255,255,0.5)" }} />
            <span aria-hidden style={{ ...ABS, left: n(8), right: n(8), bottom: n(5), height: 0, borderTop: "1.5px dashed rgba(255,255,255,0.5)" }} />
            {d.row()}
          </span>
        </span>
      );
    case "tag":
      return (
        <span style={{ position: "relative", display: "inline-block", marginLeft: n(22), filter: shadow }}>
          <svg width={n(40)} height={n(36)} viewBox="0 0 40 36" aria-hidden style={{ ...ABS, left: n(-22), top: "50%", marginTop: n(-34), overflow: "visible" }}>
            <path d="M38 33 C26 30 14 18 4 3" fill="none" stroke="#e5e7eb" strokeWidth={2} strokeLinecap="round" />
          </svg>
          <span style={{ position: "relative", display: "block", padding: `${n(15)}px ${n(24)}px ${n(15)}px ${n(48)}px`, backgroundImage: `linear-gradient(180deg, ${mix(i, 0.18)}, ${i} 55%, ${mix(i, -0.16)})`, clipPath: `polygon(${n(22)}px 0, 100% 0, 100% 100%, ${n(22)}px 100%, 0 50%)`, borderRadius: `0 ${n(6)}px ${n(6)}px 0` }}>
            <span aria-hidden style={{ ...ABS, top: n(5), bottom: n(5), left: n(32), right: n(6), borderRadius: n(4), border: "1.5px dashed rgba(255,255,255,0.5)" }} />
            <span style={{ position: "relative" }}>{d.row()}</span>
          </span>
          <span aria-hidden style={{ ...ABS, left: n(15), top: "50%", marginTop: n(-6), width: n(12), height: n(12), borderRadius: 999, background: "rgba(0,0,0,0.55)", boxShadow: `inset 0 1px 2px rgba(0,0,0,0.6), 0 0 0 ${n(2)}px rgba(255,255,255,0.75)` }} />
        </span>
      );
    case "badge":
      return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "stretch", borderRadius: n(10), overflow: "hidden", boxShadow: `0 0 0 ${n(2)}px #ffffff, 0 ${n(12)}px ${n(20)}px -${n(8)}px rgba(0,0,0,0.6)` }}>
          <span aria-hidden style={{ display: "grid", placeItems: "center", minWidth: n(54), padding: `0 ${n(12)}px`, backgroundImage: `linear-gradient(180deg, ${mix(i, 0.2)}, ${i} 55%, ${mix(i, -0.2)})`, fontSize: n(24), lineHeight: 1 }}>
            {d.emoji || <span style={{ width: n(12), height: n(12), background: "#ffffff", transform: "rotate(45deg)", borderRadius: n(2) }} />}
          </span>
          <span style={{ position: "relative", display: "flex", alignItems: "center", padding: `${n(15)}px ${n(26)}px ${n(17)}px ${n(18)}px`, backgroundImage: "linear-gradient(180deg, #16233b, #0a1525)" }}>
            {d.words()}
            <span aria-hidden style={{ ...ABS, left: n(18), right: n(26), bottom: n(8), height: n(2.5), borderRadius: 999, background: i }} />
          </span>
        </span>
      );
    case "bubble":
      return (
        <span style={{ position: "relative", display: "inline-block", paddingBottom: n(12), filter: shadow }}>
          <span aria-hidden style={{ ...ABS, left: n(30), bottom: n(3), width: n(22), height: n(22), background: i, transform: "rotate(45deg)", borderRadius: `0 0 ${n(5)}px 0` }} />
          <span style={{ position: "relative", display: "block", padding: `${n(15)}px ${n(24)}px`, borderRadius: n(22), backgroundImage: `linear-gradient(180deg, ${mix(i, 0.14)}, ${i})` }}>{d.row()}</span>
        </span>
      );
    case "cloud":
      return (
        <span style={{ position: "relative", display: "inline-block", paddingTop: n(20), filter: `drop-shadow(0 ${n(4)}px 0 ${i}) drop-shadow(0 ${n(10)}px ${n(12)}px rgba(0,0,0,0.35))` }}>
          {([["10%", n(8), n(40)], ["30%", 0, n(56)], ["58%", n(9), n(42)]] as Array<[string, number, number]>).map(([left, top, size]) => (
            <span key={left} aria-hidden style={{ ...ABS, left, top, width: size, height: size, borderRadius: 999, background: "#ffffff" }} />
          ))}
          <svg width={n(40)} height={n(30)} viewBox="-20 -15 40 30" aria-hidden style={{ ...ABS, right: n(-8), top: n(-4), overflow: "visible" }}>
            <path className="ns-amb ns-twinkle" d={STAR} transform="translate(-6 0)" fill={i} />
            <path className="ns-amb ns-twinkle" d={STAR} transform="translate(10 -8) scale(0.55)" fill={i} style={{ animationDelay: "0.7s" }} />
          </svg>
          <span style={{ position: "relative", display: "block", padding: `${n(14)}px ${n(30)}px ${n(16)}px`, borderRadius: 999, backgroundImage: "linear-gradient(180deg, #ffffff, #eaf2ff)" }}>{d.row()}</span>
        </span>
      );
    case "kitty":
      return (
        <span style={{ position: "relative", display: "inline-block", paddingTop: n(26), filter: shadow }}>
          {(["left", "right"] as const).map((side) => (
            <svg key={side} width={n(48)} height={n(44)} viewBox="0 0 48 44" aria-hidden style={{ ...ABS, [side]: n(8), top: 0, transform: side === "right" ? "scaleX(-1)" : undefined }}>
              <path d="M5 42 L9 5 L44 34 Z" fill={i} stroke={i} strokeWidth={5} strokeLinejoin="round" />
              <path d="M14 35 L16 16 L34 31 Z" fill={mix(i, 0.55)} />
            </svg>
          ))}
          <span style={{ position: "relative", display: "block", padding: `${n(15)}px ${n(28)}px`, borderRadius: n(22), background: CREAM, boxShadow: `inset 0 0 0 ${n(4)}px ${i}` }}>{d.row()}</span>
          <svg width={n(30)} height={n(30)} viewBox="0 0 30 30" aria-hidden style={{ ...ABS, right: n(-10), bottom: n(-10), transform: "rotate(18deg)" }}>
            <ellipse cx="15" cy="19" rx="8" ry="7" fill={i} />
            <circle cx="6" cy="11" r="3.4" fill={i} />
            <circle cx="13" cy="6.5" r="3.6" fill={i} />
            <circle cx="21" cy="7.5" r="3.4" fill={i} />
            <circle cx="26" cy="13" r="3" fill={i} />
          </svg>
        </span>
      );
    case "bow":
      return (
        <span style={{ position: "relative", display: "inline-block", paddingTop: n(14), filter: shadow }}>
          <span style={{ position: "relative", display: "block", padding: `${n(15)}px ${n(28)}px ${n(15)}px ${n(34)}px`, borderRadius: n(20), background: CREAM, boxShadow: `inset 0 0 0 ${n(3)}px ${i}` }}>
            <span aria-hidden style={{ ...ABS, top: n(8), right: n(8), bottom: n(8), left: n(8), borderRadius: n(13), border: `2px dotted ${alpha(i, "aa")}` }} />
            <span style={{ position: "relative" }}>{d.row()}</span>
          </span>
          <svg width={n(70)} height={n(46)} viewBox="0 0 128 84" aria-hidden style={{ ...ABS, left: n(-18), top: n(-8), overflow: "visible" }}>
            <g className="ns-amb ns-tilt" fill={mix(i, 0.12)} stroke={mix(i, -0.25)} strokeWidth={3} strokeLinejoin="round">
              <path d="M58 46 C48 58 40 70 36 82 L50 76 L58 84 C60 72 62 60 64 48 Z" />
              <path d="M70 46 C80 58 88 70 92 82 L78 76 L70 84 C68 72 66 60 64 48 Z" />
              <path d="M60 40 C40 14 12 10 6 26 C0 44 16 62 34 60 C46 58 56 50 60 44 Z" />
              <path d="M68 40 C88 14 116 10 122 26 C128 44 112 62 94 60 C82 58 72 50 68 44 Z" />
              <rect x="53" y="30" width="22" height="24" rx="9" fill={i} />
            </g>
          </svg>
        </span>
      );
    case "heart":
      return (
        <span style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: n(11), padding: `${n(11)}px ${n(28)}px ${n(11)}px ${n(13)}px`, borderRadius: 999, backgroundImage: `linear-gradient(180deg, ${mix(i, 0.22)}, ${i} 55%, ${mix(i, -0.16)})`, boxShadow: `0 0 0 ${n(3)}px #ffffff, 0 0 ${n(20)}px ${alpha(i, "88")}, 0 ${n(12)}px ${n(20)}px -${n(10)}px rgba(0,0,0,0.6)` }}>
          <svg className="ns-amb ns-beat" width={n(38)} height={n(38)} viewBox="0 0 512 512" aria-hidden style={{ flexShrink: 0, display: "block", filter: "drop-shadow(0 2px 2px rgba(0,0,0,0.25))" }}>
            <path d={HEART} fill="#ffffff" />
          </svg>
          {d.row()}
          {([[n(26), 0, n(12)], [n(54), 0.9, n(9)], [n(12), 1.7, n(8)]] as Array<[number, number, number]>).map(([right, delay, size]) => (
            <svg key={right} className="ns-amb ns-rise" width={size} height={size} viewBox="0 0 512 512" aria-hidden style={{ ...ABS, right, top: n(-6), opacity: 0, animationDelay: `${delay}s` }}>
              <path d={HEART} fill="#ffffff" />
            </svg>
          ))}
        </span>
      );
    case "candy":
      return (
        <span style={{ position: "relative", display: "inline-block", padding: n(7), borderRadius: n(24), overflow: "hidden", background: "#ffffff", boxShadow: `0 ${n(12)}px ${n(20)}px -${n(10)}px rgba(0,0,0,0.6), 0 0 ${n(18)}px ${alpha(i, "55")}` }}>
          <span aria-hidden style={{ ...ABS, left: "-40%", right: "-40%", top: 0, bottom: 0, transform: "skewX(-32deg)" }}>
            <span className="ns-amb ns-march" style={{ ...ABS, left: n(-24), right: 0, top: 0, bottom: 0, ["--ns-period" as string]: `${n(24)}px`, backgroundImage: `repeating-linear-gradient(90deg, ${i} 0 ${n(12)}px, rgba(255,255,255,0) ${n(12)}px ${n(24)}px)` }} />
          </span>
          <span style={{ position: "relative", display: "block", padding: `${n(11)}px ${n(24)}px`, borderRadius: n(17), background: CREAM }}>{d.row()}</span>
        </span>
      );
    default: // sticky
      return (
        <span style={{ position: "relative", display: "inline-block", marginTop: n(10), transform: "rotate(-2deg)", filter: `drop-shadow(0 ${n(12)}px ${n(12)}px rgba(0,0,0,0.42))` }}>
          <span style={{ position: "relative", display: "block", padding: `${n(24)}px ${n(26)}px ${n(20)}px`, backgroundImage: `linear-gradient(165deg, ${mix(i, 0.24)}, ${i} 55%, ${mix(i, -0.1)})`, clipPath: `polygon(0 0, 100% 0, 100% calc(100% - ${n(18)}px), calc(100% - ${n(18)}px) 100%, 0 100%)` }}>
            {d.row()}
            <span aria-hidden style={{ ...ABS, right: 0, bottom: 0, width: 0, height: 0, borderTop: `${n(18)}px solid ${mix(i, -0.3)}`, borderRight: `${n(18)}px solid transparent` }} />
          </span>
          <span aria-hidden style={{ ...ABS, left: "50%", top: n(-10), width: n(86), height: n(22), marginLeft: n(-43), background: "rgba(255,255,255,0.6)", boxShadow: "0 1px 3px rgba(0,0,0,0.25)", transform: "rotate(-3deg)" }} />
        </span>
      );
  }
}

interface NoteProps {
  note: StreamNote;
  still?: boolean;
  enter?: NoteEnter;
  leaving?: boolean;
  delayMs?: number;
}

/** One note with its entrance, loop motion and optional periodic replay. */
export function NoteView({ note, still = false, enter, leaving = false, delayMs = 0 }: NoteProps) {
  const scale = Math.max(0.5, Math.min(2, (note.size || 100) / 100));
  const u = (n: number) => Math.round(n * scale * 100) / 100;
  const accent = note.accentColor || "#fbbf24";
  const ent = enter ?? note.enter;
  const replay = enter || still ? 0 : Math.max(0, Math.min(60, note.replayEvery || 0));
  const [replayKey, setReplayKey] = useState(0);

  useEffect(() => {
    if (!replay || ent === "none") return;
    const t = setInterval(() => setReplayKey((k) => k + 1), replay * 1000);
    return () => clearInterval(t);
  }, [replay, ent]);

  const words = (o?: RowOpts) => (
    <span
      dir="auto"
      style={{
        color: note.textColor,
        fontWeight: o?.weight ?? 800,
        fontSize: u(o?.size ?? 20),
        lineHeight: 1.3,
        whiteSpace: "nowrap",
        textShadow: note.textAnim ? undefined : o?.bare ? "0 1px 1px rgba(0,0,0,0.95), 0 0 3px rgba(0,0,0,0.85), 0 2px 10px rgba(0,0,0,0.55)" : o?.glow,
        ["--lb" as string]: accent,
      }}
    >
      <AnimatedOverlayName text={note.text} animation={note.textAnim || "none"} />
    </span>
  );
  const icon = note.icon ? <span aria-hidden style={{ fontSize: u(22), lineHeight: 1, flexShrink: 0 }}>{note.icon}</span> : null;
  const row = (o?: RowOpts) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: u(10) }}>
      {icon}
      {words(o)}
    </span>
  );
  const anim = leaving ? `ns-out-${ent === "none" ? "fade" : ent}` : ent !== "none" ? `ns-in-${ent}` : undefined;

  return (
    <div className={still ? "ns ns-still" : "ns"} style={{ display: "inline-block", fontFamily: note.fontFamily, lineHeight: 1 }}>
      <style>{CSS}</style>
      <div key={`${replayKey}`} className={anim} style={{ display: "inline-block", animationDelay: delayMs && !leaving ? `${delayMs}ms` : undefined }}>
        <div className={note.loop !== "none" ? `ns-loop-${note.loop}` : undefined} style={{ display: "inline-block" }}>
          <Design design={note.design} d={{ u, accent, emoji: note.icon || "", words, row }} />
        </div>
      </div>
    </div>
  );
}

/** All notes: stacked, or rotating one at a time. */
export function NotesGroup({ notes, display }: { notes: StreamNote[]; display: NotesDisplay }) {
  const rotate = display.mode === "rotate" && notes.length > 1;
  const [state, setState] = useState({ index: 0, phase: "in" as "in" | "out", turn: 0 });

  useEffect(() => {
    if (!rotate) return;
    const wait = state.phase === "out" ? 320 : Math.max(760, display.interval * 1000 - 320);
    const t = setTimeout(
      () =>
        setState((s) =>
          s.phase === "in" ? { ...s, phase: "out" } : { index: ((s.index % notes.length) + 1) % notes.length, phase: "in", turn: s.turn + 1 },
        ),
      wait,
    );
    return () => clearTimeout(t);
  }, [rotate, state, notes.length, display.interval]);

  if (!rotate) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 20 }}>
        {notes.map((n, i) => (
          <NoteView key={n.id} note={n} delayMs={140 * i} />
        ))}
      </div>
    );
  }
  const current = notes[state.index % notes.length];
  return <NoteView key={`${current.id}-${state.turn}`} note={current} enter={display.effect === "none" ? "up" : display.effect} leaving={state.phase === "out"} />;
}
