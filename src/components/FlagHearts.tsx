"use client";

/**
 * Glossy 3D heart balloons wearing flags, turning gently.
 * Port of OverlayLive's flag-hearts renderer: an implicit heart surface is
 * ray-marched once into a 156-frame sprite sheet (13 × 12 cells of 128 px)
 * with shading + gloss, the flag is wrapped onto it, and CSS steps through
 * the frames so the heart turns.
 */
import { FH_PERIOD_MS, flagImage, type FlagHeartsConfig, type FlagPosition } from "@/lib/flagHearts";
import React, { useEffect, useRef, useState } from "react";

const CELL = 128;
const COLS = 13;
const ROWS = 12;
const FRAMES = COLS * ROWS; // 156
const FLAG_W = 160;
const FLAG_H = 120;
const EMPTY = 65535;

const CBRT_K = Math.cbrt(0.014);
/** Implicit heart surface: negative inside. */
function heart(x: number, y: number, z: number) {
  const r = x / 1.09;
  return r * r + y * y + 10 * z * z - 1 - (Math.cbrt(r * r + 0.014) - CBRT_K) * y;
}

const LN = Math.hypot(-0.42, 0.62, 0.66 + 1);
const LX = -0.42 / LN;
const LY = 0.62 / LN;
const LZ = (0.66 + 1) / LN;
const ZMAX = 1 / Math.sqrt(10) + 0.02;

// results of the last successful trace
let hitTex = EMPTY;
let hitShade = 0;
let hitGloss = 0;

/** Trace one pixel (x, y) of the heart rotated by (cos, sin) around Y. */
function trace(x: number, y: number, cos: number, sin: number): boolean {
  if (y > 1.27 || y < -1.03) return false;
  let tMax = 4;
  let tMin = -4;
  if (Math.abs(cos) > 1e-6) {
    const a = (ZMAX - x * sin) / cos;
    const b = (-ZMAX - x * sin) / cos;
    tMax = Math.min(tMax, Math.max(a, b));
    tMin = Math.max(tMin, Math.min(a, b));
  } else if (Math.abs(x * sin) > ZMAX) return false;
  if (Math.abs(sin) > 1e-6) {
    const a = (x * cos - 1.308) / sin;
    const b = (x * cos + 1.308) / sin;
    tMax = Math.min(tMax, Math.max(a, b));
    tMin = Math.max(tMin, Math.min(a, b));
  } else if (Math.abs(x * cos) > 1.308) return false;
  if (tMax <= tMin) return false;

  const step = (tMax - tMin) / 14;
  let prev = tMax;
  let hit = NaN;
  if (heart(x * cos - prev * sin, y, x * sin + prev * cos) < 0) hit = prev;
  else
    for (let k = 1; k <= 14; k++) {
      const t = tMax - k * step;
      if (heart(x * cos - t * sin, y, x * sin + t * cos) < 0) {
        let lo = prev;
        let hi = t;
        for (let j = 0; j < 7; j++) {
          const mid = (lo + hi) / 2;
          if (heart(x * cos - mid * sin, y, x * sin + mid * cos) < 0) hi = mid;
          else lo = mid;
        }
        hit = (lo + hi) / 2;
        break;
      }
      prev = t;
    }
  if (hit !== hit) return false;

  const px = x * cos - hit * sin;
  const pz = x * sin + hit * cos;
  const r = px / 1.09;
  const w = Math.cbrt(r * r + 0.014);
  let nx = (2 * r - (2 * y * r) / (3 * w * w)) / 1.09;
  let ny = 2 * y - (w - CBRT_K);
  let nz = 20 * pz;
  const nl = Math.hypot(nx, ny, nz) || 1;
  nx /= nl;
  ny /= nl;
  nz /= nl;
  const vx = nx * cos + nz * sin;
  const vz = -nx * sin + nz * cos;
  const diffuse = Math.max(0, (-0.42 * vx + 0.62 * ny + 0.66 * vz + 0.35) / 1.35);
  const rim = 1 - Math.max(0, vz);
  hitShade = 0.5 + 0.62 * diffuse - 0.16 * rim * rim;
  const spec = Math.max(0, vx * LX + ny * LY + vz * LZ);
  const s2 = spec * spec;
  const s8 = s2 * s2 * s2 * s2;
  const s32 = s8 * s8 * s8 * s8;
  hitGloss = 0.62 * s32 * s32 + 0.2 * s8 * s2;
  let u = (px + 1.2644) / 2.5288;
  if (pz < 0) u = 1 - u;
  hitTex =
    FLAG_W * Math.min(FLAG_H - 1, Math.max(0, Math.floor(((1.24 - y) / 2.24) * FLAG_H))) +
    Math.min(FLAG_W - 1, Math.max(0, Math.floor(FLAG_W * u)));
  return true;
}

interface Sheet {
  tex: Uint16Array;
  shade: Uint8Array;
  gloss: Uint8Array;
  alpha: Uint8Array;
}

const yieldFrame = () => new Promise<void>((r) => setTimeout(r, 0));
let sheetPromise: Promise<Sheet> | null = null;

/** Trace all 156 frames once (shared by every heart on the page). */
function buildSheet(): Promise<Sheet> {
  if (sheetPromise) return sheetPromise;
  sheetPromise = (async () => {
    const n = FRAMES * CELL * CELL;
    const sheet: Sheet = { tex: new Uint16Array(n).fill(EMPTY), shade: new Uint8Array(n), gloss: new Uint8Array(n), alpha: new Uint8Array(n) };
    const mask = new Uint8Array(CELL * CELL);
    const sub = [0.25, 0.75];
    let t0 = performance.now();
    for (let f = 0; f < FRAMES; f++) {
      const ang = (f / FRAMES) * Math.PI;
      const cos = Math.cos(ang);
      const sin = Math.sin(ang);
      const base = f * CELL * CELL;
      const toX = (v: number) => ((v / CELL) * 2 - 1) * 1.42;
      const toY = (v: number) => (1 - (v / CELL) * 2) * 1.42 + 0.1;
      for (let row = 0; row < CELL; row++) {
        const yy = toY(row + 0.5);
        for (let col = 0; col < CELL; col++) {
          const idx = row * CELL + col;
          if (trace(toX(col + 0.5), yy, cos, sin)) {
            mask[idx] = 1;
            sheet.tex[base + idx] = hitTex;
            sheet.shade[base + idx] = Math.min(255, Math.max(0, Math.round(128 * hitShade)));
            sheet.gloss[base + idx] = Math.min(255, Math.round(255 * hitGloss));
            sheet.alpha[base + idx] = 255;
          } else mask[idx] = 0;
        }
      }
      // anti-alias the silhouette with 2×2 supersampling
      for (let row = 0; row < CELL; row++)
        for (let col = 0; col < CELL; col++) {
          const idx = row * CELL + col;
          const v = mask[idx];
          let edge = false;
          for (let dy = -1; dy <= 1 && !edge; dy++)
            for (let dx = -1; dx <= 1; dx++) {
              const rr = row + dy;
              const cc = col + dx;
              const nv = rr < 0 || rr >= CELL || cc < 0 || cc >= CELL ? 0 : mask[rr * CELL + cc];
              if (nv !== v) {
                edge = true;
                break;
              }
            }
          if (!edge) continue;
          let hits = 0;
          let tex = EMPTY;
          let sh = 0;
          let gl = 0;
          for (let a = 0; a < 2; a++)
            for (let b = 0; b < 2; b++)
              if (trace(toX(col + sub[b]), toY(row + sub[a]), cos, sin)) {
                hits++;
                sh += hitShade;
                gl += hitGloss;
                if (tex === EMPTY) tex = hitTex;
              }
          const o = base + idx;
          if (!hits) {
            sheet.tex[o] = EMPTY;
            sheet.alpha[o] = 0;
            continue;
          }
          sheet.tex[o] = tex;
          sheet.shade[o] = Math.min(255, Math.max(0, Math.round((sh / hits) * 128)));
          sheet.gloss[o] = Math.min(255, Math.round((gl / hits) * 255));
          sheet.alpha[o] = Math.round((hits / 4) * 255);
        }
      if (performance.now() - t0 > 5) {
        await yieldFrame();
        t0 = performance.now();
      }
    }
    return sheet;
  })();
  return sheetPromise;
}

const flagCache = new Map<string, Promise<Uint8ClampedArray | null>>();

function loadFlag(code: string): Promise<Uint8ClampedArray | null> {
  const hit = flagCache.get(code);
  if (hit) return hit;
  const src = flagImage(code);
  const p = new Promise<Uint8ClampedArray | null>((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = FLAG_W;
        c.height = FLAG_H;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        if (!ctx) return resolve(null);
        ctx.drawImage(img, 0, 0, FLAG_W, FLAG_H);
        resolve(ctx.getImageData(0, 0, FLAG_W, FLAG_H).data);
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  flagCache.set(code, p);
  while (flagCache.size > 24) flagCache.delete(flagCache.keys().next().value as string);
  return p;
}

/** Paint one flag onto the sprite sheet canvas. */
async function paint(canvas: HTMLCanvasElement, code: string, alive: () => boolean): Promise<boolean> {
  const [sheet, flag] = await Promise.all([buildSheet(), loadFlag(code)]);
  const ctx = canvas.getContext("2d");
  if (!flag || !ctx || !alive()) return false;
  const strip = new ImageData(COLS * CELL, CELL);
  const out = strip.data;
  let t0 = performance.now();
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      const x0 = col * CELL;
      const fbase = (row * COLS + col) * CELL * CELL;
      for (let y = 0; y < CELL; y++) {
        let o = (COLS * CELL * y + x0) * 4;
        let s = fbase + CELL * y;
        for (let x = 0; x < CELL; x++, s++, o += 4) {
          const t = sheet.tex[s];
          if (t === EMPTY) {
            out[o] = out[o + 1] = out[o + 2] = out[o + 3] = 0;
            continue;
          }
          const shade = sheet.shade[s] / 128;
          const gloss = sheet.gloss[s] / 255;
          const fi = t * 4;
          const fa = flag[fi + 3] / 255;
          const r = flag[fi] * fa + 255 * (1 - fa);
          const g = flag[fi + 1] * fa + 255 * (1 - fa);
          const b = flag[fi + 2] * fa + 255 * (1 - fa);
          const dr = (0.93 * r + 18) * shade;
          const dg = (0.93 * g + 18) * shade;
          const db = (0.93 * b + 18) * shade;
          out[o] = dr + (255 - dr) * gloss;
          out[o + 1] = dg + (255 - dg) * gloss;
          out[o + 2] = db + (255 - db) * gloss;
          out[o + 3] = sheet.alpha[s];
        }
      }
    }
    ctx.putImageData(strip, 0, CELL * row);
    if (performance.now() - t0 > 5) {
      await yieldFrame();
      if (!alive()) return false;
      t0 = performance.now();
    }
  }
  return true;
}

const KEYFRAMES = Array.from({ length: FRAMES }, (_, t) => {
  const rowPct = (Math.floor(t / COLS) / ROWS) * 100;
  return `${((t / FRAMES) * 100).toFixed(4)}% { transform: translate(${-(((t % COLS) / COLS) * 100)}%, ${-rowPct}%); }`;
}).join(" ");

const CSS = `
.fh { display: flex; pointer-events: none; user-select: none; -webkit-user-select: none; }
.fh-cell { position: relative; display: block; flex: none; overflow: hidden; opacity: 0; transition: opacity .5s ease; contain: strict; }
.fh-cell[data-ready] { opacity: 1; }
.fh-sheet { position: absolute; top: 0; left: 0; display: block; will-change: transform; animation: fh-turn step-end infinite; }
.fh-sheet canvas { display: block; width: 100%; height: 100%; }
.fh[data-still] .fh-sheet { animation: none; }
@keyframes fh-turn { ${KEYFRAMES} }
@media (prefers-reduced-motion: reduce) { .fh-sheet { animation: none; } }
`;

function HeartCell({ code, size, periodMs, delayMs }: { code: string; size: number; periodMs: number; delayMs: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    setReady(false);
    const c = ref.current;
    if (c) paint(c, code, () => alive).then((ok) => ok && alive && setReady(true));
    return () => {
      alive = false;
    };
  }, [code]);
  return (
    <span className="fh-cell" data-ready={ready ? "" : undefined} style={{ width: size, height: size }} title={code}>
      <span className="fh-sheet" style={{ width: COLS * size, height: ROWS * size, animationDuration: `${periodMs}ms`, animationDelay: `${-delayMs}ms` }}>
        <canvas ref={ref} width={COLS * CELL} height={ROWS * CELL} aria-hidden />
      </span>
    </span>
  );
}

export function FlagHeartRow({ flags, size, speed, gap, direction, still = false }: { flags: string[]; size: number; speed: number; gap: number; direction: "row" | "column"; still?: boolean }) {
  const s = Math.max(16, Math.round(size));
  const period = Math.max(200, Math.round(FH_PERIOD_MS / Math.max(0.1, speed)));
  return (
    <div dir="ltr" className="fh" data-still={still ? "" : undefined} style={{ flexDirection: direction === "column" ? "column" : "row" }}>
      <style>{CSS}</style>
      {flags.map((code, i) => (
        <span key={code} style={{ display: "block", flex: "none", [direction === "column" ? "marginTop" : "marginLeft"]: i ? Math.round((s * gap) / 100) : 0 }}>
          <HeartCell code={code} size={s} periodMs={period} delayMs={((i % 2) * period) / 2 + (Math.floor(i / 2) % 2) * (period / 4)} />
        </span>
      ))}
    </div>
  );
}

const ALIGN: Record<FlagPosition, [string, string]> = {
  tl: ["flex-start", "flex-start"],
  tc: ["center", "flex-start"],
  tr: ["flex-end", "flex-start"],
  ml: ["flex-start", "center"],
  mc: ["center", "center"],
  mr: ["flex-end", "center"],
  bl: ["flex-start", "flex-end"],
  bc: ["center", "flex-end"],
  br: ["flex-end", "flex-end"],
};

/** Positioned flag hearts filling their container (overlay or preview). */
export function FlagHearts({ config, scale = 1 }: { config: FlagHeartsConfig; scale?: number }) {
  if (!config.enabled || config.flags.length === 0) return null;
  const [jc, ai] = ALIGN[config.position] ?? ALIGN.mc;
  return (
    <div dir="ltr" style={{ position: "absolute", inset: 0, display: "flex", justifyContent: jc, alignItems: ai, padding: Math.round(config.margin * scale), pointerEvents: "none" }}>
      <FlagHeartRow flags={config.flags} size={config.size * scale} speed={config.speed} gap={config.gap} direction={config.direction} />
    </div>
  );
}
