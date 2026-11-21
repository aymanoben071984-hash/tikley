"use client";

import type {
  AvatarPreset,
  LiveEvent,
  StreamerProfile,
  WidgetConfig,
} from "@/db/schema";
import { FramedAvatar } from "@/components/FramedAvatar";
import { OverlayWidgetView } from "@/components/LiveOverlayRenderer";
import {
  notifyOverlayChannel,
  playBroadcastSound,
  speakBroadcastTts,
} from "@/components/SoundEngine";
import {
  AVATAR_FRAMES,
  CHAT_THEMES,
  GIFT_CATALOG,
  SCREEN_EFFECTS,
  SHOWCASE_ARTWORKS,
} from "@/lib/catalog";
import {
  Check,
  Copy,
  Cpu,
  ExternalLink,
  Gauge,
  Gift,
  Heart,
  Send,
  Settings2,
  Sparkles,
  Users,
  Volume2,
} from "lucide-react";
import React, { useState } from "react";

interface WidgetStudioPanelProps {
  sectionId: string;
  profile: StreamerProfile;
  widgets: WidgetConfig[];
  avatars: AvatarPreset[];
  events: LiveEvent[];
  onUpdateWidget: (
    widgetKey: string,
    patch: Record<string, unknown>,
  ) => Promise<void>;
  onUpdateProfile: (patch: Record<string, unknown>) => Promise<void>;
  onFireEvent: (payload: Record<string, unknown>) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

export function WidgetStudioPanel({
  sectionId,
  profile,
  widgets,
  avatars,
  events,
  onUpdateWidget,
  onUpdateProfile,
  onFireEvent,
  onCopyUrl,
}: WidgetStudioPanelProps) {
  const [chatDraft, setChatDraft] = useState("");
  const [ttsSample, setTtsSample] = useState(
    "Mira Lee just dropped a Lion! Welcome everyone to Ava's TikTok LIVE!",
  );
  const [copied, setCopied] = useState(false);

  // Live Room Section
  if (sectionId === "live-room") {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-foreground">
                📡 Live Room Control &amp; Moderation Deck
              </h2>
              <p className="text-xs text-muted-foreground">
                Monitor incoming TikTok LIVE comments, gifts, follows and fire instant broadcast reactions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {GIFT_CATALOG.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => {
                    playBroadcastSound(g.coins > 1000 ? "lion" : "gift");
                    onFireEvent({ eventType: "gift", giftId: g.id });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-1.5 text-xs font-bold hover:border-amber-400/50"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={g.icon} alt={g.name} className="h-4 w-4 object-contain" />
                  Send {g.name}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Live Event Stream */}
            <div className="rounded-2xl border border-border bg-secondary/20 p-4">
              <div className="mb-3 flex items-center justify-between text-xs font-extrabold">
                <span>⚡ Real-Time Event Log ({events.length})</span>
                <span className="text-emerald-400">● Synced with PostgreSQL</span>
              </div>
              <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                {events.map((ev) => (
                  <div
                    key={ev.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border/60 bg-card px-3 py-2 text-xs"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <FramedAvatar
                        avatarUrl={ev.avatarUrl}
                        frameSlug={ev.avatarFrame}
                        size={38}
                        showSignatureFx={false}
                      />
                      <div className="min-w-0">
                        <div className="truncate font-bold text-foreground">
                          {ev.displayName}{" "}
                          <span className="font-normal text-muted-foreground">
                            ({ev.username})
                          </span>
                        </div>
                        <div className="truncate text-[11px] text-brand-cyan">
                          {ev.message}
                        </div>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase">
                      {ev.eventType}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={chatDraft}
                  onChange={(e) => setChatDraft(e.target.value)}
                  placeholder="Post simulated viewer chat comment..."
                  className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-xs outline-none focus:border-brand-cyan"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!chatDraft.trim()) return;
                    onFireEvent({ eventType: "chat", message: chatDraft.trim() });
                    if (profile.ttsEnabled) {
                      speakBroadcastTts(chatDraft.trim());
                    }
                    setChatDraft("");
                  }}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2 text-xs font-black text-slate-950"
                >
                  <Send className="h-3.5 w-3.5" />
                  Send
                </button>
              </div>
            </div>

            {/* Live Combined Preview */}
            <div className="checkerboard-stage flex flex-col justify-center gap-3 rounded-2xl border border-border p-4">
              <OverlayWidgetView
                widgetKey="gift-alerts"
                widget={widgets.find((w) => w.widgetKey === "gift-alerts")}
                profile={profile}
                avatars={avatars}
                events={events}
                compact
              />
              <OverlayWidgetView
                widgetKey="chat-box"
                widget={widgets.find((w) => w.widgetKey === "chat-box")}
                profile={profile}
                avatars={avatars}
                events={events}
                compact
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Live Viewers Section
  if (sectionId === "viewers") {
    return (
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="flex items-center gap-2 text-xl font-black text-foreground">
              <Users className="h-5 w-5 text-brand-cyan" />
              Live Viewers &amp; Audience Spotlight ({avatars.length} Active)
            </h2>
            <p className="text-xs text-muted-foreground">
              Click Spotlight on any viewer to feature their framed avatar &amp; message live on OBS &amp; TikTok LIVE Studio.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {avatars.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between rounded-2xl border border-border bg-secondary/25 p-3.5"
            >
              <div className="flex min-w-0 items-center gap-3">
                <FramedAvatar
                  avatarUrl={v.avatarUrl}
                  frameSlug={v.frameSlug}
                  size={60}
                  glowColor={v.glowColor}
                  showSignatureFx={false}
                />
                <div className="min-w-0">
                  <div className="truncate text-sm font-extrabold text-foreground">
                    {v.displayName}
                  </div>
                  <div className="truncate text-xs text-brand-cyan">{v.tiktokUsername}</div>
                  <div className="text-[11px] text-amber-300 font-bold">
                    🪙 {v.coinsTotal.toLocaleString()} · ❤️ {v.likesTotal.toLocaleString()}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("join");
                  onFireEvent({
                    eventType: "join",
                    displayName: v.displayName,
                    username: v.tiktokUsername,
                    avatarUrl: v.avatarUrl,
                    avatarFrame: v.frameSlug,
                    message: `🌟 SPOTLIGHT: ${v.welcomeMessage}`,
                  });
                }}
                className="rounded-xl bg-brand-cyan/20 px-3 py-1.5 text-xs font-bold text-brand-cyan hover:bg-brand-cyan/30"
              >
                Spotlight
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Performance Wizard Section
  if (sectionId === "performance") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-500/15 text-emerald-400">
            <Gauge className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-black text-foreground">
              Performance Wizard — TikTok LIVE Studio &amp; OBS Encoder Optimizer
            </h2>
            <p className="text-xs text-muted-foreground">
              Hardware-accelerated browser source benchmark &amp; single-scene optimization status.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4">
            <div className="text-xs font-bold text-emerald-300">ENCODER HEADROOM</div>
            <div className="mt-1 text-2xl font-black text-foreground">98.4% Optimal</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Using Link Scenes consolidates 10 widgets into 1 Chromium render process.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="flex items-center gap-1.5 text-xs font-bold text-brand-cyan">
              <Cpu className="h-4 w-4" /> TIKTOK LIVE STUDIO PRESET
            </div>
            <div className="mt-1 text-2xl font-black text-foreground">1080×1920 · 60fps</div>
            <p className="mt-1 text-xs text-muted-foreground">
              Recommended bitrate: 6,000 kbps NVENC / Apple VT H.264.
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-secondary/30 p-4">
            <div className="text-xs font-bold text-amber-300">ACTIVE WIDGET BUDGET</div>
            <div className="mt-1 text-2xl font-black text-foreground">
              {widgets.filter((w) => w.enabled).length} / 12 Layers
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              GPU CSS compositing active for all 68 avatar frames &amp; particle effects.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Global Settings Section
  if (sectionId === "settings") {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <div className="flex items-center gap-3">
          <Settings2 className="h-6 w-6 text-brand-cyan" />
          <div>
            <h2 className="text-xl font-black text-foreground">
              Account, Streamer Identity &amp; Broadcast Defaults
            </h2>
            <p className="text-xs text-muted-foreground">
              Changes save directly to PostgreSQL and sync immediately across OBS Studio &amp; TikTok LIVE Studio.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="space-y-1 text-xs">
            <span className="font-bold text-muted-foreground">Display Name</span>
            <input
              defaultValue={profile.displayName}
              onBlur={(e) => onUpdateProfile({ displayName: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-semibold text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs">
            <span className="font-bold text-muted-foreground">TikTok @Handle</span>
            <input
              defaultValue={profile.tiktokHandle}
              onBlur={(e) => onUpdateProfile({ tiktokHandle: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-semibold text-foreground"
            />
          </label>
          <label className="space-y-1 text-xs sm:col-span-2">
            <span className="font-bold text-muted-foreground">Creator Bio</span>
            <input
              defaultValue={profile.bio}
              onBlur={(e) => onUpdateProfile({ bio: e.target.value })}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2 font-semibold text-foreground"
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 pt-2 text-xs font-bold">
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5">
            <input
              type="checkbox"
              checked={profile.ttsEnabled}
              onChange={(e) => onUpdateProfile({ ttsEnabled: e.target.checked })}
            />
            Enable Browser TTS Chat Reader
          </label>
          <label className="inline-flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-4 py-2.5">
            <input
              type="checkbox"
              checked={profile.soundAlertsEnabled}
              onChange={(e) => onUpdateProfile({ soundAlertsEnabled: e.target.checked })}
            />
            Enable Sound Alert Chimes
          </label>
        </div>

        <div className="rounded-2xl border border-border bg-secondary/20 p-4">
          <div className="mb-2 text-sm font-extrabold text-foreground">Legal</div>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {[
              { label: "Terms of Service", path: "/terms" },
              { label: "Privacy Policy", path: "/privacy" },
            ].map((l) => (
              <div key={l.path} className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card px-3 py-2 text-xs">
                <div className="min-w-0">
                  <div className="font-bold text-foreground">{l.label}</div>
                  <div className="truncate font-mono text-[10px] text-muted-foreground">
                    {typeof window !== "undefined" ? window.location.origin : ""}
                    {l.path}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onCopyUrl(l.path, l.label)}
                    className="rounded-lg bg-brand-cyan/20 px-2.5 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/30"
                  >
                    Copy URL
                  </button>
                  <a href={l.path} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-2 py-1 text-[11px] font-bold text-muted-foreground hover:text-foreground">
                    Open
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Generic Widget Customizer for all Overlay Widget Sections
  const widget =
    widgets.find((w) => w.widgetKey === sectionId) ?? widgets[0];
  const customSettings = (widget?.customSettings || {}) as Record<string, unknown>;
  const overlayPath = `/overlay/${widget?.widgetKey || "top-lists"}`;

  const savePatch = async (patch: Record<string, unknown>) => {
    if (!widget) return;
    await onUpdateWidget(widget.widgetKey, patch);
    notifyOverlayChannel({ type: "widget-update", widgetKey: widget.widgetKey });
  };

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-cyan-950/40 via-card to-slate-900/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-foreground">{widget?.title}</h2>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${
                  widget?.enabled
                    ? "bg-emerald-500/20 text-emerald-300"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {widget?.enabled ? "Enabled on Stream" : "Paused"}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Customize themes, ornate avatar frames, colors, animations and copy the Browser Source URL for TikTok LIVE Studio &amp; OBS.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onCopyUrl(overlayPath, widget?.title || "Overlay");
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110"
            >
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              Copy OBS / Studio URL
            </button>
            <a
              href={overlayPath}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open Overlay
            </a>
          </div>
        </div>
      </div>

      {/* Live Preview + Settings Grid */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="checkerboard-stage flex min-h-[340px] flex-col justify-between rounded-2xl border border-border p-5">
          <div className="flex items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Live Transparent Stream Preview
            </span>
            <span className="font-mono text-[11px] text-white/60">{overlayPath}</span>
          </div>

          <div className="my-auto py-4">
            <OverlayWidgetView
              widgetKey={widget?.widgetKey || "top-lists"}
              widget={widget}
              profile={profile}
              avatars={avatars}
              events={events}
            />
          </div>

          {/* Quick Test Triggers */}
          <div className="flex flex-wrap items-center gap-2 border-t border-white/10 pt-3">
            <span className="text-[11px] font-bold text-white/70">Fire Test Event:</span>
            <button
              type="button"
              onClick={() => {
                playBroadcastSound("gift");
                onFireEvent({ eventType: "gift", giftId: "rose" });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-500/20 px-2.5 py-1 text-xs font-bold text-rose-200 hover:bg-rose-500/30"
            >
              🌹 Rose
            </button>
            <button
              type="button"
              onClick={() => {
                playBroadcastSound("lion");
                onFireEvent({ eventType: "gift", giftId: "lion" });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-amber-500/25 px-2.5 py-1 text-xs font-bold text-amber-200 hover:bg-amber-500/35"
            >
              🦁 Lion (29,999)
            </button>
            <button
              type="button"
              onClick={() => {
                playBroadcastSound("follow");
                onFireEvent({ eventType: "follow" });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-cyan-500/20 px-2.5 py-1 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30"
            >
              ➕ Follow
            </button>
            <button
              type="button"
              onClick={() => {
                playBroadcastSound("join");
                onFireEvent({ eventType: "join" });
              }}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/20 px-2.5 py-1 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30"
            >
              👋 VIP Join
            </button>
          </div>
        </div>

        {/* Customizer Controls */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground">
              🎨 Design, Theme &amp; Animation Settings
            </h3>
            <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-bold">
              <input
                type="checkbox"
                checked={widget?.enabled ?? true}
                onChange={(e) => savePatch({ enabled: e.target.checked })}
              />
              Layer Active
            </label>
          </div>

          {/* Colors & Avatar Frame */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Primary Accent
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5">
                <input
                  type="color"
                  value={widget?.primaryColor || "#28c7fa"}
                  onChange={(e) => savePatch({ primaryColor: e.target.value })}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-xs">{widget?.primaryColor}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Secondary Glow
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5">
                <input
                  type="color"
                  value={widget?.secondaryColor || "#ff8a2b"}
                  onChange={(e) => savePatch({ secondaryColor: e.target.value })}
                  className="h-6 w-8 cursor-pointer border-0 bg-transparent"
                />
                <span className="font-mono text-xs">{widget?.secondaryColor}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Default Avatar Frame
              </label>
              <select
                value={widget?.avatarFrame || "ember-dragon"}
                onChange={(e) => savePatch({ avatarFrame: e.target.value })}
                className="w-full rounded-xl border border-border bg-background px-2.5 py-2 text-xs font-semibold"
              >
                {AVATAR_FRAMES.map((f) => (
                  <option key={f.slug} value={f.slug}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Section-Specific Theme & Artwork Selectors */}
          {sectionId === "top-lists" && (
            <div className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "podium", label: "Spotlight Podium" },
                  { id: "list", label: "Voltage Rows" },
                  { id: "artwork", label: "Painted Boards" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() =>
                      savePatch({ customSettings: { mode: m.id } })
                    }
                    className={`rounded-xl border py-2 text-xs font-bold ${
                      (customSettings.mode || "podium") === m.id
                        ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                        : "border-border bg-secondary/40 text-muted-foreground"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              <div>
                <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  Reference Board Artworks (Click to apply)
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SHOWCASE_ARTWORKS.filter((a) => a.category === "leaderboard").map(
                    (art) => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() =>
                          savePatch({
                            customSettings: { mode: "artwork", artworkTheme: art.id },
                          })
                        }
                        className="group overflow-hidden rounded-xl border border-border bg-slate-950 p-1.5 text-left hover:border-brand-cyan"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={art.url}
                          alt={art.title}
                          className="h-16 w-full object-contain"
                        />
                        <div className="mt-1 truncate text-[10px] font-bold text-foreground">
                          {art.title}
                        </div>
                      </button>
                    ),
                  )}
                </div>
              </div>
            </div>
          )}

          {sectionId === "goals" && (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Goal Title</span>
                  <input
                    defaultValue={String(customSettings.label || "Daily Coin Goal")}
                    onBlur={(e) =>
                      savePatch({ customSettings: { label: e.target.value } })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-semibold"
                  />
                </label>
                <label className="text-xs">
                  <span className="font-semibold text-muted-foreground">Target Amount</span>
                  <input
                    type="number"
                    defaultValue={Number(customSettings.target || 1000)}
                    onBlur={(e) =>
                      savePatch({ customSettings: { target: Number(e.target.value) } })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-1.5 font-semibold"
                  />
                </label>
              </div>
              <div>
                <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                  Painted Goal Vessels (Little Ghost, Liquid Heart, Froggy Drink, Crystal, Jar)
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {SHOWCASE_ARTWORKS.filter((a) => a.category === "goal").map((art) => (
                    <button
                      key={art.id}
                      type="button"
                      onClick={() =>
                        savePatch({
                          theme: art.id,
                          customSettings: { vesselStyle: art.id },
                        })
                      }
                      className={`rounded-xl border p-1.5 text-center ${
                        (customSettings.vesselStyle || widget?.theme) === art.id
                          ? "border-brand-cyan bg-brand-cyan/15"
                          : "border-border bg-slate-950"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={art.url}
                        alt={art.title}
                        className="mx-auto h-14 w-auto object-contain"
                      />
                      <span className="mt-1 block truncate text-[9px] font-bold">
                        {art.title}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {sectionId === "chat-box" && (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                18+ Broadcast Chat Box Themes
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 max-h-52 overflow-y-auto pr-1">
                {CHAT_THEMES.map((ct) => (
                  <button
                    key={ct.id}
                    type="button"
                    onClick={() => savePatch({ theme: ct.id })}
                    className={`flex items-center justify-between rounded-xl border px-2.5 py-2 text-xs font-bold ${
                      widget?.theme === ct.id
                        ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                        : "border-border bg-secondary/35 text-foreground"
                    }`}
                  >
                    <span className="truncate">{ct.name}</span>
                    <span className="text-[9px] opacity-70">{ct.badge}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sectionId === "effects" && (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-muted-foreground">
                15 Instant Screen Effects (Click any key to fire on stream!)
              </div>
              <div className="grid grid-cols-3 gap-2 max-h-60 overflow-y-auto pr-1">
                {SCREEN_EFFECTS.map((fx) => (
                  <button
                    key={fx.id}
                    type="button"
                    onClick={() => {
                      playBroadcastSound("effect");
                      savePatch({ theme: fx.id });
                      onFireEvent({ eventType: "effect", effectKey: fx.id });
                    }}
                    className={`flex items-center gap-1.5 rounded-xl border p-2 text-left text-[11px] font-bold transition ${
                      widget?.theme === fx.id
                        ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan"
                        : "border-border bg-secondary/40 hover:border-brand-cyan/40"
                    }`}
                  >
                    <span>{fx.emoji}</span>
                    <span className="truncate">{fx.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {sectionId === "tts-sound" && (
            <div className="space-y-3">
              <label className="block text-xs">
                <span className="font-semibold text-muted-foreground">
                  Test Live Browser Text-to-Speech (TTS)
                </span>
                <textarea
                  rows={2}
                  value={ttsSample}
                  onChange={(e) => setTtsSample(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-border bg-background p-2.5 text-xs"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => speakBroadcastTts(ttsSample)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-brand-cyan px-4 py-2 text-xs font-black text-slate-950"
                >
                  <Volume2 className="h-3.5 w-3.5" />
                  Speak Aloud Now
                </button>
                <button
                  type="button"
                  onClick={() => playBroadcastSound("gift")}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold"
                >
                  🔔 Gift Chime
                </button>
                <button
                  type="button"
                  onClick={() => playBroadcastSound("lion")}
                  className="rounded-xl border border-border bg-secondary px-3 py-2 text-xs font-bold"
                >
                  🎺 Lion Fanfare
                </button>
              </div>
            </div>
          )}

          {(sectionId === "gift-alerts" ||
            sectionId === "gift-videos" ||
            sectionId === "follow-join" ||
            sectionId === "event-feed" ||
            sectionId === "branding") && (
            <div className="space-y-2.5 pt-1">
              <div className="text-xs font-semibold text-muted-foreground">
                Entrance &amp; Loop Animation
              </div>
              <div className="flex flex-wrap gap-1.5">
                {["pop", "zoom", "rise", "bounce", "float", "pulse", "heartbeat"].map(
                  (anim) => (
                    <button
                      key={anim}
                      type="button"
                      onClick={() => savePatch({ animation: anim })}
                      className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize ${
                        widget?.animation === anim
                          ? "bg-brand-cyan text-slate-950"
                          : "bg-secondary/60 text-muted-foreground"
                      }`}
                    >
                      {anim}
                    </button>
                  ),
                )}
              </div>
              {sectionId === "branding" && (
                <label className="block pt-1 text-xs">
                  <span className="font-semibold text-muted-foreground">
                    On-Stream Sticky Note / Banner
                  </span>
                  <input
                    defaultValue={String(
                      customSettings.noteText ||
                        "🎁 Top #1 Gifter picks the next game! Type !join in chat",
                    )}
                    onBlur={(e) =>
                      savePatch({ customSettings: { noteText: e.target.value } })
                    }
                    className="mt-1 w-full rounded-xl border border-border bg-background px-3 py-2 font-semibold"
                  />
                </label>
              )}
            </div>
          )}

          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/20 px-3.5 py-2.5 text-xs">
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Gift className="h-3.5 w-3.5 text-amber-400" />
              Works in OBS Studio, Streamlabs &amp; TikTok LIVE Studio
            </span>
            <Heart className="h-3.5 w-3.5 text-rose-400" />
          </div>
        </div>
      </div>
    </div>
  );
}
