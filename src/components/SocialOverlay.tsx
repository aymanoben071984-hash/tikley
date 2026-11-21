"use client";

/** Social Media overlay — port of OverlayLive's rotating handle cards. */
import { SOCIAL_PLATFORMS } from "@/lib/socialPlatforms";
import {
  CLASSIC_SOCIAL,
  SOCIAL_MOTIONS,
  SOCIAL_PARTICLES,
  frameDesign,
  platformColor,
  platformLabel,
  type FrameDesign,
  type SocialConfig,
  type SocialLink,
} from "@/lib/socialMedia";
import { Bell, Heart } from "lucide-react";
import React, { useEffect, useId, useLayoutEffect, useRef, useState } from "react";

export function PlatformIcon({ platform, size = 24, color }: { platform: string; size?: number; color?: string }) {
  const p = SOCIAL_PLATFORMS[platform];
  if (!p) {
    return (
      <span style={{ width: size, height: size, fontSize: 0.6 * size, color: color ?? "#d946ef", display: "inline-flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>
        {(platform.trim()[0] ?? "@").toUpperCase()}
      </span>
    );
  }
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill={color ?? p.color} role="img" aria-label={p.label}>
      <path d={p.path} />
    </svg>
  );
}

/* ── shared enter/exit motion (OverlayLive "ov-enter / ov-exit") ── */
const OV_CSS = `
@keyframes ov-enter { from { opacity: var(--ov-in-o); transform: translate(var(--ov-in-x), var(--ov-in-y)) scale(var(--ov-in-s)) rotate(var(--ov-in-r)); } to { opacity: 1; transform: none; } }
@keyframes ov-exit { from { opacity: 1; transform: none; } to { opacity: var(--ov-out-o); transform: translate(var(--ov-out-x), var(--ov-out-y)) scale(var(--ov-out-s)) rotate(var(--ov-out-r)); } }
`;
interface Motion {
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  opacity?: number;
}
function ov(inM: Motion, outM: Motion, o: { exiting: boolean; inMs: number; outMs: number; inEase?: string }): React.CSSProperties {
  return {
    ["--ov-in-x" as string]: `${inM.x ?? 0}px`,
    ["--ov-in-y" as string]: `${inM.y ?? 0}px`,
    ["--ov-in-s" as string]: String(inM.scale ?? 1),
    ["--ov-in-r" as string]: `${inM.rotate ?? 0}deg`,
    ["--ov-in-o" as string]: String(inM.opacity ?? 0),
    ["--ov-out-x" as string]: `${outM.x ?? 0}px`,
    ["--ov-out-y" as string]: `${outM.y ?? 0}px`,
    ["--ov-out-s" as string]: String(outM.scale ?? 1),
    ["--ov-out-r" as string]: `${outM.rotate ?? 0}deg`,
    ["--ov-out-o" as string]: String(outM.opacity ?? 0),
    animationName: o.exiting ? "ov-exit" : "ov-enter",
    animationDuration: `${o.exiting ? o.outMs : o.inMs}ms`,
    animationTimingFunction: o.exiting ? "cubic-bezier(.4,0,1,1)" : o.inEase ?? "cubic-bezier(.2,.9,.3,1.12)",
    animationFillMode: "both",
  };
}
const BOUNCY = "cubic-bezier(.2,.9,.3,1.12)";

interface Shown {
  key: number;
  exiting: boolean;
}

const quote = (f: string) => `'${f.replace(/'/g, "")}'`;
function onColor(hex: string) {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return Number.isFinite(n) && full.length === 6 && (0.299 * ((n >> 16) & 255) + 0.587 * ((n >> 8) & 255) + 0.114 * (n & 255)) / 255 > 0.62 ? "#0b0b0f" : "#ffffff";
}
function lighten(hex: string, t: number) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const ch = (i: number) => {
    const v = parseInt(h.slice(i, i + 2), 16);
    return Math.round(v + (255 - v) * t).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

/* ── particles ── */
const GLYPH: Record<string, string> = { none: "", hearts: "❤", stars: "★", sparkles: "✦", bubbles: "" };
function Particles({ kind }: { kind: string }) {
  return (
    <div className={`sf-fx sf-fx--${kind}`} aria-hidden>
      {Array.from({ length: 14 }, (_, n) => (
        <span
          key={n}
          className="sf-fx-p"
          style={{ ["--x" as string]: `${4 + ((37 * n) % 70)}%`, ["--dl" as string]: `${((0.53 * n) % 3.4).toFixed(2)}s`, ["--dur" as string]: `${(3.8 + ((0.71 * n) % 2.6)).toFixed(2)}s`, ["--sz" as string]: `${12 + ((7 * n) % 14)}px`, ["--dx" as string]: `${((13 * n) % 26) - 13}px` }}
        >
          {GLYPH[kind]}
        </span>
      ))}
    </div>
  );
}

/* ── framed card (19 painted designs) ── */
function FrameCard({ design: e, link, label, color, config: o, shown, scale, fontScale }: { design: FrameDesign; link: SocialLink; label: string; color: string; config: SocialConfig; shown: Shown; scale: number; fontScale: number }) {
  const [ready, setReady] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  useEffect(() => {
    if (imgRef.current?.complete) setReady(true);
  }, []);
  const handle = link.label || link.url;
  const boxRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HTMLDivElement>(null);
  const fitRef = useRef(1);
  const [fit, setFit] = useState(1);
  const fits = !!e.text.w || !!e.extraRight;
  useLayoutEffect(() => {
    if (!fits) return;
    const h = handleRef.current;
    const b = boxRef.current;
    if (!h || !b) return;
    const need = h.scrollWidth / fitRef.current;
    const room = Math.max(0, b.clientWidth - 14);
    const next = need > room && need > 0 ? Math.max(0.45, room / need) : 1;
    if (Math.abs(next - fitRef.current) > 0.01) {
      fitRef.current = next;
      setFit(next);
    }
  }, [fits, handle, fontScale, e.id, o.fontFamily]);

  const W = e.width;
  const H = Math.round((W * e.frameH) / e.frameW);
  const sw = (e.socket.w / 100) * W;
  const sh = (e.socket.h / 100) * H;
  const dia = Math.min(sw, sh);
  const px = (n: number) => `${n.toFixed(1)}px`;
  const showPlat = o.showPlatform !== false;
  const glow = o.handleGlowColor || e.glow;
  const halo = o.cardGlowColor || color;
  const particles = (SOCIAL_PARTICLES as readonly string[]).includes(o.particles) ? o.particles : "none";
  const motion = (SOCIAL_MOTIONS as readonly string[]).includes(o.motion) ? o.motion : "none";
  const vars: Record<string, string> = {
    "--sf-w": px(W),
    "--sf-h": px(H),
    "--sf-card-w": px(W + (e.extraRight ?? 0)),
    "--sf-cx": px((e.socket.cx / 100) * W),
    "--sf-cy": px((e.socket.cy / 100) * H),
    "--sf-sw": px(sw),
    "--sf-sh": px(sh),
    "--sf-d": px(dia),
    "--sf-disc": px(dia * (e.socket.discScale ?? 0.9)),
    "--sf-text-x": px((e.text.x / 100) * W),
    "--sf-text-y": px((e.text.y / 100) * H),
    "--sf-text-w": e.text.w ? px((e.text.w / 100) * W) : "auto",
    "--sf-text-h": e.text.h ? px((e.text.h / 100) * H) : "auto",
    "--sf-handle-px": `${e.text.px ?? 36}px`,
    "--sf-label-x": e.labelSlot ? px((e.labelSlot.x / 100) * W) : "0px",
    "--sf-label-y": e.labelSlot ? px((e.labelSlot.y / 100) * H) : "0px",
    "--sf-label-w": e.labelSlot ? px((e.labelSlot.w / 100) * W) : "auto",
    "--sf-label-h": e.labelSlot?.h ? px((e.labelSlot.h / 100) * H) : "auto",
    "--sf-label-clip": e.labelSlot?.clip ?? "none",
    "--sf-plate-clip": e.text.clip ?? "none",
    "--sf-plate-x": px((e.text.x / 100) * W),
    "--sf-plate-y": px((e.text.y / 100) * H - ((e.text.h ?? 0) / 100) * H / 2),
    "--sf-plate-w": px(((e.text.w ?? 0) / 100) * W),
    "--sf-plate-h": px(((e.text.h ?? 0) / 100) * H),
    "--sf-font": quote(e.font),
    "--sf-ink": e.ink,
    "--sf-label-ink": e.labelInk,
    "--sf-glow": glow,
    "--sf-glow-soft": `${glow}80`,
    "--sf-halo-strong": `${halo}b3`,
    "--sf-halo-soft": `${halo}66`,
    "--sf-halo-faint": `${halo}2b`,
    "--brand": color,
    "--brand-ink": onColor(color),
    "--brand-soft": `${color}66`,
    "--brand-glow": `${color}99`,
    "--social-font-scale": String(fontScale),
    "--sf-fit": fit.toFixed(3),
  };
  if (o.fontFamily) vars["--social-font"] = quote(o.fontFamily);
  if (o.textColor) vars["--social-text-color"] = o.textColor;
  const textMotion = ov({ opacity: 0, x: -26 }, { opacity: 0, x: 26 }, { exiting: shown.exiting, inMs: 460, outMs: 240, inEase: BOUNCY });
  const iconMotion = ov({ opacity: 0, scale: 0.3, rotate: -120 }, { opacity: 0, scale: 0.3, rotate: 90 }, { exiting: shown.exiting, inMs: 520, outMs: 220, inEase: BOUNCY });
  const cls = ["sf-card", `sf-disc--${e.disc}`, o.handleGlow !== false ? "" : "sf-card--noglow", o.cardGlow ? "sf-card--halo" : "", motion !== "none" ? `sf-card--m-${motion}` : "", ready ? "sf-ready" : ""].filter(Boolean).join(" ");

  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <div dir="ltr" className={cls} style={vars as React.CSSProperties}>
        <div className="sf-frame-layer">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} className="sf-frame" src={e.frame} alt="" draggable={false} decoding="async" onLoad={() => setReady(true)} onError={() => setReady(true)} />
          {e.anim && (
            <div className="sf-anim-box" style={{ left: `${e.anim.x}%`, top: `${e.anim.y}%`, width: `${e.anim.w}%`, transform: e.anim.rotate ? `rotate(${e.anim.rotate}deg)` : undefined }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className={`sf-anim sf-anim--${e.anim.motion}`} src={e.anim.src} alt="" draggable={false} decoding="async" />
            </div>
          )}
          {particles !== "none" && <Particles kind={particles} />}
          {e.text.plate && <div className="sf-plate" />}
          <div className={`sf-socket sf-socket--${e.socket.shape}${e.socket.underFrame ? " sf-socket--under" : ""}`}>
            <div className="sf-disc" />
            <div key={shown.key} className="sf-icon" style={iconMotion}>
              <PlatformIcon platform={link.platform} size={Math.round(0.52 * dia)} />
            </div>
          </div>
        </div>
        {showPlat && e.labelSlot && (
          <div className={["sf-label-slot", e.labelSlot.fill ? "sf-label-slot--fill" : "", e.labelSlot.bare ? "sf-label-slot--bare" : ""].filter(Boolean).join(" ")}>
            <div key={shown.key} className="sf-text-motion" style={textMotion}>
              <div className="sf-label">{label}</div>
            </div>
          </div>
        )}
        <div ref={boxRef} className={["sf-text", e.text.align === "center" ? "sf-text--center" : "", e.text.plate ? "sf-text--plate" : ""].filter(Boolean).join(" ")}>
          <div key={shown.key} className="sf-text-motion" style={textMotion}>
            {showPlat && !e.labelSlot && <div className="sf-label">{label}</div>}
            <div ref={handleRef} className="sf-handle" dir="auto">
              {handle}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Bubble Pop ── */
function BubbleCard({ link, label, color, config: c, shown, scale, fontScale }: { link: SocialLink; label: string; color: string; config: SocialConfig; shown: Shown; scale: number; fontScale: number }) {
  const showPlat = c.showPlatform !== false;
  const glowOn = c.handleGlow !== false;
  const gc = c.handleGlowColor || color;
  const vars = { "--sb-color": color, "--sb-on": onColor(color), "--sb-glow": glowOn ? `${gc}aa` : "transparent", "--sb-glow-soft": glowOn ? `${gc}55` : "transparent" } as React.CSSProperties;
  const m = ov({ opacity: 0, scale: 0.92 }, { opacity: 0, scale: 0.8 }, { exiting: shown.exiting, inMs: 200, outMs: 240 });
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <div key={shown.key} dir="ltr" className="sb-card" style={{ ...m, ...vars, width: 420, height: 286, fontFamily: c.fontFamily ? quote(c.fontFamily) : undefined }}>
        <div className="sb-stage" aria-hidden>
          <span className="sb-pos sb-pos--dot1"><span className="sb-pop"><span className="sb-bubble sb-float" /></span></span>
          <span className="sb-pos sb-pos--dot2"><span className="sb-pop"><span className="sb-bubble sb-float" /></span></span>
          <span className="sb-pos sb-pos--heart"><span className="sb-pop"><span className="sb-bubble sb-float"><Heart className="sb-ico sb-ico--beat" fill="currentColor" strokeWidth={0} /></span></span></span>
          <span className="sb-pos sb-pos--main"><span className="sb-pop"><span className="sb-ring"><span className="sb-face"><PlatformIcon platform={link.platform} size={74} /></span></span></span></span>
          <span className="sb-pos sb-pos--bell"><span className="sb-pop"><span className="sb-bubble sb-float"><Bell className="sb-ico sb-ico--ring" fill="currentColor" strokeWidth={1.5} /></span></span></span>
        </div>
        <div className="sb-text">
          <div className="sb-handle truncate" dir="auto" style={{ fontSize: 38 * fontScale, color: c.textColor || undefined }}>
            {link.label || link.url}
          </div>
          {showPlat && <div className="sb-label" style={{ fontSize: 17 * fontScale }}>{label}</div>}
        </div>
      </div>
    </div>
  );
}

/* ── Flame ── */
const PLATE = { x: 44, y: 70, width: 452, height: 78, radius: 18 };
const prand = (a: number, b: number) => {
  const v = 43758.5453 * Math.sin(12.9898 * a + 78.233 * b);
  return v - Math.floor(v);
};
function perimeterPoint(d: number) {
  const { x, y, width, height, radius: r } = PLATE;
  const arc = (Math.PI / 2) * r;
  const top = width - 2 * r;
  const side = height - 2 * r;
  const corner = (cx: number, cy: number, start: number, dist: number) => {
    const a = start + (dist / arc) * (Math.PI / 2);
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r, nx: Math.cos(a), ny: Math.sin(a) };
  };
  let u = d;
  if (u < top) return { x: x + r + u, y, nx: 0, ny: -1 };
  if ((u -= top) < arc) return corner(x + width - r, y + r, -Math.PI / 2, u);
  if ((u -= arc) < side) return { x: x + width, y: y + r + u, nx: 1, ny: 0 };
  if ((u -= side) < arc) return corner(x + width - r, y + height - r, 0, u);
  if ((u -= arc) < top) return { x: x + width - r - u, y: y + height, nx: 0, ny: 1 };
  if ((u -= top) < arc) return corner(x + r, y + height - r, Math.PI / 2, u);
  if ((u -= arc) < side) return { x, y: y + height - r - u, nx: -1, ny: 0 };
  return corner(x + r, y + r, Math.PI, Math.min((u -= side), arc));
}
const f1 = (n: number) => n.toFixed(1);
const FLAME_LAYERS = [
  { id: "outer-a", tongues: 15, reach: 48, seed: 11 },
  { id: "outer-b", tongues: 17, reach: 43, seed: 47 },
  { id: "mid", tongues: 21, reach: 31, seed: 83 },
  { id: "core", tongues: 27, reach: 15, seed: 131 },
].map((L) => {
  const { width, height, radius } = PLATE;
  const per = 2 * (width - 2 * radius) + 2 * (height - 2 * radius) + 2 * Math.PI * radius;
  const step = per / L.tongues;
  const base = (k: number) => {
    const p = perimeterPoint(((k % L.tongues) * step) % per);
    return { x: p.x - 4 * p.nx, y: p.y - 4 * p.ny, nx: p.nx, ny: p.ny };
  };
  let d = "";
  for (let s = 0; s < L.tongues; s++) {
    const r = base(s);
    const i = base(s + 1);
    const o = perimeterPoint((s * step + 0.5 * step) % per);
    const c = -o.ny;
    const m = o.nx;
    const h = o.ny < 0 ? 0.55 + -(0.45 * o.ny) : 0.55 - 0.27 * o.ny;
    const xr = prand(L.seed, 3 * s + 1);
    const p = L.reach * h * (0.3 + 0.7 * xr * xr + 0.25 * xr);
    const g = (prand(L.seed, 3 * s + 2) - 0.5) * step * 1.1;
    const tip = { x: o.x + o.nx * p + c * g, y: o.y + o.ny * p + m * g - 0.28 * p };
    const b = { x: r.x + r.nx * p * 0.75 - c * step * 0.12, y: r.y + r.ny * p * 0.75 - m * step * 0.12 };
    const v = { x: tip.x - o.nx * p * 0.32 - c * g * 0.5, y: tip.y - o.ny * p * 0.32 - m * g * 0.5 + 0.1 * p };
    const w = { x: tip.x - o.nx * p * 0.5 + c * step * 0.1, y: tip.y - o.ny * p * 0.5 + m * step * 0.1 + 0.12 * p };
    const j = { x: i.x + i.nx * p * 0.22, y: i.y + i.ny * p * 0.22 };
    if (s === 0) d += `M${f1(r.x)} ${f1(r.y)}`;
    d += `C${f1(b.x)} ${f1(b.y)} ${f1(v.x)} ${f1(v.y)} ${f1(tip.x)} ${f1(tip.y)}C${f1(w.x)} ${f1(w.y)} ${f1(j.x)} ${f1(j.y)} ${f1(i.x)} ${f1(i.y)}`;
  }
  return { id: L.id, d: `${d}Z` };
});
const EMBERS = Array.from({ length: 7 }, (_, t) => ({ x: 14 + ((29 * t) % 72), dx: Math.round((prand(7, t) - 0.5) * 36), delay: Number(((0.47 * t) % 2.6).toFixed(2)), dur: Number((1.7 + 1.1 * prand(9, t)).toFixed(2)), size: 3 + (t % 3) }));

function FlameCard({ link, label, color, config: i, shown, scale, fontScale }: { link: SocialLink; label: string; color: string; config: SocialConfig; shown: Shown; scale: number; fontScale: number }) {
  const showPlat = i.showPlatform !== false;
  const g = i.handleGlowColor || color;
  const vars = { "--sfl-fire": g, "--sfl-hot": lighten(g, 0.5), "--sfl-core": lighten(g, 0.82), "--sfl-halo": i.handleGlow !== false ? `${lighten(g, 0)}88` : "transparent" } as React.CSSProperties;
  const m = ov({ opacity: 0, x: -22 }, { opacity: 0, x: 22 }, { exiting: shown.exiting, inMs: 420, outMs: 220, inEase: BOUNCY });
  const uid = `sfl${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const fill: Record<string, string> = { "outer-a": g, "outer-b": g, mid: lighten(g, 0.5), core: lighten(g, 0.82) };
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <div dir="ltr" className="sfl-card" style={{ ...vars, width: 540, height: 176, fontFamily: i.fontFamily ? quote(i.fontFamily) : undefined }}>
        <div className="sfl-fire" aria-hidden>
          {FLAME_LAYERS.map((L) => (
            <svg key={L.id} className={`sfl-layer sfl-layer--${L.id}`} viewBox="0 0 540 176" width={540} height={176}>
              <defs>
                <linearGradient id={`${uid}-${L.id}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2={PLATE.y}>
                  <stop offset="0" stopColor={fill[L.id]} stopOpacity="0.15" />
                  <stop offset="1" stopColor={fill[L.id]} stopOpacity="1" />
                </linearGradient>
              </defs>
              <path d={L.d} fill={`url(#${uid}-${L.id})`} />
            </svg>
          ))}
          {EMBERS.map((e, n) => (
            <span key={n} className="sfl-ember" style={{ left: `${e.x}%`, width: e.size, height: e.size, ["--dx" as string]: `${e.dx}px`, animationDelay: `${e.delay}s`, animationDuration: `${e.dur}s` }} />
          ))}
        </div>
        <div className="sfl-plate" style={{ left: PLATE.x, top: PLATE.y, width: PLATE.width, height: PLATE.height, borderRadius: PLATE.radius }}>
          <div key={shown.key} className="sfl-row" style={m}>
            <span className="sfl-logo"><PlatformIcon platform={link.platform} size={42} /></span>
            <div className="sfl-text">
              {showPlat && <div className="sfl-label" style={{ fontSize: 12 * fontScale }}>{label}</div>}
              <div className="sfl-handle truncate" dir="auto" style={{ fontSize: (showPlat ? 30 : 34) * fontScale, color: i.textColor || undefined }}>
                {link.label || link.url}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── classic styles (Voltage, Frost, Classic, Lumen, Rose) ── */
function ClassicCard({ id, link, label, color, config: e, shown, scale, fontScale }: { id: string; link: SocialLink; label: string; color: string; config: SocialConfig; shown: Shown; scale: number; fontScale: number }) {
  const showPlat = e.showPlatform !== false;
  const t = CLASSIC_SOCIAL[id] ?? CLASSIC_SOCIAL.glassy;
  const vars: Record<string, string> = { "--social-color": color, "--social-glow": e.handleGlowColor || color, "--social-color-alpha": `${color}25`, "--social-font-scale": String(fontScale) };
  if (e.fontFamily) vars["--social-font"] = quote(e.fontFamily);
  if (e.textColor) vars["--social-text-color"] = e.textColor;
  const m = ov({ opacity: 0, x: -30, scale: 0.9 }, { opacity: 0, x: 30, scale: 0.9 }, { exiting: shown.exiting, inMs: 460, outMs: 240, inEase: BOUNCY });
  return (
    <div style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
      <div key={shown.key} className={id === "cyber-blade" ? "social-stage" : t.wrapper} style={{ ...m, ...(vars as React.CSSProperties), fontFamily: e.fontFamily || undefined }}>
        {id === "cyber-blade" ? (
          <>
            <div className="social-badge-container">
              <div className="social-badge-glow" />
              <div className="social-badge"><PlatformIcon platform={link.platform} size={30} /></div>
            </div>
            <div className="social-divider" />
            <div className="social-content">
              {showPlat && <div className="social-platform">{label}</div>}
              <div className="social-handle">{link.label || link.url}</div>
            </div>
          </>
        ) : (
          <div className={t.item}>
            <div className={t.icon} style={{ color }}><PlatformIcon platform={link.platform} size={30} /></div>
            <div className="flex flex-col">
              {showPlat && <div className={t.labelCls ?? "uppercase tracking-widest opacity-70"} style={{ fontSize: 11 * fontScale }}>{label}</div>}
              <div className={t.text} style={{ fontSize: (t.handlePx ?? 26) * fontScale, color: e.textColor || undefined }}>
                {link.label || link.url}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/** Rotating social card — one handle at a time, with enter / exit motion. */
export function SocialRotator({ config, forceIndex }: { config: SocialConfig; forceIndex?: number }) {
  const [index, setIndex] = useState(0);
  const [shown, setShown] = useState<{ item: number; key: number; exiting: boolean }>({ item: 0, key: 0, exiting: false });

  useEffect(() => {
    setIndex(0);
    if (config.links.length <= 1 || forceIndex !== undefined) return;
    const t = setInterval(() => setIndex((i) => (i + 1) % config.links.length), config.intervalMs);
    return () => clearInterval(t);
  }, [config.links.length, config.intervalMs, forceIndex]);

  const target = forceIndex ?? index;
  useEffect(() => {
    if (target === shown.item && !shown.exiting) return;
    setShown((s) => ({ ...s, exiting: true }));
    const t = setTimeout(() => setShown((s) => ({ item: target, key: s.key + 1, exiting: false })), 240);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  if (config.links.length === 0) return null;
  const link = config.links[shown.item % config.links.length];
  const color = platformColor(link.platform);
  const label = platformLabel(link.platform);
  const scale = (config.scale ?? 100) / 100;
  const fontScale = (config.fontSize ?? 100) / 100;
  const s = { key: shown.key, exiting: shown.exiting };
  const frame = frameDesign(config.design);
  return (
    <>
      <style>{OV_CSS}</style>
      {frame ? (
        <FrameCard key={frame.id} design={frame} link={link} label={label} color={color} config={config} shown={s} scale={scale} fontScale={fontScale} />
      ) : config.design === "flame" ? (
        <FlameCard link={link} label={label} color={color} config={config} shown={s} scale={scale} fontScale={fontScale} />
      ) : config.design === "bubble-pop" ? (
        <BubbleCard link={link} label={label} color={color} config={config} shown={s} scale={scale} fontScale={fontScale} />
      ) : (
        <ClassicCard id={config.design} link={link} label={label} color={color} config={config} shown={s} scale={scale} fontScale={fontScale} />
      )}
    </>
  );
}
