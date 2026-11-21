"use client";

import type { GiftAction } from "@/db/schema";
import { playBroadcastSound, type SoundEffectType } from "@/components/SoundEngine";
import { TikTokCoin } from "@/components/TikTokCoin";
import { GIFT_CATALOG } from "@/lib/catalog";
import { renderCaption } from "@/lib/giftActions";
import React, { useEffect, useMemo } from "react";

export interface PlayItem {
  key: string | number;
  action: Pick<
    GiftAction,
    "mediaType" | "mediaUrl" | "effect" | "soundEnabled" | "soundName" | "soundUrl" | "volume" | "durationSec" | "size" | "position" | "fit" | "showCaption" | "caption" | "giftId"
  >;
  displayName: string;
  avatarUrl: string;
  giftName: string;
  amount: number;
}

/** Small deterministic random so effects look varied but render consistently. */
const rnd = (i: number, salt = 1) => {
  const x = Math.sin(i * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
};

const FX_CSS = `
@keyframes ga-fall { 0% { transform: translateY(calc(var(--ch, 100vh) * -0.12)) rotate(0deg); opacity: 0; } 8% { opacity: 1; } 100% { transform: translateY(calc(var(--ch, 100vh) * 1.12)) rotate(var(--rot, 360deg)); opacity: .9; } }
@keyframes ga-rise { 0% { transform: translateY(0) scale(.6); opacity: 0; } 12% { opacity: 1; } 100% { transform: translateY(calc(var(--ch, 100vh) * -1.15)) scale(1.1); opacity: 0; } }
@keyframes ga-burst { 0% { transform: translate(0,0) scale(.2); opacity: 1; } 70% { opacity: 1; } 100% { transform: translate(var(--dx), var(--dy)) scale(1); opacity: 0; } }
@keyframes ga-zoom { 0% { transform: scale(.1) rotate(-25deg); opacity: 0; } 25% { transform: scale(1.12) rotate(6deg); opacity: 1; } 40% { transform: scale(1) rotate(0deg); } 85% { transform: scale(1.04); opacity: 1; } 100% { transform: scale(1.4); opacity: 0; } }
@keyframes ga-rays { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
@keyframes ga-shake { 0%,100% { transform: translate(0,0); } 20% { transform: translate(-8px,4px); } 40% { transform: translate(7px,-5px); } 60% { transform: translate(-5px,-3px); } 80% { transform: translate(6px,3px); } }
@keyframes ga-flash { 0%,100% { opacity: 0; } 8% { opacity: .85; } 14% { opacity: 0; } 22% { opacity: .6; } 28% { opacity: 0; } }
@keyframes ga-warp { 0% { transform: translate(-50%,-50%) rotate(var(--a)) translateX(0) scaleX(.2); opacity: 0; } 30% { opacity: 1; } 100% { transform: translate(-50%,-50%) rotate(var(--a)) translateX(calc(var(--cw, 100vw) * 0.7)) scaleX(1.6); opacity: 0; } }
@keyframes ga-caption { 0% { transform: translateY(30px) scale(.9); opacity: 0; } 12% { transform: none; opacity: 1; } 88% { opacity: 1; } 100% { transform: translateY(-10px); opacity: 0; } }
@keyframes ga-in { 0% { opacity: 0; transform: scale(.94); } 10% { opacity: 1; transform: none; } 90% { opacity: 1; } 100% { opacity: 0; } }
`;

function giftIcon(item: PlayItem, fallback = "/assets/gifts/lion.png") {
  const byId = GIFT_CATALOG.find((g) => g.id === item.action.giftId);
  const byName = GIFT_CATALOG.find((g) => g.name.toLowerCase() === item.giftName.toLowerCase());
  return (byId ?? byName)?.icon ?? fallback;
}

function Effect({ item }: { item: PlayItem }) {
  const d = item.action.durationSec;
  const e = item.action.effect;

  if (e === "confetti" || e === "snow" || e === "rose-storm" || e === "coin-rain") {
    const n = e === "snow" ? 70 : 60;
    const colors = ["#f43f5e", "#22d3ee", "#facc15", "#a855f7", "#10b981", "#fb923c"];
    return (
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: n }, (_, i) => {
          const style: React.CSSProperties = {
            position: "absolute",
            top: 0,
            left: `${rnd(i) * 100}%`,
            animation: `ga-fall ${2.4 + rnd(i, 2) * 2.6}s linear ${rnd(i, 3) * Math.max(0.5, d - 2.5)}s both`,
            ["--rot" as string]: `${(rnd(i, 4) > 0.5 ? 1 : -1) * (180 + rnd(i, 5) * 540)}deg`,
          };
          if (e === "confetti")
            return <span key={i} style={{ ...style, width: 9, height: 16, borderRadius: 2, background: colors[i % colors.length] }} />;
          if (e === "snow")
            return <span key={i} style={{ ...style, width: 6 + rnd(i, 6) * 8, height: 6 + rnd(i, 6) * 8, borderRadius: "50%", background: "#fff", boxShadow: "0 0 8px #fff", opacity: 0.9 }} />;
          if (e === "coin-rain")
            return (
              <span key={i} style={style}>
                <TikTokCoin size={22 + Math.round(rnd(i, 7) * 22)} spin />
              </span>
            );
          return (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img key={i} src="/assets/gifts/rose.png" alt="" style={{ ...style, width: 34 + rnd(i, 8) * 30 }} />
          );
        })}
      </div>
    );
  }

  if (e === "hearts") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 50 }, (_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              bottom: -40,
              left: `${rnd(i) * 100}%`,
              fontSize: 24 + rnd(i, 2) * 36,
              color: ["#ff2d55", "#ff6b9d", "#ff9f1c", "#e879f9"][i % 4],
              textShadow: "0 0 14px rgba(255,45,85,.7)",
              animation: `ga-rise ${2.6 + rnd(i, 3) * 2.2}s ease-out ${rnd(i, 4) * Math.max(0.4, d - 2.5)}s both`,
            }}
          >
            ♥
          </span>
        ))}
      </div>
    );
  }

  if (e === "fireworks") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 7 }, (_, b) => {
          const cx = 15 + rnd(b, 9) * 70;
          const cy = 15 + rnd(b, 10) * 45;
          const color = ["#facc15", "#22d3ee", "#f43f5e", "#a855f7", "#10b981", "#fb923c", "#ffffff"][b % 7];
          const delay = (b * Math.max(0.6, d - 2)) / 7;
          return (
            <span key={b} className="absolute" style={{ left: `${cx}%`, top: `${cy}%` }}>
              {Array.from({ length: 22 }, (_, i) => {
                const ang = (i / 22) * Math.PI * 2;
                const dist = 120 + rnd(i + b * 30, 11) * 90;
                return (
                  <span
                    key={i}
                    style={{
                      position: "absolute",
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: color,
                      boxShadow: `0 0 10px ${color}, 0 0 20px ${color}`,
                      ["--dx" as string]: `${Math.cos(ang) * dist}px`,
                      ["--dy" as string]: `${Math.sin(ang) * dist}px`,
                      animation: `ga-burst 1.5s cubic-bezier(.15,.7,.3,1) ${delay}s both`,
                    }}
                  />
                );
              })}
            </span>
          );
        })}
      </div>
    );
  }

  if (e === "lightning") {
    return (
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-white" style={{ animation: `ga-flash 1.6s ease-out ${0}s 3 both`, mixBlendMode: "screen" }} />
        {Array.from({ length: 4 }, (_, i) => (
          <svg key={i} viewBox="0 0 60 200" className="absolute" style={{ left: `${15 + i * 22}%`, top: 0, height: "75%", opacity: 0, animation: `ga-flash 1.6s ease-out ${i * 0.35}s 3 both`, filter: "drop-shadow(0 0 14px #a5b4fc)" }}>
            <polyline points="30,0 18,80 34,80 14,200 46,96 28,96 40,0" fill="#e0e7ff" stroke="#818cf8" strokeWidth="2" />
          </svg>
        ))}
      </div>
    );
  }

  if (e === "galaxy") {
    return (
      <div className="absolute inset-0 overflow-hidden" style={{ background: "radial-gradient(circle at center, rgba(88,28,135,.45), transparent 70%)" }}>
        {Array.from({ length: 70 }, (_, i) => (
          <span
            key={i}
            style={{
              position: "absolute",
              left: "50%",
              top: "50%",
              width: 60 + rnd(i) * 80,
              height: 2,
              borderRadius: 2,
              background: "linear-gradient(90deg, transparent, #fff)",
              ["--a" as string]: `${rnd(i, 2) * 360}deg`,
              transformOrigin: "left center",
              animation: `ga-warp ${1.2 + rnd(i, 3)}s ease-in ${rnd(i, 4) * Math.max(0.5, d - 1.5)}s both`,
            }}
          />
        ))}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/gifts/universe.png" alt="" className="absolute left-1/2 top-1/2 w-[calc(var(--cmin,100vmin)*0.38)] -translate-x-1/2 -translate-y-1/2" style={{ animation: `ga-zoom ${d}s ease-out both`, filter: "drop-shadow(0 0 40px #a855f7)" }} />
      </div>
    );
  }

  // gift-zoom / lion-roar
  const lion = e === "lion-roar";
  return (
    <div className="absolute inset-0 grid place-items-center overflow-hidden" style={lion ? { animation: "ga-shake .5s linear 0.4s 4" } : undefined}>
      <div
        className="absolute h-[calc(var(--cmax,100vmax)*1.4)] w-[calc(var(--cmax,100vmax)*1.4)]"
        style={{
          background: `repeating-conic-gradient(${lion ? "rgba(250,204,21,.28)" : "rgba(34,211,238,.22)"} 0deg 8deg, transparent 8deg 22deg)`,
          animation: "ga-rays 12s linear infinite",
          maskImage: "radial-gradient(circle, #000 15%, transparent 60%)",
          WebkitMaskImage: "radial-gradient(circle, #000 15%, transparent 60%)",
        }}
      />
      {lion && <div className="absolute inset-0 bg-amber-200" style={{ animation: "ga-flash 1.4s ease-out both", mixBlendMode: "screen" }} />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={lion ? "/assets/gifts/lion.png" : giftIcon(item, "/assets/gifts/tiktok.png")} alt="" className="relative w-[calc(var(--cmin,100vmin)*0.46)]" style={{ animation: `ga-zoom ${d}s cubic-bezier(.2,.9,.3,1.1) both`, filter: `drop-shadow(0 0 50px ${lion ? "#f59e0b" : "#22d3ee"})` }} />
    </div>
  );
}

const SOUND_MAP: Record<string, SoundEffectType> = { fanfare: "lion", chime: "gift", follow: "follow", join: "join", tick: "tick" };

export function GiftActionPlayback({ item, onDone, muted = false }: { item: PlayItem; onDone?: () => void; muted?: boolean }) {
  const a = item.action;
  const caption = useMemo(() => renderCaption(a.caption, { name: item.displayName, gift: item.giftName, amount: item.amount }), [a.caption, item]);

  useEffect(() => {
    let audio: HTMLAudioElement | null = null;
    if (a.soundEnabled && !muted && a.mediaType !== "video") {
      if (a.soundName === "url" && a.soundUrl) {
        audio = new Audio(a.soundUrl);
        audio.volume = a.volume / 100;
        audio.play().catch(() => {});
      } else {
        playBroadcastSound(SOUND_MAP[a.soundName] ?? "gift", a.volume / 100);
      }
    }
    const t = setTimeout(() => onDone?.(), Math.max(1, a.durationSec) * 1000);
    return () => {
      clearTimeout(t);
      audio?.pause();
    };
  }, [item.key, a, muted, onDone]);

  const full = a.position === "full";
  const boxStyle: React.CSSProperties = full
    ? { position: "absolute", inset: 0 }
    : {
        position: "absolute",
        width: `${a.size}%`,
        height: `${a.size}%`,
        ...(a.position === "center" ? { left: `${(100 - a.size) / 2}%`, top: `${(100 - a.size) / 2}%` } : {}),
        ...(a.position === "top" ? { left: `${(100 - a.size) / 2}%`, top: 0 } : {}),
        ...(a.position === "bottom" ? { left: `${(100 - a.size) / 2}%`, bottom: 0 } : {}),
        ...(a.position === "left" ? { left: 0, top: `${(100 - a.size) / 2}%` } : {}),
        ...(a.position === "right" ? { right: 0, top: `${(100 - a.size) / 2}%` } : {}),
      };

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" style={{ animation: `ga-in ${a.durationSec}s ease both` }}>
      <style>{FX_CSS}</style>
      <div style={boxStyle} className="overflow-hidden">
        {a.mediaType === "video" && a.mediaUrl ? (
          <video src={a.mediaUrl} autoPlay playsInline muted={muted || !a.soundEnabled} className="h-full w-full" style={{ objectFit: a.fit === "cover" ? "cover" : "contain" }} onEnded={() => onDone?.()} ref={(el) => { if (el) el.volume = a.volume / 100; }} />
        ) : a.mediaType === "gif" && a.mediaUrl ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img src={a.mediaUrl} alt="" className="h-full w-full" style={{ objectFit: a.fit === "cover" ? "cover" : "contain" }} />
        ) : (
          <Effect item={item} />
        )}
      </div>
      {a.showCaption && caption && (
        <div className="absolute inset-x-0 bottom-[8%] flex justify-center px-6" style={{ animation: `ga-caption ${a.durationSec}s ease both` }}>
          <div className="flex items-center gap-3 rounded-full border border-white/25 bg-slate-950/80 py-2 pe-6 ps-2 shadow-[0_14px_40px_rgba(0,0,0,.6)] backdrop-blur">
            {item.avatarUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={item.avatarUrl} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-amber-400" />
            )}
            <span dir="auto" className="text-2xl font-black text-white" style={{ textShadow: "0 2px 8px rgba(0,0,0,.8)" }}>
              {caption}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
