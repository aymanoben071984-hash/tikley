/** Quran Recitation — settings, reciters, designs and text loading (ported from OverlayLive). */

export interface QuranConfig {
  surah: number;
  fromAyah: number;
  toAyah: number;
  reciterId: string;
  soundEnabled: boolean;
  speed: number;
  autoAdvance: boolean;
  loop: boolean;
  highlight: boolean;
  highlightColor: string;
  activeTextColor: string;
  design: QuranDesign;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  textColor: string;
  ayahsVisible: number;
  continuous: boolean;
  volume: number;
}

export interface QuranState {
  playing: boolean;
  ayah: number;
  rev: number;
  line: number | null;
  /** Last ayah reported by an open overlay (for the dashboard). */
  liveAyah?: number;
  ended?: boolean;
}

export interface QuranPayload {
  config: QuranConfig;
  state: QuranState;
}

/** OverlayLive's defaults. */
export const QURAN_DEFAULTS: QuranConfig = {
  surah: 1,
  fromAyah: 1,
  toAyah: 7,
  reciterId: "alafasy",
  soundEnabled: true,
  speed: 1,
  autoAdvance: true,
  loop: false,
  highlight: true,
  highlightColor: "#398dc0",
  activeTextColor: "",
  design: "minimal",
  fontFamily: "",
  fontSize: 40,
  lineHeight: 2.9,
  textColor: "",
  ayahsVisible: 2,
  continuous: true,
  volume: 1,
};

export const QURAN_STATE_DEFAULT: QuranState = { playing: false, ayah: 1, rev: 0, line: null };

export const RECITERS = [
  { id: "alafasy", nameEn: "Mishary Alafasy", nameAr: "مشاري راشد العفاسي", folder: "Alafasy_128kbps" },
  { id: "husary", nameEn: "Mahmoud Al-Husary", nameAr: "محمود خليل الحصري", folder: "Husary_128kbps" },
  { id: "abdulbasit", nameEn: "AbdulBaset AbdulSamad", nameAr: "عبد الباسط عبد الصمد", folder: "Abdul_Basit_Murattal_192kbps" },
  { id: "sudais", nameEn: "Abdurrahman As-Sudais", nameAr: "عبد الرحمن السديس", folder: "Abdurrahmaan_As-Sudais_192kbps" },
  { id: "minshawi", nameEn: "Mohamed El-Minshawi", nameAr: "محمد صديق المنشاوي", folder: "Minshawy_Murattal_128kbps" },
  { id: "ghamdi", nameEn: "Saad Al-Ghamdi", nameAr: "سعد الغامدي", folder: "Ghamadi_40kbps" },
  { id: "muaiqly", nameEn: "Maher Al-Muaiqly", nameAr: "ماهر المعيقلي", folder: "Maher_AlMuaiqly_64kbps" },
];

export type QuranDesign = "minimal" | "mushaf" | "glass" | "night" | "parchment" | "emerald" | "royal";
export const QURAN_DESIGNS: Array<{ id: QuranDesign; nameEn: string; nameAr: string }> = [
  { id: "minimal", nameEn: "Text Only", nameAr: "نص فقط" },
  { id: "mushaf", nameEn: "Mushaf", nameAr: "مصحف" },
  { id: "glass", nameEn: "Glass", nameAr: "زجاجي" },
  { id: "night", nameEn: "Night Sky", nameAr: "سماء الليل" },
  { id: "parchment", nameEn: "Parchment", nameAr: "رَقّ قديم" },
  { id: "emerald", nameEn: "Emerald Glow", nameAr: "توهج زمردي" },
  { id: "royal", nameEn: "Royal", nameAr: "ملكي" },
];

export const QURAN_FONTS = ["Amiri Quran", "Scheherazade New", "Amiri", "Lateef", "Noto Naskh Arabic", "Aref Ruqaa", "Reem Kufi", "Cairo"];
export const DEFAULT_QURAN_FONT = "Amiri Quran";
const GOOGLE_FAMILY: Record<string, string> = {
  "Amiri Quran": "Amiri+Quran",
  "Scheherazade New": "Scheherazade+New:wght@400;700",
  Amiri: "Amiri:wght@400;700",
  Lateef: "Lateef:wght@400;700",
  "Noto Naskh Arabic": "Noto+Naskh+Arabic:wght@400;700",
  "Aref Ruqaa": "Aref+Ruqaa:wght@400;700",
  "Reem Kufi": "Reem+Kufi:wght@400;700",
  Cairo: "Cairo:wght@400;700",
};

/** Load a Quran font from Google Fonts once. */
export function ensureQuranFont(family: string) {
  if (typeof document === "undefined") return;
  const g = GOOGLE_FAMILY[family || DEFAULT_QURAN_FONT];
  if (!g) return;
  const id = `qf-${g.split(":")[0]}`;
  if (document.getElementById(id)) return;
  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.href = `https://fonts.googleapis.com/css2?family=${g}&display=swap`;
  document.head.appendChild(link);
}

export const BASMALA = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
export const AUDIO_BASE = (process.env.NEXT_PUBLIC_QURAN_AUDIO_BASE || "https://everyayah.com/data").replace(/\/$/, "");

const pad3 = (n: number) => String(n).padStart(3, "0");
export function reciterById(id: string) {
  return RECITERS.find((r) => r.id === id) ?? RECITERS[0];
}
export function ayahAudioUrl(reciterId: string, surah: number, ayah: number) {
  return `${AUDIO_BASE}/${reciterById(reciterId).folder}/${pad3(surah)}${pad3(ayah)}.mp3`;
}
export function arabicDigits(n: number | string) {
  return String(n).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}
/** Estimated reading time for an ayah when no reciter audio is used. */
export function ayahFallbackMs(text: string, speed: number) {
  return Math.min(120000, Math.max(2000, (700 * Math.max(2, text.split(/\s+/).filter(Boolean).length)) / Math.min(2, Math.max(0.5, speed || 1))));
}

export interface SurahIndexItem {
  n: number;
  name: string;
  en: string;
  count: number;
}
export interface SurahData {
  n: number;
  name: string;
  en: string;
  ayahs: Array<{ n: number; text: string }>;
}

let indexPromise: Promise<SurahIndexItem[]> | null = null;
const surahCache = new Map<number, Promise<SurahData>>();

export function loadSurahIndex(): Promise<SurahIndexItem[]> {
  if (!indexPromise) {
    indexPromise = fetch("/quran/index.json").then((r) => {
      if (!r.ok) throw new Error("surah index missing");
      return r.json();
    });
    indexPromise.catch(() => (indexPromise = null));
  }
  return indexPromise;
}

export function loadSurah(n: number): Promise<SurahData> {
  const k = Math.min(114, Math.max(1, Math.round(n) || 1));
  let p = surahCache.get(k);
  if (!p) {
    p = fetch(`/quran/${pad3(k)}.json`).then((r) => {
      if (!r.ok) throw new Error(`surah ${k} missing`);
      return r.json();
    });
    p.catch(() => surahCache.delete(k));
    surahCache.set(k, p);
  }
  return p;
}

const DESIGN_IDS = new Set(QURAN_DESIGNS.map((d) => d.id));
const clampN = (v: unknown, min: number, max: number, d: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : d;
};

export function normalizeQuranConfig(raw: unknown): QuranConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<QuranConfig>;
  const d = QURAN_DEFAULTS;
  const surah = Math.round(clampN(c.surah, 1, 114, d.surah));
  const fromAyah = Math.round(clampN(c.fromAyah, 1, 286, d.fromAyah));
  return {
    surah,
    fromAyah,
    toAyah: Math.max(fromAyah, Math.round(clampN(c.toAyah, 1, 286, d.toAyah))),
    reciterId: RECITERS.some((r) => r.id === c.reciterId) ? (c.reciterId as string) : d.reciterId,
    soundEnabled: c.soundEnabled ?? d.soundEnabled,
    speed: clampN(c.speed, 0.5, 2, d.speed),
    autoAdvance: c.autoAdvance ?? d.autoAdvance,
    loop: c.loop ?? d.loop,
    highlight: c.highlight ?? d.highlight,
    highlightColor: typeof c.highlightColor === "string" ? c.highlightColor : d.highlightColor,
    activeTextColor: typeof c.activeTextColor === "string" ? c.activeTextColor : d.activeTextColor,
    design: DESIGN_IDS.has(c.design as QuranDesign) ? (c.design as QuranDesign) : d.design,
    fontFamily: typeof c.fontFamily === "string" ? c.fontFamily : d.fontFamily,
    fontSize: clampN(c.fontSize, 18, 96, d.fontSize),
    lineHeight: clampN(c.lineHeight, 1.4, 4, d.lineHeight),
    textColor: typeof c.textColor === "string" ? c.textColor : d.textColor,
    ayahsVisible: Math.round(clampN(c.ayahsVisible, 1, 8, d.ayahsVisible)),
    continuous: c.continuous ?? d.continuous,
    volume: clampN(c.volume, 0, 1, d.volume),
  };
}

export function normalizeQuranState(raw: unknown, cfg: QuranConfig): QuranState {
  const s = (raw && typeof raw === "object" ? raw : {}) as Partial<QuranState>;
  return {
    playing: Boolean(s.playing),
    ayah: Math.round(clampN(s.ayah, cfg.fromAyah, cfg.toAyah, cfg.fromAyah)),
    rev: Math.max(0, Math.round(Number(s.rev) || 0)),
    line: typeof s.line === "number" ? s.line : null,
    liveAyah: typeof s.liveAyah === "number" ? s.liveAyah : undefined,
    ended: Boolean(s.ended),
  };
}
