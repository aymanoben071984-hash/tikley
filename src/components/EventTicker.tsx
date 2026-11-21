"use client";

import { AnimatedOverlayName, FramedAvatar } from "@/components/FramedAvatar";
import { TikTokCoin } from "@/components/TikTokCoin";
import {
  TICKER_EVENTS,
  isRingFrame,
  type TickerEvent,
  type TickerEventData,
  type TickerSettings,
} from "@/lib/eventTickers";
import React from "react";

const sc = (base: number, pct: number) => Math.round((base * pct) / 100);
const alpha = (hex: string, a: string) => (/^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${a}` : hex);

/* ───────── avatar with premium neon ring or image frame ───────── */

export function TickerAvatar({ src, name, frame, accent, size }: { src: string; name: string; frame: string; accent: string; size: number }) {
  if (isRingFrame(frame)) {
    return (
      <span className="relative inline-block shrink-0" style={{ width: size, height: size }}>
        <span className="absolute overflow-hidden rounded-full bg-black/30" style={{ inset: size * 0.09, zIndex: 1, boxShadow: `0 0 10px ${alpha(accent, "80")}` }}>
          {src ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={src} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="grid h-full w-full place-items-center font-black" style={{ color: accent, fontSize: size * 0.4 }}>
              {(name.trim()[0] || "?").toUpperCase()}
            </span>
          )}
        </span>
        <span
          aria-hidden
          className="pointer-events-none absolute"
          style={
            {
              left: "50%",
              top: "50%",
              width: 220,
              height: 220,
              transform: `translate(-50%, -50%) scale(${size / 200})`,
              zIndex: 2,
              "--le-main": accent,
              "--le-main-alpha": alpha(accent, "80"),
            } as React.CSSProperties
          }
        >
          <span className={`le-ring le-ring-${frame}`} />
        </span>
      </span>
    );
  }
  if (frame === "none") {
    return (
      <span className="relative inline-block shrink-0 overflow-hidden rounded-full" style={{ width: size, height: size, border: `3px solid ${accent}`, boxShadow: `0 0 14px ${alpha(accent, "88")}` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }
  return <FramedAvatar avatarUrl={src} frameSlug={frame} size={size * 1.25} glowColor={accent} showSignatureFx />;
}

/* ───────── ornaments ───────── */

function LaurelBranch({ flip }: { flip?: boolean }) {
  return (
    <span className={`re-orn re-laurel-branch ${flip ? "re-orn-end" : "re-orn-start"}`}>
      <svg viewBox="0 0 70 110" aria-hidden>
        <path className="re-orn-stroke" d="M52 104 C 30 86, 22 58, 30 8" fill="none" strokeWidth="3" strokeLinecap="round" />
        {[
          [44, 92, -30],
          [36, 80, -38],
          [30, 66, -45],
          [27, 52, -50],
          [27, 38, -55],
          [29, 24, -60],
        ].map(([x, y, r], i) => (
          <g key={i}>
            <ellipse className="re-orn-fill" cx={x - 10} cy={y} rx="11" ry="5" transform={`rotate(${r} ${x - 10} ${y})`} />
            <ellipse className="re-orn-fill" cx={x + 9} cy={y - 4} rx="10" ry="4.5" transform={`rotate(${-r - 20} ${x + 9} ${y - 4})`} />
          </g>
        ))}
      </svg>
    </span>
  );
}

const STAR = "M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z";

function SparkleStars({ end }: { end?: boolean }) {
  return (
    <span className={`re-orn re-sparkle-stars ${end ? "re-orn-end" : "re-orn-start"}`}>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path className="re-orn-fill" d={STAR} />
      </svg>
      <svg viewBox="0 0 24 24" aria-hidden>
        <path className="re-orn-fill" d={STAR} />
      </svg>
    </span>
  );
}

function PulseLine({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 300 46" className="et-pulse" aria-hidden style={{ width: "100%", height: 46 }}>
      <polyline
        points="0,23 90,23 105,23 115,6 128,42 140,14 150,30 160,23 300,23"
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ filter: `drop-shadow(0 0 6px ${accent})` }}
      />
    </svg>
  );
}

function Orbit({ kind }: { kind: "hearts" | "planets" }) {
  return (
    <span className="re-orbit-box" style={{ inset: 0 }}>
      <span className="re-orbit-scale" style={{ transform: kind === "hearts" ? "scale(1.34)" : "scale(1.62,.78)" }}>
        <span className="re-orbit" style={kind === "planets" ? { animationDuration: "9s" } : undefined}>
          {Array.from({ length: kind === "hearts" ? 6 : 3 }, (_, i) => (
            <i key={i} className={kind === "hearts" ? "et-orbit-heart" : "et-orbit-planet"} />
          ))}
        </span>
      </span>
    </span>
  );
}

/* ───────── ticker ───────── */

interface EventTickerProps {
  event: TickerEvent;
  data: TickerEventData;
  settings: TickerSettings;
  replayKey?: number;
}

const ET_STYLES = `
@keyframes et-arrive { 0% { opacity: 0; transform: translateY(18px) scale(.92); } 60% { opacity: 1; transform: translateY(-3px) scale(1.02); } 100% { opacity: 1; transform: none; } }
.et-arrive { animation: et-arrive .55s cubic-bezier(.2,.9,.3,1.15) both; }
@keyframes et-burst { 0% { opacity: 0; transform: translate(0,0) scale(.4); } 15% { opacity: 1; } 100% { opacity: 0; transform: translate(var(--bx), var(--by)) scale(1.1) rotate(var(--br)); } }
.et-burst i { position: absolute; left: 50%; top: 50%; font-style: normal; pointer-events: none; animation: et-burst 1.4s ease-out both; }
@keyframes et-dash { from { stroke-dashoffset: 600; } to { stroke-dashoffset: 0; } }
.et-pulse polyline { stroke-dasharray: 600; animation: et-dash 1.6s linear infinite; }
.et-orbit-heart::before { content: "♥"; color: var(--re-accent); text-shadow: 0 0 12px var(--le-main-alpha), 0 0 4px #fff8; font: 700 22px Arial, sans-serif; }
.et-orbit-planet::before { content: ""; width: 14px; height: 14px; border-radius: 50%; background: radial-gradient(circle at 35% 35%, #fff, var(--re-accent) 60%); box-shadow: 0 0 14px var(--re-accent); }
.et-orbit-planet:nth-child(2)::before { width: 9px; height: 9px; }
.et-root .re-orbit i::before { position: absolute; top: 0; left: 50%; translate: -50% -50%; }
@media (prefers-reduced-motion: reduce) { .et-arrive, .et-burst i, .et-pulse polyline { animation: none; } }
`;

export function EventTicker({ event, data, settings: s, replayKey = 0 }: EventTickerProps) {
  const meta = TICKER_EVENTS.find((e) => e.id === event) ?? TICKER_EVENTS[0];
  const accent = s.accentColor;
  const vars = {
    "--re-accent": accent,
    "--le-main": accent,
    "--le-main-alpha": alpha(accent, "80"),
    "--lb": accent,
    color: s.textColor,
    fontFamily: s.fontFamily,
  } as React.CSSProperties;

  const message = s.message.trim() || meta.defaultMessage;
  const vertical = ["vertical", "laurel", "sparkle", "solar-orbit", "heart-portal"].includes(s.design);
  const avatarSize = sc(vertical ? 128 : 104, s.avatarScale);
  const nameSize = sc(vertical ? 36 : 34, s.nameScale);
  const msgSize = sc(17, s.msgScale);

  const name = (
    <span dir="auto" className="ol-name-box block font-black leading-tight" style={{ fontSize: nameSize, maxWidth: vertical ? 340 : 330, textShadow: `0 2px 6px rgba(0,0,0,.6), 0 0 14px ${alpha(accent, "66")}` }}>
      <AnimatedOverlayName text={data.name} animation={s.nameAnim || "none"} />
    </span>
  );

  const detail = (
    <span className="flex flex-wrap items-center gap-2" style={{ justifyContent: vertical ? "center" : "flex-start" }}>
      {event === "like" && (
        <span className="re-count-pill inline-flex items-center gap-1.5 px-3 py-0.5 font-black" style={{ fontSize: msgSize + 2, transform: "none", direction: "ltr" }}>
          <span className="re-heart">♥</span>
          {(data.likes ?? 0).toLocaleString()}
        </span>
      )}
      {event === "gift" && (
        <span className="re-count-pill inline-flex items-center gap-1.5 px-3 py-0.5 font-black" style={{ fontSize: msgSize + 2, transform: "none", direction: "ltr" }}>
          {data.giftIcon && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img src={data.giftIcon} alt="" style={{ width: "1.4em", height: "1.4em", objectFit: "contain" }} />
          )}
          <span>{data.giftName ?? "Gift"}</span>
          {typeof data.coins === "number" && data.coins > 0 && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <TikTokCoin size={msgSize} /> {data.coins.toLocaleString()}
            </span>
          )}
        </span>
      )}
      <span dir="auto" className="font-bold" style={{ fontFamily: s.msgFont, fontSize: msgSize, opacity: 0.92, textShadow: `0 0 10px ${alpha(accent, "66")}, 0 1px 2px rgba(0,0,0,.8)` }}>
        {message}
      </span>
    </span>
  );

  const label = s.label ? (
    <span className="re-event-label" style={{ position: vertical ? "absolute" : "relative", top: vertical ? -14 : undefined, left: vertical ? "50%" : undefined, translate: vertical ? "-50%" : undefined, padding: "5px 14px 4px", borderRadius: 999, fontSize: 12, alignSelf: "flex-start", marginBottom: vertical ? 0 : 6 }}>
      {meta.icon} {meta.label}
    </span>
  ) : null;

  const avatar = <TickerAvatar src={data.avatarUrl} name={data.name} frame={s.avatarFrame} accent={accent} size={avatarSize} />;

  const burst = s.burst ? (
    <span key={`b-${data.id}-${replayKey}`} className="et-burst pointer-events-none absolute inset-0 z-20" aria-hidden>
      {Array.from({ length: 10 }, (_, i) => {
        const ang = (i / 10) * Math.PI * 2;
        const dist = 90 + (i % 3) * 28;
        return (
          <i
            key={i}
            style={
              {
                "--bx": `${Math.cos(ang) * dist}px`,
                "--by": `${Math.sin(ang) * dist * 0.7}px`,
                "--br": `${(i % 2 ? 1 : -1) * 40}deg`,
                color: i % 2 ? accent : "#fff",
                fontSize: 14 + (i % 3) * 5,
                animationDelay: `${(i % 4) * 0.05}s`,
                textShadow: `0 0 8px ${accent}`,
              } as React.CSSProperties
            }
          >
            {event === "like" || i % 3 === 0 ? "♥" : "✦"}
          </i>
        );
      })}
    </span>
  ) : null;

  const cardBg = `linear-gradient(160deg, ${alpha(accent, "33")}, rgba(10,12,20,.92) 38%, rgba(6,8,14,.95))`;
  const cardBorder = `1.5px solid ${alpha(accent, "88")}`;
  const cardShadow = `0 16px 40px -14px rgba(0,0,0,.85), 0 0 26px -8px ${alpha(accent, "aa")}, inset 0 1px 0 rgba(255,255,255,.08)`;

  let body: React.ReactNode;

  if (s.design === "classic" || s.design === "heartbeat") {
    body = (
      <div className="relative flex items-center gap-5 rounded-[22px] px-6 py-5" style={{ background: cardBg, border: cardBorder, boxShadow: cardShadow, minWidth: 460, maxWidth: 640 }}>
        <span className="re-glow" style={{ inset: "6% auto 6% 0", width: "32%", borderRadius: "50%" }} />
        <span className="relative z-10">{avatar}</span>
        <div className="relative z-10 flex min-w-0 flex-1 flex-col">
          {label}
          {name}
          {s.design === "heartbeat" && <PulseLine accent={accent} />}
          {detail}
        </div>
        <span className="re-stars" aria-hidden>
          <i style={{ top: "14%", right: "8%" }} />
          <i style={{ bottom: "18%", right: "18%" }} />
          <i style={{ top: "60%", right: "4%" }} />
        </span>
      </div>
    );
  } else if (s.design === "chat-pop") {
    body = (
      <div className="relative flex items-end gap-3">
        <span className="relative z-10">{avatar}</span>
        <div className="relative rounded-[22px] rounded-bl-md px-5 py-4" style={{ background: `linear-gradient(180deg, ${alpha(accent, "40")}, rgba(14,16,26,.95))`, border: cardBorder, boxShadow: cardShadow, minWidth: 300, maxWidth: 520 }}>
          <span className="absolute -left-2 bottom-3 h-4 w-4 rotate-45" style={{ background: "rgba(14,16,26,.95)", borderLeft: cardBorder, borderBottom: cardBorder }} />
          {label}
          {name}
          <div className="mt-1">{detail}</div>
          <span className="re-bubbles" aria-hidden>
            <i />
            <i />
            <i />
            <i />
            <i />
          </span>
        </div>
      </div>
    );
  } else {
    // vertical family: vertical, laurel, sparkle, solar-orbit, heart-portal
    body = (
      <div className={`relative flex flex-col items-center px-8 pb-6 pt-8 text-center ${s.design === "sparkle" ? "re-sparkle" : ""}`} style={{ minWidth: 380, maxWidth: 520, borderRadius: 28, background: cardBg, border: cardBorder, boxShadow: cardShadow }}>
        {label}
        <span className="re-glow" style={{ inset: "4% 18% 38%", borderRadius: "50%" }} />
        <span className="relative z-10 grid place-items-center" style={{ width: avatarSize * 1.3, height: avatarSize * 1.3 }}>
          {(s.design === "solar-orbit" || s.design === "heart-portal") && <Orbit kind={s.design === "heart-portal" ? "hearts" : "planets"} />}
          {avatar}
        </span>
        <div className="relative z-10 mt-2 flex items-center justify-center">
          {s.design === "laurel" && <LaurelBranch />}
          {s.design === "sparkle" && <SparkleStars />}
          <span className={s.design === "sparkle" ? "re-name" : undefined} style={s.design === "sparkle" ? { fontStyle: "normal", color: accent } : undefined}>
            {name}
          </span>
          {s.design === "laurel" && <LaurelBranch flip />}
          {s.design === "sparkle" && <SparkleStars end />}
        </div>
        {s.design === "laurel" && (
          <span className="mt-1 block h-[3px] w-56 rounded-full" style={{ background: `linear-gradient(90deg, transparent, ${accent}, transparent)`, boxShadow: `0 0 10px ${accent}` }} />
        )}
        <div className="relative z-10 mt-2">{detail}</div>
        <span className="re-stars" aria-hidden>
          <i style={{ top: "12%", left: "10%" }} />
          <i style={{ top: "22%", right: "9%" }} />
          <i style={{ bottom: "20%", left: "14%" }} />
          <i style={{ bottom: "14%", right: "12%" }} />
        </span>
      </div>
    );
  }

  return (
    <div className="et-root relative inline-block" style={vars}>
      <style>{ET_STYLES}</style>
      <div key={data.id} className="et-arrive relative">
        <div key={`r-${replayKey}`} className={replayKey > 0 && s.replay !== "none" ? `re-fx-stage le-fx-${s.replay}` : undefined}>
          {body}
        </div>
        {burst}
      </div>
    </div>
  );
}
