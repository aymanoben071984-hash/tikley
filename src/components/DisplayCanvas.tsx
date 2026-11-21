"use client";

import {
  ANCHOR_ORIGIN,
  CANVAS,
  TIKTOK_SAFE,
  type DefaultFormat,
  type DisplayFormat,
  type OverlayDisplay,
} from "@/lib/overlayDisplay";
import React, { useEffect, useState } from "react";

/**
 * Lays an overlay out on a fixed design canvas:
 *  - 9:16 → 1080 × 1920 (TikTok LIVE Studio)
 *  - 16:9 → 1920 × 1080 (OBS Studio)
 *  - auto → the browser source's own size
 * The canvas is scaled to fit the source, then the overlay is placed with the
 * saved scale / anchor / offset, optionally kept inside TikTok's safe zone.
 *
 * Overlays that use `position: fixed; inset: 0` fill the placement layer,
 * because a transformed ancestor becomes their containing block.
 */
export function DisplayCanvas({ display, format, children }: { display: OverlayDisplay; format: DefaultFormat; children: React.ReactNode }) {
  const [win, setWin] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    const measure = () => setWin({ w: window.innerWidth, h: window.innerHeight });
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  if (!win) return null;

  const fmt: DisplayFormat = format === "auto" ? (win.h > win.w ? "9:16" : "16:9") : format;
  const W = format === "auto" ? win.w : CANVAS[fmt].w;
  const H = format === "auto" ? win.h : CANVAS[fmt].h;
  const fit = Math.min(win.w / W, win.h / H);
  const p = display.formats[fmt];
  const safe = fmt === "9:16" && p.safeZone;
  const inset = safe
    ? { top: TIKTOK_SAFE.top * H, bottom: TIKTOK_SAFE.bottom * H, left: TIKTOK_SAFE.left * W, right: TIKTOK_SAFE.right * W }
    : { top: 0, bottom: 0, left: 0, right: 0 };

  return (
    <div className="fixed inset-0 flex items-center justify-center overflow-hidden" data-display-format={fmt}>
      <div
        style={{ position: "relative", width: W, height: H, flexShrink: 0, transform: `scale(${fit})`, transformOrigin: "center center" }}
        data-canvas={`${W}x${H}`}
      >
        <div style={{ position: "absolute", ...inset }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              transform: `translate(${p.offsetX}%, ${p.offsetY}%) scale(${p.scale / 100})`,
              transformOrigin: ANCHOR_ORIGIN[p.anchor],
              // canvas size for overlays that need it (instead of vw / vh)
              ["--cw" as string]: `${W - inset.left - inset.right}px`,
              ["--ch" as string]: `${H - inset.top - inset.bottom}px`,
              ["--cmin" as string]: `${Math.min(W - inset.left - inset.right, H - inset.top - inset.bottom)}px`,
              ["--cmax" as string]: `${Math.max(W - inset.left - inset.right, H - inset.top - inset.bottom)}px`,
            } as React.CSSProperties}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
