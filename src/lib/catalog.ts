export interface ReferenceAvatar {
  id: string;
  index: number;
  name: string;
  handle: string;
  url: string;
  defaultFrame: string;
  role: "creator" | "vip" | "superfan" | "top_gifter" | "moderator";
  bio: string;
  defaultCoins: number;
}

export interface AvatarFrameItem {
  slug: string;
  name: string;
  category:
    | "Mythic & Dragons"
    | "Kawaii & Pastel"
    | "Cyber & Arcade"
    | "Celestial & Royal"
    | "Nature & Cozy"
    | "Action & Elemental";
  url: string;
  glow: string;
  hasSignatureFx: boolean;
  free: boolean;
}

export interface GiftAssetItem {
  id: string;
  name: string;
  coins: number;
  icon: string;
  accent: string;
}

export interface ShowcaseArtworkItem {
  id: string;
  title: string;
  subtitle: string;
  category: "leaderboard" | "goal" | "plate";
  url: string;
  width: number;
  height: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  category: string;
}

export interface FreeGameDefinition {
  slug: string;
  title: string;
  subtitle: string;
  category: "quiz" | "battle" | "wheel" | "race" | "word" | "arcade" | "news";
  badge: string;
  isFree: true;
  triggerLabel: string;
  accentFrom: string;
  accentTo: string;
  keySvg: string;
  howToPlay: string;
}

export const REFERENCE_AVATARS: ReferenceAvatar[] = [
  {
    id: "a1",
    index: 1,
    name: "Ava Stone",
    handle: "@yourname",
    url: "/avatars/a1.png",
    defaultFrame: "ember-dragon",
    role: "creator",
    bio: "Daily LIVE: games, music and chat with my community",
    defaultCoins: 8420,
  },
  {
    id: "a2",
    index: 2,
    name: "Mira Lee",
    handle: "@mira_lee",
    url: "/avatars/a2.png",
    defaultFrame: "sakura-fox",
    role: "top_gifter",
    bio: "Top #1 Gifter · Music & Cozy Streams",
    defaultCoins: 6940,
  },
  {
    id: "a3",
    index: 3,
    name: "Zeyad K",
    handle: "@zeyad.gg",
    url: "/avatars/a3.png",
    defaultFrame: "stormfang-wolf",
    role: "top_gifter",
    bio: "Quiz Champion & Coin Battle Regular",
    defaultCoins: 5210,
  },
  {
    id: "a4",
    index: 4,
    name: "Hoda K",
    handle: "@hoda.k",
    url: "/avatars/a4.png",
    defaultFrame: "arcade-bunny",
    role: "superfan",
    bio: "Superfan Streak · 42 LIVEs in a row",
    defaultCoins: 4180,
  },
  {
    id: "a5",
    index: 5,
    name: "Kairos",
    handle: "@kairos_live",
    url: "/avatars/a5.png",
    defaultFrame: "volt-fox",
    role: "vip",
    bio: "VIP Regular · Cyber & FPS Gamer",
    defaultCoins: 3650,
  },
  {
    id: "a6",
    index: 6,
    name: "Luna Vibe",
    handle: "@luna.vibe",
    url: "/avatars/a6.png",
    defaultFrame: "moonpaw-cat",
    role: "vip",
    bio: "Night Owl Squad · Lo-fi Requests",
    defaultCoins: 2990,
  },
  {
    id: "a7",
    index: 7,
    name: "Nour.GG",
    handle: "@nour.gg",
    url: "/avatars/a7.png",
    defaultFrame: "astral-raven",
    role: "moderator",
    bio: "Lead Room Moderator · Keep it chill",
    defaultCoins: 2540,
  },
  {
    id: "a8",
    index: 8,
    name: "Sora.TT",
    handle: "@sora.tt",
    url: "/avatars/a8.png",
    defaultFrame: "cloudwing-halo",
    role: "superfan",
    bio: "Heart Tapper · 50K Likes Club",
    defaultCoins: 2180,
  },
  {
    id: "a9",
    index: 9,
    name: "Tariq99",
    handle: "@tariq99",
    url: "/avatars/a9.png",
    defaultFrame: "blue-dragon",
    role: "vip",
    bio: "Team Battle Captain",
    defaultCoins: 1890,
  },
  {
    id: "a10",
    index: 10,
    name: "Yuna Live",
    handle: "@yuna_live",
    url: "/avatars/a10.png",
    defaultFrame: "honeybee-royale",
    role: "vip",
    bio: "Kawaii Aesthetic & Sticker Collector",
    defaultCoins: 1640,
  },
  {
    id: "a11",
    index: 11,
    name: "LeoFlame",
    handle: "@leoflame",
    url: "/avatars/a11.png",
    defaultFrame: "ember-koi",
    role: "top_gifter",
    bio: "Lion Dropper · Hype Crew",
    defaultCoins: 1490,
  },
  {
    id: "a12",
    index: 12,
    name: "Rami Pro",
    handle: "@rami_pro",
    url: "/avatars/a12.png",
    defaultFrame: "neon-headphones",
    role: "moderator",
    bio: "Audio & Song Queue DJ",
    defaultCoins: 1220,
  },
  {
    id: "a13",
    index: 13,
    name: "Chloe.TV",
    handle: "@chloe.tv",
    url: "/avatars/a13.png",
    defaultFrame: "cozy-pond-frog",
    role: "superfan",
    bio: "Cozy Pond Squad",
    defaultCoins: 980,
  },
  {
    id: "a14",
    index: 14,
    name: "Kenji X",
    handle: "@kenji_x",
    url: "/avatars/a14.png",
    defaultFrame: "pixel-quest",
    role: "vip",
    bio: "Retro Arcade Speedrunner",
    defaultCoins: 870,
  },
  {
    id: "a15",
    index: 15,
    name: "Layla Q8",
    handle: "@layla_q8",
    url: "/avatars/a15.png",
    defaultFrame: "moonlit-roses",
    role: "vip",
    bio: "VIP Entrance Collector",
    defaultCoins: 740,
  },
  {
    id: "a16",
    index: 16,
    name: "MaxVolt",
    handle: "@maxvolt",
    url: "/avatars/a16.png",
    defaultFrame: "tidepool-otter",
    role: "vip",
    bio: "Plinko & Wheel Addict",
    defaultCoins: 630,
  },
  {
    id: "a17",
    index: 17,
    name: "Elena Star",
    handle: "@elena.star",
    url: "/avatars/a17.png",
    defaultFrame: "golden-halo",
    role: "superfan",
    bio: "Always first in the LIVE!",
    defaultCoins: 520,
  },
];

const SIGNATURE_FRAMES = new Set([
  "arcade-bunny",
  "astral-raven",
  "cloudwing-halo",
  "cozy-pond-frog",
  "ember-dragon",
  "ember-koi",
  "honeybee-royale",
  "moonpaw-cat",
  "sakura-fox",
  "stormfang-wolf",
  "tidepool-otter",
  "volt-fox",
]);

function titleizeSlug(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const RAW_FRAME_META: Array<{
  slug: string;
  category: AvatarFrameItem["category"];
  glow: string;
}> = [
  { slug: "ember-dragon", category: "Mythic & Dragons", glow: "#ff7a18" },
  { slug: "blue-dragon", category: "Mythic & Dragons", glow: "#00d4ff" },
  { slug: "astral-raven", category: "Mythic & Dragons", glow: "#9b5de5" },
  { slug: "stormfang-wolf", category: "Mythic & Dragons", glow: "#38bdf8" },
  { slug: "fox-spirit", category: "Mythic & Dragons", glow: "#fb7185" },
  { slug: "sakura-fox", category: "Mythic & Dragons", glow: "#f472b6" },
  { slug: "volt-fox", category: "Mythic & Dragons", glow: "#facc15" },
  { slug: "ember-koi", category: "Mythic & Dragons", glow: "#fb923c" },
  { slug: "demon-orb", category: "Mythic & Dragons", glow: "#ef4444" },
  { slug: "ghostfire-skulls", category: "Mythic & Dragons", glow: "#2dd4bf" },
  { slug: "dark-wings", category: "Mythic & Dragons", glow: "#6366f1" },
  { slug: "spirit-wings", category: "Mythic & Dragons", glow: "#67e8f9" },
  { slug: "white-wings", category: "Mythic & Dragons", glow: "#e2e8f0" },
  { slug: "blade-wings", category: "Mythic & Dragons", glow: "#38bdf8" },

  { slug: "arcade-bunny", category: "Kawaii & Pastel", glow: "#f472b6" },
  { slug: "bunny-hearts", category: "Kawaii & Pastel", glow: "#fb7185" },
  { slug: "bubblegum-aura", category: "Kawaii & Pastel", glow: "#ec4899" },
  { slug: "candy-clouds", category: "Kawaii & Pastel", glow: "#f9a8d4" },
  { slug: "cat-ears", category: "Kawaii & Pastel", glow: "#c084fc" },
  { slug: "moonpaw-cat", category: "Kawaii & Pastel", glow: "#a78bfa" },
  { slug: "autumn-cat", category: "Kawaii & Pastel", glow: "#f59e0b" },
  { slug: "kawaii-stars", category: "Kawaii & Pastel", glow: "#fde047" },
  { slug: "floating-hearts", category: "Kawaii & Pastel", glow: "#fb7185" },
  { slug: "heart", category: "Kawaii & Pastel", glow: "#f43f5e" },
  { slug: "love-potion", category: "Kawaii & Pastel", glow: "#e879f9" },
  { slug: "pink-swirl", category: "Kawaii & Pastel", glow: "#f472b6" },

  { slug: "neon-headphones", category: "Cyber & Arcade", glow: "#22d3ee" },
  { slug: "neon-butterfly", category: "Cyber & Arcade", glow: "#e879f9" },
  { slug: "keyboard", category: "Cyber & Arcade", glow: "#38bdf8" },
  { slug: "pixel-quest", category: "Cyber & Arcade", glow: "#4ade80" },
  { slug: "storm-portal", category: "Cyber & Arcade", glow: "#818cf8" },
  { slug: "venom", category: "Cyber & Arcade", glow: "#22c55e" },
  { slug: "blaze-crystal", category: "Cyber & Arcade", glow: "#f97316" },
  { slug: "blur-orange", category: "Cyber & Arcade", glow: "#fb923c" },

  { slug: "cloudwing-halo", category: "Celestial & Royal", glow: "#7dd3fc" },
  { slug: "golden-halo", category: "Celestial & Royal", glow: "#facc15" },
  { slug: "angel", category: "Celestial & Royal", glow: "#fef08a" },
  { slug: "honeybee-royale", category: "Celestial & Royal", glow: "#fbbf24" },
  { slug: "amber-crescent", category: "Celestial & Royal", glow: "#f59e0b" },
  { slug: "crescent-clouds", category: "Celestial & Royal", glow: "#93c5fd" },
  { slug: "cotton-nebula", category: "Celestial & Royal", glow: "#c084fc" },
  { slug: "dream-clouds", category: "Celestial & Royal", glow: "#a5b4fc" },
  { slug: "eclipse-ring", category: "Celestial & Royal", glow: "#fb923c" },
  { slug: "silver-rings", category: "Celestial & Royal", glow: "#cbd5e1" },
  { slug: "star-orbs", category: "Celestial & Royal", glow: "#fcd34d" },
  { slug: "husky-stars", category: "Celestial & Royal", glow: "#60a5fa" },
  { slug: "capricorn-ice", category: "Celestial & Royal", glow: "#38bdf8" },
  { slug: "virgo-wreath", category: "Celestial & Royal", glow: "#86efac" },

  { slug: "cozy-pond-frog", category: "Nature & Cozy", glow: "#4ade80" },
  { slug: "tidepool-otter", category: "Nature & Cozy", glow: "#2dd4bf" },
  { slug: "cozy-camp", category: "Nature & Cozy", glow: "#fb923c" },
  { slug: "branches", category: "Nature & Cozy", glow: "#84cc16" },
  { slug: "butterfly", category: "Nature & Cozy", glow: "#c084fc" },
  { slug: "leo-sunflower", category: "Nature & Cozy", glow: "#eab308" },
  { slug: "moonlit-roses", category: "Nature & Cozy", glow: "#fb7185" },
  { slug: "violet-bloom", category: "Nature & Cozy", glow: "#a855f7" },
  { slug: "prism-dolphins", category: "Nature & Cozy", glow: "#22d3ee" },
  { slug: "starfin-whales", category: "Nature & Cozy", glow: "#38bdf8" },
  { slug: "rainbow-dove", category: "Nature & Cozy", glow: "#34d399" },
  { slug: "snow-globe", category: "Nature & Cozy", glow: "#bae6fd" },
  { slug: "straw-hat", category: "Nature & Cozy", glow: "#facc15" },

  { slug: "fire", category: "Action & Elemental", glow: "#ef4444" },
  { slug: "fire-horns", category: "Action & Elemental", glow: "#f97316" },
  { slug: "fire-ice", category: "Action & Elemental", glow: "#38bdf8" },
  { slug: "drop", category: "Action & Elemental", glow: "#0ea5e9" },
  { slug: "storm-rock", category: "Action & Elemental", glow: "#6366f1" },
  { slug: "punch", category: "Action & Elemental", glow: "#ef4444" },
  { slug: "football", category: "Action & Elemental", glow: "#22c55e" },
];

export const AVATAR_FRAMES: AvatarFrameItem[] = RAW_FRAME_META.map((item) => ({
  slug: item.slug,
  name: titleizeSlug(item.slug),
  category: item.category,
  url: `/assets/frames/${item.slug}.png`,
  glow: item.glow,
  hasSignatureFx: SIGNATURE_FRAMES.has(item.slug),
  free: true,
}));

export const NAME_ANIMATIONS = [
  "aurora",
  "rainbow",
  "shimmer",
  "glitch",
  "wave",
  "heartbeat",
  "bounce",
  "float",
  "glow",
  "twinkle",
  "flicker",
  "jelly",
  "pulse",
  "rise",
  "spin",
  "stamp",
  "swing",
  "typewriter",
  "wiggle",
  "flip",
] as const;

export const GIFT_CATALOG: GiftAssetItem[] = [
  { id: "rose", name: "Rose", coins: 1, icon: "/assets/gifts/rose.png", accent: "#fb7185" },
  {
    id: "finger-heart",
    name: "Finger Heart",
    coins: 5,
    icon: "/assets/gifts/finger-heart.png",
    accent: "#f472b6",
  },
  { id: "tiktok", name: "TikTok", coins: 10, icon: "/assets/gifts/tiktok.png", accent: "#22d3ee" },
  { id: "lion", name: "Lion", coins: 29999, icon: "/assets/gifts/lion.png", accent: "#f59e0b" },
  {
    id: "universe",
    name: "TikTok Universe",
    coins: 44999,
    icon: "/assets/gifts/universe.png",
    accent: "#a855f7",
  },
];

export const SHOWCASE_ARTWORKS: ShowcaseArtworkItem[] = [
  {
    id: "board-high-rollers",
    title: "High Rollers",
    subtitle: "Hand of five royal cards top gifters leaderboard",
    category: "leaderboard",
    url: "/assets/marketing/widgets/board-high-rollers.webp",
    width: 1100,
    height: 582,
  },
  {
    id: "board-ember-dragon",
    title: "Ember Dragon Podium",
    subtitle: "Spotlight Top-3 Podium with ornate dragon avatar frames",
    category: "leaderboard",
    url: "/assets/marketing/widgets/board-ember-dragon.webp",
    width: 1100,
    height: 557,
  },
  {
    id: "board-voltage",
    title: "Voltage Neon",
    subtitle: "Electric cyber rows ranked live by coins",
    category: "leaderboard",
    url: "/assets/marketing/widgets/board-voltage.webp",
    width: 1043,
    height: 1016,
  },
  {
    id: "board-metro-line",
    title: "Metro Line",
    subtitle: "Clean broadcast leaderboard for vertical scenes",
    category: "leaderboard",
    url: "/assets/marketing/widgets/board-metro-line.webp",
    width: 1100,
    height: 745,
  },
  {
    id: "board-moonlit-clouds",
    title: "Moonlit Clouds Podium",
    subtitle: "Silver celestial cloud frames for top 3 gifters",
    category: "leaderboard",
    url: "/assets/marketing/widgets/board-moonlit-clouds.webp",
    width: 1100,
    height: 627,
  },
  {
    id: "goal-little-ghost",
    title: "Little Ghost Vessel",
    subtitle: "Painted ghost vessel that fills as coins arrive",
    category: "goal",
    url: "/assets/marketing/widgets/goal-little-ghost.webp",
    width: 723,
    height: 931,
  },
  {
    id: "goal-liquid-heart",
    title: "Liquid Heart",
    subtitle: "Glowing liquid heart goal for likes & followers",
    category: "goal",
    url: "/assets/marketing/widgets/goal-liquid-heart.webp",
    width: 733,
    height: 889,
  },
  {
    id: "goal-froggy-drink",
    title: "Froggy Drink",
    subtitle: "Kawaii boba frog cup follower goal",
    category: "goal",
    url: "/assets/marketing/widgets/goal-froggy-drink.webp",
    width: 656,
    height: 943,
  },
  {
    id: "goal-coins",
    title: "Gold Crystal",
    subtitle: "Radiant crystal coin milestone vessel",
    category: "goal",
    url: "/assets/marketing/widgets/goal-coins.webp",
    width: 800,
    height: 897,
  },
  {
    id: "goal-heart",
    title: "Supporter Heart Jar",
    subtitle: "Glass heart jar filled with supporter avatars",
    category: "goal",
    url: "/assets/marketing/widgets/goal-heart.webp",
    width: 628,
    height: 1023,
  },
  {
    id: "plate-night-owl",
    title: "Night Owl Supporter Plate",
    subtitle: "Signature coordinated supporter nameplate banner",
    category: "plate",
    url: "/assets/marketing/widgets/plate-night-owl.webp",
    width: 1100,
    height: 313,
  },
];

export const CHAT_THEMES = [
  { id: "dynamic-island", name: "Dynamic Island", badge: "Popular" },
  { id: "glass", name: "Frosted Glass", badge: "Clean" },
  { id: "cyber-neon", name: "Cyber Neon", badge: "Gaming" },
  { id: "roblox", name: "Roblox Blocks", badge: "Fun" },
  { id: "gaming-hud", name: "Gaming HUD", badge: "Pro" },
  { id: "neo-dark", name: "Neo Obsidian", badge: "Minimal" },
  { id: "kawaii-pop", name: "Kawaii Pastel", badge: "Cute" },
  { id: "ember-gold", name: "Ember Dragon", badge: "Mythic" },
  { id: "royal-velvet", name: "Royal Velvet", badge: "VIP" },
  { id: "matrix-pulse", name: "Matrix Terminal", badge: "Tech" },
  { id: "bubble-tea", name: "Bubble Capsule", badge: "Cozy" },
  { id: "broadcast-lower", name: "Broadcast Strip", badge: "Studio" },
  { id: "sakura-breeze", name: "Sakura Breeze", badge: "Soft" },
  { id: "arctic-ice", name: "Arctic Ice", badge: "Crisp" },
  { id: "vaporwave", name: "Sunset Synth", badge: "Retro" },
  { id: "comic-pop", name: "Manga Speech", badge: "Bold" },
  { id: "esports-pro", name: "Esports Pro", badge: "Sharp" },
  { id: "transparent-clean", name: "Pure Stream Text", badge: "Light" },
];

export const SCREEN_EFFECTS = [
  { id: "confetti", name: "Confetti Cannon", emoji: "🎊", color: "#38bdf8" },
  { id: "fireworks", name: "Neon Fireworks", emoji: "🎆", color: "#f472b6" },
  { id: "hearts", name: "Rising Hearts", emoji: "💖", color: "#fb7185" },
  { id: "money-rain", name: "Money & Coin Rain", emoji: "💸", color: "#4ade80" },
  { id: "snow", name: "Winter Snowfall", emoji: "❄️", color: "#bae6fd" },
  { id: "avatar-bubbles", name: "Viewer Avatar Bubbles", emoji: "🫧", color: "#22d3ee" },
  { id: "dragon-embers", name: "Ember Dragon Sparks", emoji: "🔥", color: "#fb923c" },
  { id: "star-shower", name: "Golden Star Shower", emoji: "✨", color: "#facc15" },
  { id: "sakura-petals", name: "Sakura Petal Drift", emoji: "🌸", color: "#f9a8d4" },
  { id: "lightning", name: "Storm Lightning", emoji: "⚡", color: "#818cf8" },
  { id: "crown-drop", name: "Royal Crown Rain", emoji: "👑", color: "#fbbf24" },
  { id: "rose-storm", name: "TikTok Rose Storm", emoji: "🌹", color: "#f43f5e" },
  { id: "laser-rave", name: "Cyber Laser Beams", emoji: "🪩", color: "#c084fc" },
  { id: "frost-freeze", name: "Battle Freeze Crystal", emoji: "🧊", color: "#67e8f9" },
  { id: "gg-hype", name: "GG Hype Stampede", emoji: "🎮", color: "#34d399" },
];

export const QUIZ_CARD_THEMES = [
  { id: "cyber-cyan", name: "Cyber Cyan", bg: "from-sky-950/95 via-slate-900/95 to-cyan-950/95", accent: "#22d3ee" },
  { id: "ember-dragon", name: "Ember Dragon", bg: "from-amber-950/95 via-stone-950/95 to-orange-950/95", accent: "#fb923c" },
  { id: "glass-capsule", name: "Frosted Glass", bg: "from-slate-900/80 via-slate-800/80 to-slate-900/80", accent: "#38bdf8" },
  { id: "royal-gold", name: "Gold Royale", bg: "from-yellow-950/95 via-neutral-950/95 to-amber-900/95", accent: "#facc15" },
  { id: "kawaii-pink", name: "Kawaii Cloud", bg: "from-pink-950/95 via-purple-950/95 to-rose-950/95", accent: "#f472b6" },
  { id: "arcade-pixel", name: "Arcade Pixel", bg: "from-indigo-950/95 via-violet-950/95 to-fuchsia-950/95", accent: "#a78bfa" },
  { id: "emerald-arena", name: "Emerald Arena", bg: "from-emerald-950/95 via-slate-950/95 to-teal-950/95", accent: "#34d399" },
  { id: "minimal-obsidian", name: "Minimal Obsidian", bg: "from-zinc-950/95 via-neutral-900/95 to-zinc-950/95", accent: "#f8fafc" },
];

export const DEFAULT_QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: "q1",
    question: "Which planet in our solar system has the most moons?",
    options: ["Jupiter", "Saturn", "Uranus", "Neptune"],
    correctIndex: 1,
    category: "Science",
  },
  {
    id: "q2",
    question: "In gaming, what does 'FPS' stand for?",
    options: ["Fast Pixel Sync", "First-Person Shooter", "Full Power Mode", "Final Player Score"],
    correctIndex: 1,
    category: "Gaming",
  },
  {
    id: "q3",
    question: "Which TikTok LIVE gift is famous for roaring across the whole screen?",
    options: ["Rose", "Finger Heart", "Lion", "Ice Cream"],
    correctIndex: 2,
    category: "TikTok LIVE",
  },
  {
    id: "q4",
    question: "What resolution is standard 9:16 vertical HD in TikTok LIVE Studio?",
    options: ["1920 × 1080", "1080 × 1920", "1280 × 720", "1080 × 1080"],
    correctIndex: 1,
    category: "Streaming",
  },
  {
    id: "q5",
    question: "Which ocean is the deepest on Earth?",
    options: ["Atlantic Ocean", "Indian Ocean", "Pacific Ocean", "Arctic Ocean"],
    correctIndex: 2,
    category: "Trivia",
  },
];

export const FREE_GAMES_CATALOG: FreeGameDefinition[] = [
  {
    slug: "news-ticker",
    title: "News Ticker",
    subtitle: "Endless scrolling strip with your own messages in 8 designs — Breaking, Glass, Neon, Gold, Gradient, LED, Paper and Cyber.",
    category: "news",
    badge: "FREE · NEW",
    isFree: true,
    triggerLabel: "Your messages",
    accentFrom: "#ef4444",
    accentTo: "#22d3ee",
    keySvg: "/assets/announcements/keys/application.svg",
    howToPlay: "Write your messages, pick a design, press Start and add the link to your scene.",
  },
  {
    slug: "stream-timer",
    title: "Stream Timer",
    subtitle: "LIVE uptime, a countdown viewers extend with gifts, follows and likes, or a clock — Neon, LCD, Flip, Capsule, Minimal or Analog.",
    category: "news",
    badge: "FREE · NEW",
    isFree: true,
    triggerLabel: "Gifts · Follows · Likes",
    accentFrom: "#22d3ee",
    accentTo: "#6366f1",
    keySvg: "/assets/announcements/keys/live.svg",
    howToPlay: "Choose uptime, countdown or clock, press Start timer, and viewers can add time in countdown mode.",
  },
  {
    slug: "breaking-news",
    title: "Breaking News",
    subtitle: "A TV-style news bar that turns gifts, follows, likes, joins and comments into live breaking headlines with a scrolling ticker and clock.",
    category: "news",
    badge: "FREE · NEW",
    isFree: true,
    triggerLabel: "Every LIVE event",
    accentFrom: "#dc2626",
    accentTo: "#f97316",
    keySvg: "/assets/announcements/keys/live.svg",
    howToPlay: "Start it, add the link at the bottom of your scene, and every gift, follow, like, join or comment becomes a breaking headline.",
  },
  {
    slug: "live-quiz",
    title: "Live Trivia Quiz (8 Designs)",
    subtitle: "Chat types A, B, C or D to answer live with instant leaderboard & winner reveal.",
    category: "quiz",
    badge: "FREE · 8 THEMES",
    isFree: true,
    triggerLabel: "Chat A / B / C / D",
    accentFrom: "#0ea5e9",
    accentTo: "#22d3ee",
    keySvg: "/assets/announcements/keys/quiz.svg",
    howToPlay: "Start a round, let viewers vote A/B/C/D in chat, then click Reveal Answer to crown fast responders!",
  },
  {
    slug: "coin-battle",
    title: "Timed Coin Battle",
    subtitle: "High-energy timed gifter battle with freeze power-ups and podium crown ceremony.",
    category: "battle",
    badge: "FREE · POPULAR",
    isFree: true,
    triggerLabel: "Any Gift Coins",
    accentFrom: "#f59e0b",
    accentTo: "#ef4444",
    keySvg: "/assets/announcements/keys/games.svg",
    howToPlay: "Start a 90s battle timer — every Rose, Finger Heart or Lion moves the live coin battle bars!",
  },
  {
    slug: "team-battle",
    title: "Team Tug-of-War Battle",
    subtitle: "Red Ember Dragons vs Cyan Cyber Wolves — chat comments, likes & gifts push the bar!",
    category: "battle",
    badge: "FREE · TEAMS",
    isFree: true,
    triggerLabel: "!red / !blue + Gifts",
    accentFrom: "#fb7185",
    accentTo: "#38bdf8",
    keySvg: "/assets/announcements/keys/audience.svg",
    howToPlay: "Viewers type !red or !blue or send team gifts to push the glowing tug-of-war beam to 100%!",
  },
  {
    slug: "lucky-wheel",
    title: "Lucky Prize Wheel",
    subtitle: "Physics-animated spin wheel triggered by gifts, follows, or 1-click streamer spin.",
    category: "wheel",
    badge: "FREE · ARCADE",
    isFree: true,
    triggerLabel: "Gift or Manual Spin",
    accentFrom: "#a855f7",
    accentTo: "#ec4899",
    keySvg: "/assets/announcements/keys/effects.svg",
    howToPlay: "Customize up to 8 wheel slices and spin live on stream with confetti winner callouts!",
  },
  {
    slug: "avatar-race",
    title: "Framed Avatar Derby Race",
    subtitle: "Viewers join with their TikTok avatar + ornate frame and sprint to the neon finish line!",
    category: "race",
    badge: "FREE · MULTIPLAYER",
    isFree: true,
    triggerLabel: "!join + Likes Boost",
    accentFrom: "#10b981",
    accentTo: "#06b6d4",
    keySvg: "/assets/announcements/keys/followers.svg",
    howToPlay: "Racers line up in ornate avatar frames — likes & gifts give turbo boosts down the track!",
  },
  {
    slug: "word-scramble",
    title: "Live Word Scramble",
    subtitle: "Unscramble the hidden word in chat before the clock hits zero to claim points!",
    category: "word",
    badge: "FREE · CHAT GAME",
    isFree: true,
    triggerLabel: "Chat Guess",
    accentFrom: "#6366f1",
    accentTo: "#22d3ee",
    keySvg: "/assets/announcements/keys/quiz.svg",
    howToPlay: "Letters shuffle on screen; progressive hints unlock until a viewer types the exact word!",
  },
  {
    slug: "boss-raid",
    title: "Ember Dragon Boss Raid",
    subtitle: "Co-op stream raid! Likes deal 10 DMG and Gifts unleash critical strikes on the Boss.",
    category: "arcade",
    badge: "FREE · CO-OP RAID",
    isFree: true,
    triggerLabel: "Likes & Gifts = DMG",
    accentFrom: "#f97316",
    accentTo: "#dc2626",
    keySvg: "/assets/announcements/keys/games.svg",
    howToPlay: "Your whole chat teams up to deplete the Boss HP bar before enrage — MVP slayer wins the crown!",
  },
  {
    slug: "mit-halay-party",
    title: "Halay Dance Party",
    subtitle: "A live group dance with animated steps, a changing beat and a viewer-led spotlight.",
    category: "arcade",
    badge: "MIT · DANCE",
    isFree: true,
    triggerLabel: "Join · Chat · Gifts",
    accentFrom: "#ec4899",
    accentTo: "#8b5cf6",
    keySvg: "/assets/announcements/keys/games.svg",
    howToPlay: "Viewers join with !dance; !jump, !spin and gifts change their dance move and raise the party energy.",
  },
  {
    slug: "mit-avatar-arena",
    title: "Avatar Arena Battle",
    subtitle: "Viewers enter a live arena, grow through likes, comments and gifts, and compete to become the champion.",
    category: "battle",
    badge: "MIT · BATTLE",
    isFree: true,
    triggerLabel: "Join · Likes · Chat · Gifts",
    accentFrom: "#f97316",
    accentTo: "#22d3ee",
    keySvg: "/assets/announcements/keys/audience.svg",
    howToPlay: "A viewer enters with !join or their first interaction; likes and comments grow their avatar, while gifts give a bigger boost.",
  },
  {
    slug: "neon-dance-floor",
    title: "3D Neon Avatar Dance Party",
    subtitle: "Every active chatter & gifter spawns on a pulsing club floor with framed avatars & emotes!",
    category: "arcade",
    badge: "FREE · 3D PARTY",
    isFree: true,
    triggerLabel: "Join, Chat & Dance",
    accentFrom: "#ec4899",
    accentTo: "#8b5cf6",
    keySvg: "/assets/announcements/keys/music.svg",
    howToPlay: "Viewers appear automatically with their VIP frames, speech bubbles and dance bounce animations!",
  },
  {
    slug: "gift-plinko",
    title: "Neon Avatar Plinko Drop",
    subtitle: "Drop viewer avatar pucks through glowing pegs into 1x, 2x, 5x & 10x JACKPOT slots!",
    category: "arcade",
    badge: "FREE · PHYSICS",
    isFree: true,
    triggerLabel: "Rose / Drop Puck",
    accentFrom: "#eab308",
    accentTo: "#22c55e",
    keySvg: "/assets/announcements/keys/effects.svg",
    howToPlay: "Each gift drops the sender's framed avatar puck bouncing down the pegboard into prize buckets!",
  },
  {
    slug: "emoji-royale",
    title: "Flag & Emoji Battle Royale",
    subtitle: "Bouncing arena showdown where viewer avatars collide until 1 Last Champion survives!",
    category: "battle",
    badge: "FREE · ROYALE",
    isFree: true,
    triggerLabel: "!play in Chat",
    accentFrom: "#f43f5e",
    accentTo: "#fb923c",
    keySvg: "/assets/announcements/keys/live.svg",
    howToPlay: "Launch an arena wave — framed avatars clash with knockback sparks until one winner stands!",
  },
  {
    slug: "chat-tic-tac-toe",
    title: "Streamer vs Chat Tic-Tac-Toe",
    subtitle: "Play X against your LIVE chat voting A1–C3 in real time on a glowing neon grid.",
    category: "word",
    badge: "FREE · STRATEGY",
    isFree: true,
    triggerLabel: "Chat A1–C3",
    accentFrom: "#38bdf8",
    accentTo: "#818cf8",
    keySvg: "/assets/announcements/keys/application.svg",
    howToPlay: "Click any cell for Streamer (X) or let Chat vote/simulate their counter-move (O)!",
  },
  {
    slug: "hot-potato",
    title: "Ticking Neon Bomb Pass",
    subtitle: "Pass the ticking cyber-bomb in chat with !pass or a Rose before the fuse runs out!",
    category: "arcade",
    badge: "FREE · FAST PACE",
    isFree: true,
    triggerLabel: "!pass or Rose",
    accentFrom: "#ef4444",
    accentTo: "#facc15",
    keySvg: "/assets/announcements/keys/games.svg",
    howToPlay: "Start the 15s fuse — viewers frantic-pass the bomb until BOOM, crowning the survivors!",
  },
];

export interface SidebarNavItem {
  id: string;
  label: string;
  group: "core" | "overlays" | "interactive" | "studio";
  hot?: boolean;
  badge?: string;
}

export const SIDEBAR_NAV_ITEMS: SidebarNavItem[] = [
  { id: "overview", label: "Dashboard", group: "core" },
  { id: "live-room", label: "Live Room", group: "core", hot: true },
  { id: "performance", label: "Performance", group: "core" },
  { id: "viewers", label: "Live Viewers", group: "core" },

  { id: "top-lists", label: "Top Lists", group: "overlays", hot: true },
  { id: "goals", label: "Goals", group: "overlays" },
  { id: "gift-alerts", label: "Gift Alerts", group: "overlays", hot: true },
  { id: "follow-join", label: "Follow & Join Alerts", group: "overlays" },
  { id: "event-feed", label: "Latest Events", group: "overlays" },
  { id: "chat-box", label: "Chat Box", group: "overlays", hot: true },
  { id: "scenes", label: "Link Scenes", group: "overlays", hot: true, badge: "OBS + Studio" },

  { id: "avatars", label: "Avatars & 68 Frames", group: "interactive", hot: true, badge: "68" },
  { id: "gift-videos", label: "Gift Videos", group: "interactive", hot: true },
  { id: "games", label: "Live Overlays", group: "interactive", hot: true, badge: "15 FREE" },
  { id: "effects", label: "Effects & Rising Hearts", group: "interactive" },
  { id: "flag-hearts", label: "Flag Hearts", group: "interactive", badge: "NEW" },
  { id: "tts-sound", label: "TTS & Sound Alerts", group: "interactive" },

  { id: "social", label: "Social Media", group: "studio", badge: "NEW" },
  { id: "branding", label: "Branding", group: "studio" },
  { id: "notes", label: "Stream Notes", group: "studio", badge: "NEW" },
  { id: "backgrounds", label: "Background Library", group: "studio", badge: "NEW" },
  { id: "quran", label: "Quran Recitation", group: "studio", badge: "NEW" },
  { id: "display", label: "9:16 & 16:9 Display", group: "studio", badge: "NEW" },
  { id: "studio-setup", label: "TikTok Studio & OBS", group: "studio", badge: "Guide" },
  { id: "settings", label: "Settings", group: "studio" },
];

export function getAvatarByUsername(username: string): string {
  let hash = 0;
  const clean = username || "viewer";
  for (let i = 0; i < clean.length; i++) {
    hash = ((hash * 31 + clean.charCodeAt(i)) >>> 0);
  }
  return `/avatars/a${(hash % 17) + 1}.png`;
}

export function getFrameBySlug(slug?: string | null): AvatarFrameItem {
  return AVATAR_FRAMES.find((f) => f.slug === slug) ?? AVATAR_FRAMES[0];
}
