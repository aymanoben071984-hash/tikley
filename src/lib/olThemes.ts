/**
 * OverlayLive Top Lists themes — the real HTML/CSS/JS board themes served from
 * /themes/top-lists/<id>/ (template.html + style.css + renderer.js).
 */

export type ThemeGroup = "Painted boards" | "Classic boards" | "Flags" | "PUBG Mobile";

export interface OlTheme {
  id: string; // "theme-<key>"
  key: string; // design key used by OverlayLive
  label: string;
  group: ThemeGroup;
  base: string; // folder under /themes/top-lists
  country?: string;
  maxRows: number;
  width: number;
}

const LABELS: Record<string, string> = {
  "cyber-blade": "Voltage",
  classic: "Classic",
  basic: "Basic",
  "basic-scroll": "Basic Scroll",
  "neon-shards": "Prism",
  taif: "Lumen",
  "top-rankers": "Top Rankers",
  music: "Music",
  lighting: "Stage Lights",
  "high-rollers": "High Rollers",
  "metro-line": "Metro Line",
  "moonlit-clouds": "Moonlit Clouds",
  "flame-ribbons": "Sacred Flames",
  "champagne-gold": "Champagne Gold",
  "crystal-comet": "Crystal Comet",
  "auria-crystal": "Auria Crystal",
  "celestial-elements": "Celestial",
  "cosmic-arcade": "Cosmic Arcade",
  "rose-clouds": "Rose Clouds",
  "blackfire-dragon": "Blackfire Dragon",
  "stormforge-wolf-guardian": "Stormforge Wolf Guardian",
  "ivory-sky-dynasty": "Ivory Sky Dynasty",
  "solar-phoenix-reliquary": "Solar Phoenix Reliquary",
  "crimson-tempest-corsair": "Crimson Tempest Corsair",
  "verdant-seraph-emerald-doe": "Verdant Seraph Emerald Doe",
  "shadowmoon-guardian": "Shadowmoon Guardian",
  "rosemoon-cat-sanctuary": "Rosemoon Cat Sanctuary",
  "thunderclaw-lion-sovereign": "Thunderclaw Lion Sovereign",
  "neon-ronin-tiger": "Neon Ronin Tiger",
  "clockwork-raven": "Clockwork Raven",
  "emberforge-scorpion": "Emberforge Scorpion",
  "candy-cloud-cat": "Candy Cloud Cat",
};

/** Max rows per design (OverlayLive values). */
const MAX_ROWS: Record<string, number> = {
  "cyber-blade": 10, classic: 20, basic: 20, "basic-scroll": 20, "neon-shards": 10, taif: 10, "top-rankers": 5, music: 5, lighting: 5,
  "high-rollers": 5, "metro-line": 10, "moonlit-clouds": 5, "flame-ribbons": 5, "crystal-comet": 5, "champagne-gold": 5, "auria-crystal": 5,
  "celestial-elements": 5, "cosmic-arcade": 5, "rose-clouds": 10, "blackfire-dragon": 10, "stormforge-wolf-guardian": 5, "ivory-sky-dynasty": 5,
  "solar-phoenix-reliquary": 5, "crimson-tempest-corsair": 5, "verdant-seraph-emerald-doe": 5, "shadowmoon-guardian": 5, "rosemoon-cat-sanctuary": 5,
  "thunderclaw-lion-sovereign": 5, "neon-ronin-tiger": 5, "clockwork-raven": 5, "emberforge-scorpion": 5, "candy-cloud-cat": 5,
};

/** Natural width of each design (OverlayLive values). */
const WIDTHS: Record<string, number> = {
  classic: 720, "cyber-blade": 560, basic: 560, "basic-scroll": 560, "neon-shards": 480, "high-rollers": 900, "metro-line": 520, taif: 430,
  "auria-crystal": 760, "celestial-elements": 760, "cosmic-arcade": 760, "rose-clouds": 470, "blackfire-dragon": 470,
};

/** Painted podium designs (crown + frame art). */
export const PAINTED = new Set([
  "moonlit-clouds", "flame-ribbons", "champagne-gold", "crystal-comet", "stormforge-wolf-guardian", "ivory-sky-dynasty", "solar-phoenix-reliquary",
  "crimson-tempest-corsair", "verdant-seraph-emerald-doe", "shadowmoon-guardian", "rosemoon-cat-sanctuary", "thunderclaw-lion-sovereign",
  "neon-ronin-tiger", "clockwork-raven", "emberforge-scorpion", "candy-cloud-cat",
]);
export const STAGE_PODIUMS = new Set(["high-rollers", "lighting", "music", "top-rankers"]);

const CLASSIC_ORDER = ["cyber-blade", "metro-line", "classic", "basic", "basic-scroll", "neon-shards", "taif", "top-rankers", "music", "lighting", "high-rollers"];
const PAINTED_ORDER = ["auria-crystal", "celestial-elements", "cosmic-arcade", "rose-clouds", "blackfire-dragon", ...PAINTED];

const COUNTRIES: Record<string, string[]> = {
  mena: ["palestine", "saudi", "syria", "morocco", "kurdistan", "egypt", "iraq", "jordan", "lebanon", "uae", "kuwait", "qatar", "bahrain", "oman", "yemen", "libya", "tunisia", "algeria", "sudan", "turkey"],
  europe: ["spain", "france", "germany", "italy", "uk", "portugal", "netherlands", "poland", "sweden", "greece", "ukraine", "albania"],
  latam: ["brazil", "argentina", "mexico", "colombia", "chile", "peru", "venezuela", "ecuador", "uruguay", "cuba"],
};
const COUNTRY_LABEL: Record<string, string> = { uk: "UK", uae: "UAE" };

const PUBG = [
  { key: "pubg-m416-joker", dir: "M416Joker", label: "M416 Joker" },
  { key: "pubg-m416-ice", dir: "M416Ice", label: "M416 Glacier" },
  { key: "battleground-airdrop-commander", dir: "Airdrop", label: "Battleground Airdrop Commander" },
  { key: "specter-night-strike", dir: "Ghost", label: "Specter Night Strike" },
  { key: "neon-heist-king", dir: "Gta", label: "Neon Heist King" },
  { key: "straw-hat-sun-voyager", dir: "StrawHat", label: "Straw Hat Sun Voyager" },
  { key: "skyfall-storm-royale", dir: "Skyfall", label: "Skyfall Storm Royale" },
  { key: "global-strike-ops", dir: "GlobalStrike", label: "Global Strike Ops" },
  { key: "blockcraft-ender-realm", dir: "Blockcraft", label: "Blockcraft Ender Realm" },
  { key: "radiant-tactical", dir: "Radiant", label: "Radiant Tactical" },
];

const cap = (s: string) => COUNTRY_LABEL[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

export const OL_THEMES: OlTheme[] = [
  ...PAINTED_ORDER.map((k) => ({ id: `theme-${k}`, key: k, label: LABELS[k] ?? k, group: "Painted boards" as const, base: k, maxRows: MAX_ROWS[k] ?? 10, width: WIDTHS[k] ?? 840 })),
  ...CLASSIC_ORDER.map((k) => ({ id: `theme-${k}`, key: k, label: LABELS[k] ?? k, group: "Classic boards" as const, base: k, maxRows: MAX_ROWS[k] ?? 10, width: WIDTHS[k] ?? 1000 })),
  ...Object.values(COUNTRIES)
    .flat()
    .map((c) => ({ id: `theme-flags-${c}`, key: `flags-${c}`, label: `Flag — ${cap(c)}`, group: "Flags" as const, base: "flags", country: c, maxRows: 7, width: 620 })),
  ...PUBG.map((p) => ({ id: `theme-${p.key}`, key: p.key, label: p.label, group: "PUBG Mobile" as const, base: `pubgMobile/${p.dir}`, maxRows: p.dir.startsWith("M416") ? 5 : 10, width: 820 })),
];

export const OL_THEME_GROUPS: ThemeGroup[] = ["Painted boards", "Classic boards", "Flags", "PUBG Mobile"];
const BY_ID = new Map(OL_THEMES.map((t) => [t.id, t]));
export const olTheme = (id: string) => BY_ID.get(id);
export const isOlTheme = (id: string) => BY_ID.has(id);

/* ── colour helpers + accent overrides (port of OverlayLive's override CSS) ── */
function rgbOf(hex: string): [number, number, number] {
  let t = hex.replace("#", "").trim();
  if (t.length === 3) t = t.split("").map((c) => c + c).join("");
  const n = parseInt(t.slice(0, 6), 16);
  return Number.isFinite(n) ? [(n >> 16) & 255, (n >> 8) & 255, n & 255] : [255, 45, 120];
}
const DARK: [number, number, number] = [10, 11, 18];
const WHITE: [number, number, number] = [255, 255, 255];
function mix(hex: string, to: [number, number, number], k: number) {
  const [r, g, b] = rgbOf(hex);
  const f = (a: number, t: number) => Math.round(a + (t - a) * k);
  return `rgb(${f(r, to[0])}, ${f(g, to[1])}, ${f(b, to[2])})`;
}

export function accentOverrideCss(key: string, color: string): string {
  const [r, g, b] = rgbOf(color);
  const glow = `rgba(${r}, ${g}, ${b}, 0.6)`;
  const dark = mix(color, DARK, 0.4);
  const light = mix(color, WHITE, 0.4);
  if (STAGE_PODIUMS.has(key)) {
    const lum = (v: number) => {
      const t = v / 255;
      return t <= 0.03928 ? t / 12.92 : Math.pow((t + 0.055) / 1.055, 2.4);
    };
    const isDark = 0.2126 * lum(r) + 0.7152 * lum(g) + 0.0722 * lum(b) < 0.4;
    return `.rank-1,.rank-2,.rank-3,.rank-4,.rank-5{--rank-color:${color}!important;--avatar-ring-solid:${color}!important;}.rank-badge{color:${isDark ? "#ffffff" : "#000000"}!important;border-color:${isDark ? "rgba(255,255,255,0.55)" : "#1a1a1a"}!important;}`;
  }
  if (key === "metro-line") return `.wrapper,.rank-bar{--line-color:${color}!important;--rank-color:${color}!important;}`;
  if (key === "neon-shards") return `.ns-row[data-rank]{--rc:${color}!important;--rc2:${light}!important;--rg:${glow}!important;}`;
  if (key === "classic")
    return `.rank-bar{background:linear-gradient(135deg, ${color}, ${dark})!important;border-color:${color}!important;box-shadow:0 4px 18px ${glow}, inset 0 0 26px ${glow}!important;}.rank-num{background:linear-gradient(45deg, ${color}, ${light})!important;color:#12131a!important;}.avatar{border-color:${color}!important;box-shadow:0 0 12px ${glow}!important;}`;
  if (key === "rose-clouds" || key === "blackfire-dragon")
    return `.bar-fill{background:linear-gradient(180deg, ${light}, ${color} 38%, ${dark})!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.28),inset 0 -1px 0 rgba(0,0,0,.35),0 0 14px ${glow}!important;}`;
  if (PAINTED.has(key))
    return `.wrapper{--plate-a:${mix(color, DARK, 0.45)}!important;--plate-b:${mix(color, DARK, 0.8)}!important;--plate-edge:${light}!important;--badge-a:${color}!important;--badge-b:${dark}!important;--name-glow:${glow}!important;--score-color:${light}!important;}`;
  return "";
}

const STACK_ORDER = [1, 2, 3, 4, 5].map((e) => `#theme-wrapper[data-orientation="stacked"] .rank-${e} { order: ${e}; }\n`).join("");
const R1 = '#theme-wrapper[data-orientation="stacked"] .rank-1';

/** Extra CSS for the vertical ("stacked") layout of podium themes. */
export function stackedCss(key: string): string {
  if (PAINTED.has(key)) {
    return `
#theme-wrapper[data-orientation="stacked"] .podium-container { flex-direction: column; align-items: center; justify-content: flex-start; width: 340px; gap: 64px; padding: 72px 10px 30px; }
#theme-wrapper[data-orientation="stacked"] .rank-unit { margin: 0; transform: translateY(var(--tr-y, 0px)); transform-origin: center; }
#theme-wrapper[data-orientation="stacked"] .rank-unit .avatar-container { width: 150px; height: 150px; }
${R1} .rank-badge { width: 34px; min-width: 34px; height: 34px; font-size: 17px; }
${R1} .player-name { font-size: 1.15rem; width: 170px; }
${R1} .score-value { font-size: 23px; }
${STACK_ORDER}`;
  }
  if (STAGE_PODIUMS.has(key)) {
    const gap = key === "lighting" ? 76 : 40;
    const extra: Record<string, string> = {
      music: `${R1} .player-name { width: 170px; font-size: 1.15rem; }`,
      "top-rankers": `${R1} .player-name { width: 170px; font-size: 1.15rem; }`,
      "high-rollers": `${R1} .avatar-wrapper { width: 118px; height: 118px; } ${R1} .player-name { font-size: 16px; } ${R1} .score-value { font-size: 19px; }`,
      lighting: `${R1} .avatar-wrapper { width: 100px; height: 100px; } ${R1} .stage-podium { width: 176px; height: 36px; } ${R1} .info-container { width: 156px; } ${R1} .player-name { font-size: 17px; } ${R1} .score-value { font-size: 22px; }`,
    };
    return `
#theme-wrapper[data-orientation="stacked"] { width: 340px; margin-inline: auto; }
#theme-wrapper[data-orientation="stacked"] .leaderboard-container { box-sizing: border-box; flex-direction: column; align-items: center; justify-content: flex-start; width: 340px; gap: ${gap}px; padding: 120px 10px 40px; }
#theme-wrapper[data-orientation="stacked"] .rank-unit { margin: 0; --tilt: 0deg; --lift: 0px; --rank-base-scale: 1; transform-origin: center; }
${STACK_ORDER}${extra[key] ?? ""}`;
  }
  return "";
}

export const supportsStacked = (key: string) => PAINTED.has(key) || STAGE_PODIUMS.has(key);

const FLAG_CODE: Record<string, string> = {
  palestine: "ps", saudi: "sa", syria: "sy", morocco: "ma", egypt: "eg", iraq: "iq", jordan: "jo", lebanon: "lb", uae: "ae", kuwait: "kw",
  qatar: "qa", bahrain: "bh", oman: "om", yemen: "ye", libya: "ly", tunisia: "tn", algeria: "dz", sudan: "sd", turkey: "tr", spain: "es",
  france: "fr", germany: "de", italy: "it", uk: "gb", portugal: "pt", netherlands: "nl", poland: "pl", sweden: "se", greece: "gr",
  ukraine: "ua", albania: "al", brazil: "br", argentina: "ar", mexico: "mx", colombia: "co", chile: "cl", peru: "pe", venezuela: "ve",
  ecuador: "ec", uruguay: "uy", cuba: "cu",
};
const ROW_ART = new Set(["auria-crystal", "celestial-elements", "cosmic-arcade"]);
const MARKETING: Record<string, string> = {
  "high-rollers": "/assets/marketing/widgets/board-high-rollers.webp",
  "metro-line": "/assets/marketing/widgets/board-metro-line.webp",
  "cyber-blade": "/assets/marketing/widgets/board-voltage.webp",
  "moonlit-clouds": "/assets/marketing/widgets/board-moonlit-clouds.webp",
};

/** A static picture for the design picker (no live render). */
export function themeThumb(t: OlTheme): string | null {
  if (t.country) return t.country === "kurdistan" ? "/assets/flags/kurdistan.svg" : FLAG_CODE[t.country] ? `/assets/flags/4x3/${FLAG_CODE[t.country]}.svg` : null;
  if (MARKETING[t.key]) return MARKETING[t.key];
  if (t.group === "PUBG Mobile") return `/themes/top-lists/${t.base}/crown.png`;
  if (ROW_ART.has(t.key)) return `/themes/top-lists/${t.base}/row1.png`;
  if (t.key === "lighting") return "/themes/top-lists/lighting/podium.webp";
  if (PAINTED.has(t.key) || t.key === "rose-clouds" || t.key === "blackfire-dragon") return `/themes/top-lists/${t.base}/crown.png`;
  return null;
}

/** Animated nameplate videos for Crown List plates (OverlayLive). */
export const NAMEPLATES: Array<{ id: string; label: string }> = [
  ["neon-skull", "Neon Skull"], ["shadow-wings", "Shadow Wings"], ["rose-butterfly", "Rose Butterfly"], ["kitty-blossom", "Kitty Blossom"],
  ["crimson-smoke", "Crimson Smoke"], ["pink-melody", "Pink Melody"], ["starfall", "Starfall"], ["wish-orb", "Wish Orb"], ["moonlit-night", "Moonlit Night"],
  ["nebula-streak", "Nebula Streak"], ["void-portal", "Void Portal"], ["golden-lanterns", "Golden Lanterns"], ["amber-hex", "Amber Hex"],
  ["shark-fin", "Shark Fin"], ["finger-heart", "Finger Heart"], ["love-sign", "Love Sign"], ["aurora-veil", "Aurora Veil"],
  ["haunted-souls", "Haunted Souls"], ["crimson-wraith", "Crimson Wraith"], ["glowing-hearts", "Glowing Hearts"], ["green-alien", "Green Alien"],
].map(([id, label]) => ({ id, label }));
export const nameplateUrl = (id: string) => (NAMEPLATES.some((n) => n.id === id) ? `/assets/nameplates/${id}.webm` : "");

/** Crown pictures for the #1 spot (OverlayLive). */
export const CROWNS: Array<{ id: string; label: string; file: string }> = [
  ["classic", "Classic gold crown", "classic-crown"], ["jester", "Jester", "jester"], ["skull", "Skull", "skull"], ["dark-skull", "Dark skull", "dark-skull"],
  ["snowman", "Snowman", "snowman"], ["blackfire-dragon", "Blackfire Dragon", "blackfire-dragon"], ["champagne-gold", "Champagne Gold", "champagne-gold"],
  ["crimson-tempest-corsair", "Crimson Corsair", "crimson-tempest-corsair"], ["crystal-comet", "Crystal Comet", "crystal-comet"],
  ["flame-ribbons", "Sacred Flames", "flame-ribbons"], ["ivory-sky-dynasty", "Ivory Sky Dynasty", "ivory-sky-dynasty"], ["moonlit-clouds", "Moonlit Clouds", "moonlit-clouds"],
  ["neon-ronin-tiger", "Neon Ronin Tiger", "neon-ronin-tiger"], ["clockwork-raven", "Clockwork Raven", "clockwork-raven"], ["emberforge-scorpion", "Emberforge Scorpion", "emberforge-scorpion"],
  ["candy-cloud-cat", "Candy Cloud Cat", "candy-cloud-cat"], ["rose-clouds", "Rose Clouds", "rose-clouds"], ["rosemoon-cat-sanctuary", "Rosemoon Cats", "rosemoon-cat-sanctuary"],
  ["shadowmoon-guardian", "Shadowmoon Guardian", "shadowmoon-guardian"], ["solar-phoenix-reliquary", "Solar Phoenix", "solar-phoenix-reliquary"],
  ["stormforge-wolf-guardian", "Stormforge Wolf", "stormforge-wolf-guardian"], ["thunderclaw-lion-sovereign", "Thunderclaw Lion", "thunderclaw-lion-sovereign"],
  ["verdant-seraph-emerald-doe", "Verdant Seraph", "verdant-seraph-emerald-doe"], ["airdrop-commander", "Airdrop Commander", "airdrop-commander"],
  ["blockcraft-ender", "Blockcraft Ender", "blockcraft-ender"], ["global-strike", "Global Strike", "global-strike"], ["m416-glacier", "M416 Glacier", "m416-glacier"],
  ["m416-joker", "M416 Joker", "m416-joker"], ["neon-heist", "Neon Heist", "neon-heist"], ["radiant-tactical", "Radiant Tactical", "radiant-tactical"],
  ["skyfall-royale", "Skyfall Royale", "skyfall-royale"], ["specter-night", "Specter Night", "specter-night"], ["straw-hat", "Straw Hat", "straw-hat"],
].map(([id, label, file]) => ({ id, label, file: `/assets/crowns/${file}.png` }));
export const crownUrl = (id: string) => CROWNS.find((c) => c.id === id)?.file ?? "";
