"use client";

import type { LiveEvent } from "@/db/schema";
import {
  BN_THROTTLE,
  GIFT_COINS,
  barBackground,
  bnEventEnabled,
  bnHeadline,
  darken,
  linesDir,
  withAlpha,
  type BnEvent,
  type BnEventType,
  type BreakingNewsConfig,
  type BreakingNewsState,
} from "@/lib/breakingNews";
import React, { memo, useEffect, useLayoutEffect, useRef, useState } from "react";

/* ───────────────────────── events ───────────────────────── */

const TYPE_MAP: Record<string, BnEventType | undefined> = {
  gift: "gift",
  like: "like",
  follow: "follow",
  chat: "comment",
  join: "join",
};

/** Convert stored LIVE events into the overlay's event stream (oldest → newest). */
export function toBnEvents(events: LiveEvent[], state: BreakingNewsState): BnEvent[] {
  const startedAt = state.startedAt ?? 0;
  const last: Partial<Record<BnEventType, number>> = {};
  const out: BnEvent[] = [];
  const sorted = [...events].sort((a, b) => a.id - b.id);
  for (const e of sorted) {
    const type = TYPE_MAP[e.eventType];
    if (!type) continue;
    const at = new Date(e.createdAt).getTime();
    if (startedAt && at < startedAt) continue;
    const ev: BnEvent = {
      id: e.id,
      type,
      nickname: e.displayName || e.username,
      avatarUrl: e.avatarUrl,
      giftName: e.giftName ?? undefined,
      repeatCount:
        type === "gift" && e.giftId && GIFT_COINS[e.giftId]
          ? Math.max(1, Math.round(e.coins / GIFT_COINS[e.giftId]))
          : 1,
      comment: e.message ?? undefined,
      at,
    };
    if (!bnEventEnabled(ev, state.config)) continue;
    const throttle = BN_THROTTLE[type];
    if (throttle && last[type] !== undefined && at - (last[type] as number) < throttle) continue;
    last[type] = at;
    out.push(ev);
  }
  return out.slice(-24);
}

/* ───────────────────────── building blocks ───────────────────────── */

interface TickerProps {
  lines: string[];
  accent: string;
  tickerFont?: string;
  tickerIcon: string;
  showIcon: boolean;
  height?: number;
  fontSize?: number;
  bare?: boolean;
  speed: number;
}

/** Endless right-to-left (or left-to-right for Arabic) headline ticker. */
const Ticker = memo(function Ticker({
  lines,
  accent,
  tickerFont,
  tickerIcon,
  showIcon,
  height = 48,
  fontSize = 19,
  bare = false,
  speed,
}: TickerProps) {
  const dir = linesDir(lines);
  const rtl = dir === "rtl";
  const runRef = useRef<HTMLDivElement>(null);
  const [runW, setRunW] = useState(0);

  useLayoutEffect(() => {
    const el = runRef.current;
    if (!el) return;
    const measure = () => setRunW(el.offsetWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [lines, fontSize]);

  const run = (ref?: React.Ref<HTMLDivElement>) => (
    <div ref={ref} className="flex shrink-0 items-center">
      {lines.map((line, i) => (
        <span key={i} className="flex shrink-0 items-center whitespace-nowrap">
          <span dir="auto" className="font-bold" style={{ fontSize, textShadow: "0 1px 0 rgba(0,0,0,0.75)" }}>
            {line}
          </span>
          <span className="mx-4 font-black" style={{ fontSize: Math.round(0.8 * fontSize), color: accent }}>
            ◆
          </span>
        </span>
      ))}
    </div>
  );

  const duration = runW > 0 ? runW / Math.max(20, speed) : 0;
  const animName = `bn-scroll-${rtl ? "r" : "l"}`;

  return (
    <div
      dir={dir}
      className="relative flex w-full items-stretch overflow-hidden"
      style={{
        height,
        background: bare
          ? undefined
          : `linear-gradient(${rtl ? 270 : 90}deg, ${withAlpha(accent, "40")}, ${withAlpha(darken(accent, 0.2), "59")} 30%), linear-gradient(180deg, ${withAlpha(darken(accent, 0.1), "f5")}, ${withAlpha(darken(accent, 0.06), "f8")})`,
        borderTop: bare ? undefined : `1px solid ${withAlpha(accent, "66")}`,
        boxShadow: bare ? undefined : "inset 0 1px 0 rgba(255,255,255,0.05)",
        fontFamily: tickerFont,
      }}
    >
      {showIcon && (
        <div
          dir="auto"
          className="relative z-10 grid shrink-0 place-items-center whitespace-nowrap px-2 font-black leading-none"
          style={{
            minWidth: Math.round(1.3 * height),
            maxWidth: 180,
            fontSize: Math.round(0.46 * height),
            background: `linear-gradient(180deg, ${accent}, ${withAlpha(accent, "b3")})`,
            boxShadow: `${rtl ? -4 : 4}px 0 16px -4px ${withAlpha(accent, "aa")}`,
            borderRadius: bare ? 8 : undefined,
          }}
        >
          {tickerIcon}
        </div>
      )}
      <div className="relative flex min-w-0 flex-1 items-center overflow-hidden">
        <div
          className="relative flex w-max shrink-0 items-center self-stretch will-change-transform"
          style={
            duration > 0
              ? ({
                  "--bn-run": `${runW}px`,
                  animation: `${animName} ${duration}s linear infinite`,
                } as React.CSSProperties)
              : undefined
          }
        >
          {run(runRef)}
          {run()}
          {run()}
        </div>
        {!bare && (
          <>
            <span
              className="pointer-events-none absolute inset-y-0 left-0 z-10 w-10"
              style={{ background: `linear-gradient(90deg, ${withAlpha(darken(accent, 0.08), "e6")}, transparent)` }}
            />
            <span
              className="pointer-events-none absolute inset-y-0 right-0 z-10 w-10"
              style={{ background: `linear-gradient(270deg, ${withAlpha(darken(accent, 0.08), "e6")}, transparent)` }}
            />
          </>
        )}
      </div>
    </div>
  );
});

/** Live clock with blinking LIVE dot. */
const Clock = memo(function Clock({ accent, size = "lg" }: { accent: string; size?: "lg" | "sm" }) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const hhmm = now
    ? `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`
    : "--:--";
  const divider = (
    <span
      className="pointer-events-none absolute inset-y-0 left-0 w-[2px]"
      style={{ background: `linear-gradient(180deg, transparent, ${withAlpha(accent, "cc")}, transparent)` }}
    />
  );
  const dot = (
    <span
      className="h-2 w-2 rounded-full"
      style={{ background: accent, boxShadow: `0 0 8px ${accent}`, animation: "bn-blink 1.2s infinite" }}
    />
  );
  if (size === "sm") {
    return (
      <div className="relative z-10 flex shrink-0 items-center gap-2 px-4">
        {divider}
        {dot}
        <span
          className="font-mono text-[20px] font-black leading-none tabular-nums"
          style={{ textShadow: `0 2px 6px rgba(0,0,0,0.85), 0 0 10px ${withAlpha(accent, "66")}` }}
        >
          {hhmm}
        </span>
      </div>
    );
  }
  return (
    <div className="relative z-10 flex w-[178px] shrink-0 flex-col items-center justify-center gap-1">
      {divider}
      <span
        className="font-mono text-[38px] font-black leading-none tabular-nums"
        style={{ textShadow: `0 2px 6px rgba(0,0,0,0.85), 0 0 12px ${withAlpha(accent, "66")}` }}
      >
        {hhmm}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.28em] text-white/75">
        {dot}LIVE
      </span>
    </div>
  );
});

/** Pulsing "عاجل" badge. */
function Badge({ text, accent, color, fontSize, font }: { text: string; accent: string; color?: string; fontSize: number; font?: string }) {
  return (
    <div
      className="flex shrink-0 items-center gap-2 rounded-md px-3 py-1"
      style={{
        fontFamily: font,
        background: `linear-gradient(180deg, ${accent}, ${withAlpha(accent, "c8")})`,
        boxShadow: `0 0 14px ${withAlpha(accent, "99")}, 0 4px 14px -6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.35)`,
        animation: "bn-badge-pulse 1.5s ease-in-out infinite",
      }}
    >
      <span className="h-2 w-2 shrink-0 rounded-full bg-white" style={{ boxShadow: "0 0 10px #fff", animation: "bn-dot-pulse 1.1s ease-in-out infinite" }} />
      <span dir="auto" className="whitespace-nowrap font-black leading-none text-white" style={{ fontSize, color, textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}>
        {text}
      </span>
    </div>
  );
}

/** Avatar with glowing accent ring. */
function Avatar({ ev, accent, size }: { ev: BnEvent; accent: string; size: number }) {
  const [broken, setBroken] = useState(false);
  return (
    <span className="relative shrink-0" style={{ width: size, height: size }}>
      <span className="absolute -inset-[3px] rounded-full" style={{ border: `2px solid ${withAlpha(accent, "dd")}`, boxShadow: `0 0 14px ${withAlpha(accent, "88")}` }} />
      {ev.avatarUrl && !broken ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={ev.avatarUrl} alt="" onError={() => setBroken(true)} className="h-full w-full rounded-full object-cover" />
      ) : (
        <span className="grid h-full w-full place-items-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 font-black text-white" style={{ fontSize: Math.round(0.42 * size) }}>
          {(ev.nickname.trim()[0] || "?").toUpperCase()}
        </span>
      )}
    </span>
  );
}

const BN_KEYFRAMES = `
@keyframes bn-blink { 0%, 60% { opacity: 1; } 61%, 100% { opacity: 0.25; } }
@keyframes bn-badge-pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.05); } }
@keyframes bn-dot-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.25; } }
@keyframes bn-in { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: none; } }
.bn-in { animation: bn-in 380ms cubic-bezier(.2,.9,.3,1.1) both; }
@keyframes bn-wipe { from { transform: translateX(-110%); opacity: .95; } to { transform: translateX(110%); opacity: 0; } }
.bn-wipe { animation: bn-wipe 650ms ease-out both; }
@keyframes bn-scroll-l { from { transform: translate3d(0,0,0); } to { transform: translate3d(calc(var(--bn-run) * -1),0,0); } }
@keyframes bn-scroll-r { from { transform: translate3d(0,0,0); } to { transform: translate3d(var(--bn-run),0,0); } }
@media (prefers-reduced-motion: reduce) { .bn-in, .bn-wipe { animation-duration: 1ms; } }
`;

/* ───────────────────────── overlay ───────────────────────── */

interface BreakingNewsOverlayProps {
  state: BreakingNewsState;
  events: BnEvent[];
  className?: string;
  /** Show the bar even when the overlay is stopped (dashboard preview). */
  forceVisible?: boolean;
}

export function BreakingNewsOverlay({ state, events, className = "", forceVisible = false }: BreakingNewsOverlayProps) {
  const r: BreakingNewsConfig = state.config;
  const s = r.accentColor || "#dc2626";
  const c = r.design;
  const scale = (n: number) => Math.max(0.6, Math.min(1.8, (Number(n) || 100) / 100));
  const y = scale(r.headlineFontScale);
  const k = scale(r.leftFontScale);
  const v = (n: number, f: number) => Math.round(n * f);
  const S = r.headlineFont || undefined;
  const $ = r.leftFont || undefined;
  const j = r.tickerFont || undefined;
  const N = r.headlineColor || undefined;
  const C = r.leftColor || undefined;
  const F = (r.tickerIcon || "").trim() || "📰";

  const R = events.length > 0 ? events[events.length - 1] : null;
  const z = R ? bnHeadline(R, r) : "";
  const M = r.customHeadlines.map((e) => e.trim()).filter(Boolean);
  const I = events.slice(-14).map((e) => bnHeadline(e, r));
  const H: string[] = [];
  const T = Math.max(I.length, M.length);
  for (let i = 0; i < T; i++) {
    if (I[i] != null) H.push(I[i]);
    if (M[i] != null) H.push(M[i]);
  }
  if (H.length === 0) H.push(r.badgeText, r.channelName);

  if (state.phase === "idle" && !forceVisible) return null;

  const ticker = (height: number, fontSize: number, bare = false, lines = H, showIcon = r.showTickerIcon) => (
    <Ticker lines={lines} accent={s} tickerFont={j} tickerIcon={F} showIcon={showIcon} height={height} fontSize={fontSize} bare={bare} speed={r.tickerSpeed} />
  );

  const headline = (fontSize: number, avatarSize: number, standby: string) =>
    R ? (
      <div key={R.id} className="bn-in relative flex h-full min-w-0 flex-1 items-center gap-3 overflow-hidden px-4">
        <Avatar ev={R} accent={s} size={avatarSize} />
        <span
          dir="auto"
          className="min-w-0 flex-1 truncate font-black leading-tight"
          style={{ fontSize: v(fontSize, y), color: N, fontFamily: S, textShadow: "0 2px 6px rgba(0,0,0,0.85), 0 0 12px rgba(0,0,0,0.5)" }}
        >
          {z}
        </span>
        <span className="bn-wipe pointer-events-none absolute inset-0 z-10" style={{ background: `linear-gradient(100deg, transparent 15%, ${withAlpha(s, "b3")} 50%, transparent 85%)` }} />
      </div>
    ) : (
      <div key="standby" className="bn-in flex h-full min-w-0 flex-1 items-center px-4">
        <span dir="auto" className="truncate font-black text-white/85" style={{ fontSize: v(Math.round(0.9 * fontSize), y), fontFamily: S, textShadow: "0 2px 6px rgba(0,0,0,0.85)" }}>
          {standby}
        </span>
      </div>
    );

  const wrap = (content: React.ReactNode) => (
    <div dir="ltr" className={`bn-root w-full select-none ${className}`} style={{ fontFamily: r.fontFamily, color: r.textColor }}>
      <style>{BN_KEYFRAMES}</style>
      {content}
    </div>
  );

  if (c === "ticker") {
    const lines = R ? [z, ...H.filter((e) => e !== z)] : H;
    return wrap(
      <div
        dir={linesDir(lines)}
        className="flex w-full items-stretch overflow-hidden"
        style={{
          background: `linear-gradient(90deg, ${withAlpha(s, "b3")}, ${withAlpha(s, "8c")} 35%, ${withAlpha(s, "80")}), linear-gradient(180deg, ${withAlpha(darken(s, 0.34), "f2")}, ${withAlpha(darken(s, 0.24), "f5")})`,
          borderTop: `2px solid ${s}`,
        }}
      >
        <div className="flex shrink-0 items-center px-3" style={{ fontFamily: $ }}>
          <Badge text={r.badgeText} accent={s} color={C} fontSize={v(17, k)} font={$} />
        </div>
        {ticker(46, 18, true, lines, false)}
      </div>,
    );
  }

  if (c === "pill") {
    return wrap(
      <div className="flex w-full justify-center pb-5">
        <div
          key={R?.id ?? "standby"}
          className="bn-in flex max-w-[min(760px,calc(var(--cw,100vw)*0.92))] items-center gap-3 overflow-hidden rounded-full border py-2 pe-5 ps-2"
          style={{ background: barBackground(s), borderColor: withAlpha(s, "88"), boxShadow: `0 14px 34px -14px rgba(0,0,0,.85), 0 0 22px -8px ${withAlpha(s, "88")}` }}
        >
          {R ? <Avatar ev={R} accent={s} size={40} /> : null}
          <Badge text={r.badgeText} accent={s} color={C} fontSize={v(15, k)} font={$} />
          <span dir="auto" className="min-w-0 truncate font-black leading-tight" style={{ fontSize: v(21, y), color: N, fontFamily: S, textShadow: "0 2px 6px rgba(0,0,0,0.85)" }}>
            {R ? z : r.channelName}
          </span>
        </div>
      </div>,
    );
  }

  if (c === "minimal") {
    return wrap(
      <div className="w-full px-6 pb-4">
        <div className="mb-2 flex items-center gap-3" style={{ fontFamily: $ }}>
          <span dir="auto" className="font-black uppercase tracking-[0.2em]" style={{ fontSize: v(14, k), color: C ?? s, textShadow: `0 0 12px ${withAlpha(s, "88")}, 0 1px 3px rgba(0,0,0,.9)` }}>
            {r.badgeText}
          </span>
          <span className="h-[2px] w-10" style={{ background: s, boxShadow: `0 0 10px ${s}` }} />
          <span dir="auto" className="font-bold uppercase tracking-[0.3em] text-white/70" style={{ fontSize: v(11, k), textShadow: "0 1px 3px rgba(0,0,0,.9)" }}>
            {r.channelName}
          </span>
        </div>
        <div key={R?.id ?? "standby"} className="bn-in flex items-center gap-3">
          {R ? <Avatar ev={R} accent={s} size={44} /> : null}
          <span dir="auto" className="min-w-0 truncate font-black leading-tight" style={{ fontSize: v(30, y), color: N, fontFamily: S, textShadow: "0 2px 8px rgba(0,0,0,.95), 0 0 18px rgba(0,0,0,.7)" }}>
            {R ? z : r.channelName}
          </span>
        </div>
        <div className="mt-2 h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${s}, ${withAlpha(s, "33")} 55%, transparent)`, boxShadow: `0 0 12px ${withAlpha(s, "88")}` }} />
      </div>,
    );
  }

  if (c === "card") {
    return wrap(
      <div className="w-full px-6 pb-6">
        <div className="w-[560px] max-w-[calc(var(--cw,100vw)*0.92)] overflow-hidden rounded-xl" style={{ boxShadow: `0 18px 40px -16px rgba(0,0,0,.9), 0 0 24px -10px ${withAlpha(s, "77")}` }}>
          <div className="flex items-center gap-3 px-3 py-1.5" style={{ background: `linear-gradient(90deg, ${s}, ${withAlpha(s, "b3")})`, fontFamily: $ }}>
            <span className="h-2 w-2 rounded-full bg-white" style={{ boxShadow: "0 0 10px #fff", animation: "bn-dot-pulse 1.1s ease-in-out infinite" }} />
            <span dir="auto" className="font-black leading-none text-white" style={{ fontSize: v(16, k), color: C, textShadow: "0 1px 3px rgba(0,0,0,.55)" }}>
              {r.badgeText}
            </span>
            <span dir="auto" className="ms-auto font-bold uppercase tracking-[0.25em] text-white/85" style={{ fontSize: v(10, k), color: C ? withAlpha(C, "cc") : undefined }}>
              {r.channelName}
            </span>
          </div>
          <div className="flex h-[74px] items-stretch overflow-hidden" style={{ background: barBackground(s) }}>
            {headline(23, 48, r.channelName)}
          </div>
          {ticker(30, 13)}
        </div>
      </div>,
    );
  }

  if (c === "compact") {
    return wrap(
      <>
        <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, ${s}, ${withAlpha(s, "33")} 55%, transparent)`, boxShadow: `0 0 10px ${withAlpha(s, "88")}` }} />
        <div className="relative flex h-[62px] w-full items-stretch overflow-hidden" style={{ background: barBackground(s), boxShadow: "inset 0 1px 0 rgba(255,255,255,0.09)" }}>
          <div className="relative z-10 flex shrink-0 items-center gap-3 px-4" style={{ fontFamily: $ }}>
            <Badge text={r.badgeText} accent={s} color={C} fontSize={v(18, k)} font={$} />
            <span dir="auto" className="hidden font-bold uppercase tracking-[0.25em] text-white/75 sm:inline" style={{ fontSize: v(10, k), color: C ? withAlpha(C, "bf") : undefined, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
              {r.channelName}
            </span>
            <span className="pointer-events-none absolute inset-y-2 right-0 w-[2px]" style={{ background: `linear-gradient(180deg, transparent, ${withAlpha(s, "cc")}, transparent)` }} />
          </div>
          {headline(22, 42, "📡 البث المباشر مستمر…")}
          <Clock accent={s} size="sm" />
        </div>
        {ticker(30, 14)}
      </>,
    );
  }

  // classic
  return wrap(
    <>
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(90deg, ${s}, ${withAlpha(s, "33")} 55%, transparent)`, boxShadow: `0 0 12px ${withAlpha(s, "88")}` }} />
      <div className="relative flex h-[118px] w-full items-stretch overflow-hidden" style={{ background: barBackground(s), boxShadow: "0 -10px 24px -14px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.09)" }}>
        <div className="relative z-10 flex w-[248px] shrink-0 flex-col items-center justify-center gap-1.5 px-4" style={{ fontFamily: $ }}>
          <span className="pointer-events-none absolute inset-y-0 right-0 w-[2px]" style={{ background: `linear-gradient(180deg, transparent, ${withAlpha(s, "cc")}, transparent)` }} />
          <div
            className="flex items-center gap-2 rounded-md px-5 py-1.5"
            style={{ background: `linear-gradient(180deg, ${s}, ${withAlpha(s, "c8")})`, boxShadow: `0 0 14px ${withAlpha(s, "99")}, 0 4px 14px -6px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.35)`, animation: "bn-badge-pulse 1.5s ease-in-out infinite" }}
          >
            <span className="h-2.5 w-2.5 rounded-full bg-white" style={{ boxShadow: "0 0 10px #fff", animation: "bn-dot-pulse 1.1s ease-in-out infinite" }} />
            <span dir="auto" className="font-black leading-none text-white" style={{ fontSize: v(24, k), color: C, textShadow: "0 1px 3px rgba(0,0,0,0.55)" }}>
              {r.badgeText}
            </span>
          </div>
          <span dir="auto" className="font-bold uppercase tracking-[0.3em] text-white/75" style={{ fontSize: v(12, k), color: C ? withAlpha(C, "bf") : undefined, textShadow: "0 1px 3px rgba(0,0,0,0.8)" }}>
            {r.channelName}
          </span>
        </div>
        <div className="relative min-w-0 flex-1 overflow-hidden">{headline(30, 62, "📡 البث المباشر مستمر… ترقّبوا الأخبار العاجلة")}</div>
        <Clock accent={s} />
      </div>
      {ticker(48, 19)}
      <div className="h-[2px] w-full" style={{ background: `linear-gradient(90deg, transparent, ${withAlpha(s, "88")}, transparent)` }} />
    </>,
  );
}
