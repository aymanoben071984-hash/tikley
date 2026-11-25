"use client";

import { pollMs } from "@/lib/poll";
import type {
  AvatarPreset,
  GameConfig,
  LinkScene,
  LiveEvent,
  StreamerProfile,
  TopBoardRow,
  WidgetConfig,
} from "@/db/schema";
import { TopBoard } from "@/components/TopBoard";
import { EventTickerOverlay } from "@/components/EventTickerOverlay";
import { GiftVideoScreen } from "@/components/GiftVideoScreen";
import { ScreenEffectsOverlay } from "@/components/ScreenEffectsOverlay";
import { FlagHearts } from "@/components/FlagHearts";
import { normalizeFlagHearts } from "@/lib/flagHearts";
import { NoteView, NotesGroup } from "@/components/StreamNote";
import { normalizeNotesConfig } from "@/lib/streamNotes";
import { SocialRotator } from "@/components/SocialOverlay";
import { normalizeSocial } from "@/lib/socialMedia";
import { QuranOverlay } from "@/components/QuranOverlay";
import { BreakingNewsOverlay, toBnEvents } from "@/components/BreakingNewsOverlay";
import { BREAKING_NEWS_DESIGNS, normalizeBnState } from "@/lib/breakingNews";
import { NewsTickerOverlay, StreamTimerOverlay } from "@/components/ExtraOverlays";
import { NEWS_TICKER_DEFAULTS, STREAM_TIMER_DEFAULTS, normalizeSimpleState, timerBonusSeconds } from "@/lib/liveOverlays";
import { normalizeBoardSettings } from "@/lib/topBoard";
import { GameOverlayStage } from "@/components/FreeGamesArena";
import {
  OverlayWidgetView,
  SceneCanvasRenderer,
} from "@/components/LiveOverlayRenderer";
import { DisplayCanvas } from "@/components/DisplayCanvas";
import { DISPLAY_DEFAULT, normalizeDisplay, parseFormatParam, type OverlayDisplay } from "@/lib/overlayDisplay";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { normalizeLocale, translateText } from "@/lib/i18n";

interface OverlayStatePayload {
  profile: StreamerProfile;
  widgets: WidgetConfig[];
  avatars: AvatarPreset[];
  topListAvatars?: AvatarPreset[];
  games: GameConfig[];
  scenes: LinkScene[];
  events: LiveEvent[];
  boards?: TopBoardRow[];
  display?: OverlayDisplay;
}

interface OverlaySourceClientProps {
  type: string;
  subId?: string;
}

export function OverlaySourceClient({ type, subId }: OverlaySourceClientProps) {
  const { locale, setLocale } = useLocale();
  const tx = (source: string) => translateText(locale, source);
  const [state, setState] = useState<OverlayStatePayload | null>(null);
  const [previewBackdrop, setPreviewBackdrop] = useState<boolean>(false);
  const clientIdRef = useRef<string>("");

  useEffect(() => {
    const createClientId = () => {
      if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return crypto.randomUUID();
      }
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
        const r = Math.floor(Math.random() * 16);
        return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
      });
    };
    clientIdRef.current = createClientId();
    document.documentElement.classList.add("obs-transparent");
    return () => {
      document.documentElement.classList.remove("obs-transparent");
    };
  }, []);

  useEffect(() => {
    if (state?.profile?.locale) setLocale(normalizeLocale(state.profile.locale));
  }, [state?.profile?.locale, setLocale]);

  const targetLabel = subId ? `${type}/${subId}` : type;
  const [query] = useState(() => (typeof window !== "undefined" ? new URLSearchParams(window.location.search) : new URLSearchParams()));
  const noteId = type === "notes" ? query.get("note") : null;
  const displayKey = noteId ? `notes/${noteId}` : targetLabel;
  const formatParam = parseFormatParam(query.get("format"));
  const isPreview = query.get("preview") === "1";
  const [draftDisplay, setDraftDisplay] = useState<OverlayDisplay | null>(null);

  // dashboard previews send unsaved display settings
  useEffect(() => {
    if (!isPreview) return;
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const d = e.data as { type?: string; key?: string; display?: unknown };
      if (d?.type === "ol-display-draft" && d.key === displayKey) setDraftDisplay(normalizeDisplay(d.display));
    };
    window.addEventListener("message", onMsg);
    window.parent?.postMessage({ type: "ol-display-ready", key: displayKey }, window.location.origin);
    return () => window.removeEventListener("message", onMsg);
  }, [isPreview, displayKey]);

  const syncOverlay = useCallback(async () => {
    try {
      const cid = clientIdRef.current || "obs-source";
      const res = await fetch(
        `/api/overlay/state?clientId=${encodeURIComponent(cid)}&target=${encodeURIComponent(
          targetLabel,
        )}&displayKey=${encodeURIComponent(displayKey)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const json = (await res.json()) as OverlayStatePayload;
      setState(json);
    } catch {
      // Ignore transient network blips in long-lived OBS sources
    }
  }, [targetLabel, displayKey]);

  useEffect(() => {
    syncOverlay();
    const timer = setInterval(syncOverlay, pollMs(2200));

    let channel: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== "undefined") {
      try {
        channel = new BroadcastChannel("overlaylive-sync");
        channel.onmessage = () => {
          syncOverlay();
        };
      } catch {
        // Ignore
      }
    }

    return () => {
      clearInterval(timer);
      channel?.close();
    };
  }, [syncOverlay]);

  if (!state) {
    return <div className="fixed inset-0 bg-transparent" />;
  }

  const { profile, widgets, avatars, topListAvatars, games, scenes, events } = state;

  const renderContent = () => {
    if (type === "quran") {
      return <QuranOverlay />;
    }
    if (type === "social") {
      const cfg = normalizeSocial((widgets.find((w) => w.widgetKey === "social")?.customSettings as Record<string, unknown> | undefined)?.social);
      const POS: Record<string, string> = { center: "items-center justify-center", "bottom-left": "items-end justify-start", "bottom-right": "items-end justify-end", "top-left": "items-start justify-start", "top-right": "items-start justify-end", bottom: "items-end justify-center", top: "items-start justify-center" };
      const p = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("pos") ?? "center" : "center";
      return (
        <div className={`overlay-root fixed inset-0 flex p-8 ${POS[p] ?? POS.center}`}>
          <SocialRotator config={cfg} />
        </div>
      );
    }
    if (type === "notes") {
      const cfg = normalizeNotesConfig((widgets.find((w) => w.widgetKey === "notes")?.customSettings as Record<string, unknown> | undefined)?.notesConfig);
      const one = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("note") : null;
      const single = one ? cfg.notes.find((n) => n.id === one) : null;
      return (
        <div className="overlay-root fixed inset-0 flex items-start justify-start p-10">
          {one ? single ? <NoteView key={JSON.stringify(single)} note={single} /> : null : <NotesGroup notes={cfg.notes} display={cfg.display} />}
        </div>
      );
    }
    if (type === "flag-hearts") {
      const cfg = normalizeFlagHearts((widgets.find((w) => w.widgetKey === "flag-hearts")?.customSettings as Record<string, unknown> | undefined)?.flagHearts);
      return (
        <div className="overlay-root pointer-events-none fixed inset-0 overflow-hidden">
          <FlagHearts config={cfg} />
        </div>
      );
    }
    if (type === "effects") {
      return <ScreenEffectsOverlay widget={widgets.find((w) => w.widgetKey === "effects")} events={events} />;
    }
    if (type === "gift-video") {
      return <GiftVideoScreen screen={Math.min(6, Math.max(1, Number(subId) || 1))} />;
    }
    if ((type === "ticker" || type === "feed") && subId) {
      return <EventTickerOverlay event={subId} />;
    }

    if (type === "scene") {
      const sceneSlug = subId || "tiktok-studio";
      const scene =
        scenes.find((s) => s.slug === sceneSlug) ?? scenes[0];
      if (!scene) return null;
      return (
        <div className="absolute inset-0 overflow-hidden">
          <SceneCanvasRenderer
            layers={scene.layersJson}
            widgets={widgets}
            profile={profile}
            avatars={avatars}
            topListAvatars={topListAvatars}
            events={events}
          />
        </div>
      );
    }

    if (type === "top") {
      const board = (state.boards ?? []).find((b) => String(b.id) === String(subId));
      if (!board || !board.enabled) return null;
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <TopBoard settings={normalizeBoardSettings(board.settings)} avatars={topListAvatars ?? avatars} />
        </div>
      );
    }

    if (type === "game" && subId === "news-ticker") {
      const st = normalizeSimpleState(games.find((g) => g.gameSlug === "news-ticker")?.stateJson, NEWS_TICKER_DEFAULTS);
      return (
        <div className="overlay-root fixed inset-0 flex items-end justify-center p-6">
          <NewsTickerOverlay state={st} />
        </div>
      );
    }

    if (type === "game" && subId === "stream-timer") {
      const st = normalizeSimpleState(games.find((g) => g.gameSlug === "stream-timer")?.stateJson, STREAM_TIMER_DEFAULTS);
      const now = profile ? { coins: profile.sessionCoins, followers: profile.followersCount, likes: profile.sessionLikes } : null;
      return (
        <div className="overlay-root fixed inset-0 flex items-center justify-center p-6">
          <StreamTimerOverlay state={st} bonusSec={timerBonusSeconds(st.config, now, st.baseline)} />
        </div>
      );
    }

    if (type === "game" && subId === "breaking-news") {
      const gConf = games.find((g) => g.gameSlug === "breaking-news");
      const bnState = normalizeBnState(gConf?.stateJson);
      const forced = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("design") : null;
      if (forced && BREAKING_NEWS_DESIGNS.some((d) => d.id === forced)) {
        bnState.config = { ...bnState.config, design: forced as typeof bnState.config.design };
      }
      return (
        <div className="overlay-root fixed inset-x-0 bottom-0">
          <BreakingNewsOverlay state={bnState} events={toBnEvents(events, bnState)} />
        </div>
      );
    }

    if (type === "game") {
      const gSlug = subId || "live-quiz";
      const gConf = games.find((g) => g.gameSlug === gSlug);
      return (
        <div className="absolute inset-0 flex items-center justify-center p-6">
          <GameOverlayStage
            gameSlug={gSlug}
            gameConfig={gConf}
            avatars={avatars}
            interactive={false}
          />
        </div>
      );
    }

    const foundWidget = widgets.find((w) => w.widgetKey === type);
    return (
      <div className="absolute inset-0 flex items-center justify-center p-6">
        <OverlayWidgetView
          widgetKey={type}
          widget={foundWidget}
          profile={profile}
          avatars={avatars}
          topListAvatars={topListAvatars}
          events={events}
        />
      </div>
    );
  };

  const display = draftDisplay ?? state.display ?? DISPLAY_DEFAULT;
  const format = formatParam ?? display.defaultFormat;

  return (
    <div dir={locale === "ar" ? "rtl" : "ltr"} className={`fixed inset-0 transition-colors ${previewBackdrop ? "checkerboard-stage" : "bg-transparent"}`}>
      {/* Hover-only browser test helper (completely invisible in OBS / TikTok LIVE Studio) */}
      {!isPreview && (
      <div className={`fixed ${locale === "ar" ? "left-3" : "right-3"} top-3 z-50 flex items-center gap-2 opacity-0 transition-opacity duration-200 hover:opacity-100`}>
        <button
          type="button"
          onClick={() => setPreviewBackdrop((v) => !v)}
          className="rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-bold text-cyan-300 ring-1 ring-white/20"
        >
          {previewBackdrop ? tx("Transparent OBS Mode") : tx("Show Dark Test Grid")}
        </button>
        <a
          href="/dashboard"
          className="rounded-full bg-slate-950/90 px-3 py-1 text-[11px] font-bold text-white ring-1 ring-white/20"
        >
          ← Dashboard
        </a>
      </div>
      )}

      <DisplayCanvas display={display} format={format}>
        {renderContent()}
      </DisplayCanvas>
    </div>
  );
}
