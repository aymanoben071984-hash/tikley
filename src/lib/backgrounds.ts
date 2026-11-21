/** Ready-made stream backgrounds: painted images + procedural (canvas-drawn) designs. */

export type BgOrientation = "vertical" | "horizontal";
export type BgCategory = "Gaming" | "Cozy" | "Neon" | "Nature" | "Studio" | "Space" | "Ramadan" | "Abstract" | "Music";

export interface BackgroundItem {
  id: string;
  title: string;
  category: BgCategory;
  kind: "image" | "procedural";
  /** Orientations this background is designed for. */
  orientations: BgOrientation[];
  src?: string; // image backgrounds
  accent?: string; // default accent for procedural backgrounds
  tags: string[];
}

export const BG_CATEGORIES: BgCategory[] = ["Gaming", "Cozy", "Neon", "Nature", "Studio", "Space", "Ramadan", "Abstract", "Music"];

export const BACKGROUNDS: BackgroundItem[] = [
  { id: "gaming-neon-room", title: "Neon Gaming Room", category: "Gaming", kind: "image", orientations: ["vertical"], src: "/backgrounds/gaming-neon-room.jpg", tags: ["rgb", "setup", "purple"] },
  { id: "cozy-bedroom", title: "Cozy Fairy-Light Room", category: "Cozy", kind: "image", orientations: ["vertical"], src: "/backgrounds/cozy-bedroom.jpg", tags: ["warm", "chill", "plants"] },
  { id: "cyber-city", title: "Rainy Cyber City", category: "Neon", kind: "image", orientations: ["vertical"], src: "/backgrounds/cyber-city.jpg", tags: ["cyberpunk", "night", "rain"] },
  { id: "ramadan-lanterns", title: "Ramadan Lanterns", category: "Ramadan", kind: "image", orientations: ["vertical"], src: "/backgrounds/ramadan-lanterns.jpg", tags: ["fanous", "crescent", "gold"] },
  { id: "sakura-garden", title: "Sakura Garden", category: "Nature", kind: "image", orientations: ["vertical"], src: "/backgrounds/sakura-garden.jpg", tags: ["cherry blossom", "pastel", "calm"] },
  { id: "podcast-studio", title: "Podcast Studio", category: "Studio", kind: "image", orientations: ["horizontal"], src: "/backgrounds/podcast-studio.jpg", tags: ["talk show", "pro", "wood"] },
  { id: "space-nebula", title: "Deep Space Nebula", category: "Space", kind: "image", orientations: ["horizontal"], src: "/backgrounds/space-nebula.jpg", tags: ["galaxy", "stars", "planet"] },
  { id: "music-stage", title: "Concert Stage", category: "Music", kind: "image", orientations: ["horizontal"], src: "/backgrounds/music-stage.jpg", tags: ["spotlights", "dj", "party"] },

  { id: "synthwave-grid", title: "Synthwave Grid", category: "Neon", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#ec4899", tags: ["retro", "sun", "80s"] },
  { id: "aurora-flow", title: "Aurora Flow", category: "Abstract", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#22d3ee", tags: ["gradient", "soft", "glow"] },
  { id: "bokeh-lights", title: "Bokeh Lights", category: "Cozy", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#f59e0b", tags: ["warm", "blur", "lights"] },
  { id: "starfield", title: "Starfield", category: "Space", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#818cf8", tags: ["stars", "night", "minimal"] },
  { id: "hex-arena", title: "Hex Arena", category: "Gaming", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#10b981", tags: ["esports", "hexagon", "tech"] },
  { id: "islamic-pattern", title: "Golden Arabesque", category: "Ramadan", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#d4af37", tags: ["geometric", "eid", "pattern"] },
  { id: "sunset-mountains", title: "Sunset Mountains", category: "Nature", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#fb7185", tags: ["landscape", "sunset", "layers"] },
  { id: "studio-spotlight", title: "Studio Spotlight", category: "Studio", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#38bdf8", tags: ["clean", "vignette", "pro"] },
  { id: "liquid-waves", title: "Liquid Waves", category: "Abstract", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#a855f7", tags: ["waves", "flow", "modern"] },
  { id: "equalizer", title: "Neon Equalizer", category: "Music", kind: "procedural", orientations: ["vertical", "horizontal"], accent: "#f43f5e", tags: ["audio", "bars", "dj"] },
];

export const BG_SIZES: Record<BgOrientation, Array<{ label: string; w: number; h: number }>> = {
  vertical: [
    { label: "1080 × 1920 (TikTok LIVE Studio)", w: 1080, h: 1920 },
    { label: "2160 × 3840 (4K)", w: 2160, h: 3840 },
  ],
  horizontal: [
    { label: "1920 × 1080 (OBS Full HD)", w: 1920, h: 1080 },
    { label: "3840 × 2160 (4K)", w: 3840, h: 2160 },
  ],
};

/* ───────────────────────── procedural drawing ───────────────────────── */

function rng(seed: number) {
  let s = seed >>> 0 || 1;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", "").padEnd(6, "0").slice(0, 6), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
const rgba = (hex: string, a: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r},${g},${b},${a})`;
};
function shade(hex: string, k: number) {
  const { r, g, b } = hexToRgb(hex);
  const f = (v: number) => Math.max(0, Math.min(255, Math.round(v * k)));
  return `rgb(${f(r)},${f(g)},${f(b)})`;
}

type Draw = (ctx: CanvasRenderingContext2D, w: number, h: number, accent: string) => void;

const DRAWERS: Record<string, Draw> = {
  "synthwave-grid": (ctx, w, h, a) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#0b0320");
    sky.addColorStop(0.55, shade(a, 0.35));
    sky.addColorStop(0.62, "#140428");
    sky.addColorStop(1, "#05010d");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    const horizon = h * 0.62;
    const r = Math.min(w, h) * 0.22;
    const sun = ctx.createLinearGradient(0, horizon - r * 2, 0, horizon);
    sun.addColorStop(0, "#fde047");
    sun.addColorStop(1, a);
    ctx.save();
    ctx.beginPath();
    ctx.arc(w / 2, horizon - r * 0.15, r, Math.PI, 0);
    ctx.clip();
    ctx.fillStyle = sun;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "#140428";
    for (let i = 0; i < 6; i++) ctx.fillRect(0, horizon - r * 0.15 - i * r * 0.16, w, r * 0.035 * (6 - i) * 0.5);
    ctx.restore();
    ctx.strokeStyle = rgba(a, 0.85);
    ctx.lineWidth = Math.max(1.5, w / 700);
    ctx.shadowColor = a;
    ctx.shadowBlur = w / 90;
    for (let i = -20; i <= 20; i++) {
      ctx.beginPath();
      ctx.moveTo(w / 2 + i * (w / 40), horizon);
      ctx.lineTo(w / 2 + i * (w / 6), h);
      ctx.stroke();
    }
    for (let i = 1; i < 14; i++) {
      const y = horizon + (h - horizon) * Math.pow(i / 14, 2.1);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  },
  "aurora-flow": (ctx, w, h, a) => {
    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, w, h);
    const blobs: Array<[number, number, number, string]> = [
      [0.25, 0.3, 0.7, a],
      [0.8, 0.25, 0.6, "#a855f7"],
      [0.6, 0.75, 0.75, "#10b981"],
      [0.15, 0.85, 0.55, "#ec4899"],
    ];
    ctx.globalCompositeOperation = "lighter";
    for (const [x, y, rad, c] of blobs) {
      const g = ctx.createRadialGradient(x * w, y * h, 0, x * w, y * h, rad * Math.max(w, h) * 0.6);
      g.addColorStop(0, rgba(c, 0.55));
      g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }
    ctx.globalCompositeOperation = "source-over";
  },
  "bokeh-lights": (ctx, w, h, a) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#1a0f05");
    g.addColorStop(1, "#0b0612");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const rand = rng(7);
    ctx.globalCompositeOperation = "lighter";
    const cols = [a, "#fb7185", "#fde68a", "#f97316"];
    for (let i = 0; i < 70; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const r = (0.02 + rand() * 0.07) * Math.min(w, h);
      const c = cols[i % cols.length];
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r);
      rg.addColorStop(0, rgba(c, 0.38));
      rg.addColorStop(0.7, rgba(c, 0.18));
      rg.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = rg;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  },
  starfield: (ctx, w, h, a) => {
    const g = ctx.createRadialGradient(w / 2, h * 0.4, 0, w / 2, h * 0.4, Math.max(w, h) * 0.8);
    g.addColorStop(0, shade(a, 0.35));
    g.addColorStop(1, "#02030a");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const rand = rng(42);
    for (let i = 0; i < (w * h) / 2500; i++) {
      const s = rand() * (w / 900) + 0.4;
      ctx.fillStyle = `rgba(255,255,255,${0.35 + rand() * 0.65})`;
      ctx.beginPath();
      ctx.arc(rand() * w, rand() * h, s, 0, Math.PI * 2);
      ctx.fill();
    }
    for (let i = 0; i < 8; i++) {
      const x = rand() * w;
      const y = rand() * h;
      const s = (w / 120) * (0.5 + rand());
      ctx.strokeStyle = "rgba(255,255,255,.8)";
      ctx.lineWidth = Math.max(1, w / 1400);
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s);
      ctx.lineTo(x, y + s);
      ctx.stroke();
    }
  },
  "hex-arena": (ctx, w, h, a) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, "#03130d");
    g.addColorStop(1, "#010806");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) / 14;
    const hw = Math.sqrt(3) * s;
    for (let row = -1; row * s * 1.5 < h + s; row++) {
      for (let col = -1; col * hw < w + hw; col++) {
        const cx = col * hw + (row % 2 ? hw / 2 : 0);
        const cy = row * s * 1.5;
        const d = Math.hypot(cx - w / 2, cy - h / 2) / Math.hypot(w / 2, h / 2);
        ctx.beginPath();
        for (let k = 0; k < 6; k++) {
          const ang = (Math.PI / 3) * k + Math.PI / 6;
          const px = cx + s * 0.92 * Math.cos(ang);
          const py = cy + s * 0.92 * Math.sin(ang);
          if (k) ctx.lineTo(px, py);
          else ctx.moveTo(px, py);
        }
        ctx.closePath();
        ctx.strokeStyle = rgba(a, 0.15 + 0.6 * d);
        ctx.lineWidth = Math.max(1, w / 900);
        ctx.stroke();
      }
    }
    const v = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    v.addColorStop(0, "rgba(0,0,0,.65)");
    v.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  },
  "islamic-pattern": (ctx, w, h, a) => {
    ctx.fillStyle = "#06122b";
    ctx.fillRect(0, 0, w, h);
    const s = Math.min(w, h) / 6;
    ctx.strokeStyle = rgba(a, 0.55);
    ctx.lineWidth = Math.max(1.2, w / 800);
    for (let y = -s; y < h + s; y += s) {
      for (let x = -s; x < w + s; x += s) {
        const cx = x + s / 2;
        const cy = y + s / 2;
        for (let k = 0; k < 2; k++) {
          ctx.beginPath();
          for (let i = 0; i < 4; i++) {
            const ang = (Math.PI / 2) * i + (k ? Math.PI / 4 : 0);
            const px = cx + s * 0.36 * Math.cos(ang);
            const py = cy + s * 0.36 * Math.sin(ang);
            if (i) ctx.lineTo(px, py);
            else ctx.moveTo(px, py);
          }
          ctx.closePath();
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(cx, cy, s * 0.12, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    const v = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.65);
    v.addColorStop(0, "rgba(6,18,43,.92)");
    v.addColorStop(0.55, "rgba(6,18,43,.55)");
    v.addColorStop(1, "rgba(6,18,43,0)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  },
  "sunset-mountains": (ctx, w, h, a) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, "#1e1b4b");
    sky.addColorStop(0.45, a);
    sky.addColorStop(0.7, "#fdba74");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = "rgba(255,244,214,.9)";
    ctx.beginPath();
    ctx.arc(w * 0.5, h * 0.58, Math.min(w, h) * 0.09, 0, Math.PI * 2);
    ctx.fill();
    const layers = ["#7c3a5c", "#4c1d4f", "#2a1238", "#140a20"];
    layers.forEach((c, li) => {
      const rand = rng(11 + li);
      const base = h * (0.6 + li * 0.1);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(0, h);
      ctx.lineTo(0, base);
      const steps = 8;
      for (let i = 0; i <= steps; i++) ctx.lineTo((w / steps) * i, base - rand() * h * 0.12);
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fill();
    });
  },
  "studio-spotlight": (ctx, w, h, a) => {
    ctx.fillStyle = "#0a0f17";
    ctx.fillRect(0, 0, w, h);
    const g = ctx.createRadialGradient(w / 2, h * 0.42, 0, w / 2, h * 0.42, Math.max(w, h) * 0.7);
    g.addColorStop(0, rgba(a, 0.42));
    g.addColorStop(0.45, rgba(a, 0.1));
    g.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const floor = ctx.createLinearGradient(0, h * 0.78, 0, h);
    floor.addColorStop(0, "rgba(255,255,255,0)");
    floor.addColorStop(1, "rgba(255,255,255,.06)");
    ctx.fillStyle = floor;
    ctx.fillRect(0, h * 0.78, w, h * 0.22);
  },
  "liquid-waves": (ctx, w, h, a) => {
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, "#0f0520");
    g.addColorStop(1, "#05020d");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const cols = [a, "#22d3ee", "#ec4899", "#6366f1"];
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      const amp = h * (0.03 + i * 0.006);
      const base = h * (0.25 + i * 0.07);
      for (let x = 0; x <= w; x += w / 60) {
        const y = base + Math.sin(x / (w / 3.2) + i * 0.7) * amp + Math.cos(x / (w / 1.7) + i) * amp * 0.5;
        if (x) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
      }
      ctx.strokeStyle = rgba(cols[i % cols.length], 0.55);
      ctx.lineWidth = Math.max(2, w / 300);
      ctx.shadowColor = cols[i % cols.length];
      ctx.shadowBlur = w / 60;
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
  },
  equalizer: (ctx, w, h, a) => {
    ctx.fillStyle = "#07040c";
    ctx.fillRect(0, 0, w, h);
    const rand = rng(3);
    const n = Math.round(w / (Math.min(w, h) / 18));
    const bw = w / n;
    for (let i = 0; i < n; i++) {
      const v = 0.15 + rand() * 0.5 * (1 - Math.abs(i - n / 2) / n);
      const bh = v * h * 0.55;
      const g = ctx.createLinearGradient(0, h - bh, 0, h);
      g.addColorStop(0, rgba(a, 0.9));
      g.addColorStop(1, rgba("#6366f1", 0.25));
      ctx.fillStyle = g;
      ctx.shadowColor = a;
      ctx.shadowBlur = w / 70;
      ctx.fillRect(i * bw + bw * 0.18, h - bh, bw * 0.64, bh);
      ctx.fillRect(i * bw + bw * 0.18, 0, bw * 0.64, bh * 0.35);
    }
    ctx.shadowBlur = 0;
    const v = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.55);
    v.addColorStop(0, "rgba(7,4,12,.85)");
    v.addColorStop(1, "rgba(7,4,12,0)");
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, w, h);
  },
};

export function drawProcedural(ctx: CanvasRenderingContext2D, id: string, w: number, h: number, accent: string) {
  const d = DRAWERS[id];
  if (!d) {
    ctx.fillStyle = "#0b0f17";
    ctx.fillRect(0, 0, w, h);
    return;
  }
  ctx.save();
  d(ctx, w, h, accent);
  ctx.restore();
}

/** Draw an image so it covers the whole canvas (centre crop). */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, w: number, h: number) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
}
