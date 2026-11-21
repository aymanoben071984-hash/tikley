"use client";

import { AnimatedOverlayName } from "@/components/FramedAvatar";
import { NAME_ANIMATIONS } from "@/lib/catalog";
import React from "react";

interface NameAnimationPickerProps {
  value: string;
  onChange: (value: string) => void;
  accent: string;
  sampleName?: string;
}

/** Grid of live, playing previews for every name animation. */
export function NameAnimationPicker({ value, onChange, accent, sampleName = "Mira Lee" }: NameAnimationPickerProps) {
  const options = ["none", ...NAME_ANIMATIONS];
  return (
    <div
      className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto pr-1 sm:grid-cols-3"
      style={{ "--lb": accent } as React.CSSProperties}
    >
      {options.map((anim) => {
        const active = value === anim;
        return (
          <button
            key={anim}
            type="button"
            onClick={() => onChange(anim)}
            aria-pressed={active}
            className={`flex flex-col items-center gap-1 rounded-xl border px-2 py-2 transition ${
              active
                ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan"
                : "border-border bg-slate-950/60 hover:border-brand-cyan/40"
            }`}
          >
            <span className="ol-name-box w-full text-center text-sm font-black text-white">
              <AnimatedOverlayName text={sampleName} animation={anim} />
            </span>
            <span className={`text-[10px] font-bold capitalize ${active ? "text-brand-cyan" : "text-muted-foreground"}`}>
              {anim === "none" ? "None" : anim}
            </span>
          </button>
        );
      })}
    </div>
  );
}
