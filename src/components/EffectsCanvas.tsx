"use client";

import type { AmbienceSettings, ScreenEffectId } from "@/lib/screenEffects";
import React, { useEffect, useRef } from "react";

export interface BurstSignal {
  id: number | string;
  effect: ScreenEffectId;
  size: number; // 20–100
  durationSec: number;
}

interface P {
  fx: ScreenEffectId;
  kind: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rot: number;
  vr: number;
  life: number;
  max: number;
  color: string;
  phase: number;
  glyph?: string;
  targetY?: number;
}

const CONFETTI = ["#f43f5e", "#22d3ee", "#facc15", "#a855f7", "#10b981", "#fb923c", "#ec4899"];
const GOLD = ["#facc15", "#fde68a", "#f59e0b", "#ffffff"];
const FIREWORK = ["#facc15", "#22d3ee", "#f43f5e", "#a855f7", "#10b981", "#fb923c", "#ffffff"];
const LEAF = ["#f97316", "#ea580c", "#facc15", "#b45309", "#dc2626"];

/** Particles spawned per second at intensity 100 (ambience). */
const RATE: Record<ScreenEffectId, number> = {
  snow: 70, stars: 14, confetti: 45, hearts: 16, rain: 160, sakura: 22, fireworks: 1.4, bubbles: 14,
  leaves: 14, money: 14, sparkles: 26, fireflies: 6, ramadan: 8, eid: 18, newyear: 30,
};

const R = Math.random;
const pick = <T,>(a: T[]) => a[Math.floor(R() * a.length)];

function spawn(fx: ScreenEffectId, w: number, h: number, tint: string | null, burst: boolean): P[] {
  const base: P = { fx, kind: fx, x: R() * w, y: -20, vx: 0, vy: 0, size: 6, rot: R() * Math.PI * 2, vr: 0, life: 0, max: 12, color: tint ?? "#ffffff", phase: R() * Math.PI * 2 };
  const s = Math.min(w, h) / 900; // scale with screen
  switch (fx) {
    case "snow":
      return [{ ...base, vy: (30 + R() * 50) * s * 2, vx: (R() - 0.5) * 20 * s, size: (2 + R() * 4.5) * s * 2, color: tint ?? "#ffffff" }];
    case "rain":
      return [{ ...base, vy: (700 + R() * 400) * s, vx: -60 * s, size: (12 + R() * 16) * s, color: tint ?? "#bfdbfe", max: 4 }];
    case "confetti":
      return [{ ...base, vy: (90 + R() * 120) * s, vx: (R() - 0.5) * 80 * s, vr: (R() - 0.5) * 8, size: (6 + R() * 6) * s * 1.6, color: pick(CONFETTI) }];
    case "hearts":
      return [{ ...base, kind: "rise", y: h + 30, vy: -(60 + R() * 90) * s * 1.6, size: (14 + R() * 22) * s * 1.6, color: tint ?? pick(["#ff2d55", "#ff6b9d", "#fb7185", "#e879f9"]) }];
    case "sakura":
      return [{ ...base, vy: (40 + R() * 50) * s * 1.6, vx: (20 + R() * 40) * s, vr: (R() - 0.5) * 3, size: (6 + R() * 7) * s * 1.6, color: tint ?? pick(["#fbcfe8", "#f9a8d4", "#fda4af"]) }];
    case "leaves":
      return [{ ...base, vy: (50 + R() * 60) * s * 1.5, vx: (R() - 0.3) * 60 * s, vr: (R() - 0.5) * 4, size: (10 + R() * 10) * s * 1.6, color: pick(LEAF) }];
    case "money":
      return [{ ...base, kind: "glyph", glyph: pick(["💵", "💵", "💸", "🪙"]), vy: (90 + R() * 100) * s * 1.6, vx: (R() - 0.5) * 50 * s, vr: (R() - 0.5) * 3, size: (24 + R() * 18) * s * 1.6 }];
    case "bubbles":
      return [{ ...base, kind: "rise", y: h + 30, vy: -(50 + R() * 70) * s * 1.6, size: (8 + R() * 22) * s * 1.6, color: tint ?? "#a5f3fc" }];
    case "stars":
      return [{ ...base, kind: "twinkle", x: R() * w, y: R() * h, size: (2 + R() * 4) * s * 2, max: 3 + R() * 3, color: tint ?? "#fef9c3" }];
    case "sparkles":
      return [{ ...base, kind: "twinkle", x: R() * w, y: R() * h, size: (8 + R() * 14) * s * 1.6, max: 1.2 + R() * 1.4, color: tint ?? pick(["#ffffff", "#fde68a", "#a5f3fc"]) }];
    case "fireflies":
      return [{ ...base, kind: "wander", x: R() * w, y: h * (0.3 + R() * 0.7), vx: (R() - 0.5) * 40 * s, vy: (R() - 0.5) * 30 * s, size: (3 + R() * 3) * s * 2, max: 6 + R() * 6, color: tint ?? "#bef264" }];
    case "ramadan": {
      const g = pick(["🏮", "🏮", "🌙", "⭐", "✨"]);
      return [{ ...base, kind: "glyph", glyph: g, vy: (30 + R() * 30) * s * 1.6, vx: 0, size: (g === "🏮" ? 34 : 22 + R() * 10) * s * 1.6, max: 20 }];
    }
    case "eid":
      if (R() < 0.35) return [{ ...base, kind: "glyph", glyph: pick(["🌙", "🎈", "🎁", "⭐"]), y: h + 30, vy: -(50 + R() * 50) * s * 1.6, size: (26 + R() * 14) * s * 1.6 }];
      return [{ ...base, vy: (90 + R() * 110) * s, vx: (R() - 0.5) * 80 * s, vr: (R() - 0.5) * 8, size: (6 + R() * 6) * s * 1.6, color: pick(GOLD) }];
    case "newyear":
      if (R() < (burst ? 0.12 : 0.05)) return rocket(w, h, s);
      return [{ ...base, vy: (90 + R() * 120) * s, vx: (R() - 0.5) * 80 * s, vr: (R() - 0.5) * 8, size: (6 + R() * 6) * s * 1.6, color: pick(GOLD) }];
    case "fireworks":
      return rocket(w, h, s);
    default:
      return [base];
  }
}

function rocket(w: number, h: number, s: number): P[] {
  return [{ fx: "fireworks", kind: "rocket", x: w * (0.15 + R() * 0.7), y: h + 10, vx: (R() - 0.5) * 60 * s, vy: -(700 + R() * 300) * s, size: 3 * s * 2, rot: 0, vr: 0, life: 0, max: 3, color: pick(FIREWORK), phase: 0, targetY: h * (0.15 + R() * 0.35) }];
}

function explode(p: P, s: number): P[] {
  const out: P[] = [];
  const n = 70;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const sp = (180 + R() * 220) * s;
    out.push({ fx: "fireworks", kind: "spark", x: p.x, y: p.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, size: (2 + R() * 2) * s * 2, rot: 0, vr: 0, life: 0, max: 1.4 + R() * 0.8, color: R() < 0.2 ? "#ffffff" : p.color, phase: 0 });
  }
  return out;
}

function heartPath(ctx: CanvasRenderingContext2D, size: number) {
  const s = size / 2;
  ctx.beginPath();
  ctx.moveTo(0, s * 0.6);
  ctx.bezierCurveTo(-s * 1.4, -s * 0.3, -s * 0.6, -s * 1.4, 0, -s * 0.5);
  ctx.bezierCurveTo(s * 0.6, -s * 1.4, s * 1.4, -s * 0.3, 0, s * 0.6);
  ctx.closePath();
}

function draw(ctx: CanvasRenderingContext2D, p: P) {
  const fade = Math.min(1, p.life / 0.3) * Math.min(1, (p.max - p.life) / 0.6);
  ctx.save();
  ctx.translate(p.x, p.y);
  switch (p.kind) {
    case "snow":
      ctx.globalAlpha = 0.9 * fade;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 1.5;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "rain":
      ctx.globalAlpha = 0.55 * fade;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = Math.max(1, p.size / 12);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-p.size * 0.08, p.size);
      ctx.stroke();
      break;
    case "confetti":
    case "eid":
    case "newyear":
      ctx.globalAlpha = fade;
      ctx.rotate(p.rot);
      ctx.scale(1, Math.cos(p.phase + p.life * 6));
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
      break;
    case "rise":
      if (p.fx === "hearts") {
        ctx.globalAlpha = 0.95 * fade;
        ctx.rotate(Math.sin(p.phase + p.life * 2) * 0.25);
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = p.size * 0.6;
        heartPath(ctx, p.size);
        ctx.fill();
      } else {
        ctx.globalAlpha = 0.7 * fade;
        const g = ctx.createRadialGradient(-p.size * 0.3, -p.size * 0.3, 0, 0, 0, p.size);
        g.addColorStop(0, "rgba(255,255,255,.85)");
        g.addColorStop(0.5, "rgba(255,255,255,.08)");
        g.addColorStop(1, p.color);
        ctx.fillStyle = g;
        ctx.strokeStyle = "rgba(255,255,255,.55)";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(0, 0, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      break;
    case "sakura":
      ctx.globalAlpha = 0.95 * fade;
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,.35)";
      ctx.beginPath();
      ctx.ellipse(-p.size * 0.25, -p.size * 0.12, p.size * 0.35, p.size * 0.18, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    case "leaves":
      ctx.globalAlpha = fade;
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.quadraticCurveTo(p.size * 0.8, 0, 0, p.size);
      ctx.quadraticCurveTo(-p.size * 0.8, 0, 0, -p.size);
      ctx.fill();
      ctx.strokeStyle = "rgba(0,0,0,.25)";
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.lineTo(0, p.size);
      ctx.stroke();
      break;
    case "glyph":
      ctx.globalAlpha = fade;
      ctx.rotate(p.fx === "ramadan" ? Math.sin(p.phase + p.life * 1.5) * 0.18 : p.rot);
      ctx.font = `${p.size}px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if (p.fx === "ramadan") {
        ctx.shadowColor = "#fbbf24";
        ctx.shadowBlur = p.size * 0.6;
      }
      ctx.fillText(p.glyph ?? "✨", 0, 0);
      break;
    case "twinkle": {
      const tw = Math.sin((p.life / p.max) * Math.PI);
      ctx.globalAlpha = tw;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 2;
      const r = p.size * (0.6 + tw * 0.4);
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const rad = i % 2 === 0 ? r : r * 0.25;
        const a = (Math.PI / 4) * i - Math.PI / 2;
        if (i) ctx.lineTo(Math.cos(a) * rad, Math.sin(a) * rad);
        else ctx.moveTo(Math.cos(a) * rad, Math.sin(a) * rad);
      }
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "wander": {
      const glow = 0.5 + 0.5 * Math.sin(p.phase + p.life * 3);
      ctx.globalAlpha = glow * fade;
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.size * 5);
      g.addColorStop(0, p.color);
      g.addColorStop(0.25, p.color);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(0, 0, p.size * 5, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "rocket":
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.4;
      ctx.fillRect(-p.size / 3, 0, (p.size * 2) / 3, p.size * 8);
      break;
    case "spark":
      ctx.globalAlpha = Math.max(0, 1 - p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = p.size * 4;
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fill();
      break;
  }
  ctx.restore();
}

interface EffectsCanvasProps {
  ambience: AmbienceSettings;
  burst?: BurstSignal | null;
  className?: string;
}

/** Full-screen particle layer: continuous ambience + one-shot bursts. */
export function EffectsCanvas({ ambience, burst, className = "" }: EffectsCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ambRef = useRef(ambience);
  const bursts = useRef<Array<{ effect: ScreenEffectId; until: number; rate: number; acc: number }>>([]);
  ambRef.current = ambience;

  useEffect(() => {
    if (!burst) return;
    const rate = Math.max(RATE[burst.effect] * 3, 10) * (burst.size / 50);
    bursts.current.push({ effect: burst.effect, until: performance.now() + burst.durationSec * 1000, rate, acc: 0 });
  }, [burst]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    let particles: P[] = [];
    let raf = 0;
    let last = performance.now();
    let acc = 0;
    let w = 0;
    let h = 0;

    const resize = () => {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.round(w * dpr));
      canvas.height = Math.max(1, Math.round(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const a = ambRef.current;
      const speed = a.speed;
      const s = Math.min(w, h) / 900;

      if (a.enabled && a.intensity > 0 && !reduced) {
        acc += RATE[a.effect] * (a.intensity / 100) * dt;
        while (acc >= 1 && particles.length < 900) {
          acc -= 1;
          particles.push(...spawn(a.effect, w, h, a.tint, false));
        }
      } else {
        acc = 0;
      }
      bursts.current = bursts.current.filter((b) => b.until > now);
      for (const b of bursts.current) {
        b.acc += b.rate * dt;
        while (b.acc >= 1 && particles.length < 1400) {
          b.acc -= 1;
          particles.push(...spawn(b.effect, w, h, null, true));
        }
      }

      const next: P[] = [];
      for (const p of particles) {
        const k = p.kind === "spark" || p.kind === "rocket" ? 1 : speed;
        p.life += dt * (p.kind === "twinkle" ? speed : 1);
        if (p.kind === "rocket") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vy += 300 * s * dt;
          if (p.y <= (p.targetY ?? 0) || p.vy >= 0) {
            next.push(...explode(p, s));
            continue;
          }
        } else if (p.kind === "spark") {
          p.x += p.vx * dt;
          p.y += p.vy * dt;
          p.vx *= 0.985;
          p.vy = p.vy * 0.985 + 160 * s * dt;
        } else if (p.kind === "wander") {
          p.vx += (R() - 0.5) * 60 * s * dt;
          p.vy += (R() - 0.5) * 60 * s * dt;
          p.x += p.vx * dt * k;
          p.y += p.vy * dt * k;
        } else if (p.kind !== "twinkle") {
          const sway = p.kind === "snow" || p.kind === "sakura" || p.kind === "leaves" || p.kind === "rise" ? Math.sin(p.phase + p.life * 1.6) * 30 * s : 0;
          p.x += (p.vx + sway) * dt * k;
          p.y += p.vy * dt * k;
          p.rot += p.vr * dt * k;
        }
        const out = p.y > h + 60 || p.y < -80 || p.x < -80 || p.x > w + 80;
        const dead = p.life >= p.max && (p.kind === "twinkle" || p.kind === "wander" || p.kind === "spark" || p.kind === "rain");
        if (!dead && !(out && p.life > 0.5)) next.push(p);
      }
      particles = next;

      ctx.clearRect(0, 0, w, h);
      for (const p of particles) draw(ctx, p);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvasRef} className={`pointer-events-none block h-full w-full ${className}`} aria-hidden />;
}
