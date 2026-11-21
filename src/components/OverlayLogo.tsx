"use client";

import React from "react";

interface OverlayLogoProps {
  size?: number;
  showWordmark?: boolean;
  boxed?: boolean;
  className?: string;
}

export function OverlayLogo({
  size = 28,
  showWordmark = false,
  boxed = false,
  className = "",
}: OverlayLogoProps) {
  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <div
        className={
          boxed
            ? "grid place-items-center rounded-xl bg-white p-1.5 shadow-[0_2px_12px_rgba(40,199,250,0.22)] ring-1 ring-white/20"
            : "relative grid place-items-center shrink-0"
        }
        style={boxed ? { width: size + 10, height: size + 10 } : undefined}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo.svg"
          alt="OverlayLive"
          width={size}
          height={size}
          className="object-contain drop-shadow-[0_2px_8px_rgba(40,199,250,0.3)]"
        />
      </div>
      {showWordmark && (
        <span className="text-[17px] font-extrabold tracking-tight leading-none">
          <span className="text-foreground">Overlay</span>
          <span className="bg-gradient-to-r from-brand-cyan to-brand-orange bg-clip-text text-transparent">
            Live
          </span>
        </span>
      )}
    </div>
  );
}
