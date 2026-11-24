"use client";

import type {
  AvatarPreset,
  LiveEvent,
  SceneLayerItem,
  StreamerProfile,
  WidgetConfig,
} from "@/db/schema";
import { AnimatedOverlayName, FramedAvatar } from "@/components/FramedAvatar";
import { TopBoard } from "@/components/TopBoard";
import { normalizeBoardSettings } from "@/lib/topBoard";
import {
  GIFT_CATALOG,
  SCREEN_EFFECTS,
  SHOWCASE_ARTWORKS,
} from "@/lib/catalog";
import {
  Flame,
  Gift,
  Heart,
  MessageCircle,
  Share2,
  Sparkles,
  UserPlus,
} from "lucide-react";
import React from "react";

interface OverlayWidgetViewProps {
  widgetKey: string;
  widget?: WidgetConfig;
  profile?: StreamerProfile;
  avatars: AvatarPreset[];
  events: LiveEvent[];
  compact?: boolean;
}

export function OverlayWidgetView({
  widgetKey,
  widget,
  profile,
  avatars,
  events,
  compact = false,
}: OverlayWidgetViewProps) {
  const primary = widget?.primaryColor || "#28c7fa";
  const secondary = widget?.secondaryColor || "#ff8a2b";
  const settings = (widget?.customSettings || {}) as Record<string, unknown>;
  const frameOverride = widget?.avatarFrame;

  if (widgetKey === "top-lists") {
    return (
      <TopBoard
        settings={normalizeBoardSettings(settings.board)}
        avatars={avatars}
        compact={compact}
      />
    );
  }

  if (widgetKey === "goals") {
    const label = String(settings.label || "Daily Coin Goal");
    const current = Number(settings.current ?? profile?.sessionCoins ?? 663);
    const target = Math.max(1, Number(settings.target || 1000));
    const pct = Math.min(100, Math.round((current / target) * 100));
    const vesselId = String(settings.vesselStyle || widget?.theme || "goal-liquid-heart");
    const vessel =
      SHOWCASE_ARTWORKS.find((a) => a.id === vesselId && a.category === "goal") ??
      SHOWCASE_ARTWORKS.find((a) => a.id === "goal-liquid-heart");

    return (
      <div className="mx-auto flex w-full max-w-sm items-center gap-3.5 rounded-2xl border border-white/15 bg-slate-950/80 p-3.5 backdrop-blur-md shadow-[0_12px_34px_rgba(0,0,0,0.55)]">
        {vessel && (
          <div className="relative h-20 w-16 shrink-0 animate-ol-float">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={vessel.url}
              alt={vessel.title}
              className="h-full w-full object-contain drop-shadow-[0_6px_16px_rgba(251,113,133,0.45)]"
            />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="truncate">{label}</span>
            <span style={{ color: primary }}>{pct}%</span>
          </div>
          <div className="mt-2 h-3.5 w-full overflow-hidden rounded-full bg-white/10 p-0.5 ring-1 ring-white/15">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${primary}, ${secondary})`,
                boxShadow: `0 0 14px ${primary}`,
              }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[11px] font-semibold text-white/75">
            <span>
              🪙 {current.toLocaleString()} / {target.toLocaleString()}
            </span>
            <span className="text-emerald-400">+{Math.max(0, target - current)} left</span>
          </div>
        </div>
      </div>
    );
  }

  if (widgetKey === "gift-alerts" || widgetKey === "gift-videos") {
    const latestGift =
      events.find((e) => e.eventType === "gift") ?? {
        id: 1,
        displayName: "Mira Lee",
        username: "@mira_lee",
        avatarUrl: "/avatars/a2.png",
        avatarFrame: frameOverride || "ember-dragon",
        giftName: "Lion",
        giftIcon: "/assets/gifts/lion.png",
        coins: 29999,
      };

    return (
      <div
        key={latestGift.id}
        className="animate-ol-pop relative mx-auto flex w-full max-w-md items-center gap-3.5 overflow-hidden rounded-2xl border border-amber-400/35 bg-gradient-to-r from-slate-950/95 via-amber-950/60 to-slate-950/95 p-3.5 shadow-[0_14px_40px_rgba(245,158,11,0.32)] backdrop-blur-md"
      >
        <FramedAvatar
          avatarUrl={latestGift.avatarUrl}
          frameSlug={frameOverride || latestGift.avatarFrame || "ember-dragon"}
          size={compact ? 66 : 84}
          glowColor={primary}
        />
        <div className="min-w-0 flex-1">
          <div className="inline-flex items-center gap-1 rounded-full bg-amber-400/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-300">
            <Sparkles className="h-3 w-3" />
            {widgetKey === "gift-videos" ? "Cinema Gift Action" : "New Gift Alert"}
          </div>
          <div className="mt-1 truncate text-base font-black text-white">
            <AnimatedOverlayName text={latestGift.displayName} animation="shimmer" />
          </div>
          <div className="text-xs font-semibold text-amber-200/90">
            sent <span className="font-extrabold text-white">{latestGift.giftName || "Rose"}</span>{" "}
            <span className="text-amber-300">
              (+{(latestGift.coins || 1).toLocaleString()} coins)
            </span>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {latestGift.giftIcon ? (
          <img
            src={latestGift.giftIcon}
            alt={latestGift.giftName || "Gift"}
            className="h-16 w-16 shrink-0 object-contain drop-shadow-[0_6px_16px_rgba(251,191,36,0.55)] animate-ol-float"
          />
        ) : (
          <span
            role="img"
            aria-label={latestGift.giftName || "TikTok gift"}
            className="grid h-16 w-16 shrink-0 place-items-center text-4xl"
          >
            🎁
          </span>
        )}
      </div>
    );
  }

  if (widgetKey === "follow-join") {
    const latestJoinOrFollow =
      events.find((e) => e.eventType === "join" || e.eventType === "follow") ?? {
        id: 2,
        eventType: "join",
        displayName: "Zeyad K",
        username: "@zeyad.gg",
        avatarUrl: "/avatars/a3.png",
        avatarFrame: frameOverride || "stormfang-wolf",
        message: "VIP entered the LIVE!",
      };
    const isFollow = latestJoinOrFollow.eventType === "follow";

    return (
      <div
        key={latestJoinOrFollow.id}
        className="animate-ol-pop mx-auto flex w-full max-w-md flex-col items-center gap-2"
      >
        <div className="flex w-full items-center gap-3.5 rounded-full border border-cyan-400/35 bg-slate-950/90 px-4 py-2.5 shadow-[0_10px_32px_rgba(34,211,238,0.28)] backdrop-blur-md">
          <FramedAvatar
            avatarUrl={latestJoinOrFollow.avatarUrl}
            frameSlug={frameOverride || latestJoinOrFollow.avatarFrame || "arcade-bunny"}
            size={compact ? 58 : 74}
            glowColor={primary}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-cyan-300">
              <UserPlus className="h-3 w-3" />
              {isFollow ? "New Follower" : "VIP Stream Entrance"}
            </div>
            <div className="truncate text-sm font-black text-white">
              <AnimatedOverlayName text={latestJoinOrFollow.displayName} animation="aurora" />
            </div>
            <div className="truncate text-xs text-white/75">
              {String(settings.welcomeText || latestJoinOrFollow.message || "welcomed into the LIVE!")}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (widgetKey === "chat-box") {
    const chatEvents = events.filter((e) => e.eventType === "chat").slice(0, compact ? 3 : 5);
    const theme = widget?.theme || "dynamic-island";
    const themeContainerClass =
      theme === "cyber-neon"
        ? "border-fuchsia-500/40 bg-slate-950/90 shadow-[0_0_25px_rgba(217,70,239,0.2)]"
        : theme === "roblox"
          ? "border-4 border-white/80 bg-zinc-900/95 rounded-none"
          : theme === "kawaii-pop"
            ? "border-pink-400/40 bg-rose-950/80"
            : "border-white/15 bg-slate-950/75";

    return (
      <div
        className={`mx-auto w-full max-w-md space-y-2 rounded-2xl border p-3 backdrop-blur-md ${themeContainerClass}`}
      >
        <div className="flex items-center justify-between px-1 text-[10px] font-bold uppercase tracking-wider text-white/60">
          <span className="inline-flex items-center gap-1.5 text-cyan-300">
            <MessageCircle className="h-3 w-3" />
            LIVE Chat · {theme.replace("-", " ")}
          </span>
          <span>TikTok LIVE</span>
        </div>
        <div className="space-y-1.5">
          {chatEvents.map((msg) => (
            <div
              key={msg.id}
              className="animate-ol-pop flex items-start gap-2.5 rounded-2xl bg-white/[0.07] px-3 py-2 ring-1 ring-white/10"
            >
              <FramedAvatar
                avatarUrl={msg.avatarUrl}
                frameSlug={msg.avatarFrame || "moonpaw-cat"}
                size={36}
                showSignatureFx={false}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-cyan-300">
                    {msg.displayName}
                  </span>
                  <span className="rounded bg-amber-400/20 px-1.5 py-0.2 text-[9px] font-bold uppercase text-amber-300">
                    VIP
                  </span>
                </div>
                <p className="text-xs leading-relaxed text-white/95">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetKey === "event-feed") {
    const recent = events.slice(0, 6);
    return (
      <div className="mx-auto w-full max-w-lg overflow-hidden rounded-full border border-white/15 bg-slate-950/85 px-4 py-2 backdrop-blur-md shadow-lg">
        <div className="flex items-center gap-5 whitespace-nowrap animate-ol-marquee">
          {[...recent, ...recent].map((ev, idx) => (
            <div key={`${ev.id}-${idx}`} className="inline-flex items-center gap-2 text-xs">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ev.avatarUrl}
                alt={ev.displayName}
                className="h-5 w-5 rounded-full object-cover ring-1 ring-cyan-400"
              />
              <span className="font-bold text-white">{ev.displayName}</span>
              <span className="text-cyan-300">
                {ev.eventType === "gift" ? (
                  <span className="inline-flex items-center gap-1 text-amber-300">
                    <Gift className="h-3 w-3" /> {ev.giftName} ({ev.coins})
                  </span>
                ) : ev.eventType === "follow" ? (
                  "followed ✨"
                ) : ev.eventType === "like" ? (
                  `+${ev.likes} ❤️`
                ) : ev.eventType === "share" ? (
                  <span className="inline-flex items-center gap-1 text-emerald-300">
                    <Share2 className="h-3 w-3" /> shared
                  </span>
                ) : (
                  "joined 👋"
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetKey === "effects") {
    const latestEffect = events.find((e) => e.eventType === "effect");
    const effectMeta =
      SCREEN_EFFECTS.find((s) => s.id === (latestEffect?.effectKey || widget?.theme)) ??
      SCREEN_EFFECTS[0];

    return (
      <div className="relative mx-auto h-48 w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-slate-950/40 p-3">
        <div className="relative z-10 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white">
            <span>{effectMeta.emoji}</span>
            {effectMeta.name} + Rising Avatar Hearts
          </span>
          <Heart className="h-4 w-4 text-rose-400 animate-pulse" />
        </div>
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {avatars.slice(0, 7).map((av, idx) => (
            <div
              key={av.id}
              className="absolute bottom-2 animate-ol-heart flex flex-col items-center"
              style={{
                left: `${10 + idx * 12}%`,
                animationDelay: `${idx * 0.38}s`,
                animationIterationCount: "infinite",
              }}
            >
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={av.avatarUrl}
                  alt={av.displayName}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-rose-400 shadow-lg"
                />
                <span className="absolute -right-1 -bottom-1 text-xs">
                  {effectMeta.emoji}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (widgetKey === "badge") {
    return (
      <div className="inline-flex items-center gap-2.5 rounded-2xl border border-cyan-400/30 bg-slate-950/90 px-4 py-2.5 shadow-[0_8px_28px_rgba(40,199,250,0.28)] backdrop-blur-md">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="OverlayLive" className="h-7 w-7 object-contain" />
        <div>
          <div className="text-[10px] font-bold uppercase tracking-widest text-cyan-300">
            Powered by
          </div>
          <div className="text-sm font-black text-white">
            Overlay<span className="text-orange-400">Live</span>
          </div>
        </div>
      </div>
    );
  }

  // Default: Social, Branding & Stream Notes
  const noteText = String(
    settings.noteText || "🎁 Top #1 Gifter picks the next game! Type !join in chat",
  );
  return (
    <div className="mx-auto w-full max-w-md space-y-2.5">
      <div className="flex items-center justify-between rounded-2xl border border-cyan-400/30 bg-slate-950/85 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-2.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="Brand" className="h-7 w-7 object-contain" />
          <div>
            <div className="text-xs font-black text-white">
              {profile?.displayName || "Ava Stone"} · {profile?.tiktokHandle || "@yourname"}
            </div>
            <div className="text-[11px] text-cyan-300">
              {String(settings.discord || "discord.gg/avastone")} · {String(settings.youtube || "@AvaStoneTV")}
            </div>
          </div>
        </div>
        <Flame className="h-4 w-4 text-orange-400" />
      </div>
      <div className="rounded-xl border border-amber-400/30 bg-amber-500/15 px-3.5 py-2 text-center text-xs font-bold text-amber-200 backdrop-blur-sm">
        {noteText}
      </div>
    </div>
  );
}

interface SceneCanvasRendererProps {
  layers: SceneLayerItem[];
  widgets: WidgetConfig[];
  profile?: StreamerProfile;
  avatars: AvatarPreset[];
  events: LiveEvent[];
  showSafeZone?: boolean;
  selectedLayerId?: string | null;
  onSelectLayer?: (id: string) => void;
}

export function SceneCanvasRenderer({
  layers,
  widgets,
  profile,
  avatars,
  events,
  showSafeZone = false,
  selectedLayerId,
  onSelectLayer,
}: SceneCanvasRendererProps) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      {layers
        .filter((l) => l.visible)
        .sort((a, b) => a.zIndex - b.zIndex)
        .map((layer) => {
          const w = widgets.find((item) => item.widgetKey === layer.widgetKey);
          const isSelected = selectedLayerId === layer.id;
          return (
            <div
              key={layer.id}
              onClick={() => onSelectLayer?.(layer.id)}
              className={`absolute transition-all duration-200 ${
                onSelectLayer ? "cursor-pointer" : ""
              } ${
                isSelected
                  ? "ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-950 rounded-2xl"
                  : ""
              }`}
              style={{
                left: `${layer.x}%`,
                top: `${layer.y}%`,
                width: `${layer.width}%`,
                transform: `scale(${layer.scale / 100})`,
                transformOrigin: "top left",
                zIndex: layer.zIndex,
              }}
            >
              <OverlayWidgetView
                widgetKey={layer.widgetKey}
                widget={w}
                profile={profile}
                avatars={avatars}
                events={events}
                compact
              />
            </div>
          );
        })}

      {showSafeZone && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-[14%] items-center justify-between border-t border-dashed border-rose-400/50 bg-rose-950/25 px-4 text-[10px] font-bold uppercase tracking-wider text-rose-200/85">
          <span>📱 TikTok Mobile Safe Zone (Native Comments & Gift Tray)</span>
          <span>Keep Clear</span>
        </div>
      )}
    </div>
  );
}
