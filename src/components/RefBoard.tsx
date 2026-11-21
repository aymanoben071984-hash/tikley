"use client";

/**
 * OverlayLive's own Top Lists designs, rebuilt with the reference class names
 * (cb-*, cb-h*, cl-*, fp-*, podium-*, lb-title-*) so the original stylesheet
 * (public/assets/overlaylive-engine.css) drives every layout and animation.
 */
import type { AvatarPreset } from "@/db/schema";
import { AnimatedOverlayName, FramedAvatar } from "@/components/FramedAvatar";
import { TikTokCoin } from "@/components/TikTokCoin";
import {
  formatBoardValue,
  getBoardMeta,
  type BoardType,
  type RefDesign,
  type TopBoardSettings,
} from "@/lib/topBoard";
import React, { useLayoutEffect, useRef, useState } from "react";
import { crownUrl, nameplateUrl } from "@/lib/olThemes";

const RANK_COLORS = ["#ffd700", "#00f2ff", "#ff5e00"];

function hexToRgb(hex: string): string {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h.padEnd(6, "0").slice(0, 6);
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return "56, 189, 248";
  return `${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}`;
}

/** Scales a fixed-size board down to fit its container (never up). */
export function AutoScale({ children, maxScale = 1 }: { children: React.ReactNode; maxScale?: number }) {
  const outer = useRef<HTMLDivElement>(null);
  const inner = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ scale: 1, height: 0 });

  useLayoutEffect(() => {
    const o = outer.current;
    const i = inner.current;
    if (!o || !i) return;
    const measure = () => {
      const natW = i.scrollWidth || 1;
      const natH = i.scrollHeight || 1;
      const scale = Math.min(maxScale, o.clientWidth / natW);
      setBox((prev) =>
        Math.abs(prev.scale - scale) < 0.005 && Math.abs(prev.height - natH * scale) < 1
          ? prev
          : { scale, height: natH * scale },
      );
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(o);
    ro.observe(i);
    return () => ro.disconnect();
  }, [maxScale]);

  return (
    <div ref={outer} className="relative w-full overflow-visible" style={{ height: box.height || undefined }}>
      <div
        ref={inner}
        className="absolute left-1/2 top-0 w-max"
        style={{ transform: `translateX(-50%) scale(${box.scale})`, transformOrigin: "top center" }}
      >
        {children}
      </div>
    </div>
  );
}

interface RefBoardFaceProps {
  design: RefDesign;
  type: BoardType;
  settings: TopBoardSettings;
  rows: Array<{ preset: AvatarPreset; value: number }>;
  fontCss: string;
}

export function RefBoardFace({ design, type, settings, rows, fontCss }: RefBoardFaceProps) {
  const meta = getBoardMeta(type);
  const d = settings.display;
  const title = settings.titles[type] || meta.defaultTitle;
  const horizontal = settings.layout === "horizontal";
  const kind = type === "top-likers" ? "likers" : type === "top-shares" ? "sharers" : "gifters";

  const rankColor = (rank: number) =>
    d.highlightTop3 && rank <= 3 ? RANK_COLORS[rank - 1] : settings.color;

  const frameFor = (p: AvatarPreset) => {
    if (!d.showFrame) return "none";
    return settings.frameSlug !== "user" ? settings.frameSlug : p.frameSlug;
  };

  const name = (text: string) =>
    settings.nameAnimation && settings.nameAnimation !== "none" ? (
      <AnimatedOverlayName text={text} animation={settings.nameAnimation} />
    ) : (
      text
    );

  const unitIcon = () => {
    if (!d.showUnit) return null;
    if (meta.unit === "coins") return <TikTokCoin size={20} className="cb-coin" />;
    if (meta.unit === "likes") return <span className="cb-heart">❤</span>;
    return <span className="cb-share">🔁</span>;
  };

  const titleEl = d.showTitle ? (
    <div
      className="lb-title lb-title-md"
      dir={settings.direction}
      style={{ "--lb-title-accent": settings.color, marginBottom: 14, color: "#fff" } as React.CSSProperties}
    >
      <div className="lb-title-row">
        <span className="lb-title-bar" />
        <span className="lb-title-text">{title}</span>
      </div>
      <span className="lb-title-rule" />
    </div>
  ) : null;

  const avatarImg = (p: AvatarPreset, size: number, rank: number, plainClass: string) => {
    if (!d.showAvatar) return null;
    const frame = frameFor(p);
    if (frame === "none") {
      return (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={p.avatarUrl} alt={p.displayName} className={plainClass} style={{ width: size, height: size }} />
      );
    }
    return (
      <FramedAvatar
        avatarUrl={p.avatarUrl}
        frameSlug={frame}
        size={size * 1.25}
        glowColor={rankColor(rank)}
        showSignatureFx={rank === 1}
      />
    );
  };

  const rootStyle = { fontFamily: fontCss, "--lb": settings.color } as React.CSSProperties;

  // ───────────────────────── ENERGY (cb rows / cb-h cards) ─────────────────────────
  if (design === "energy") {
    if (horizontal) {
      const ordered = rows.length >= 3 ? [rows[1], rows[0], rows[2], ...rows.slice(3)] : rows;
      return (
        <div style={{ ...rootStyle, width: Math.max(520, ordered.length * 160), padding: "28px 16px 16px" }} dir={settings.direction}>
          {titleEl}
          <div className="cb-hrow">
            {ordered.map((r) => {
              const rank = rows.indexOf(r) + 1;
              const c = rankColor(rank);
              return (
                <div
                  key={r.preset.id}
                  className="cb-hcard"
                  style={{ "--rank-color": c, "--rank-glow": `${c}99`, marginBottom: rank === 1 ? 24 : 0 } as React.CSSProperties}
                >
                  <div className="cb-havatar">
                    {d.showAvatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img src={r.preset.avatarUrl} alt={r.preset.displayName} className="cb-havatar-img" />
                    ) : (
                      <div className="cb-havatar-img cb-havatar-initial">{r.preset.displayName[0]}</div>
                    )}
                    {d.showCrown && rank === 1 && <span className="cb-hcrown">👑</span>}
                    {d.showRankBadge && <span className="cb-hbadge">{rank}</span>}
                  </div>
                  <div className="cb-hplate" style={{ padding: "8px 6px", borderRadius: 12, display: "flex", flexDirection: "column", alignItems: "center", gap: 5 }}>
                    <span className="cb-hname">{name(r.preset.displayName)}</span>
                    <span className="cb-hline" />
                    {d.showScore && (
                      <span className="cb-hscore">
                        {unitIcon()}
                        {formatBoardValue(r.value)}
                      </span>
                    )}
                    {rank <= 3 && (
                      <span className="cb-hfx">
                        <i />
                        <i />
                        <i />
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    return (
      <div style={{ ...rootStyle, width: 560 }}>
        <div style={{ padding: "18px 18px 0" }}>{titleEl}</div>
        <div className="cb-leaderboard" data-direction={settings.direction} style={{ fontFamily: fontCss }}>
          {rows.map((r, i) => {
            const rank = i + 1;
            const c = rankColor(rank);
            return (
              <div
                key={r.preset.id}
                className="cb-row"
                data-rank={String(rank)}
                style={{ "--rank-color": c, "--rank-glow": `${c}99`, "--rd": `${i * 0.08}s` } as React.CSSProperties}
              >
                {d.showScore && (
                  <div className="cb-score-block">
                    <span className="cb-score-val">
                      {unitIcon()}
                      {formatBoardValue(r.value)}
                    </span>
                  </div>
                )}
                <div className="cb-bar" style={{ display: "flex" }}>
                  <div className="cb-info">
                    <span className="cb-name">{name(r.preset.displayName)}</span>
                    {d.showHandle && (
                      <span style={{ fontSize: 11, opacity: 0.6, color: "#fff" }}><bdi>{r.preset.tiktokUsername}</bdi></span>
                    )}
                    <span className="cb-deco-line" />
                  </div>
                  {rank <= 3 && (
                    <span className="cb-stars">
                      <span className="cb-star">✦</span>
                      <span className="cb-star">✦</span>
                      <span className="cb-star">✦</span>
                      <span className="cb-star">✦</span>
                    </span>
                  )}
                </div>
                <div className="cb-avatar-core">
                  <span className="cb-energy-ring" />
                  {d.showAvatar ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={r.preset.avatarUrl} alt={r.preset.displayName} className="cb-avatar-img" />
                  ) : (
                    <span className="cb-avatar-initial">{r.preset.displayName[0]}</span>
                  )}
                  {d.showCrown && rank === 1 && <span className="cb-crown">👑</span>}
                  {d.showRankBadge && <span className="cb-rank-badge">{rank}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ───────────────────────── CROWN LIST (cl-*) ─────────────────────────
  if (design.startsWith("crown-")) {
    const shapeMap: Record<string, string> = {
      "crown-rounded": "rounded",
      "crown-pill": "pill",
      "crown-bevel": "bevel",
      "crown-blade": "blade",
      "crown-ribbon": "ribbon",
      "crown-notch": "notch",
      "crown-hexagon": "hexagon",
      "crown-tag": "tag",
      "crown-frost": "sp-frost",
      "crown-glowpill": "sp-pill",
    };
    const shape = shapeMap[design] ?? "rounded";
    const pos = settings.scorePosition;
    const plateRadius = shape === "sp-pill" ? 999 : shape === "sp-frost" ? 16 : 12;


    return (
      <div style={{ ...rootStyle, padding: "20px 22px" }}>
        {titleEl}
        <div
          className="cl-board"
          dir={settings.direction}
          data-plate-shape={shape}
          data-kind={kind}
          data-orientation={horizontal ? "horizontal" : undefined}
          style={
            {
              fontFamily: fontCss,
              color: "#fff",
              width: horizontal ? undefined : 560,
              "--cl-accent": settings.color,
              "--cl-accent-soft": `${settings.color}80`,
              "--cl-plate-radius": `${plateRadius}px`,
              "--cl-crown-room": d.showCrown ? "26px" : "0px",
            } as React.CSSProperties
          }
        >
          <div className="cl-rows">
            {rows.map((r, i) => {
              const rank = i + 1;
              const c = rankColor(rank);
              const score = d.showScore ? (
                <>
                  {unitIcon()}
                  <span>{formatBoardValue(r.value)}</span>
                </>
              ) : null;
              const plate = (
                <div
                  className={`cl-plate ${pos === "inside" && d.showScore ? "cl-plate-hasscore" : ""}`}
                  style={{ "--cl-accent": c, "--cl-accent-soft": `${c}80` } as React.CSSProperties}
                >
                  {settings.nameplate && nameplateUrl(settings.nameplate) ? (
                    <video className="cl-plate-bg" src={nameplateUrl(settings.nameplate)} autoPlay muted loop playsInline aria-hidden />
                  ) : (
                    <span className="cl-plate-bg cl-plate-fallback" />
                  )}
                  <span className="cl-plate-tint" />
                  {(shape === "sp-frost" || shape === "sp-pill") && (
                    <span className="fp-ring" style={{ "--fp-acc": hexToRgb(c) } as React.CSSProperties}>
                      <i />
                    </span>
                  )}
                  <span className="cl-name" style={{ fontSize: rank === 1 ? 22 : 19 }}>
                    {name(r.preset.displayName)}
                  </span>
                  {pos === "inside" && score && <span className="cl-score-inside" style={{ display: "flex", alignItems: "center", gap: 5, fontWeight: 900 }}>{score}</span>}
                  {rank <= 3 && (
                    <span className="cl-fx" style={{ "--cl-accent": c } as React.CSSProperties}>
                      <i style={{ animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle" }} />
                      <i style={{ animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle", animationDelay: "-2.66s, -.6s" }} />
                      <i style={{ animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle", animationDelay: "-5.33s, -1.2s" }} />
                    </span>
                  )}
                </div>
              );
              return (
                <div key={r.preset.id} className="cl-row" data-rank={String(rank)} style={{ "--cl-accent": c, "--cl-accent-soft": `${c}80` } as React.CSSProperties}>
                  {d.showAvatar && (
                    <div className="cl-avatar">
                      {d.showCrown && rank === 1 &&
                        (settings.crownStyle && crownUrl(settings.crownStyle) ? (
                          <span className="cl-crown cl-crown-img">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={crownUrl(settings.crownStyle)} alt="" />
                          </span>
                        ) : (
                          <span className="cl-crown">👑</span>
                        ))}
                      {avatarImg(r.preset, rank === 1 ? 70 : 62, rank, "rounded-full object-cover")}
                      {d.showRankBadge && <span className="cl-rankbadge">{rank}</span>}
                    </div>
                  )}
                  {pos === "above" && score ? (
                    <div className="cl-stack">
                      <span className="cl-score cl-score-over" style={{ display: "flex" }}>{score}</span>
                      {plate}
                    </div>
                  ) : (
                    plate
                  )}
                  {pos === "beside" && score && (
                    horizontal ? (
                      <span className="cl-score cl-score-under" style={{ display: "flex" }}>{score}</span>
                    ) : (
                      <span className="cl-score" style={{ display: "flex", padding: "6px 10px", fontSize: 18, fontWeight: 900 }}>{score}</span>
                    )
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────── SPOTLIGHT PODIUM (fp-*) ─────────────────────────
  if (design.startsWith("spot-")) {
    const board = `sp-${design.slice(5)}`;
    const top = rows.slice(0, Math.max(3, Math.min(rows.length, horizontal ? rows.length : 3)));
    const ordered = !horizontal ? top : top.length >= 3 ? [top[1], top[0], top[2], ...top.slice(3)] : top;
    const plateRadius = board === "sp-pill" ? 999 : board === "sp-frost" ? 14 : 10;
    return (
      <div style={{ ...rootStyle, padding: "18px 14px" }}>
        {titleEl}
        <div
          className="fp-board"
          data-board={board}
          data-kind={kind}
          data-orientation={horizontal ? undefined : "stacked"}
          style={{ fontFamily: fontCss, "--fp-acc": hexToRgb(settings.color) } as React.CSSProperties}
        >
          <div className="fp-row" style={{ gap: horizontal ? 14 : 18 }}>
            {ordered.map((r) => {
              const rank = rows.indexOf(r) + 1;
              const c = rankColor(rank);
              const size = rank === 1 ? 104 : 86;
              return (
                <div
                  key={r.preset.id}
                  className="fp-unit"
                  data-rank={String(rank)}
                  style={{ "--fp-acc": hexToRgb(c), marginTop: horizontal ? (rank === 1 ? 0 : 26) : 0 } as React.CSSProperties}
                >
                  <div className="fp-float" style={{ animationDelay: `${-rank * 0.9}s` }}>
                    <div className="fp-photo" style={{ width: size * 1.25, height: size * 1.25 }}>
                      {d.showCrown && rank === 1 && (
                        <span className="fp-crown" style={{ top: -6, fontSize: 26 }}>
                          <i>👑</i>
                        </span>
                      )}
                      {avatarImg(r.preset, size, rank, "rounded-full object-cover")}
                      {d.showRankBadge && (
                        <span className="fp-badge" style={{ position: "absolute", bottom: 10, right: 10, width: 28, height: 28, fontSize: 13 }}>
                          {rank}
                        </span>
                      )}
                    </div>
                    <div
                      className="fp-plate"
                      style={{
                        position: "relative",
                        marginTop: -8,
                        minWidth: 132,
                        maxWidth: 170,
                        padding: "8px 16px",
                        borderRadius: plateRadius,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 3,
                        overflow: board === "sp-frost" || board === "sp-pill" ? "hidden" : "visible",
                      }}
                    >
                      <span className="fp-ring"><i /></span>
                      <span className="fp-name" style={{ fontSize: rank === 1 ? 16 : 14 }}>{name(r.preset.displayName)}</span>
                      {d.showScore && (
                        <span className="fp-score" style={{ fontSize: 14 }}>
                          {unitIcon()}
                          {formatBoardValue(r.value)}
                        </span>
                      )}
                      {rank <= 3 && (
                        <span className="fp-fx">
                          <i style={{ "--rx": "84px", "--ry": "34px", animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle", position: "absolute" } as React.CSSProperties} />
                          <i style={{ "--rx": "84px", "--ry": "34px", animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle", animationDelay: "-2.33s, -.5s", position: "absolute" } as React.CSSProperties} />
                          <i style={{ "--rx": "84px", "--ry": "34px", animation: "7s linear infinite lb-orbit, 1.6s ease-in-out infinite lb-orbit-twinkle", animationDelay: "-4.66s, -1.1s", position: "absolute" } as React.CSSProperties} />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────── CLASSIC PODIUM (podium-*) ─────────────────────────
  const podium = rows.slice(0, 3);
  const order = podium.length >= 3 ? [podium[1], podium[0], podium[2]] : podium;
  const pedestalH = [120, 92, 74];
  return (
    <div style={{ ...rootStyle, width: 480, padding: "18px 16px" }} dir={settings.direction}>
      {titleEl}
      <div className="podium-container" style={{ fontFamily: fontCss, height: "auto", paddingTop: 30 }}>
        {order.map((r) => {
          const rank = rows.indexOf(r) + 1;
          const c = rankColor(rank);
          const size = rank === 1 ? 84 : 72;
          return (
            <div
              key={r.preset.id}
              className="podium-column"
              style={{ "--podium-color": c, "--podium-color-20": `${c}33`, "--podium-glow": `${c}99`, "--podium-glow-10": `${c}1a` } as React.CSSProperties}
            >
              <div className="podium-avatar-wrapper" style={{ width: size * 1.25, height: size * 1.25 }}>
                {d.showCrown && rank === 1 && <span className="podium-crown">👑</span>}
                {d.showAvatar &&
                  (frameFor(r.preset) === "none" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={r.preset.avatarUrl} alt={r.preset.displayName} className="podium-avatar" style={{ width: size, height: size }} />
                  ) : (
                    <FramedAvatar avatarUrl={r.preset.avatarUrl} frameSlug={frameFor(r.preset)} size={size * 1.25} glowColor={c} showSignatureFx={rank === 1} />
                  ))}
              </div>
              <div className="podium-pedestal" style={{ height: pedestalH[rank - 1] }}>
                {d.showRankBadge && <span className="podium-rank">{rank}</span>}
                <span className="podium-nickname" style={{ fontSize: 12, maxWidth: 120 }}>{name(r.preset.displayName)}</span>
                {d.showScore && (
                  <span className="podium-value" style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 14 }}>
                    {unitIcon()}
                    {formatBoardValue(r.value)}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
