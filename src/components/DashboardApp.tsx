"use client";

import { pageHidden, pollMs } from "@/lib/poll";
import type {
  AvatarPreset,
  GameConfig,
  LinkScene,
  LiveEvent,
  OverlayHeartbeat,
  SceneLayerItem,
  StreamerProfile,
  TopBoardRow,
  WidgetConfig,
} from "@/db/schema";
import { TopBoardsManager } from "@/components/TopBoardsManager";
import { AvatarStudio } from "@/components/AvatarStudio";
import { FramedAvatar } from "@/components/FramedAvatar";
import { FreeGamesArena } from "@/components/FreeGamesArena";
import { OverlayLogo } from "@/components/OverlayLogo";
import { SceneAndStudioSetup } from "@/components/SceneAndStudioSetup";
import {
  notifyOverlayChannel,
  playBroadcastSound,
} from "@/components/SoundEngine";
import { WidgetStudioPanel } from "@/components/WidgetStudioPanel";
import { TikTokCoin } from "@/components/TikTokCoin";
import { TopListsStudio } from "@/components/TopListsStudio";
import { EventTickersStudio } from "@/components/EventTickersStudio";
import { GiftVideosStudio } from "@/components/GiftVideosStudio";
import { BackgroundsStudio } from "@/components/BackgroundsStudio";
import { ScreenEffectsStudio } from "@/components/ScreenEffectsStudio";
import { FlagHeartsStudio } from "@/components/FlagHeartsStudio";
import { StreamNotesStudio } from "@/components/StreamNotesStudio";
import { SocialMediaStudio } from "@/components/SocialMediaStudio";
import { QuranStudio } from "@/components/QuranStudio";
import { DisplayStudio } from "@/components/DisplayStudio";
import {
  AVATAR_FRAMES,
  FREE_GAMES_CATALOG,
  SIDEBAR_NAV_ITEMS,
  SHOWCASE_ARTWORKS,
} from "@/lib/catalog";
import {
  Activity,
  BarChart3,
  BookOpen,
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  Coins,
  Copy,
  Crown,
  ExternalLink,
  Eye,
  FileText,
  ShieldCheck,
  Film,
  Flame,
  Gamepad2,
  Gauge,
  Gift,
  Heart,
  Hourglass,
  ImageIcon,
  Layers,
  LayoutGrid,
  Lightbulb,
  Lock,
  MessageSquare,
  MonitorSmartphone,
  Moon,
  Palette,
  Power,
  Radio,
  RefreshCw,
  RotateCcw,
  Settings,
  Share2,
  Sparkles,
  StickyNote,
  Sun,
  Target,
  Trophy,
  Tv,
  UserPlus,
  Users,
  Volume2,
  Wifi,
} from "lucide-react";
import React, { useCallback, useEffect, useState } from "react";

interface DashboardPayload {
  profile: StreamerProfile;
  widgets: WidgetConfig[];
  avatars: AvatarPreset[];
  games: GameConfig[];
  scenes: LinkScene[];
  events: LiveEvent[];
  activeOverlays: OverlayHeartbeat[];
  boards: TopBoardRow[];
}

interface DashboardAppProps {
  initialSection?: string;
  initialGame?: string;
}

const ACCENT_PRESETS: Record<
  string,
  { label: string; primaryHsl: string; cyanHsl: string; hex: string }
> = {
  cyan: {
    label: "Overlay Cyan",
    primaryHsl: "193 81% 55%",
    cyanHsl: "193 81% 55%",
    hex: "#28c7fa",
  },
  orange: {
    label: "Ember Dragon",
    primaryHsl: "27 88% 56%",
    cyanHsl: "27 88% 56%",
    hex: "#f3802a",
  },
  pink: {
    label: "Sakura Neon",
    primaryHsl: "330 85% 62%",
    cyanHsl: "330 85% 62%",
    hex: "#f04c9d",
  },
  emerald: {
    label: "Cyber Mint",
    primaryHsl: "158 78% 48%",
    cyanHsl: "158 78% 48%",
    hex: "#1bd992",
  },
  gold: {
    label: "Royal Gold",
    primaryHsl: "45 93% 54%",
    cyanHsl: "45 93% 54%",
    hex: "#f7c31d",
  },
};

function formatCompact(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 10_000) return `${(num / 1_000).toFixed(1)}K`;
  return num.toLocaleString();
}

function getNavIcon(id: string) {
  switch (id) {
    case "overview":
      return LayoutGrid;
    case "live-room":
      return Radio;
    case "performance":
      return Gauge;
    case "viewers":
      return Users;
    case "top-lists":
      return Trophy;
    case "goals":
      return Target;
    case "gift-alerts":
      return Gift;
    case "gift-videos":
      return Film;
    case "follow-join":
      return Bell;
    case "event-feed":
      return Activity;
    case "chat-box":
      return MessageSquare;
    case "scenes":
      return Layers;
    case "avatars":
      return Crown;
    case "games":
      return Gamepad2;
    case "effects":
      return Sparkles;
    case "tts-sound":
      return Volume2;
    case "branding":
      return Palette;
    case "studio-setup":
      return Tv;
    case "backgrounds":
      return ImageIcon;
    case "flag-hearts":
      return Heart;
    case "notes":
      return StickyNote;
    case "social":
      return Share2;
    case "quran":
      return BookOpen;
    case "display":
      return MonitorSmartphone;
    default:
      return Settings;
  }
}

export function DashboardApp({ initialSection = "overview", initialGame }: DashboardAppProps) {
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [activeSection, setActiveSection] = useState<string>(initialSection);
  const [sidebarExpanded, setSidebarExpanded] = useState<boolean>(true);
  const [darkMode, setDarkMode] = useState<boolean>(true);
  const [showPaletteMenu, setShowPaletteMenu] = useState<boolean>(false);
  const [showNotifMenu, setShowNotifMenu] = useState<boolean>(false);
  const [autoStreamSim, setAutoStreamSim] = useState<boolean>(false);
  const [editingHandle, setEditingHandle] = useState<boolean>(false);
  const [handleInput, setHandleInput] = useState<string>("@yourname");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [topOption, setTopOption] = useState<"A" | "B">("B");

  useEffect(() => {
    const stored = window.localStorage.getItem("ol-top-option");
    if (stored === "A" || stored === "B") setTopOption(stored);
  }, []);

  const chooseTopOption = (o: "A" | "B") => {
    setTopOption(o);
    window.localStorage.setItem("ol-top-option", o);
  };

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 2600);
  }, []);

  const fetchDashboard = useCallback(async () => {
    try {
      const res = await fetch("/api/dashboard", { cache: "no-store" });
      if (res.status === 401) { window.location.assign("/login"); return; }
      if (!res.ok) return;
      const json = (await res.json()) as DashboardPayload;
      setData(json);
      setHandleInput((prev) =>
        editingHandle ? prev : json.profile?.tiktokHandle || "@yourname",
      );
    } catch {
      // Ignore transient poll errors
    }
  }, [editingHandle]);

  useEffect(() => {
    fetchDashboard();
    const poll = setInterval(() => !pageHidden() && fetchDashboard(), pollMs(5000));
    return () => clearInterval(poll);
  }, [fetchDashboard]);

  // Apply accent preset CSS vars
  useEffect(() => {
    const presetKey = data?.profile?.accentPreset || "cyan";
    const preset = ACCENT_PRESETS[presetKey] ?? ACCENT_PRESETS.cyan;
    document.documentElement.style.setProperty("--primary", preset.primaryHsl);
    document.documentElement.style.setProperty("--brand-cyan", preset.cyanHsl);
  }, [data?.profile?.accentPreset]);

  // Toggle light/dark class on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.remove("dark");
      root.classList.add("light");
    }
  }, [darkMode]);

  const handleFireEvent = useCallback(
    async (payload: Record<string, unknown>, silent = false) => {
      try {
        const res = await fetch("/api/events", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          notifyOverlayChannel({ type: "new-event", payload });
          await fetchDashboard();
          if (!silent) {
            showToast(`Fired live ${String(payload.eventType || "test")} event to overlays!`);
          }
        }
      } catch {
        // Ignore error
      }
    },
    [fetchDashboard, showToast],
  );

  // Gentle Test Mode sample event flow
  useEffect(() => {
    if (!autoStreamSim || data?.profile?.connectionStatus !== "live") {
      return;
    }
    const timer = setInterval(() => {
      const samplePool: Array<Record<string, unknown>> = [
        { eventType: "gift", giftId: "rose" },
        { eventType: "like", likes: 35 },
        { eventType: "join" },
        {
          eventType: "chat",
          message: "This overlay setup looks so clean on TikTok LIVE Studio 🔥",
        },
        { eventType: "gift", giftId: "finger-heart" },
      ];
      const pick = samplePool[Math.floor(Math.random() * samplePool.length)];
      handleFireEvent(pick, true);
    }, 11000);
    return () => clearInterval(timer);
  }, [autoStreamSim, data?.profile?.connectionStatus, handleFireEvent]);

  const handleUpdateProfile = async (patch: Record<string, unknown>) => {
    const res = await fetch("/api/dashboard", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (res.ok) {
      notifyOverlayChannel({ type: "profile-update" });
      await fetchDashboard();
      showToast("Saved settings to PostgreSQL");
    }
  };

  const handleUpdateWidget = async (
    widgetKey: string,
    patch: Record<string, unknown>,
  ) => {
    const res = await fetch("/api/widgets", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ widgetKey, ...patch }),
    });
    if (res.ok) {
      await fetchDashboard();
    }
  };

  const handleSaveGame = async (
    gameSlug: string,
    patch: { cardTheme?: string; stateJson?: Record<string, unknown> },
  ) => {
    const res = await fetch("/api/games", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameSlug, ...patch }),
    });
    if (res.ok) {
      await fetchDashboard();
    }
  };

  const handleSaveScene = async (slug: string, layersJson: SceneLayerItem[]) => {
    const res = await fetch("/api/scenes", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slug, layersJson }),
    });
    if (res.ok) {
      await fetchDashboard();
      showToast("Scene layout saved! Live browser sources updated.");
    }
  };

  const handleCopyUrl = (relativePath: string, label: string) => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "https://overlaylive.app";
    const full = `${origin}${relativePath}`;
    navigator.clipboard?.writeText(full).catch(() => {});
    playBroadcastSound("tick");
    showToast(`Copied ${label} URL: ${full}`);
  };

  const handleDeckAction = (keyId: string) => {
    playBroadcastSound(keyId === "music" ? "lion" : "gift");
    if (keyId === "live") {
      const nextStatus =
        data?.profile?.connectionStatus === "live" ? "test_mode" : "live";
      handleUpdateProfile({ connectionStatus: nextStatus });
    } else if (keyId === "effects") {
      handleFireEvent({ eventType: "effect", effectKey: "confetti" });
    } else if (keyId === "games") {
      setActiveSection("games");
    } else if (keyId === "quiz") {
      setActiveSection("games");
    } else if (keyId === "audience") {
      handleFireEvent({ eventType: "join" });
    } else if (keyId === "followers") {
      handleFireEvent({ eventType: "follow" });
    } else if (keyId === "music") {
      handleFireEvent({ eventType: "gift", giftId: "lion" });
    } else if (keyId === "application") {
      window.open("/overlay/scene/tiktok-studio", "_blank");
    }
  };

  if (!data) {
    return (
      <div className="fixed inset-0 grid place-items-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <OverlayLogo size={56} />
          <div className="text-sm font-bold text-muted-foreground animate-pulse">
            Loading OverlayLive Studio...
          </div>
        </div>
      </div>
    );
  }

  const { profile, widgets, avatars, games, scenes, events, activeOverlays } = data;
  const firstName = profile.displayName.split(" ")[0] || "Ava";
  const isLive = profile.connectionStatus === "live";

  // Sparkline viewer data matching reference curve
  const sparkPoints =
    "0,46 28,45 56,43 84,45 112,41 140,40 168,38 196,21 224,16 252,24 280,22 308,29 336,15 364,13 392,22 420,25 448,18 476,12 504,22 532,20 560,27";

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl border border-brand-cyan/40 bg-slate-950/95 px-4 py-3 text-xs font-bold text-white shadow-[0_12px_36px_rgba(40,199,250,0.35)] animate-ol-pop">
          <Check className="h-4 w-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TOP HEADER BAR — Reference-Matched to dashboard-collapsed.jpg */}
      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sidebar-border bg-sidebar/95 px-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setActiveSection("overview")}
            className="flex items-center gap-2.5 text-left"
          >
            <OverlayLogo size={24} boxed showWordmark={sidebarExpanded} />
          </button>

          {/* Status Pill: WAITING FOR LIVE / LIVE ON AIR */}
          <button
            type="button"
            onClick={() =>
              handleUpdateProfile({
                connectionStatus: isLive ? "test_mode" : "live",
              })
            }
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-black tracking-wide transition ${
              isLive
                ? "bg-emerald-400 text-slate-950 shadow-[0_0_18px_rgba(52,211,153,0.45)]"
                : "bg-amber-400 text-slate-950 shadow-[0_0_14px_rgba(251,191,36,0.3)]"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
            {isLive ? "LIVE ON AIR" : "WAITING FOR LIVE"}
          </button>

          <span
            title="Real-time PostgreSQL & Overlay Sync Connected"
            className="inline-flex items-center text-emerald-400"
          >
            <Wifi className="h-4 w-4" />
          </span>
        </div>

        {/* Right Utility Cluster */}
        <div className="flex items-center gap-2">
          {/* Pro Badge */}
          <div className="hidden items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-300 sm:inline-flex">
            <Crown className="h-3.5 w-3.5 text-amber-400" />
            <span>{profile.proPlanLabel}</span>
          </div>

          {/* Coin Balance Pill */}
          <div className="hidden items-center gap-1.5 rounded-full border border-border bg-secondary/70 px-3 py-1 text-xs font-extrabold text-foreground sm:inline-flex">
            <TikTokCoin size={15} />
            <span>{profile.coinsBalance}</span>
          </div>

          {/* Timer / Auto-Sim Toggle */}
          <button
            type="button"
            title={
              autoStreamSim
                ? "Auto Test Events Flowing (Click to pause)"
                : "Start Auto Test Events"
            }
            onClick={() => {
              setAutoStreamSim((v) => !v);
              showToast(
                !autoStreamSim
                  ? "Test Mode auto-events enabled"
                  : "Test Mode auto-events paused",
              );
            }}
            className={`grid h-8 w-8 place-items-center rounded-full border transition ${
              autoStreamSim
                ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
                : "border-transparent text-muted-foreground hover:bg-secondary"
            }`}
          >
            <Hourglass className="h-4 w-4" />
          </button>

          {/* Notifications Bell with cyan '2' badge */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowNotifMenu((v) => !v)}
              className="relative grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -right-0.5 -top-0.5 grid h-4 w-4 place-items-center rounded-full bg-brand-cyan text-[10px] font-black text-slate-950">
                2
              </span>
            </button>
            {showNotifMenu && (
              <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-border bg-popover p-3.5 shadow-2xl z-50 space-y-2.5">
                <div className="text-xs font-extrabold text-foreground">
                  What&apos;s New on OverlayLive
                </div>
                <div className="rounded-xl bg-secondary/50 p-2.5 text-xs">
                  <div className="font-bold text-brand-cyan">
                    🐉 68 Ornate Avatar Frames Unlocked
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Ember Dragon, Sakura Fox, Stormfang Wolf &amp; 65 more frames ready for VIPs and Podiums.
                  </p>
                </div>
                <div className="rounded-xl bg-secondary/50 p-2.5 text-xs">
                  <div className="font-bold text-emerald-400">
                    🎮 12 Free TikTok LIVE Games
                  </div>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    Quiz, Coin Battle, Lucky Wheel, Plinko &amp; Boss Raid ready for OBS &amp; TikTok LIVE Studio.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Language EN with UK Flag */}
          <button
            type="button"
            onClick={() => {
              const order = ["en", "ar", "es", "tr", "de", "fr"];
              const next = order[(order.indexOf(profile.locale) + 1) % order.length];
              handleUpdateProfile({ locale: next });
            }}
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            <span className="inline-block h-3.5 w-5 overflow-hidden rounded-[3px] ring-1 ring-white/20">
              <svg viewBox="0 0 20 14" className="h-full w-full">
                <rect width="20" height="14" fill="#012169" />
                <path d="M0 0 20 14M20 0 0 14" stroke="#fff" strokeWidth="3" />
                <path d="M0 0 20 14M20 0 0 14" stroke="#C8102E" strokeWidth="1.5" />
                <path d="M10 0V14M0 7H20" stroke="#fff" strokeWidth="4.6" />
                <path d="M10 0V14M0 7H20" stroke="#C8102E" strokeWidth="2.6" />
              </svg>
            </span>
            <span className="uppercase">{profile.locale}</span>
          </button>

          {/* Theme Toggle */}
          <button
            type="button"
            onClick={() => setDarkMode((d) => !d)}
            aria-label="Toggle theme"
            className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
          >
            {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Appearance Accent Customizer */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowPaletteMenu((v) => !v)}
              aria-label="Customize appearance"
              className="grid h-8 w-8 place-items-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
            >
              <Palette className="h-4 w-4" />
            </button>
            {showPaletteMenu && (
              <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-border bg-popover p-3 shadow-2xl z-50 space-y-2">
                <div className="text-xs font-extrabold text-foreground">
                  Dashboard Accent Mood
                </div>
                {Object.entries(ACCENT_PRESETS).map(([key, item]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      handleUpdateProfile({ accentPreset: key });
                      setShowPaletteMenu(false);
                    }}
                    className="flex w-full items-center justify-between rounded-xl px-2.5 py-1.5 text-xs font-bold hover:bg-secondary"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.hex }}
                      />
                      {item.label}
                    </span>
                    {profile.accentPreset === key && (
                      <Check className="h-3.5 w-3.5 text-brand-cyan" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* BODY: COLLAPSIBLE SIDEBAR + MAIN WORKSPACE */}
      <div className="flex flex-1">
        <aside
          className={`relative shrink-0 border-r border-sidebar-border bg-sidebar transition-all duration-200 ${
            sidebarExpanded ? "w-60" : "w-[68px]"
          }`}
        >
          {/* Collapse / Expand Edge Pill Button */}
          <button
            type="button"
            onClick={() => setSidebarExpanded((v) => !v)}
            aria-label="Toggle sidebar"
            className="absolute -right-3 top-4 z-20 grid h-6 w-6 place-items-center rounded-full border border-sidebar-border bg-card text-muted-foreground shadow hover:text-foreground"
          >
            {sidebarExpanded ? (
              <ChevronLeft className="h-3.5 w-3.5" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5" />
            )}
          </button>

          <div className="flex h-[calc(100vh-3.5rem)] flex-col gap-1 overflow-y-auto p-2.5">
            {/* Guide Shortcut Pill */}
            <button
              type="button"
              onClick={() => setActiveSection("studio-setup")}
              className={`lo-hint-fresh mb-1 flex items-center gap-2 rounded-xl border border-brand-cyan/25 bg-brand-cyan/10 px-3 py-2 text-xs font-extrabold text-brand-cyan transition hover:bg-brand-cyan/20 ${
                sidebarExpanded ? "justify-start" : "justify-center px-0"
              }`}
            >
              <Lightbulb className="lo-hint-bulb h-4 w-4 shrink-0" />
              {sidebarExpanded && <span>Guide · OBS &amp; LIVE Studio</span>}
            </button>

            {SIDEBAR_NAV_ITEMS.map((item, idx) => {
              const Icon = getNavIcon(item.id);
              const active = activeSection === item.id;
              const prevGroup = idx > 0 ? SIDEBAR_NAV_ITEMS[idx - 1].group : item.group;
              const showDivider = idx > 0 && prevGroup !== item.group;

              return (
                <React.Fragment key={item.id}>
                  {showDivider && (
                    <div className="my-1.5 h-px bg-sidebar-border/80" />
                  )}
                  <button
                    type="button"
                    title={item.label}
                    onClick={() => setActiveSection(item.id)}
                    className={`group relative flex items-center gap-3 rounded-xl px-2.5 py-2 text-xs font-bold transition ${
                      sidebarExpanded ? "justify-between" : "justify-center"
                    } ${
                      active
                        ? "bg-brand-cyan text-slate-950 shadow-[0_4px_18px_hsl(var(--brand-cyan)/0.38)]"
                        : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-foreground"
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="relative shrink-0">
                        <Icon className="h-4 w-4" />
                        {item.hot && (
                          <span
                            className={`absolute -right-1.5 -top-1.5 grid h-3.5 w-3.5 place-items-center rounded-full text-[8px] ${
                              active
                                ? "bg-slate-950 text-orange-400"
                                : "bg-orange-500 text-white shadow"
                            }`}
                          >
                            🔥
                          </span>
                        )}
                      </div>
                      {sidebarExpanded && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </div>

                    {sidebarExpanded && item.badge && (
                      <span
                        className={`rounded-full px-1.5 py-0.5 text-[9px] font-black ${
                          active
                            ? "bg-slate-950/20 text-slate-950"
                            : "bg-brand-cyan/15 text-brand-cyan"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                </React.Fragment>
              );
            })}

            <div className="mt-auto border-t border-sidebar-border/80 pt-2">
              {sidebarExpanded ? (
                <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 pb-1 text-[10px] font-semibold text-muted-foreground">
                  <a href="/terms" target="_blank" rel="noreferrer" className="hover:text-foreground">Terms of Service</a>
                  <a href="/privacy" target="_blank" rel="noreferrer" className="hover:text-foreground">Privacy Policy</a>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1">
                  <a href="/terms" target="_blank" rel="noreferrer" title="Terms of Service" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                    <FileText className="h-4 w-4" />
                  </a>
                  <a href="/privacy" target="_blank" rel="noreferrer" title="Privacy Policy" className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <div className="mx-auto max-w-[1380px] space-y-5">
            {activeSection === "overview" && (
              <>
                {/* HERO WELCOME BANNER — Exact Reference Match */}
                <div className="relative overflow-hidden rounded-2xl border border-brand-cyan/20 bg-gradient-to-r from-[#0d222d] via-[#0b1821] to-[#0f2933] p-5 sm:p-6 shadow-[0_12px_40px_-15px_rgba(40,199,250,0.25)]">
                  <div className="pointer-events-none absolute -right-12 -top-12 h-44 w-44 rounded-full bg-brand-cyan/15 blur-3xl" />
                  <div className="relative flex flex-wrap items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      {/* Neon Cyan-Bracketed CORE / Dashboard Pill */}
                      <div className="flex flex-col justify-center rounded-2xl border-r-4 border-y border-l border-white/10 border-r-brand-cyan bg-slate-950/55 px-4 py-2.5 shadow-[0_0_20px_rgba(40,199,250,0.2)]">
                        <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
                          CORE
                        </span>
                        <span className="text-xs font-black text-white">
                          Dashboard
                        </span>
                      </div>

                      <div>
                        <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl">
                          Welcome back, {firstName}
                        </h1>
                        <p className="mt-1 text-xs text-slate-300/85 sm:text-sm">
                          {isLive
                            ? `Connected to ${profile.tiktokHandle} — real-time events are streaming to OBS & TikTok LIVE Studio.`
                            : "Test Mode is running — sample events are flowing to your overlays."}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          playBroadcastSound("lion");
                          handleFireEvent({ eventType: "gift", giftId: "lion" });
                        }}
                        className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/35 bg-amber-500/15 px-3.5 py-1.5 text-xs font-extrabold text-amber-300 hover:bg-amber-500/25"
                      >
                        🦁 Fire Test Lion
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateProfile({
                            connectionStatus: isLive ? "test_mode" : "live",
                          })
                        }
                        className="inline-flex items-center gap-2 rounded-full border border-emerald-400/35 bg-emerald-500/15 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                      >
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {isLive ? "LIVE ACTIVE" : "TEST MODE"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ASYMMETRIC 2-COLUMN DASHBOARD GRID — Reference-Matched */}
                <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_350px]">
                  {/* LEFT COLUMN: Latest LIVE + TikTok LIVE Connection */}
                  <div className="space-y-5">
                    {/* Latest LIVE Card */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
                            <BarChart3 className="h-5 w-5" />
                          </div>
                          <div>
                            <h2 className="text-base font-extrabold text-foreground">
                              Latest LIVE
                            </h2>
                            <div className="mt-0.5 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                              <span className="inline-flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                Thu 12 Nov 2026 &nbsp;09:14 – 11:30
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" />2 h 15 min
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => setActiveSection("live-room")}
                          className="inline-flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline"
                        >
                          View recap →
                        </button>
                      </div>

                      {/* 6 Metric Columns */}
                      <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <span className="text-amber-400">🪙</span> COINS
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {profile.sessionCoins.toLocaleString()}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Eye className="h-3 w-3" /> PEAK VIEWERS
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {profile.sessionPeakViewers}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Users className="h-3 w-3" /> AVERAGE VIEWERS
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {profile.sessionAvgViewers}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <UserPlus className="h-3 w-3" /> NEW FOLLOWERS
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {profile.sessionNewFollowers}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Heart className="h-3 w-3" /> LIKES
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {formatCompact(profile.sessionLikes)}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                            <Gift className="h-3 w-3" /> GIFTS
                          </div>
                          <div className="mt-1 text-xl font-black text-foreground">
                            {profile.sessionGifts}
                          </div>
                        </div>
                      </div>

                      {/* Smooth Cyan Area Sparkline */}
                      <div className="mt-4 pt-2">
                        <svg
                          viewBox="0 0 560 56"
                          className="h-16 w-full overflow-visible"
                          preserveAspectRatio="none"
                        >
                          <defs>
                            <linearGradient id="liveSparkFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#28c7fa" stopOpacity="0.32" />
                              <stop offset="100%" stopColor="#28c7fa" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>
                          <polygon
                            points={`0,56 ${sparkPoints} 560,56`}
                            fill="url(#liveSparkFill)"
                          />
                          <polyline
                            fill="none"
                            stroke="#28c7fa"
                            strokeWidth="2.4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={sparkPoints}
                          />
                        </svg>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Viewers during the LIVE
                        </div>
                      </div>
                    </div>

                    {/* TikTok LIVE Connection Card */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
                      <div className="flex items-start gap-3.5">
                        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/25">
                          <Radio className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base font-extrabold text-foreground">
                            TikTok LIVE Connection
                          </h2>
                          <p className="mt-0.5 text-xs text-muted-foreground">
                            Enter your TikTok username — we connect your LIVE automatically, with sample data standing in until you go live.
                          </p>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-secondary/25 p-4 space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={profile.avatarUrl}
                              alt={profile.displayName}
                              className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20"
                            />
                            {editingHandle ? (
                              <div className="flex items-center gap-2">
                                <input
                                  value={handleInput}
                                  onChange={(e) => setHandleInput(e.target.value)}
                                  className="rounded-lg border border-brand-cyan bg-background px-2.5 py-1 text-sm font-bold outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleUpdateProfile({ tiktokHandle: handleInput });
                                    setEditingHandle(false);
                                  }}
                                  className="rounded-lg bg-brand-cyan px-2.5 py-1 text-xs font-black text-slate-950"
                                >
                                  Save
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => setEditingHandle(true)}
                                className="text-base font-black text-foreground hover:text-brand-cyan"
                              >
                                {profile.tiktokHandle}
                              </button>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold ${
                                isLive
                                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                                  : "bg-amber-500/15 text-amber-300 ring-1 ring-amber-400/30"
                              }`}
                            >
                              <Clock className="h-3.5 w-3.5" />
                              {isLive ? "Connected LIVE" : "Waiting for LIVE"}
                            </span>

                            <button
                              type="button"
                              onClick={() => handleUpdateProfile({ action: "reset_stats" })}
                              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:bg-secondary"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                              Reset stats
                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleUpdateProfile({
                                  connectionStatus:
                                    profile.connectionStatus === "disconnected"
                                      ? "test_mode"
                                      : "disconnected",
                                })
                              }
                              className="inline-flex items-center gap-1.5 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-bold text-red-400 hover:bg-red-500/20"
                            >
                              <Power className="h-3.5 w-3.5" />
                              {profile.connectionStatus === "disconnected"
                                ? "Reconnect"
                                : "Disconnect"}
                            </button>
                          </div>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          {profile.tiktokHandle} isn&apos;t live yet — your overlays show sample data and switch to your LIVE automatically the moment you start streaming.
                        </p>

                        <div className="flex items-center gap-2 rounded-xl border border-brand-cyan/15 bg-brand-cyan/[0.06] px-3.5 py-2.5 text-xs text-muted-foreground">
                          <Lock className="h-3.5 w-3.5 shrink-0 text-brand-cyan" />
                          <span>Each username locks to the account that linked it.</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT COLUMN: Creator Profile + Support Badge + Overlays on Stream */}
                  <div className="space-y-5">
                    {/* Creator Profile Card (Ava Stone) */}
                    <div className="rounded-2xl border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3.5">
                          <FramedAvatar
                            avatarUrl={profile.avatarUrl}
                            frameSlug={profile.avatarFrame}
                            size={82}
                          />
                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-black text-foreground">
                              {profile.displayName}
                            </h3>
                            <button
                              type="button"
                              onClick={() => setEditingHandle(true)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-brand-cyan hover:underline"
                            >
                              {profile.tiktokHandle}
                              <ExternalLink className="h-3 w-3" />
                            </button>
                            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">
                              {profile.bio}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={fetchDashboard}
                          title="Refresh profile"
                          className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-4 grid grid-cols-4 gap-2">
                        <div className="rounded-xl border border-border/70 bg-secondary/35 p-2 text-center">
                          <div className="text-[9px] font-bold uppercase text-muted-foreground">
                            FOLLOWERS
                          </div>
                          <div className="mt-0.5 text-sm font-black text-foreground">
                            {profile.followersCount.toLocaleString()}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/35 p-2 text-center">
                          <div className="text-[9px] font-bold uppercase text-muted-foreground">
                            FOLLOWING
                          </div>
                          <div className="mt-0.5 text-sm font-black text-foreground">
                            {profile.followingCount}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/35 p-2 text-center">
                          <div className="text-[9px] font-bold uppercase text-muted-foreground">
                            LIKES
                          </div>
                          <div className="mt-0.5 text-sm font-black text-foreground">
                            {formatCompact(profile.likesCount)}
                          </div>
                        </div>
                        <div className="rounded-xl border border-border/70 bg-secondary/35 p-2 text-center">
                          <div className="text-[9px] font-bold uppercase text-muted-foreground">
                            VIDEOS
                          </div>
                          <div className="mt-0.5 text-sm font-black text-foreground">
                            {profile.videosCount}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* SUPPORT OVERLAYLIVE Badge Card */}
                    <div className="rounded-2xl border border-border bg-card p-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-24 w-28 shrink-0 flex-col items-center justify-center gap-1.5 rounded-xl bg-gradient-to-b from-[#132938] to-[#0b161f] p-2.5 ring-1 ring-white/10">
                          <OverlayLogo size={38} />
                          <span className="text-[11px] font-extrabold text-white">
                            Overlay<span className="text-orange-400">Live</span>
                          </span>
                        </div>
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider text-brand-orange">
                            <span>🧡</span> SUPPORT OVERLAYLIVE
                          </div>
                          <div className="text-sm font-black text-foreground">
                            Put our badge on your LIVE
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              handleCopyUrl("/overlay/badge", "OverlayLive Badge")
                            }
                            className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-2 text-xs font-extrabold text-white shadow hover:brightness-110"
                          >
                            <Copy className="h-3.5 w-3.5" />
                            Copy badge URL
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Overlays on your stream Card */}
                    <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-extrabold text-foreground">
                          <Layers className="h-4 w-4 text-brand-cyan" />
                          <span>Overlays on your stream</span>
                        </div>
                        {activeOverlays.length > 0 && (
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-black text-emerald-300">
                            {activeOverlays.length} LIVE
                          </span>
                        )}
                      </div>

                      {activeOverlays.length === 0 ? (
                        <p className="text-xs leading-relaxed text-muted-foreground">
                          No overlay is open right now. Add one of your overlay links as a browser source in{" "}
                          <strong className="text-foreground">TikTok LIVE Studio</strong> or{" "}
                          <strong className="text-foreground">OBS Studio</strong> and it shows up here.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {activeOverlays.map((hb) => (
                            <div
                              key={hb.id}
                              className="flex items-center justify-between rounded-xl border border-emerald-400/30 bg-emerald-500/10 px-3 py-2 text-xs"
                            >
                              <span className="font-bold text-emerald-200">
                                ● {hb.overlayTarget}
                              </span>
                              <span className="text-[10px] text-emerald-300/80">
                                {hb.platformHint}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <a
                          href="/overlay/scene/tiktok-studio"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-brand-cyan/35 bg-brand-cyan/10 px-2.5 py-2 text-[11px] font-bold text-brand-cyan hover:bg-brand-cyan/20"
                        >
                          <ExternalLink className="h-3 w-3" />
                          TikTok Studio 9:16
                        </a>
                        <a
                          href="/overlay/scene/obs-studio"
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-border bg-secondary/50 px-2.5 py-2 text-[11px] font-bold text-foreground hover:bg-secondary"
                        >
                          <ExternalLink className="h-3 w-3" />
                          OBS Scene 16:9
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QUICK EXPLORE HUB: Painted Overlays + 68 Avatar Frames + 12 Free Games */}
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {/* Painted Broadcast Overlays Card */}
                  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-brand-cyan">
                          Layered Overlays
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSection("top-lists")}
                          className="text-xs font-bold text-brand-cyan hover:underline"
                        >
                          Customize all →
                        </button>
                      </div>
                      <h3 className="mt-1 text-base font-black text-foreground">
                        High Rollers, Ember Dragon &amp; Liquid Vessels
                      </h3>
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {SHOWCASE_ARTWORKS.slice(0, 6).map((art) => (
                          <div
                            key={art.id}
                            onClick={() =>
                              setActiveSection(
                                art.category === "goal" ? "goals" : "top-lists",
                              )
                            }
                            className="cursor-pointer rounded-xl border border-border bg-slate-950 p-2 hover:border-brand-cyan transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={art.url}
                              alt={art.title}
                              className="mx-auto h-16 w-auto object-contain"
                            />
                            <div className="mt-1 truncate text-center text-[10px] font-bold">
                              {art.title}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* 17 Avatars + 68 Frames Showcase Card */}
                  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-brand-orange">
                          17 Avatars · 68 Frames
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSection("avatars")}
                          className="text-xs font-bold text-brand-cyan hover:underline"
                        >
                          Open Frame Vault →
                        </button>
                      </div>
                      <h3 className="mt-1 text-base font-black text-foreground">
                        Animated VIP &amp; Top Gifter Avatar Frames
                      </h3>
                      <div className="mt-3 grid grid-cols-4 gap-2">
                        {AVATAR_FRAMES.slice(0, 8).map((fr, i) => (
                          <div
                            key={fr.slug}
                            onClick={() => setActiveSection("avatars")}
                            className="cursor-pointer flex flex-col items-center rounded-xl border border-border/60 bg-secondary/25 p-2 hover:border-brand-cyan transition"
                          >
                            <FramedAvatar
                              avatarUrl={`/avatars/a${(i % 17) + 1}.png`}
                              frameSlug={fr.slug}
                              size={52}
                              glowColor={fr.glow}
                              showSignatureFx={false}
                            />
                            <span className="mt-1 w-full truncate text-center text-[9px] font-bold">
                              {fr.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* All 12 Free Stream Games Card */}
                  <div className="rounded-2xl border border-border bg-card p-5 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                          100% Free Game Store
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSection("games")}
                          className="text-xs font-bold text-brand-cyan hover:underline"
                        >
                          Open Live Overlays →
                        </button>
                      </div>
                      <h3 className="mt-1 text-base font-black text-foreground">
                        Quiz, Coin Battle, Lucky Wheel &amp; Boss Raid
                      </h3>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {FREE_GAMES_CATALOG.slice(0, 6).map((gm) => (
                          <button
                            key={gm.slug}
                            type="button"
                            onClick={() => setActiveSection("games")}
                            className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 p-2 text-left hover:border-brand-cyan transition"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={gm.keySvg}
                              alt={gm.title}
                              className="h-7 w-7 shrink-0 object-contain"
                            />
                            <div className="min-w-0">
                              <div className="truncate text-[11px] font-extrabold text-foreground">
                                {gm.title}
                              </div>
                              <div className="text-[9px] font-bold text-emerald-400">
                                FREE
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeSection === "avatars" && (
              <AvatarStudio
                presets={avatars}
                onCreatePreset={async (payload) => {
                  await fetch("/api/avatars", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                  });
                  await fetchDashboard();
                  showToast("VIP Framed Avatar saved to PostgreSQL!");
                }}
                onUpdateProfileAvatar={async (avatarUrl, avatarFrame) => {
                  await handleUpdateProfile({ avatarUrl, avatarFrame });
                }}
                onDeletePreset={async (id) => {
                  await fetch(`/api/avatars?id=${id}`, { method: "DELETE" });
                  await fetchDashboard();
                  showToast("Removed preset");
                }}
                onFireEntrance={async (payload) => {
                  playBroadcastSound("join");
                  await handleFireEvent({ eventType: "join", ...payload });
                }}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection === "games" && (
              <FreeGamesArena
                games={games}
                avatars={avatars}
                events={events}
                profile={profile}
                initialSlug={initialGame}
                onFireEvent={(p) => handleFireEvent(p)}
                onSaveGame={handleSaveGame}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {(activeSection === "scenes" || activeSection === "studio-setup") && (
              <SceneAndStudioSetup
                scenes={scenes}
                widgets={widgets}
                profile={profile}
                avatars={avatars}
                events={events}
                onSaveScene={handleSaveScene}
                onCopyUrl={handleCopyUrl}
                onTriggerDeckAction={handleDeckAction}
                mode={activeSection === "scenes" ? "scenes" : "studio-setup"}
              />
            )}

            {activeSection === "top-lists" && (
              <div className="flex justify-end">
                <div className="inline-flex rounded-xl border border-border bg-card p-1 text-xs font-bold">
                  {(["A", "B"] as const).map((o) => (
                    <button
                      key={o}
                      type="button"
                      onClick={() => chooseTopOption(o)}
                      className={`relative rounded-lg border border-transparent px-3 py-1.5 transition ${
                        topOption === o ? "bg-brand-cyan text-slate-950" : "text-muted-foreground hover:text-foreground"
                      } ${o === "B" && topOption !== "B" ? "lo-new-target" : ""}`}
                    >
                      {o === "A" ? "Option A · Single board" : "Option B · Boards manager"}
                      {o === "B" && topOption !== "B" && (
                        <span className="lo-new-pointer absolute -top-9 left-1/2 -translate-x-1/2">
                          <span className="lo-new-pointer-badge">New</span>
                          <span className="lo-new-pointer-hand">👇</span>
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activeSection === "top-lists" && topOption === "B" && (
              <TopBoardsManager
                boards={data.boards ?? []}
                avatars={avatars}
                onRefresh={fetchDashboard}
                onFireEvent={(p) => handleFireEvent(p)}
                onCopyUrl={handleCopyUrl}
                onToast={showToast}
              />
            )}

            {activeSection === "top-lists" && topOption === "A" && (
              <TopListsStudio
                widget={widgets.find((w) => w.widgetKey === "top-lists")}
                avatars={avatars}
                onSave={async (board) => {
                  await handleUpdateWidget("top-lists", { customSettings: { board } });
                  showToast("Top Lists saved — your overlay updated");
                }}
                onFireEvent={(p) => handleFireEvent(p)}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection === "event-feed" && (
              <EventTickersStudio events={events} onFireEvent={(p) => handleFireEvent(p)} onCopyUrl={handleCopyUrl} />
            )}

            {activeSection === "gift-videos" && <GiftVideosStudio onCopyUrl={handleCopyUrl} onToast={showToast} />}

            {activeSection === "backgrounds" && <BackgroundsStudio onToast={showToast} />}

            {activeSection === "quran" && <QuranStudio onCopyUrl={handleCopyUrl} onToast={showToast} />}

            {activeSection === "display" && <DisplayStudio boards={data.boards ?? []} widgets={widgets} onCopyUrl={handleCopyUrl} onToast={showToast} />}

            {activeSection === "social" && (
              <SocialMediaStudio
                widget={widgets.find((w) => w.widgetKey === "social")}
                onSave={async (customSettings) => {
                  await handleUpdateWidget("social", { customSettings });
                  showToast("Social Media saved — your overlay updated");
                }}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection === "notes" && (
              <StreamNotesStudio
                widget={widgets.find((w) => w.widgetKey === "notes")}
                onSave={async (customSettings) => {
                  await handleUpdateWidget("notes", { customSettings });
                  showToast("Stream Notes saved — your overlays updated");
                }}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection === "flag-hearts" && (
              <FlagHeartsStudio
                widget={widgets.find((w) => w.widgetKey === "flag-hearts")}
                onSave={async (customSettings) => {
                  await handleUpdateWidget("flag-hearts", { customSettings });
                  showToast("Flag Hearts saved — your overlay updated");
                }}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection === "effects" && (
              <ScreenEffectsStudio
                widget={widgets.find((w) => w.widgetKey === "effects")}
                onSave={async (customSettings) => {
                  await handleUpdateWidget("effects", { customSettings });
                  showToast("Screen Effects saved — your overlay updated");
                }}
                onFireEvent={(p) => handleFireEvent(p, true)}
                onCopyUrl={handleCopyUrl}
              />
            )}

            {activeSection !== "overview" &&
              activeSection !== "gift-videos" &&
              activeSection !== "backgrounds" &&
              activeSection !== "effects" &&
              activeSection !== "flag-hearts" &&
              activeSection !== "notes" &&
              activeSection !== "social" &&
              activeSection !== "quran" &&
              activeSection !== "display" &&
              activeSection !== "event-feed" &&
              activeSection !== "top-lists" &&
              activeSection !== "avatars" &&
              activeSection !== "games" &&
              activeSection !== "scenes" &&
              activeSection !== "studio-setup" && (
                <WidgetStudioPanel
                  sectionId={activeSection}
                  profile={profile}
                  widgets={widgets}
                  avatars={avatars}
                  events={events}
                  onUpdateWidget={handleUpdateWidget}
                  onUpdateProfile={handleUpdateProfile}
                  onFireEvent={(p) => handleFireEvent(p)}
                  onCopyUrl={handleCopyUrl}
                />
              )}
          </div>
        </main>
      </div>
    </div>
  );
}
