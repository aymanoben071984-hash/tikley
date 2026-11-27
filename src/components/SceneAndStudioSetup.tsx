"use client";

import { useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

import type {
  AvatarPreset,
  LinkScene,
  LiveEvent,
  SceneLayerItem,
  StreamerProfile,
  WidgetConfig,
} from "@/db/schema";
import { SceneCanvasRenderer } from "@/components/LiveOverlayRenderer";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import {
  Check,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  Monitor,
  Save,
  Smartphone,
  Tv,
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { withFormat } from "@/lib/overlayDisplay";

interface SceneComposerProps {
  scenes: LinkScene[];
  widgets: WidgetConfig[];
  profile?: StreamerProfile;
  avatars: AvatarPreset[];
  events: LiveEvent[];
  onSaveScene: (slug: string, layers: SceneLayerItem[]) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
  onTriggerDeckAction: (keyId: string) => void;
  mode: "scenes" | "studio-setup";
}

const HARDWARE_KEYS = [
  { id: "live", label: "Connect LIVE", icon: "/assets/announcements/keys/live.svg" },
  { id: "effects", label: "Confetti FX", icon: "/assets/announcements/keys/effects.svg" },
  { id: "games", label: "Coin Battle", icon: "/assets/announcements/keys/games.svg" },
  { id: "quiz", label: "Next Quiz Q", icon: "/assets/announcements/keys/quiz.svg" },
  { id: "audience", label: "VIP Join", icon: "/assets/announcements/keys/audience.svg" },
  { id: "followers", label: "Follow Alert", icon: "/assets/announcements/keys/followers.svg" },
  { id: "music", label: "Lion Fanfare", icon: "/assets/announcements/keys/music.svg" },
  { id: "application", label: "Open Scene", icon: "/assets/announcements/keys/application.svg" },
];

export function SceneAndStudioSetup({
  scenes,
  widgets,
  profile,
  avatars,
  events,
  onSaveScene,
  onCopyUrl,
  onTriggerDeckAction,
  mode,
}: SceneComposerProps) {  const { locale } = useLocale();
  const tx = (source: string) => translateText(locale, source);

  const [selectedSceneSlug, setSelectedSceneSlug] = useState<string>("tiktok-studio");
  const activeScene =
    scenes.find((s) => s.slug === selectedSceneSlug) ?? scenes[0];

  const [draftLayers, setDraftLayers] = useState<SceneLayerItem[]>(
    activeScene?.layersJson ?? [],
  );
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(
    activeScene?.layersJson?.[0]?.id ?? null,
  );
  const [showSafeZone, setShowSafeZone] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [guideTab, setGuideTab] = useState<"tiktok" | "obs" | "streamlabs">("tiktok");

  useEffect(() => {
    if (activeScene) {
      setDraftLayers(activeScene.layersJson);
      setSelectedLayerId(activeScene.layersJson[0]?.id ?? null);
    }
  }, [activeScene]);

  const selectedLayer = draftLayers.find((l) => l.id === selectedLayerId);
  const isVertical = selectedSceneSlug === "tiktok-studio";

  const updateLayer = (id: string, patch: Partial<SceneLayerItem>) => {
    setDraftLayers((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleSave = async () => {
    setSaving(true);
    await onSaveScene(selectedSceneSlug, draftLayers);
    notifyOverlayChannel({ type: "scene-update", slug: selectedSceneSlug });
    playBroadcastSound("follow");
    setSaving(false);
  };

  const copyWithFeedback = (path: string, label: string) => {
    onCopyUrl(path, label);
    setCopiedPath(path);
    setTimeout(() => setCopiedPath(null), 1800);
  };

  const customObsCss = `body { background-color: rgba(0, 0, 0, 0) !important; margin: 0px auto; overflow: hidden; }`;

  const allOverlayEndpoints = [
    { label: "TikTok LIVE Studio Master Scene (9:16)", path: "/overlay/scene/tiktok-studio", size: "1080 × 1920" },
    { label: "OBS Studio Master Scene (16:9)", path: "/overlay/scene/obs-studio", size: "1920 × 1080" },
    { label: "Top Gifters & Coin Leaderboard", path: "/overlay/top-lists", size: "600 × 700" },
    { label: "Goals Vessel Overlay", path: "/overlay/goals", size: "550 × 300" },
    { label: "Gift Alerts & Lion Celebrations", path: "/overlay/gift-alerts", size: "650 × 320" },
    { label: "Follow & VIP Framed Join Alerts", path: "/overlay/follow-join", size: "650 × 280" },
    { label: "TikTok Chat Box (18+ Themes)", path: "/overlay/chat-box", size: "550 × 650" },
    { label: "Latest Events Ticker", path: "/overlay/event-feed", size: "900 × 140" },
    { label: "15 Screen Effects & Rising Hearts", path: "/overlay/effects", size: "1080 × 1920" },
    { label: "Live Trivia Quiz Game", path: "/overlay/game/live-quiz", size: "700 × 520" },
    { label: "Timed Coin Battle Game", path: "/overlay/game/coin-battle", size: "700 × 520" },
    { label: "Lucky Prize Wheel Game", path: "/overlay/game/lucky-wheel", size: "600 × 600" },
  ];

  return (
    <div className="space-y-6">
      {/* Top Switcher Header */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-sky-950/50 via-card to-indigo-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/35">
              <Layers className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-foreground">
                {mode === "scenes"
                  ? "Link Scenes — One Browser Source for TikTok LIVE Studio & OBS"
                  : "TikTok LIVE Studio & OBS Studio Broadcast Integration"}
              </h2>
              <p className="text-xs text-muted-foreground">
                Combine Leaderboards, Goals, Gift Alerts, Chat Box &amp; VIP Frames into a single lightweight Web / Browser Source link.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setSelectedSceneSlug("tiktok-studio")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                isVertical
                  ? "bg-brand-cyan text-slate-950 shadow"
                  : "border border-border bg-secondary/50 text-foreground"
              }`}
            >
              <Smartphone className="h-3.5 w-3.5" />
              TikTok LIVE Studio (9:16)
            </button>
            <button
              type="button"
              onClick={() => setSelectedSceneSlug("obs-studio")}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition ${
                !isVertical
                  ? "bg-brand-cyan text-slate-950 shadow"
                  : "border border-border bg-secondary/50 text-foreground"
              }`}
            >
              <Monitor className="h-3.5 w-3.5" />
              OBS Studio (16:9)
            </button>
          </div>
        </div>
      </div>

      {/* Interactive Link Scene Canvas + Layer Inspector */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="checkerboard-stage flex flex-col items-center justify-between rounded-2xl border border-border p-5">
          <div className="mb-3 flex w-full flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-extrabold text-white">
              {isVertical
                ? "📱 Vertical Canvas · 1080 × 1920 (TikTok LIVE Studio Web Source)"
                : "🖥️ Widescreen Canvas · 1920 × 1080 (OBS Studio Browser Source)"}
            </span>
            {isVertical && (
              <label className="inline-flex cursor-pointer items-center gap-1.5 text-[11px] font-semibold text-rose-300">
                <input
                  type="checkbox"
                  checked={showSafeZone}
                  onChange={(e) => setShowSafeZone(e.target.checked)}
                />
                Show TikTok Phone UI Safe Zone
              </label>
            )}
          </div>

          <div
            className={`relative overflow-hidden rounded-2xl border-2 border-white/20 bg-slate-950/65 shadow-2xl transition-all ${
              isVertical
                ? "aspect-[9/16] w-full max-w-[330px]"
                : "aspect-video w-full max-w-[660px]"
            }`}
          >
            <SceneCanvasRenderer
              layers={draftLayers}
              widgets={widgets}
              profile={profile}
              avatars={avatars}
              events={events}
              showSafeZone={isVertical && showSafeZone}
              selectedLayerId={selectedLayerId}
              onSelectLayer={(id) => setSelectedLayerId(id)}
            />
          </div>

          <div className="mt-4 flex w-full flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  copyWithFeedback(
                    `/overlay/scene/${selectedSceneSlug}`,
                    isVertical ? "TikTok Studio Scene" : "OBS Studio Scene",
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-black text-white shadow hover:brightness-110"
              >
                {copiedPath === `/overlay/scene/${selectedSceneSlug}` ? (
                  <Check className="h-3.5 w-3.5" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
                Copy 1-Link Scene URL
              </button>
              <a
                href={`/overlay/scene/${selectedSceneSlug}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-bold text-white hover:bg-white/15"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Preview Transparent Tab
              </a>
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-black text-slate-950 hover:brightness-110 disabled:opacity-60"
            >
              <Save className="h-3.5 w-3.5" />
              {saving ? "Saving..." : "Save Scene Layout"}
            </button>
          </div>
        </div>

        {/* Layer Controls + Position Sliders */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-extrabold text-foreground">
            🧩 Scene Layers (Click a layer to position &amp; resize)
          </h3>

          <div className="space-y-2">
            {draftLayers.map((layer) => {
              const active = selectedLayerId === layer.id;
              return (
                <div
                  key={layer.id}
                  onClick={() => setSelectedLayerId(layer.id)}
                  className={`flex cursor-pointer items-center justify-between rounded-xl border px-3.5 py-2.5 transition ${
                    active
                      ? "border-brand-cyan bg-brand-cyan/10"
                      : "border-border bg-secondary/30 hover:bg-secondary/50"
                  }`}
                >
                  <div>
                    <div className="text-xs font-extrabold text-foreground">
                      {layer.label}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      X: {layer.x}% · Y: {layer.y}% · Width: {layer.width}% · Scale: {layer.scale}%
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      updateLayer(layer.id, { visible: !layer.visible });
                    }}
                    className={`rounded-lg p-1.5 ${
                      layer.visible
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-secondary text-muted-foreground"
                    }`}
                  >
                    {layer.visible ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              );
            })}
          </div>

          {selectedLayer && (
            <div className="space-y-3 rounded-xl border border-border bg-secondary/25 p-3.5">
              <div className="text-xs font-extrabold text-brand-cyan">
                Editing Layer: {selectedLayer.label}
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <label className="space-y-1">
                  <span className="flex justify-between font-semibold text-muted-foreground">
                    <span>{tx("Horizontal (X)")}</span>
                    <span>{selectedLayer.x}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={85}
                    value={selectedLayer.x}
                    onChange={(e) =>
                      updateLayer(selectedLayer.id, { x: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="flex justify-between font-semibold text-muted-foreground">
                    <span>{tx("Vertical (Y)")}</span>
                    <span>{selectedLayer.y}%</span>
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={88}
                    value={selectedLayer.y}
                    onChange={(e) =>
                      updateLayer(selectedLayer.id, { y: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="flex justify-between font-semibold text-muted-foreground">
                    <span>{tx("Layer Width")}</span>
                    <span>{selectedLayer.width}%</span>
                  </span>
                  <input
                    type="range"
                    min={20}
                    max={98}
                    value={selectedLayer.width}
                    onChange={(e) =>
                      updateLayer(selectedLayer.id, { width: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </label>
                <label className="space-y-1">
                  <span className="flex justify-between font-semibold text-muted-foreground">
                    <span>{tx("Scale")}</span>
                    <span>{selectedLayer.scale}%</span>
                  </span>
                  <input
                    type="range"
                    min={60}
                    max={125}
                    value={selectedLayer.scale}
                    onChange={(e) =>
                      updateLayer(selectedLayer.id, { scale: Number(e.target.value) })
                    }
                    className="w-full accent-cyan-400"
                  />
                </label>
              </div>
            </div>
          )}

          {/* Stream Deck Virtual Hotkey Pad */}
          <div className="rounded-xl border border-border bg-secondary/20 p-3.5">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-extrabold text-foreground">
                🎛️ Live Stream Deck &amp; Studio Hotkeys (Click to fire!)
              </span>
              <span className="text-[10px] font-bold text-brand-cyan">{tx("8 Physical Keys")}</span>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {HARDWARE_KEYS.map((k) => (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => onTriggerDeckAction(k.id)}
                  className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-slate-950 p-2 text-center shadow hover:border-brand-cyan hover:scale-[1.03] active:scale-95 transition"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={k.icon} alt={k.label} className="h-9 w-9 object-contain" />
                  <span className="text-[10px] font-bold text-white/85">{k.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Step-by-Step TikTok LIVE Studio & OBS Studio Setup Guide */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-2 text-base font-black text-foreground">
              <Tv className="h-5 w-5 text-brand-cyan" />
              Step-by-Step Broadcaster Setup
            </h3>
            <div className="flex rounded-xl bg-secondary p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setGuideTab("tiktok")}
                className={`rounded-lg px-2.5 py-1 ${
                  guideTab === "tiktok" ? "bg-brand-cyan text-slate-950" : "text-muted-foreground"
                }`}
              >
                TikTok LIVE Studio
              </button>
              <button
                type="button"
                onClick={() => setGuideTab("obs")}
                className={`rounded-lg px-2.5 py-1 ${
                  guideTab === "obs" ? "bg-brand-cyan text-slate-950" : "text-muted-foreground"
                }`}
              >
                OBS Studio
              </button>
              <button
                type="button"
                onClick={() => setGuideTab("streamlabs")}
                className={`rounded-lg px-2.5 py-1 ${
                  guideTab === "streamlabs" ? "bg-brand-cyan text-slate-950" : "text-muted-foreground"
                }`}
              >
                Streamlabs
              </button>
            </div>
          </div>

          {guideTab === "tiktok" && (
            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("1. Copy your Vertical Scene URL:")}</strong>{" "}
                Click <em>{tx("Copy 1-Link Scene URL")}</em> {tx("above (")}<code className="text-brand-cyan">{tx("/overlay/scene/tiktok-studio")}</code>).
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("2. Open TikTok LIVE Studio → Add Source → Link / Web:")}</strong>{" "}
                Choose <strong>{tx("Link (Web)")}</strong> in your Sources list and paste your OverlayLive URL.
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("3. Set Resolution to 1080 × 1920 (60 FPS):")}</strong>{" "}
                Place the Web layer above your Camera or Game Capture. Keep the bottom 14% clear for TikTok mobile chat!
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("4. Test before going LIVE:")}</strong>{" "}
                Keep <em>{tx("Test Mode")}</em> enabled in your Dashboard to preview Gifts, VIP Avatars &amp; Games directly inside TikTok LIVE Studio.
              </li>
            </ol>
          )}

          {guideTab === "obs" && (
            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("1. In OBS Studio, click Sources → + → Browser:")}</strong>{" "}
                Name it <code className="text-brand-cyan">{tx("OverlayLive Master Scene")}</code>.
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("2. Paste URL & Set Dimensions:")}</strong>{" "}
                Use <code className="text-brand-cyan">1920 × 1080</code> for Horizontal OBS or{" "}
                <code className="text-brand-cyan">1080 × 1920</code> if using Aitum Vertical Plugin. Check{" "}
                <em>{tx("Control audio via OBS")}</em>.
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <div className="mb-1 flex items-center justify-between">
                  <strong className="text-foreground">{tx("3. Transparent Custom CSS (Auto-applied):")}</strong>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(customObsCss);
                    }}
                    className="text-[11px] font-bold text-brand-cyan hover:underline"
                  >
                    Copy CSS
                  </button>
                </div>
                <code className="block rounded-lg bg-slate-950 p-2 font-mono text-[11px] text-emerald-300">
                  {customObsCss}
                </code>
              </li>
            </ol>
          )}

          {guideTab === "streamlabs" && (
            <ol className="space-y-2.5 text-xs text-muted-foreground">
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("1. Streamlabs Desktop Dual Output Ready:")}</strong>{" "}
                Add a <strong>{tx("Browser Source")}</strong> in both your Horizontal (16:9) and Vertical (9:16) scenes!
              </li>
              <li className="rounded-xl border border-border bg-secondary/25 p-3">
                <strong className="text-foreground">{tx("2. Paste Dedicated Scene Links:")}</strong>{" "}
                Use <code className="text-brand-cyan">{tx("/overlay/scene/obs-studio")}</code> for YouTube/Twitch and{" "}
                <code className="text-brand-cyan">{tx("/overlay/scene/tiktok-studio")}</code> for TikTok Dual Output.
              </li>
            </ol>
          )}
        </div>

        {/* All Direct Widget & Game Browser Source Links */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="mb-3 text-base font-black text-foreground">
            🔗 Direct Browser Source Links (OBS &amp; TikTok LIVE Studio)
          </h3>
          <div className="max-h-[310px] space-y-2 overflow-y-auto pr-1">
            {allOverlayEndpoints.map((ep) => (
              <div
                key={ep.path}
                className="flex items-center justify-between gap-2 rounded-xl border border-border bg-secondary/25 px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <div className="truncate font-bold text-foreground">{ep.label}</div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {ep.path} · Recommended: {ep.size}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <button
                    type="button"
                    title={tx("Copy TikTok LIVE Studio link (9:16)")}
                    onClick={() => copyWithFeedback(withFormat(ep.path, "9:16"), `${ep.label} (9:16)`)}
                    className="rounded-lg bg-pink-500/15 px-2 py-1 text-[11px] font-bold text-pink-300 hover:bg-pink-500/25"
                  >
                    9:16
                  </button>
                  <button
                    type="button"
                    title={tx("Copy OBS link (16:9)")}
                    onClick={() => copyWithFeedback(withFormat(ep.path, "16:9"), `${ep.label} (16:9)`)}
                    className="rounded-lg bg-sky-500/15 px-2 py-1 text-[11px] font-bold text-sky-300 hover:bg-sky-500/25"
                  >
                    16:9
                  </button>
                  <button
                    type="button"
                    onClick={() => copyWithFeedback(ep.path, ep.label)}
                    className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan/20 px-2.5 py-1 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/30"
                  >
                    {copiedPath === ep.path ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                    {copiedPath === ep.path ? "Copied" : "Copy"}
                  </button>
                  <a
                    href={ep.path}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-border p-1 text-muted-foreground hover:text-foreground"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
