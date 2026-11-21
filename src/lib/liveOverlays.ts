/**
 * OverlayLive Game Store catalog (from /overlay/games/* on overlaylive.app)
 * plus settings for the overlays that are fully ported here.
 */

export type StoreStatus = "ready" | "soon";

export interface StoreOverlay {
  slug: string;
  title: string;
  description: string;
  group: "Games" | "Gifts" | "Stats & Info" | "Community";
  emoji: string;
  designs: string[];
  status: StoreStatus;
}

/** All 37 live overlays published under overlaylive.app/overlay/games/<slug>. */
export const STORE_OVERLAYS: StoreOverlay[] = [
  { slug: "breaking-news", title: "Breaking News", emoji: "📰", group: "Stats & Info", status: "ready", description: "TV news bar that turns LIVE events into breaking headlines with a ticker and clock.", designs: ["Classic bar", "Compact bar", "Ticker only", "Floating pill", "Minimal text", "Lower-third card"] },
  { slug: "news-ticker", title: "News Ticker", emoji: "📜", group: "Stats & Info", status: "ready", description: "Endless scrolling strip with your own messages — welcome lines, rules, socials.", designs: ["Breaking", "Glass", "Neon", "Gold", "Gradient", "LED", "Paper", "Cyber"] },
  { slug: "stream-timer", title: "Stream Timer", emoji: "⏱️", group: "Stats & Info", status: "ready", description: "LIVE uptime, a countdown viewers can extend with gifts, follows and likes, or a clock.", designs: ["Neon", "LCD", "Flip", "Capsule", "Minimal", "Analog"] },
  { slug: "total-followers", title: "Total Followers", emoji: "👥", group: "Stats & Info", status: "soon", description: "Your follower count with your framed avatar, counting up live.", designs: ["Minimal"] },
  { slug: "league-rank", title: "League Rank", emoji: "🏅", group: "Stats & Info", status: "soon", description: "Shows your LIVE league tier, score and the gap to the next rank.", designs: ["Card"] },
  { slug: "live-activity", title: "Live Activity", emoji: "⚡", group: "Stats & Info", status: "soon", description: "A compact live feed of what viewers are doing right now.", designs: [] },
  { slug: "top-streak", title: "Top Streak", emoji: "🔥", group: "Stats & Info", status: "soon", description: "Celebrates the biggest gift combo streak of the LIVE.", designs: [] },
  { slug: "highest-gift", title: "Highest Gift", emoji: "💎", group: "Gifts", status: "soon", description: "Spotlights the single most valuable gift sent this LIVE.", designs: [] },
  { slug: "gift-stream", title: "Gift Stream", emoji: "🎁", group: "Gifts", status: "soon", description: "TikTok-style stack of incoming gifts with avatars, counts and merged streaks.", designs: ["TikTok"] },
  { slug: "gift-gallery", title: "Gift Gallery", emoji: "🖼️", group: "Gifts", status: "soon", description: "A showcase wall of the gifts received during the LIVE.", designs: ["Aurora", "Gold", "Neon", "Royal"] },
  { slug: "gift-menu", title: "Gift Menu", emoji: "📋", group: "Gifts", status: "soon", description: "Shows viewers which gift does what — slides, carousel, boxes or ticker.", designs: ["Gift Slides", "Gift Carousel", "Card Boxes", "Minimal", "Scrolling Ticker", "Ticker — No Box", "Gifts Only (grid)", "Gifts Only (one row)"] },
  { slug: "gift-goals", title: "Gift Goals", emoji: "🎯", group: "Gifts", status: "soon", description: "Per-gift goals that fill up as viewers send each gift.", designs: ["Gift Carousel", "Gift Slides", "Card Boxes", "Minimal", "Ticker — No Box", "Gifts Only (grid)", "Gifts Only (one row)"] },
  { slug: "gift-cannon", title: "Gift Cannon", emoji: "💥", group: "Gifts", status: "soon", description: "Fires gifts across the screen with sounds when they arrive.", designs: [] },
  { slug: "gift-printer", title: "Gift Printer", emoji: "🧾", group: "Gifts", status: "soon", description: "Prints a receipt-style slip for every gift.", designs: [] },
  { slug: "coin-jar", title: "Coin Jar", emoji: "🫙", group: "Gifts", status: "soon", description: "A physics jar that fills with coins as gifts land.", designs: ["Glass", "Physics Jar", "Clear Glass", "Donation Box", "Tag Jar", "Classic", "Royal Medal", "Arcade Champion", "Champion Shield", "Emerald Flask", "Royal Hourglass", "Arcade Orb"] },
  { slug: "magic-cauldron", title: "Magic Cauldron", emoji: "🧪", group: "Gifts", status: "soon", description: "Gifts drop into a bubbling cauldron that brews a reward.", designs: ["Witch", "Alchemy", "Neon"] },
  { slug: "mega-drop", title: "Mega Drop", emoji: "🎰", group: "Games", status: "soon", description: "Casino-style prize drop triggered by gifts.", designs: ["Casino Royal", "Neon Nights", "Candy Pop"] },
  { slug: "lucky-wheel", title: "Lucky Wheel", emoji: "🎡", group: "Games", status: "soon", description: "Viewers earn tickets with coins and likes; the wheel picks a winner.", designs: ["Carnival"] },
  { slug: "car-race", title: "Car Race", emoji: "🏎️", group: "Games", status: "soon", description: "Teams race cars powered by gifts, likes and comments.", designs: ["Asphalt City", "Desert Rally", "Neon Circuit", "Neon Clash", "Royal Gold", "Glass", "Inferno", "Ocean", "Forest", "Candy"] },
  { slug: "boxing-ring", title: "Boxing Ring", emoji: "🥊", group: "Games", status: "soon", description: "Two fighters battle — every gift is a punch for its team.", designs: ["Neon Clash", "Royal Gold", "Glass", "Inferno", "Ocean", "Forest", "Candy", "Minimal"] },
  { slug: "castle-war", title: "Castle War", emoji: "🏰", group: "Games", status: "soon", description: "Defend your castle and attack the other team with gifts.", designs: [] },
  { slug: "avatar-arena", title: "Avatar Arena", emoji: "⚔️", group: "Games", status: "soon", description: "Viewer avatars fight in an arena until one champion remains.", designs: [] },
  { slug: "boys-vs-girls", title: "Boys vs Girls", emoji: "👦👧", group: "Games", status: "soon", description: "Two-team battle — the room picks a side and pushes the score.", designs: [] },
  { slug: "team-scores", title: "Team Scores", emoji: "🆚", group: "Games", status: "soon", description: "Two teams, each with its own gifts, racing to a target.", designs: ["Arena"] },
  { slug: "nations-league", title: "Nations League", emoji: "🌍", group: "Games", status: "soon", description: "Countries compete — viewers score for their nation.", designs: [] },
  { slug: "country-crown", title: "Country Crown", emoji: "👑", group: "Games", status: "soon", description: "Ranks the countries of your viewers by support.", designs: ["Ranked List", "Race Bars", "Flag Cards", "Minimal"] },
  { slug: "football-clubs", title: "Football Clubs", emoji: "⚽", group: "Games", status: "soon", description: "Fans back their club; gifts and comments score goals.", designs: [] },
  { slug: "flag-taps", title: "Flag Taps", emoji: "🚩", group: "Games", status: "soon", description: "Likes raise flags — the most-tapped country wins.", designs: [] },
  { slug: "word-hunt", title: "Word Hunt", emoji: "🔎", group: "Games", status: "soon", description: "Find hidden words on the grid by typing them in chat.", designs: [] },
  { slug: "word-swipe", title: "Word Swipe", emoji: "🔤", group: "Games", status: "soon", description: "Make words from the letter wheel in chat.", designs: [] },
  { slug: "questions", title: "Questions", emoji: "❓", group: "Community", status: "soon", description: "Viewers send questions with !q; you show them one by one.", designs: ["Neon"] },
  { slug: "guestbook", title: "Guestbook", emoji: "📖", group: "Community", status: "soon", description: "Viewers sign a guestbook that fills up during the LIVE.", designs: [] },
  { slug: "dance-party", title: "Dance Party", emoji: "💃", group: "Community", status: "soon", description: "Viewers join a dance floor and dance on screen.", designs: [] },
  { slug: "wedding-party", title: "Wedding Party", emoji: "💍", group: "Community", status: "soon", description: "A celebration scene that viewers join and decorate.", designs: [] },
  { slug: "graffiti-city", title: "Graffiti City", emoji: "🎨", group: "Community", status: "soon", description: "Viewers tag a city wall with their names.", designs: [] },
  { slug: "deep-ocean", title: "Deep Ocean", emoji: "🐠", group: "Community", status: "soon", description: "Viewers become fish swimming in your ocean.", designs: [] },
  { slug: "retro-tv", title: "Retro TV", emoji: "📺", group: "Community", status: "soon", description: "A retro TV frame that shows LIVE moments.", designs: [] },
];

/* ───────────────────────── News Ticker ───────────────────────── */

export type TickerDesign = "breaking" | "glass" | "neon" | "gold" | "gradient" | "led" | "paper" | "cyber";

export interface NewsTickerConfig {
  design: TickerDesign;
  messages: string[];
  badgeText: string;
  showBadge: boolean;
  separator: string;
  speed: number;
  direction: "auto" | "ltr" | "rtl";
  reverse: boolean;
  fontFamily: string;
  fontScale: number;
  textColor: string;
  accentColor: string;
}

export const NEWS_TICKER_DESIGNS: TickerDesign[] = ["breaking", "glass", "neon", "gold", "gradient", "led", "paper", "cyber"];

export const NEWS_TICKER_DEFAULTS: NewsTickerConfig = {
  design: "breaking",
  messages: ["Welcome to the LIVE 👋", "Follow so you don't miss the next stream ❤️", "Drop a like to support the stream 🔥"],
  badgeText: "NEWS",
  showBadge: true,
  separator: "◆",
  speed: 80,
  direction: "auto",
  reverse: false,
  fontFamily: "",
  fontScale: 100,
  textColor: "",
  accentColor: "",
};

/* ───────────────────────── Stream Timer ───────────────────────── */

export type TimerDesign = "neon" | "lcd" | "flip" | "capsule" | "minimal" | "analog";
export type TimerMode = "uptime" | "countdown" | "clock";

export interface StreamTimerConfig {
  design: TimerDesign;
  mode: TimerMode;
  label: string;
  showLabel: boolean;
  fontFamily: string;
  accentColor: string;
  textColor: string;
  showSeconds: boolean;
  hour12: boolean;
  countdownMinutes: number;
  bonusEnabled: boolean;
  secPerCoin: number;
  secPerFollow: number;
  likesPerBonus: number;
  secPerLikes: number;
  maxBonusMinutes: number;
  showBonus: boolean;
}

export const STREAM_TIMER_DESIGNS: TimerDesign[] = ["neon", "lcd", "flip", "capsule", "minimal", "analog"];
export const STREAM_TIMER_MODES: TimerMode[] = ["uptime", "countdown", "clock"];

export const STREAM_TIMER_DEFAULTS: StreamTimerConfig = {
  design: "neon",
  mode: "uptime",
  label: "LIVE",
  showLabel: true,
  fontFamily: "Orbitron",
  accentColor: "#22d3ee",
  textColor: "#ffffff",
  showSeconds: true,
  hour12: true,
  countdownMinutes: 60,
  bonusEnabled: false,
  secPerCoin: 1,
  secPerFollow: 10,
  likesPerBonus: 100,
  secPerLikes: 1,
  maxBonusMinutes: 0,
  showBonus: true,
};

/* ───────────────────────── shared state ───────────────────────── */

export interface SessionBaseline {
  coins: number;
  followers: number;
  likes: number;
}

export interface SimpleOverlayState<C> {
  phase: "idle" | "running";
  startedAt: number | null;
  baseline?: SessionBaseline | null;
  config: C;
}

export function normalizeSimpleState<C extends object>(raw: unknown, defaults: C): SimpleOverlayState<C> {
  const src = (raw && typeof raw === "object" ? raw : {}) as Partial<SimpleOverlayState<C>>;
  return {
    phase: src.phase === "running" ? "running" : "idle",
    startedAt: typeof src.startedAt === "number" ? src.startedAt : null,
    baseline: src.baseline ?? null,
    config: { ...defaults, ...((src.config as object) || {}) } as C,
  };
}

/** Seconds added to a countdown by gifts, follows and likes since the timer started. */
export function timerBonusSeconds(cfg: StreamTimerConfig, now: SessionBaseline | null, base: SessionBaseline | null | undefined): number {
  if (!cfg.bonusEnabled || !now || !base) return 0;
  const d = (k: keyof SessionBaseline) => Math.max(0, (Number(now[k]) || 0) - (Number(base[k]) || 0));
  const perLikes = Math.max(1, Math.floor(Number(cfg.likesPerBonus) || 1));
  let sec =
    d("coins") * Math.max(0, Number(cfg.secPerCoin) || 0) +
    d("followers") * Math.max(0, Number(cfg.secPerFollow) || 0) +
    Math.floor(d("likes") / perLikes) * Math.max(0, Number(cfg.secPerLikes) || 0);
  if (cfg.maxBonusMinutes > 0) sec = Math.min(sec, cfg.maxBonusMinutes * 60);
  return Math.floor(sec);
}
