"use client";

import { getFrameBySlug } from "@/lib/catalog";
import React from "react";

interface FramedAvatarProps {
  avatarUrl: string;
  frameSlug?: string | null;
  size?: number;
  glowColor?: string;
  showSignatureFx?: boolean;
  className?: string;
  alt?: string;
}

export function FramedAvatar({
  avatarUrl,
  frameSlug = "ember-dragon",
  size = 84,
  glowColor,
  showSignatureFx = true,
  className = "",
  alt = "Avatar",
}: FramedAvatarProps) {
  const frame = getFrameBySlug(frameSlug);
  const scale = size / 220;
  const effectiveGlow = glowColor || frame.glow;

  return (
    <div
      className={`relative inline-flex shrink-0 items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        style={
          {
            width: 220,
            height: 220,
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: `translate(-50%, -50%) scale(${scale})`,
            "--le-frame-glow": `${effectiveGlow}88`,
          } as React.CSSProperties
        }
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={avatarUrl || "/avatars/a1.png"}
          alt={alt}
          className="le-avatar"
        />
        {frameSlug && frameSlug !== "none" && (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={frame.url}
            alt={frame.name}
            className={`le-frame le-frame-${frame.slug}`}
          />
        )}
        {showSignatureFx && frame.hasSignatureFx && (
          <div
            className={`le-frame-fx le-sig-${frame.slug} pointer-events-none absolute inset-0`}
          >
            <b />
            <b />
            <b />
            <b />
          </div>
        )}
      </div>
    </div>
  );
}

interface AnimatedOverlayNameProps {
  text: string;
  animation?: string;
  className?: string;
}

/** Animations that move each letter separately (others animate the whole word). */
const PER_LETTER_ANIMATIONS = new Set(["wave", "bounce", "rise", "flip", "spin", "wiggle", "twinkle"]);

export function AnimatedOverlayName({
  text,
  animation = "aurora",
  className = "",
}: AnimatedOverlayNameProps) {
  const anim = animation && animation !== "none" ? animation : "";
  const perLetter = PER_LETTER_ANIMATIONS.has(anim);
  return (
    <span
      className={`ol-name ${anim ? `ol-name-anim-${anim}` : ""} ${className}`}
      dir="auto"
      data-name={text}
      aria-label={text}
    >
      {perLetter
        ? Array.from(text).map((ch, idx) => (
            <span
              key={`${idx}-${ch}`}
              aria-hidden="true"
              className="ol-ch"
              style={{ "--i": idx } as React.CSSProperties}
            >
              {ch}
            </span>
          ))
        : text}
    </span>
  );
}
