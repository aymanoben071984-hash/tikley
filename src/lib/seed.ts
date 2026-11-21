import { LOCK_SEED, db, withAdvisoryLock } from "@/db";
import {
  avatarPresets,
  gameConfigs,
  linkScenes,
  liveEvents,
  streamerProfiles,
  widgetConfigs,
} from "@/db/schema";
import {
  AVATAR_FRAMES,
  DEFAULT_QUIZ_QUESTIONS,
  FREE_GAMES_CATALOG,
  NAME_ANIMATIONS,
  REFERENCE_AVATARS,
} from "@/lib/catalog";
import { count } from "drizzle-orm";
import { BREAKING_NEWS_DEFAULTS } from "@/lib/breakingNews";
import { FLAG_HEARTS_DEFAULTS } from "@/lib/flagHearts";
import { NOTES_STARTER } from "@/lib/streamNotes";
import { SOCIAL_DEFAULTS } from "@/lib/socialMedia";
import { QURAN_DEFAULTS, QURAN_STATE_DEFAULT } from "@/lib/quran";
import { NEWS_TICKER_DEFAULTS, STREAM_TIMER_DEFAULTS } from "@/lib/liveOverlays";

let seedPromise: Promise<void> | null = null;

export async function ensureSeeded(): Promise<void> {
  if (seedPromise) {
    return seedPromise;
  }
  seedPromise = runSeed().catch((err) => {
    seedPromise = null;
    throw err;
  });
  return seedPromise;
}

/** Default state for overlays added to the catalog after the first seed. */
function initialGameState(slug: string): Record<string, unknown> {
  if (slug === "breaking-news") {
    return { phase: "running", startedAt: null, config: BREAKING_NEWS_DEFAULTS };
  }
  if (slug === "news-ticker") {
    return { phase: "running", startedAt: Date.now(), config: NEWS_TICKER_DEFAULTS };
  }
  if (slug === "stream-timer") {
    return { phase: "running", startedAt: Date.now(), baseline: null, config: STREAM_TIMER_DEFAULTS };
  }
  return { status: "idle", round: 1 };
}

/** Make sure every catalog overlay has a row (adds new ones to existing databases). */
async function ensureGameRows(): Promise<void> {
  await db
    .insert(gameConfigs)
    .values(
      FREE_GAMES_CATALOG.map((g) => ({
        gameSlug: g.slug,
        title: g.title,
        category: g.category,
        isFree: true,
        enabled: true,
        cardTheme: "cyber-cyan",
        roundDurationSec: 60,
        stateJson: initialGameState(g.slug),
      })),
    )
    .onConflictDoNothing();
}

/** Widgets added after the first seed. */
async function ensureExtraWidgets(): Promise<void> {
  await db
    .insert(widgetConfigs)
    .values([
      { widgetKey: "flag-hearts", title: "Flag Hearts", theme: "glossy", customSettings: { flagHearts: FLAG_HEARTS_DEFAULTS } },
      { widgetKey: "notes", title: "Stream Notes", theme: "sticky", customSettings: { notesConfig: NOTES_STARTER } },
      { widgetKey: "social", title: "Social Media", theme: "overlaylive-badge", customSettings: { social: SOCIAL_DEFAULTS } },
      { widgetKey: "quran", title: "Quran Recitation", theme: "minimal", customSettings: { config: QURAN_DEFAULTS, state: QURAN_STATE_DEFAULT } },
    ])
    .onConflictDoNothing();
}

async function runSeed(): Promise<void> {
  await withAdvisoryLock(LOCK_SEED, async () => {
    await runInitialSeed();
    await ensureGameRows();
    await ensureExtraWidgets();
  });
}

async function runInitialSeed(): Promise<void> {
  const [{ value: profileCount }] = await db
    .select({ value: count() })
    .from(streamerProfiles);

  if (profileCount > 0) {
    return;
  }

  await db.insert(streamerProfiles).values({
    displayName: "Ava Stone",
    tiktokHandle: "@yourname",
    avatarUrl: "/avatars/a1.png",
    avatarFrame: "ember-dragon",
    bio: "Daily LIVE: games, music and chat with my community",
    connectionStatus: "test_mode",
    followersCount: 5453,
    followingCount: 354,
    likesCount: 31900,
    videosCount: 79,
    coinsBalance: 42,
    sessionCoins: 663,
    sessionPeakViewers: 76,
    sessionAvgViewers: 33,
    sessionNewFollowers: 14,
    sessionLikes: 116900,
    sessionGifts: 51,
    proPlanLabel: "Pro · ends Oct 24",
    locale: "en",
    accentPreset: "cyan",
    canvasFormat: "9:16",
    ttsEnabled: true,
    soundAlertsEnabled: true,
  });

  await db
    .insert(widgetConfigs)
    .values([
      {
        widgetKey: "top-lists",
        title: "Top Gifters & Coin Leaderboard",
        enabled: true,
        theme: "ember-dragon",
        animation: "pop",
        avatarFrame: "ember-dragon",
        primaryColor: "#28c7fa",
        secondaryColor: "#ff8a2b",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: true,
        volume: 80,
        customSettings: {
          mode: "podium",
          metric: "coins",
          maxRows: 5,
          artworkTheme: "board-ember-dragon",
          showAvatars: true,
          showFrames: true,
        },
      },
      {
        widgetKey: "goals",
        title: "LIVE Coin & Heart Goal",
        enabled: true,
        theme: "goal-liquid-heart",
        animation: "float",
        avatarFrame: "sakura-fox",
        primaryColor: "#fb7185",
        secondaryColor: "#28c7fa",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: true,
        volume: 75,
        customSettings: {
          goalType: "coins",
          label: "Daily Coin Goal",
          current: 663,
          target: 1000,
          vesselStyle: "goal-liquid-heart",
        },
      },
      {
        widgetKey: "gift-alerts",
        title: "Real-Time Gift Alerts",
        enabled: true,
        theme: "royal-ember",
        animation: "zoom",
        avatarFrame: "ember-dragon",
        primaryColor: "#fb923c",
        secondaryColor: "#facc15",
        fontFamily: "Roadster",
        scale: 100,
        soundEnabled: true,
        volume: 85,
        customSettings: {
          minCoins: 1,
          template: "{user} sent {gift}!",
          durationSec: 5,
        },
      },
      {
        widgetKey: "gift-videos",
        title: "Gift Videos & Multi-Screen Actions",
        enabled: true,
        theme: "cinema-burst",
        animation: "bounce",
        avatarFrame: "stormfang-wolf",
        primaryColor: "#a855f7",
        secondaryColor: "#22d3ee",
        fontFamily: "Roadster",
        scale: 100,
        soundEnabled: true,
        volume: 90,
        customSettings: {
          screens: 2,
          lionTriggerEffect: "fireworks",
          roseTriggerEffect: "hearts",
        },
      },
      {
        widgetKey: "follow-join",
        title: "Follow & VIP Join Alerts",
        enabled: true,
        theme: "neon",
        animation: "rise",
        avatarFrame: "arcade-bunny",
        primaryColor: "#22d3ee",
        secondaryColor: "#f472b6",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: true,
        volume: 75,
        customSettings: {
          followStyle: "cyber",
          joinStyle: "vip-framed",
          welcomeText: "welcomed into the LIVE!",
          plateArtwork: "plate-night-owl",
        },
      },
      {
        widgetKey: "event-feed",
        title: "Latest Events Ticker",
        enabled: true,
        theme: "solar-orbit",
        animation: "slide",
        avatarFrame: "volt-fox",
        primaryColor: "#38bdf8",
        secondaryColor: "#fbbf24",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: false,
        volume: 60,
        customSettings: {
          direction: "ltr",
          showGifts: true,
          showFollows: true,
          showLikes: true,
          showShares: true,
        },
      },
      {
        widgetKey: "chat-box",
        title: "TikTok LIVE Chat Box (18+ Themes)",
        enabled: true,
        theme: "dynamic-island",
        animation: "pop",
        avatarFrame: "moonpaw-cat",
        primaryColor: "#28c7fa",
        secondaryColor: "#a855f7",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: false,
        volume: 50,
        customSettings: {
          showBadges: true,
          showAvatars: true,
          direction: "ltr",
          maxMessages: 6,
        },
      },
      {
        widgetKey: "effects",
        title: "15 Screen Effects & Rising Hearts",
        enabled: true,
        theme: "confetti",
        animation: "float",
        avatarFrame: "cloudwing-halo",
        primaryColor: "#fb7185",
        secondaryColor: "#38bdf8",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: true,
        volume: 80,
        customSettings: {
          risingAvatarHearts: true,
          autoEffectOnLion: true,
        },
      },
      {
        widgetKey: "tts-sound",
        title: "TTS Chat Reader & Sound Alerts",
        enabled: true,
        theme: "voice-pro",
        animation: "pulse",
        avatarFrame: "neon-headphones",
        primaryColor: "#22d3ee",
        secondaryColor: "#34d399",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: true,
        volume: 85,
        customSettings: {
          voicePitch: 1.05,
          voiceRate: 1.0,
          readAllChat: true,
          readPrefix: "!say",
          announceGifts: true,
        },
      },
      {
        widgetKey: "branding",
        title: "Social Media, Branding & Stream Notes",
        enabled: true,
        theme: "night-owl",
        animation: "shimmer",
        avatarFrame: "honeybee-royale",
        primaryColor: "#28c7fa",
        secondaryColor: "#ff8a2b",
        fontFamily: "Inter",
        scale: 100,
        soundEnabled: false,
        volume: 0,
        customSettings: {
          tiktok: "@yourname",
          instagram: "@avastone.live",
          youtube: "@AvaStoneTV",
          discord: "discord.gg/avastone",
          noteText: "🎁 Top #1 Gifter picks the next game! Type !join in chat",
          waitingScreen: "none",
        },
      },
    ])
    .onConflictDoNothing();

  await db.insert(avatarPresets).values(
    REFERENCE_AVATARS.map((a, idx) => {
      const frameObj =
        AVATAR_FRAMES.find((f) => f.slug === a.defaultFrame) ?? AVATAR_FRAMES[0];
      return {
        displayName: a.name,
        tiktokUsername: a.handle,
        avatarUrl: a.url,
        frameSlug: a.defaultFrame,
        nameAnimation: NAME_ANIMATIONS[idx % NAME_ANIMATIONS.length],
        particleFx: frameObj.hasSignatureFx ? a.defaultFrame : "sparkles",
        role: a.role,
        glowColor: frameObj.glow,
        welcomeMessage: a.bio,
        coinsTotal: a.defaultCoins,
        likesTotal: (18 - idx) * 1450,
        sharesTotal: 20 + (((idx + 1) * 37) % 140),
        weeklyCoins: Math.round(a.defaultCoins * (0.55 + (((idx + 1) * 13) % 40) / 100)) + (((idx + 1) * 211) % 900),
        allTimeCoins: a.defaultCoins * (4 + ((idx + 1) % 5)) + (((idx + 1) * 977) % 5000),
        isPinned: idx < 8,
      };
    }),
  );

  await db
    .insert(gameConfigs)
    .values(
      FREE_GAMES_CATALOG.map((g) => {
        let initialState: Record<string, unknown> = initialGameState(g.slug);
        if (g.slug === "live-quiz") {
          initialState = {
            status: "active",
            currentQuestionIndex: 0,
            revealed: false,
            questions: DEFAULT_QUIZ_QUESTIONS,
            votes: { 0: 14, 1: 42, 2: 9, 3: 6 },
            scores: [
              { name: "Mira Lee", avatar: "/avatars/a2.png", frame: "sakura-fox", points: 320 },
              { name: "Zeyad K", avatar: "/avatars/a3.png", frame: "stormfang-wolf", points: 280 },
              { name: "Hoda K", avatar: "/avatars/a4.png", frame: "arcade-bunny", points: 210 },
            ],
          };
        } else if (g.slug === "coin-battle") {
          initialState = {
            status: "active",
            timeLeft: 75,
            frozen: false,
            contenders: [
              { name: "Ava", handle: "@yourname", avatar: "/avatars/a1.png", frame: "ember-dragon", coins: 8420 },
              { name: "Mira Lee", handle: "@mira_lee", avatar: "/avatars/a2.png", frame: "sakura-fox", coins: 6940 },
              { name: "Zeyad K", handle: "@zeyad.gg", avatar: "/avatars/a3.png", frame: "stormfang-wolf", coins: 5210 },
            ],
          };
        } else if (g.slug === "team-battle") {
          initialState = {
            status: "active",
            redName: "Ember Dragons",
            blueName: "Cyber Wolves",
            redScore: 1420,
            blueScore: 1180,
          };
        } else if (g.slug === "lucky-wheel") {
          initialState = {
            status: "idle",
            rotation: 0,
            winnerSlice: "VIP Frame Shoutout",
            slices: [
              "VIP Frame Shoutout",
              "Choose Next Song",
              "20x Squat Challenge",
              "Mod Badge for LIVE",
              "Mystery Gift Box",
              "Double Quiz Points",
              "Follow Back!",
              "Spin Again x2",
            ],
          };
        } else if (g.slug === "avatar-race") {
          initialState = {
            status: "active",
            winner: null,
            racers: [
              { name: "Mira Lee", avatar: "/avatars/a2.png", frame: "sakura-fox", progress: 68 },
              { name: "Zeyad K", avatar: "/avatars/a3.png", frame: "stormfang-wolf", progress: 74 },
              { name: "Hoda K", avatar: "/avatars/a4.png", frame: "arcade-bunny", progress: 59 },
              { name: "Kairos", avatar: "/avatars/a5.png", frame: "volt-fox", progress: 81 },
            ],
          };
        } else if (g.slug === "word-scramble") {
          initialState = {
            status: "active",
            word: "STREAMER",
            scrambled: "R M E A T S R E",
            hint: "Someone broadcasting live to their community",
            solvedBy: null,
          };
        } else if (g.slug === "boss-raid") {
          initialState = {
            status: "active",
            bossName: "Obsidian Ember Dragon",
            hp: 6450,
            maxHp: 10000,
            mvp: "LeoFlame",
          };
        } else if (g.slug === "neon-dance-floor") {
          initialState = {
            status: "active",
            bpm: 128,
            vibe: "Cyber Synthwave",
          };
        } else if (g.slug === "gift-plinko") {
          initialState = {
            status: "active",
            lastMultiplier: "5x",
            lastWinner: "MaxVolt",
            jackpotPool: 2450,
          };
        } else if (g.slug === "emoji-royale") {
          initialState = {
            status: "active",
            champion: "Tariq99",
            aliveCount: 6,
          };
        } else if (g.slug === "chat-tic-tac-toe") {
          initialState = {
            status: "active",
            board: ["X", "O", "", "", "X", "", "", "", "O"],
            turn: "X",
            winner: null,
          };
        } else if (g.slug === "hot-potato") {
          initialState = {
            status: "active",
            holder: "Kairos",
            holderAvatar: "/avatars/a5.png",
            holderFrame: "volt-fox",
            fuseSec: 12,
          };
        }

        return {
          gameSlug: g.slug,
          title: g.title,
          category: g.category,
          isFree: true,
          enabled: true,
          cardTheme: "cyber-cyan",
          roundDurationSec: 60,
          stateJson: initialState,
        };
      }),
    )
    .onConflictDoNothing();

  await db
    .insert(linkScenes)
    .values([
      {
        slug: "tiktok-studio",
        name: "TikTok LIVE Studio Vertical (9:16)",
        platform: "tiktok_studio",
        aspectRatio: "9:16",
        isActive: true,
        layersJson: [
          {
            id: "layer-top",
            widgetKey: "top-lists",
            label: "Top Gifters Podium",
            x: 6,
            y: 4,
            width: 88,
            scale: 95,
            visible: true,
            zIndex: 10,
          },
          {
            id: "layer-goal",
            widgetKey: "goals",
            label: "Coin / Heart Goal",
            x: 8,
            y: 26,
            width: 84,
            scale: 95,
            visible: true,
            zIndex: 20,
          },
          {
            id: "layer-alerts",
            widgetKey: "gift-alerts",
            label: "Gift & VIP Join Alerts",
            x: 10,
            y: 41,
            width: 80,
            scale: 100,
            visible: true,
            zIndex: 40,
          },
          {
            id: "layer-chat",
            widgetKey: "chat-box",
            label: "Dynamic Island Chat",
            x: 6,
            y: 58,
            width: 88,
            scale: 95,
            visible: true,
            zIndex: 30,
          },
          {
            id: "layer-feed",
            widgetKey: "event-feed",
            label: "Latest Events Ticker",
            x: 4,
            y: 84,
            width: 92,
            scale: 90,
            visible: true,
            zIndex: 15,
          },
        ],
      },
      {
        slug: "obs-studio",
        name: "OBS Studio Widescreen (16:9)",
        platform: "obs",
        aspectRatio: "16:9",
        isActive: true,
        layersJson: [
          {
            id: "obs-top",
            widgetKey: "top-lists",
            label: "Top Gifters Podium",
            x: 3,
            y: 5,
            width: 38,
            scale: 95,
            visible: true,
            zIndex: 10,
          },
          {
            id: "obs-goal",
            widgetKey: "goals",
            label: "Liquid Heart Goal",
            x: 66,
            y: 5,
            width: 31,
            scale: 95,
            visible: true,
            zIndex: 20,
          },
          {
            id: "obs-alerts",
            widgetKey: "gift-alerts",
            label: "Center Gift & VIP Alerts",
            x: 32,
            y: 28,
            width: 36,
            scale: 100,
            visible: true,
            zIndex: 40,
          },
          {
            id: "obs-chat",
            widgetKey: "chat-box",
            label: "Stream Chat Box",
            x: 3,
            y: 52,
            width: 34,
            scale: 95,
            visible: true,
            zIndex: 30,
          },
          {
            id: "obs-feed",
            widgetKey: "event-feed",
            label: "Bottom Event Strip",
            x: 20,
            y: 87,
            width: 60,
            scale: 95,
            visible: true,
            zIndex: 15,
          },
        ],
      },
    ])
    .onConflictDoNothing();

  await db.insert(liveEvents).values([
    {
      eventType: "gift",
      username: "@mira_lee",
      displayName: "Mira Lee",
      avatarUrl: "/avatars/a2.png",
      avatarFrame: "sakura-fox",
      giftId: "tiktok",
      giftName: "TikTok",
      giftIcon: "/assets/gifts/tiktok.png",
      coins: 10,
      likes: 0,
      message: "Sent TikTok x10!",
    },
    {
      eventType: "join",
      username: "@zeyad.gg",
      displayName: "Zeyad K",
      avatarUrl: "/avatars/a3.png",
      avatarFrame: "stormfang-wolf",
      coins: 0,
      likes: 0,
      message: "VIP entered the LIVE!",
    },
    {
      eventType: "chat",
      username: "@hoda.k",
      displayName: "Hoda K",
      avatarUrl: "/avatars/a4.png",
      avatarFrame: "arcade-bunny",
      coins: 0,
      likes: 0,
      message: "B! Definitely Saturn 🪐 let's gooo Ava!!",
    },
    {
      eventType: "follow",
      username: "@kairos_live",
      displayName: "Kairos",
      avatarUrl: "/avatars/a5.png",
      avatarFrame: "volt-fox",
      coins: 0,
      likes: 0,
      message: "followed the LIVE!",
    },
    {
      eventType: "gift",
      username: "@leoflame",
      displayName: "LeoFlame",
      avatarUrl: "/avatars/a11.png",
      avatarFrame: "ember-koi",
      giftId: "finger-heart",
      giftName: "Finger Heart",
      giftIcon: "/assets/gifts/finger-heart.png",
      coins: 25,
      likes: 0,
      message: "Sent Finger Heart x5!",
    },
    {
      eventType: "chat",
      username: "@luna.vibe",
      displayName: "Luna Vibe",
      avatarUrl: "/avatars/a6.png",
      avatarFrame: "moonpaw-cat",
      coins: 0,
      likes: 0,
      message: "Love the new Ember Dragon podium overlay 🔥🐉",
    },
  ]);
}
