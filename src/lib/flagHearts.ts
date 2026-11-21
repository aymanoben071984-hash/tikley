/** Flag Hearts — settings and flag list (ported from OverlayLive). */

export type FlagPosition = "tl" | "tc" | "tr" | "ml" | "mc" | "mr" | "bl" | "bc" | "br";

export interface FlagHeartsConfig {
  enabled: boolean;
  flags: string[]; // up to 6 codes
  size: number;
  speed: number;
  gap: number; // % of heart size
  position: FlagPosition;
  direction: "row" | "column";
  margin: number;
}

export const FLAG_HEARTS_DEFAULTS: FlagHeartsConfig = {
  enabled: true,
  flags: ["sy", "kurdistan"],
  size: 120,
  speed: 1,
  gap: 6,
  position: "mc",
  direction: "row",
  margin: 40,
};

export const FH_SIZE = { min: 48, max: 220, step: 4 };
export const FH_SPEED = { min: 0.4, max: 2.5, step: 0.1 };
export const FH_GAP = { min: -20, max: 80, step: 2 };
export const FH_MARGIN = { min: 0, max: 300, step: 4 };
export const FH_MAX_FLAGS = 6;
export const FH_PERIOD_MS = 2600;
export const FH_POSITIONS: FlagPosition[] = ["tl", "tc", "tr", "ml", "mc", "mr", "bl", "bc", "br"];

/** Featured flags shown first (same order as OverlayLive). */
export const FEATURED_FLAGS = ["sy", "kurdistan", "ps", "sa", "ae", "qa", "kw", "bh", "om", "iq", "jo", "lb", "ye", "eg", "ly", "tn", "dz", "ma", "sd", "mr", "so", "tr"];

const ALL_CODES =
  "ad ae af ag ai al am ao aq ar as at au aw ax az ba bb bd be bf bg bh bi bj bl bm bn bo bq br bs bt bv bw by bz ca cc cd cf cg ch ci ck cl cm cn co cr cu cv cw cx cy cz de dj dk dm do dz ec ee eg eh er es et fi fj fk fm fo fr ga gb gd ge gf gg gh gi gl gm gn gp gq gr gs gt gu gw gy hk hm hn hr ht hu id ie im in io iq ir is it je jm jo jp ke kg kh ki km kn kp kr kw ky kz la lb lc li lk lr ls lt lu lv ly ma mc md me mf mg mh mk ml mm mn mo mp mq mr ms mt mu mv mw mx my mz na nc ne nf ng ni nl no np nr nu nz om pa pe pf pg ph pk pl pm pn pr ps pt pw py qa re ro rs ru rw sa sb sc sd se sg sh si sj sk sl sm sn so sr ss st sv sx sy sz tc td tf tg th tj tk tl tm tn to tr tt tv tw tz ua ug um us uy uz va vc ve vg vi vn vu wf ws ye yt za zm zw".split(" ");

const EXCLUDED = new Set(["il", "um"]);

export const ALL_FLAGS: string[] = [...FEATURED_FLAGS, ...ALL_CODES.filter((c) => !FEATURED_FLAGS.includes(c))].filter((c) => !EXCLUDED.has(c));
const FLAG_SET = new Set(ALL_FLAGS);

export function isFlagCode(c: unknown): c is string {
  return typeof c === "string" && FLAG_SET.has(c);
}

export function flagImage(code: string): string | null {
  if (!isFlagCode(code)) return null;
  return code === "kurdistan" ? "/assets/flags/kurdistan.svg" : `/assets/flags/4x3/${code}.svg`;
}

export function flagName(code: string, lang = "en"): string {
  if (code === "kurdistan") return lang === "ar" ? "كوردستان" : "Kurdistan";
  try {
    return new Intl.DisplayNames([lang, "en"], { type: "region" }).of(code.toUpperCase()) ?? code.toUpperCase();
  } catch {
    return code.toUpperCase();
  }
}

const clamp = (v: unknown, r: { min: number; max: number }, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(r.max, Math.max(r.min, n)) : d;
};

export function normalizeFlagHearts(raw: unknown): FlagHeartsConfig {
  const t = (raw && typeof raw === "object" ? raw : {}) as Partial<FlagHeartsConfig>;
  const d = FLAG_HEARTS_DEFAULTS;
  return {
    enabled: t.enabled !== false,
    flags: Array.isArray(t.flags) ? [...new Set(t.flags.filter(isFlagCode))].slice(0, FH_MAX_FLAGS) : d.flags,
    size: Math.round(clamp(t.size, FH_SIZE, d.size)),
    speed: Math.round(100 * clamp(t.speed, FH_SPEED, d.speed)) / 100,
    gap: Math.round(clamp(t.gap, FH_GAP, d.gap)),
    position: FH_POSITIONS.includes(t.position as FlagPosition) ? (t.position as FlagPosition) : d.position,
    direction: t.direction === "column" ? "column" : "row",
    margin: Math.round(clamp(t.margin, FH_MARGIN, d.margin)),
  };
}
