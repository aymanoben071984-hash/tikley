/** Stream Notes — settings (ported from OverlayLive's notes overlay). */

export type NoteDesign =
  | "text" | "underline" | "marker"
  | "sticky" | "pill" | "glass" | "neon" | "ribbon" | "tag" | "badge" | "bubble"
  | "cloud" | "kitty" | "bow" | "heart" | "candy";
export type NoteEnter = "none" | "fade" | "up" | "down" | "left" | "right" | "pop" | "zoom" | "drop" | "flip" | "swing" | "unfold";
export type NoteLoop = "none" | "float" | "pulse" | "wiggle" | "sway" | "beat" | "hop" | "shake";

export interface StreamNote {
  id: string;
  text: string;
  icon: string;
  design: NoteDesign;
  accentColor: string;
  textColor: string;
  fontFamily: string;
  size: number; // 50–200
  textAnim: string;
  enter: NoteEnter;
  loop: NoteLoop;
  replayEvery: number; // seconds, 0 = never
}

export interface NotesDisplay {
  mode: "stack" | "rotate";
  interval: number; // seconds
  effect: NoteEnter;
}

export interface NotesConfig {
  notes: StreamNote[];
  display: NotesDisplay;
}

export const TEXT_DESIGNS: NoteDesign[] = ["text", "underline", "marker"];
export const SHAPE_DESIGNS: NoteDesign[] = ["sticky", "pill", "glass", "neon", "ribbon", "tag", "badge", "bubble"];
export const CUTE_DESIGNS: NoteDesign[] = ["cloud", "kitty", "bow", "heart", "candy"];
export const ALL_NOTE_DESIGNS: NoteDesign[] = [...TEXT_DESIGNS, ...SHAPE_DESIGNS, ...CUTE_DESIGNS];

export const NOTE_DESIGN_LABELS: Record<NoteDesign, string> = {
  text: "Plain text", underline: "Underline", marker: "Marker",
  sticky: "Sticky note", pill: "Pill", glass: "Glass", neon: "Neon", ribbon: "Ribbon", tag: "Tag", badge: "Badge", bubble: "Speech bubble",
  cloud: "Cloud", kitty: "Kitty", bow: "Bow", heart: "Heart", candy: "Candy",
};

/** Default colours per design (OverlayLive values). */
export const NOTE_DESIGN_COLORS: Record<NoteDesign, { accent: string; text: string }> = {
  text: { accent: "#fbbf24", text: "#ffffff" },
  underline: { accent: "#38bdf8", text: "#ffffff" },
  marker: { accent: "#fde047", text: "#111111" },
  sticky: { accent: "#fbbf24", text: "#111111" },
  pill: { accent: "#38bdf8", text: "#ffffff" },
  glass: { accent: "#a78bfa", text: "#ffffff" },
  neon: { accent: "#f472b6", text: "#ffffff" },
  ribbon: { accent: "#ef4444", text: "#ffffff" },
  tag: { accent: "#22c55e", text: "#0b1f12" },
  badge: { accent: "#f59e0b", text: "#ffffff" },
  bubble: { accent: "#ffffff", text: "#111111" },
  cloud: { accent: "#9ec5ff", text: "#3b4a6b" },
  kitty: { accent: "#ff9ec4", text: "#5a2244" },
  bow: { accent: "#ff9ec4", text: "#5a2244" },
  heart: { accent: "#ff5c93", text: "#ffffff" },
  candy: { accent: "#ff7eb6", text: "#5a2244" },
};

export const NOTE_ENTERS: NoteEnter[] = ["none", "fade", "up", "down", "left", "right", "pop", "zoom", "drop", "flip", "swing", "unfold"];
export const NOTE_LOOPS: NoteLoop[] = ["none", "float", "pulse", "wiggle", "sway", "beat", "hop", "shake"];
export const NOTE_ICONS = ["", "📌", "✨", "❤️", "⭐", "🔥", "🎁", "👑", "🎵", "🎮", "📣", "💬", "🌙", "🌸", "🐱", "🙏", "👇", "✅"];
export const NOTE_FONTS = ["Inter", "Changa", "Cairo", "Roadster", "Poppins", "Bebas Neue", "Baloo 2", "Orbitron", "Georgia", "Tajawal"];

export const NOTE_DEFAULTS: Omit<StreamNote, "id"> = {
  text: "Follow for more! ✨",
  icon: "📌",
  design: "sticky",
  accentColor: NOTE_DESIGN_COLORS.sticky.accent,
  textColor: NOTE_DESIGN_COLORS.sticky.text,
  fontFamily: "Inter",
  size: 100,
  textAnim: "",
  enter: "pop",
  loop: "none",
  replayEvery: 0,
};

export const DISPLAY_DEFAULTS: NotesDisplay = { mode: "stack", interval: 5, effect: "up" };

export const NOTES_STARTER: NotesConfig = {
  notes: [
    { id: "n1", ...NOTE_DEFAULTS },
    { id: "n2", ...NOTE_DEFAULTS, text: "Tap ❤️ to support the stream", icon: "", design: "heart", accentColor: NOTE_DESIGN_COLORS.heart.accent, textColor: NOTE_DESIGN_COLORS.heart.text, loop: "float", enter: "drop" },
    { id: "n3", ...NOTE_DEFAULTS, text: "Top gifter picks the next game!", icon: "👑", design: "neon", accentColor: NOTE_DESIGN_COLORS.neon.accent, textColor: NOTE_DESIGN_COLORS.neon.text, enter: "flip" },
  ],
  display: DISPLAY_DEFAULTS,
};

export function newNoteId() {
  return `n${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

/** When switching design, keep custom colours but swap untouched defaults. */
export function recolorForDesign(note: StreamNote, next: NoteDesign): Pick<StreamNote, "accentColor" | "textColor"> {
  const cur = NOTE_DESIGN_COLORS[note.design] ?? NOTE_DESIGN_COLORS.sticky;
  const nxt = NOTE_DESIGN_COLORS[next];
  const same = (a: string, b: string) => a.trim().toLowerCase() === b.toLowerCase();
  return {
    accentColor: same(note.accentColor, cur.accent) ? nxt.accent : note.accentColor,
    textColor: same(note.textColor, cur.text) ? nxt.text : note.textColor,
  };
}

const pick = <T extends string>(v: unknown, list: readonly T[], d: T): T => (list.includes(v as T) ? (v as T) : d);

export function normalizeNote(raw: unknown, idx = 0): StreamNote {
  const n = (raw && typeof raw === "object" ? raw : {}) as Partial<StreamNote>;
  const design = pick(n.design, ALL_NOTE_DESIGNS, "sticky");
  return {
    id: typeof n.id === "string" && n.id ? n.id.slice(0, 40) : `n${idx + 1}`,
    text: typeof n.text === "string" ? n.text.slice(0, 140) : NOTE_DEFAULTS.text,
    icon: typeof n.icon === "string" ? n.icon.slice(0, 8) : NOTE_DEFAULTS.icon,
    design,
    accentColor: typeof n.accentColor === "string" ? n.accentColor : NOTE_DESIGN_COLORS[design].accent,
    textColor: typeof n.textColor === "string" ? n.textColor : NOTE_DESIGN_COLORS[design].text,
    fontFamily: typeof n.fontFamily === "string" ? n.fontFamily : "Inter",
    size: Math.min(200, Math.max(50, Number(n.size) || 100)),
    textAnim: typeof n.textAnim === "string" ? n.textAnim : "",
    enter: pick(n.enter, NOTE_ENTERS, "pop"),
    loop: pick(n.loop, NOTE_LOOPS, "none"),
    replayEvery: Math.min(60, Math.max(0, Math.round(Number(n.replayEvery) || 0))),
  };
}

export function normalizeNotesConfig(raw: unknown): NotesConfig {
  const c = (raw && typeof raw === "object" ? raw : {}) as Partial<NotesConfig>;
  const d = (c.display ?? {}) as Partial<NotesDisplay>;
  return {
    notes: Array.isArray(c.notes) ? c.notes.slice(0, 20).map(normalizeNote) : NOTES_STARTER.notes,
    display: {
      mode: d.mode === "rotate" ? "rotate" : "stack",
      interval: Math.min(30, Math.max(1, Number(d.interval) || DISPLAY_DEFAULTS.interval)),
      effect: pick(d.effect, NOTE_ENTERS, "up"),
    },
  };
}
