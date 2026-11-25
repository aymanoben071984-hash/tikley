"use client";

import type { AvatarPreset } from "@/db/schema";
import { AnimatedOverlayName, FramedAvatar } from "@/components/FramedAvatar";
import {
  BOARD_FONTS,
  formatBoardValue,
  getBoardMeta,
  isRefDesign,
  isThemeDesign,
  rankBoard,
  type BoardType,
  type DesignVariant,
  type TopBoardSettings,
} from "@/lib/topBoard";
import { Crown } from "lucide-react";
import { TikTokCoin } from "@/components/TikTokCoin";
import { AutoScale, RefBoardFace } from "@/components/RefBoard";
import { ThemeBoard } from "@/components/ThemeBoard";
import { olTheme } from "@/lib/olThemes";
import React, { useEffect, useMemo, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

const MEDALS = ["#ffd700", "#e2e8f0", "#ff7a18"];

interface VariantTokens {
  container: string;
  title: string;
  row: string;
  rowTop: string;
  name: string;
  score: string;
  card: string;
  radius: string;
}

function tokensFor(variant: DesignVariant): VariantTokens {
  switch (variant) {
    case "voltage":
      return {
        container: "bg-slate-950/90 border border-[color:var(--lb)]/60 shadow-[0_0_28px_-6px_var(--lb)]",
        title: "text-[color:var(--lb)] drop-shadow-[0_0_8px_var(--lb)] tracking-[0.25em]",
        row: "border border-[color:var(--lb)]/35 bg-gradient-to-r from-[color:var(--lb)]/15 to-transparent shadow-[inset_0_0_12px_rgba(0,0,0,0.6)]",
        rowTop: "border-[color:var(--lb)] shadow-[0_0_16px_-4px_var(--lb)]",
        name: "text-white",
        score: "text-[color:var(--lb)] drop-shadow-[0_0_6px_var(--lb)]",
        card: "border border-[color:var(--lb)]/50 bg-slate-950/90 shadow-[0_0_18px_-6px_var(--lb)]",
        radius: "rounded-xl",
      };
    case "glass":
      return {
        container: "bg-white/10 border border-white/25 backdrop-blur-xl shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
        title: "text-white",
        row: "bg-white/15 border border-white/20 backdrop-blur-md",
        rowTop: "bg-white/25",
        name: "text-white",
        score: "text-white",
        card: "bg-white/15 border border-white/25 backdrop-blur-md",
        radius: "rounded-2xl",
      };
    case "royal":
      return {
        container: "bg-gradient-to-b from-[#2a1606]/95 to-[#120a03]/95 border-2 border-amber-400/60 shadow-[0_14px_40px_rgba(245,158,11,0.3)]",
        title: "bg-gradient-to-r from-amber-200 via-yellow-400 to-amber-200 bg-clip-text text-transparent tracking-[0.22em]",
        row: "border border-amber-400/35 bg-gradient-to-r from-amber-900/50 via-amber-950/40 to-amber-900/50",
        rowTop: "border-amber-300 from-amber-700/60",
        name: "text-amber-50",
        score: "text-amber-300",
        card: "border-2 border-amber-400/60 bg-gradient-to-b from-amber-900/70 to-black/80",
        radius: "rounded-lg",
      };
    case "ember":
      return {
        container: "bg-gradient-to-b from-[#1c0a04]/95 to-[#0a0503]/95 border border-orange-500/45 shadow-[0_14px_42px_rgba(249,115,22,0.32)]",
        title: "text-orange-300 tracking-[0.2em] drop-shadow-[0_0_10px_rgba(249,115,22,0.7)]",
        row: "border border-orange-500/30 bg-gradient-to-r from-orange-950/70 to-stone-950/60",
        rowTop: "border-orange-400",
        name: "text-orange-50",
        score: "text-orange-300",
        card: "border border-orange-500/45 bg-gradient-to-b from-orange-950/80 to-stone-950/90",
        radius: "rounded-2xl",
      };
    case "kawaii":
      return {
        container: "bg-gradient-to-b from-pink-200/95 to-violet-200/95 border-4 border-white shadow-[0_12px_30px_rgba(236,72,153,0.35)]",
        title: "text-pink-600",
        row: "bg-white/85 border-2 border-pink-200",
        rowTop: "border-pink-400",
        name: "text-violet-900",
        score: "text-pink-600",
        card: "bg-white/90 border-2 border-pink-300",
        radius: "rounded-full",
      };
    case "metro":
      return {
        container: "bg-neutral-950/92 border-l-4 border-[color:var(--lb)]",
        title: "text-white tracking-[0.3em]",
        row: "border-b border-white/10 bg-transparent",
        rowTop: "",
        name: "text-white",
        score: "text-[color:var(--lb)]",
        card: "border-t-4 border-[color:var(--lb)] bg-neutral-950/92",
        radius: "rounded-none",
      };
    case "cyber":
      return {
        container: "bg-emerald-950/85 border border-emerald-400/50 [clip-path:polygon(0_0,96%_0,100%_6%,100%_100%,4%_100%,0_94%)]",
        title: "text-emerald-300 font-mono tracking-[0.3em]",
        row: "border border-emerald-400/30 bg-black/50 [clip-path:polygon(0_0,97%_0,100%_30%,100%_100%,3%_100%,0_70%)]",
        rowTop: "border-emerald-300 bg-emerald-500/15",
        name: "text-emerald-50 font-mono",
        score: "text-emerald-300 font-mono",
        card: "border border-emerald-400/50 bg-black/70",
        radius: "rounded-none",
      };
    case "music":
      return {
        container: "bg-gradient-to-br from-[#1a0633]/95 via-[#14052a]/95 to-[#2a0620]/95 border border-fuchsia-500/40 shadow-[0_14px_40px_rgba(217,70,239,0.3)]",
        title: "bg-gradient-to-r from-fuchsia-300 via-pink-400 to-violet-300 bg-clip-text text-transparent tracking-[0.2em]",
        row: "border border-fuchsia-400/25 bg-gradient-to-r from-fuchsia-900/40 to-violet-900/20",
        rowTop: "border-pink-400",
        name: "text-fuchsia-50",
        score: "text-pink-300",
        card: "border border-fuchsia-400/40 bg-gradient-to-b from-fuchsia-950/80 to-violet-950/90",
        radius: "rounded-2xl",
      };
    case "cards":
      return {
        container: "bg-gradient-to-br from-indigo-950/92 to-violet-950/92 border border-violet-400/40",
        title: "text-violet-200 tracking-[0.2em]",
        row: "bg-gradient-to-r from-white to-slate-100 border-2 border-violet-300 shadow-md",
        rowTop: "border-amber-400",
        name: "text-slate-900",
        score: "text-violet-700",
        card: "bg-gradient-to-b from-white to-slate-100 border-2 border-violet-300 shadow-xl",
        radius: "rounded-xl",
      };
    case "classic":
    case "podium":
    default:
      return {
        container: "bg-slate-950/85 border border-white/15 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.55)]",
        title: "text-[color:var(--lb)] tracking-[0.18em]",
        row: "border border-white/10 bg-white/[0.06]",
        rowTop: "border-[color:var(--lb)]/60 bg-[color:var(--lb)]/10",
        name: "text-white",
        score: "text-amber-300",
        card: "border border-white/15 bg-slate-950/85",
        radius: "rounded-xl",
      };
  }
}

interface TopBoardProps {
  settings: TopBoardSettings;
  avatars: AvatarPreset[];
  compact?: boolean;
  /** Force a specific board (used by the rotation preview chips). */
  forceType?: BoardType;
}

export function TopBoard({ settings, avatars, compact = false, forceType }: TopBoardProps) {
  const sequence = useMemo<BoardType[]>(() => {
    if (forceType) return [forceType];
    if (!settings.rotation.enabled || settings.rotation.boards.length === 0) {
      return [settings.type];
    }
    return [settings.type, ...settings.rotation.boards.filter((b) => b !== settings.type)].slice(0, 3);
  }, [forceType, settings.rotation.enabled, settings.rotation.boards, settings.type]);

  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    setIndex(0);
  }, [sequence]);

  useEffect(() => {
    if (sequence.length < 2) return;
    const t = setInterval(() => {
      setIndex((i) => (i + 1) % sequence.length);
      setCycle((c) => c + 1);
    }, settings.rotation.intervalSec * 1000);
    return () => clearInterval(t);
  }, [sequence, settings.rotation.intervalSec]);

  // Load Google font for the chosen family
  const font = BOARD_FONTS.find((f) => f.id === settings.fontFamily) ?? BOARD_FONTS[0];
  useEffect(() => {
    if (!font.google || typeof document === "undefined") return;
    const id = `lb-font-${font.id.replace(/\s+/g, "-")}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${font.google}&display=swap`;
    document.head.appendChild(link);
  }, [font]);

  const activeType = sequence[index % sequence.length] ?? settings.type;

  return (
    <div
      className="ol-board-font mx-auto w-full"
      style={
        {
          maxWidth: settings.layout === "horizontal" ? 760 : 440,
          perspective: 1200,
          "--ol-board-font": font.css,
        } as React.CSSProperties
      }
    >
      <div
        key={`${activeType}-${cycle}`}
        className={sequence.length > 1 ? `lb-switch-${settings.rotation.animation}` : ""}
      >
        <BoardFace
          type={activeType}
          settings={settings}
          avatars={avatars}
          compact={compact}
          fontCss={font.css}
        />
      </div>
      {sequence.length > 1 && (
        <div className="mt-2 flex justify-center gap-1.5">
          {sequence.map((t, i) => (
            <span
              key={t}
              className="h-1.5 rounded-full transition-all"
              style={{
                width: i === index ? 18 : 6,
                backgroundColor: i === index ? settings.color : "rgba(255,255,255,0.35)",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface BoardFaceProps {
  type: BoardType;
  settings: TopBoardSettings;
  avatars: AvatarPreset[];
  compact: boolean;
  fontCss: string;
}

function BoardFace({ type, settings, avatars, compact, fontCss }: BoardFaceProps) {
  const { locale } = useLocale();
  const meta = getBoardMeta(type);
  const d = settings.display;
  const tk = tokensFor(settings.variant);
  const rows = rankBoard(avatars, type, compact ? Math.min(d.maxRows, 5) : d.maxRows);
  const configuredTitle = settings.titles[type];
  const title = configuredTitle && configuredTitle !== meta.defaultTitle ? configuredTitle : translateText(locale, meta.defaultTitle);
  const horizontal = settings.layout === "horizontal";

  if (isThemeDesign(settings.variant)) {
    const theme = olTheme(settings.variant);
    const limit = Math.min(theme?.maxRows ?? 10, Math.max(1, d.maxRows));
    const themed = rankBoard(avatars, type, limit).map((r) => ({ nickname: r.preset.displayName, score: r.value, avatar: r.preset.avatarUrl }));
    return (
      <div dir={settings.direction}>
        {d.showTitle && (
          <div className="lb-title lb-title-md" style={{ "--lb-title-accent": settings.color, marginBottom: 10, color: "#fff", fontFamily: fontCss } as React.CSSProperties}>
            <div className="lb-title-row">
              <span className="lb-title-bar" />
              <span className="lb-title-text">{title}</span>
            </div>
            <span className="lb-title-rule" />
          </div>
        )}
        <ThemeBoard
          themeId={settings.variant}
          entries={themed}
          count={limit}
          kind={type === "top-likers" ? "likes" : "gifts"}
          accent={settings.color}
          orientation={settings.layout === "vertical" ? "stacked" : "horizontal"}
          direction={settings.direction}
        />
      </div>
    );
  }

  if (isRefDesign(settings.variant)) {
    return (
      <AutoScale>
        <RefBoardFace design={settings.variant} type={type} settings={settings} rows={rows} fontCss={fontCss} />
      </AutoScale>
    );
  }

  const frameFor = (p: AvatarPreset) => {
    if (!d.showFrame) return "none";
    if (settings.frameSlug !== "user") return settings.frameSlug;
    if (settings.variant === "ember") return "ember-dragon";
    return p.frameSlug;
  };

  const medalFor = (rank: number) =>
    d.highlightTop3 && rank <= 3 ? MEDALS[rank - 1] : settings.color;

  const renderName = (text: string) =>
    settings.nameAnimation && settings.nameAnimation !== "none" ? (
      <AnimatedOverlayName text={text} animation={settings.nameAnimation} />
    ) : (
      <span>{text}</span>
    );

  const renderAvatar = (p: AvatarPreset, size: number, rank: number) => {
    if (!d.showAvatar) return null;
    const frame = frameFor(p);
    return (
      <div className="relative shrink-0">
        {d.showCrown && rank === 1 && (
          <Crown
            className="absolute left-1/2 z-10 h-5 w-5 -translate-x-1/2 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)] animate-bounce"
            style={{ top: frame === "none" ? -14 : -6 }}
          />
        )}
        {frame === "none" ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={p.avatarUrl}
            alt={p.displayName}
            className="rounded-full object-cover"
            style={{
              width: size * 0.78,
              height: size * 0.78,
              boxShadow: `0 0 0 2px ${medalFor(rank)}`,
            }}
          />
        ) : (
          <FramedAvatar
            avatarUrl={p.avatarUrl}
            frameSlug={frame}
            size={size}
            glowColor={medalFor(rank)}
            showSignatureFx={rank === 1}
          />
        )}
      </div>
    );
  };

  const renderScore = (value: number) =>
    d.showScore ? (
      <span className={`ol-score inline-flex shrink-0 items-center gap-1 font-black ${tk.score}`}>
        {d.showUnit && (meta.unit === "coins" ? <TikTokCoin size={14} /> : <span className="text-[0.9em]">{meta.icon}</span>)}
        <span>{formatBoardValue(value)}</span>
      </span>
    ) : null;

  const renderRank = (rank: number) =>
    d.showRankBadge ? (
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-[11px] font-black"
        style={{
          backgroundColor: medalFor(rank),
          color: rank <= 3 && d.highlightTop3 ? "#111" : "#fff",
          boxShadow: `0 0 10px ${medalFor(rank)}88`,
        }}
      >
        {rank}
      </span>
    ) : null;

  const titleBar = d.showTitle ? (
    <div className="mb-2.5 flex items-center justify-between gap-2 px-1">
      <span className="inline-flex items-center gap-2">
        {settings.variant === "music" && (
          <span className="flex h-3.5 items-end gap-[2px]">
            {[0, 1, 2, 3].map((i) => (
              <span
                key={i}
                className="w-[3px] rounded-sm bg-pink-400 animate-equalise"
                style={{ animationDelay: `${i * 0.18}s` }}
              />
            ))}
          </span>
        )}
        <span className={`text-xs font-black uppercase sm:text-sm ${tk.title}`}>{title}</span>
      </span>
      <span
        className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase"
        style={{ backgroundColor: `${settings.color}26`, color: settings.color }}
      >
        {meta.icon} LIVE
      </span>
    </div>
  ) : null;

  const containerStyle = {
    "--lb": settings.color,
    fontFamily: fontCss,
  } as React.CSSProperties;

  if (rows.length === 0) {
    return (
      <div dir={settings.direction} style={containerStyle} className={`p-4 text-center text-xs text-white/70 ${tk.container} ${tk.radius === "rounded-full" ? "rounded-3xl" : "rounded-2xl"}`}>
        {titleBar}
        Waiting for the first supporters…
      </div>
    );
  }

  const outerRadius = settings.variant === "metro" || settings.variant === "cyber" ? "rounded-none" : "rounded-2xl";

  // ---------- PODIUM ----------
  if (settings.variant === "podium") {
    const order = [rows[1], rows[0], rows[2]].filter(Boolean);
    const rest = rows.slice(3);
    return (
      <div dir={settings.direction} style={containerStyle} className={`p-3.5 ${tk.container} ${outerRadius}`}>
        {titleBar}
        <div className={horizontal ? "flex items-end gap-3" : ""}>
          <div className={`grid grid-cols-3 items-end gap-2 pt-3 ${horizontal ? "flex-[1.4]" : ""}`}>
            {order.map((r) => {
              const rank = rows.indexOf(r) + 1;
              const size = rank === 1 ? (compact ? 76 : 96) : compact ? 60 : 74;
              const ped = rank === 1 ? "h-20" : rank === 2 ? "h-14" : "h-11";
              return (
                <div key={r.preset.id} className="flex min-w-0 flex-col items-center">
                  {renderAvatar(r.preset, size, rank)}
                  <div className={`mt-1 max-w-full ol-name-box text-xs font-bold ${tk.name}`}>
                    {renderName(r.preset.displayName)}
                  </div>
                  {d.showHandle && (
                    <div className="max-w-full truncate text-[9px] text-white/55"><bdi>{r.preset.tiktokUsername}</bdi></div>
                  )}
                  <div className="mb-1.5 text-[11px]">{renderScore(r.value)}</div>
                  <div
                    className={`flex w-full ${ped} items-center justify-center rounded-t-xl border-x border-t bg-gradient-to-b from-white/15 to-white/5 text-sm font-black text-white/90`}
                    style={{ borderColor: `${medalFor(rank)}88` }}
                  >
                    {d.showRankBadge ? `#${rank}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
          {rest.length > 0 && (
            <div className={horizontal ? "flex flex-1 flex-col gap-1.5" : "mt-2.5 space-y-1.5 border-t border-white/10 pt-2.5"}>
              {rest.map((r, i) => (
                <div key={r.preset.id} className={`flex items-center gap-2 px-2.5 py-1.5 text-xs ${tk.row} ${tk.radius}`}>
                  {renderRank(i + 4)}
                  {renderAvatar(r.preset, 30, i + 4)}
                  <span className={`min-w-0 flex-1 ol-name-box font-semibold ${tk.name}`}>
                    {renderName(r.preset.displayName)}
                  </span>
                  {renderScore(r.value)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // ---------- HORIZONTAL (cards in a row) ----------
  if (horizontal) {
    return (
      <div dir={settings.direction} style={containerStyle} className={`p-3.5 ${tk.container} ${outerRadius}`}>
        {titleBar}
        <div className="flex items-stretch gap-2 overflow-hidden">
          {rows.map((r, i) => {
            const rank = i + 1;
            const tilt =
              settings.variant === "cards"
                ? `rotate(${(i - (rows.length - 1) / 2) * 4}deg) translateY(${Math.abs(i - (rows.length - 1) / 2) * 4}px)`
                : undefined;
            return (
              <div
                key={r.preset.id}
                className={`flex min-w-0 flex-1 flex-col items-center gap-1 px-1.5 py-2.5 ${tk.card} ${tk.radius === "rounded-full" ? "rounded-3xl" : tk.radius} ${rank <= 3 ? tk.rowTop : ""}`}
                style={{ transform: tilt }}
              >
                {renderRank(rank)}
                {renderAvatar(r.preset, rank === 1 ? 64 : 54, rank)}
                <div className={`w-full ol-name-box text-center text-[11px] font-bold ${tk.name}`}>
                  {renderName(r.preset.displayName)}
                </div>
                {d.showHandle && (
                  <div className="w-full truncate text-center text-[9px] opacity-60"><bdi>{r.preset.tiktokUsername}</bdi></div>
                )}
                <div className="text-[11px]">{renderScore(r.value)}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ---------- VERTICAL LIST ----------
  return (
    <div dir={settings.direction} style={containerStyle} className={`p-3.5 ${tk.container} ${outerRadius}`}>
      {titleBar}
      <div className="space-y-1.5">
        {rows.map((r, i) => {
          const rank = i + 1;
          const top = rank <= 3;
          return (
            <div
              key={r.preset.id}
              className={`flex items-center gap-2.5 px-3 py-1.5 ${tk.row} ${tk.radius} ${top ? tk.rowTop : ""}`}
            >
              {renderRank(rank)}
              {renderAvatar(r.preset, top && !compact ? 46 : 38, rank)}
              <div className="min-w-0 flex-1">
                <div className={`ol-name-box text-xs font-bold ${tk.name}`}>
                  {renderName(r.preset.displayName)}
                </div>
                {d.showHandle && (
                  <div className="truncate text-[10px] opacity-60"><bdi>{r.preset.tiktokUsername}</bdi></div>
                )}
              </div>
              <span className="text-xs">{renderScore(r.value)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
