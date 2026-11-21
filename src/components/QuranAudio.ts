"use client";

/** Gapless ayah-by-ayah recitation player (port of OverlayLive's engine). */

const withTimeout = <T,>(p: Promise<T>, ms: number): Promise<T> => {
  let t: ReturnType<typeof setTimeout> | undefined;
  return Promise.race([p, new Promise<T>((_, rej) => (t = setTimeout(() => rej(new Error(`timed out after ${ms} ms`)), ms)))]).finally(() => clearTimeout(t));
};
const dbToGain = (db: number) => Math.pow(10, db / 20);

interface Clip {
  buffer: AudioBuffer;
  start: number;
  end: number;
}

/** Find where the recitation actually starts and ends (trim leading/trailing silence). */
function trimSilence(buf: AudioBuffer): { start: number; end: number } {
  const data = buf.getChannelData(0);
  const rate = buf.sampleRate;
  const frames = Math.floor(data.length / 512);
  if (frames < 2) return { start: 0, end: buf.duration };
  const rms = new Float32Array(frames);
  let peak = 0;
  for (let f = 0; f < frames; f++) {
    let sum = 0;
    const base = 512 * f;
    for (let i = 0; i < 512; i++) {
      const v = data[base + i];
      sum += v * v;
    }
    const r = Math.sqrt(sum / 512);
    rms[f] = r;
    if (r > peak) peak = r;
  }
  if (peak <= 0) return { start: 0, end: buf.duration };
  const startTh = Math.max(peak * dbToGain(-30), dbToGain(-48));
  const endTh = Math.max(peak * dbToGain(-38), dbToGain(-48));
  let s = 0;
  while (s < frames && rms[s] < startTh) s++;
  if (s >= frames) return { start: 0, end: buf.duration };
  let e = frames - 1;
  while (e > s && rms[e] < endTh) e--;
  const start = Math.max(0, (512 * s) / rate - 0.02);
  const end = Math.min(buf.duration, ((e + 1) * 512) / rate + 0.03);
  return end - start > 0.25 ? { start, end } : { start: 0, end: buf.duration };
}

interface Playing {
  key: string;
  n: number;
  source: AudioBufferSourceNode;
  gain: GainNode;
  endAt: number;
  playedBuf: number;
  segStart: number;
  segSpeed: number;
  bufDur: number;
  fadeInEnd: number;
  hold: number;
}

export interface EngineCallbacks {
  url: (ayah: number) => string;
  onAyah: (ayah: number) => void;
  onEnded: () => void;
  onTiming?: (t: { startedAt: number; endsAt: number }) => void;
  fallbackMs: (ayah: number) => number;
}

export interface EngineOptions {
  speed: number;
  volume: number;
  muted: boolean;
  loop: boolean;
  autoAdvance: boolean;
  from: number;
  to: number;
}

export class QuranAudioEngine {
  private cb: EngineCallbacks;
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private cache = new Map<string, Promise<Clip>>();
  private cur: Playing | null = null;
  private pending: Playing | null = null;
  private timers: Array<ReturnType<typeof setTimeout>> = [];
  private gen = 0;
  private opts: EngineOptions = { speed: 1, volume: 1, muted: false, loop: false, autoAdvance: true, from: 1, to: 1 };

  constructor(cb: EngineCallbacks) {
    this.cb = cb;
  }

  private ac(): AudioContext {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctor({ latencyHint: "playback" });
    const g = ctx.createGain();
    g.gain.value = this.opts.muted ? 0 : this.opts.volume;
    g.connect(ctx.destination);
    this.ctx = ctx;
    this.master = g;
    return ctx;
  }
  private now() {
    return this.ctx?.currentTime ?? 0;
  }

  private load(url: string): Promise<Clip> {
    const hit = this.cache.get(url);
    if (hit) {
      this.cache.delete(url);
      this.cache.set(url, hit);
      return hit;
    }
    const p = (async () => {
      const res = await withTimeout(fetch(url), 15000);
      if (!res.ok) throw new Error(`audio ${res.status}`);
      const ab = await withTimeout(res.arrayBuffer(), 15000);
      const buffer = await withTimeout(this.ac().decodeAudioData(ab), 10000);
      return { buffer, ...trimSilence(buffer) };
    })();
    p.catch(() => this.cache.delete(url));
    this.cache.set(url, p);
    while (this.cache.size > 10) {
      let removed = false;
      for (const k of this.cache.keys()) {
        if (k !== this.cur?.key && k !== this.pending?.key && k !== url) {
          this.cache.delete(k);
          removed = true;
          break;
        }
      }
      if (!removed) break;
    }
    return p;
  }

  warm(ayahs: number[]) {
    for (const a of ayahs) if (a >= this.opts.from && a <= this.opts.to) this.load(this.cb.url(a)).catch(() => {});
  }

  setOptions(o: EngineOptions) {
    const prev = this.opts;
    this.opts = o;
    if (this.master) {
      const t = this.now();
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setTargetAtTime(o.muted ? 0 : o.volume, t, 0.015);
    }
    const c = this.cur;
    if (c) {
      if (o.speed !== prev.speed) {
        const t = this.now();
        c.playedBuf += (t - c.segStart) * c.segSpeed;
        c.segStart = t;
        c.segSpeed = o.speed;
        c.source.playbackRate.setValueAtTime(o.speed, t);
        c.endAt = t + Math.max(0, c.bufDur - c.playedBuf) / o.speed;
        this.scheduleFadeOut(c);
        this.emitTiming(c);
      }
      if (o.speed !== prev.speed || o.loop !== prev.loop || o.autoAdvance !== prev.autoAdvance || o.to !== prev.to) this.arm();
    }
  }

  async play(ayah: number) {
    const url = this.cb.url(ayah);
    this.flushBoundary();
    if (this.cur && this.cur.key === url && this.now() < this.boundary(this.cur)) return;
    const g = ++this.gen;
    this.stopAll();
    let clip: Clip;
    try {
      clip = await this.load(url);
    } catch {
      if (g === this.gen) this.fallback(ayah);
      return;
    }
    if (g !== this.gen) return;
    const ctx = this.ac();
    if (ctx.state !== "running") {
      try {
        await withTimeout(ctx.resume(), 1500);
      } catch {
        /* autoplay blocked */
      }
      if (g !== this.gen) return;
    }
    if (ctx.state !== "running") {
      this.fallback(ayah);
      return;
    }
    this.cur = this.startSource(ayah, url, clip, ctx.currentTime + 0.02);
    this.emitTiming(this.cur);
    this.arm();
    this.warm([ayah + 1, ayah + 2]);
  }

  stop() {
    ++this.gen;
    this.stopAll();
  }

  dispose() {
    this.stop();
    this.cache.clear();
    this.ctx?.close().catch(() => {});
    this.ctx = null;
    this.master = null;
  }

  private boundary(c: Playing) {
    return c.endAt + c.hold / this.opts.speed;
  }

  private startSource(n: number, key: string, clip: Clip, at: number): Playing {
    const ctx = this.ac();
    const src = ctx.createBufferSource();
    src.buffer = clip.buffer;
    src.playbackRate.value = this.opts.speed;
    const gain = ctx.createGain();
    const fadeInEnd = at + 0.008;
    try {
      gain.gain.setValueAtTime(0, at);
      gain.gain.linearRampToValueAtTime(1, fadeInEnd);
    } catch {
      gain.gain.value = 1;
    }
    src.connect(gain);
    gain.connect(this.master as GainNode);
    const dur = clip.end - clip.start;
    src.start(at, clip.start, Math.max(dur, clip.buffer.duration - clip.start));
    const p: Playing = { key, n, source: src, gain, endAt: at + dur / this.opts.speed, playedBuf: 0, segStart: at, segSpeed: this.opts.speed, bufDur: dur, fadeInEnd, hold: 0.85 + Math.random() * 0.3 };
    this.scheduleFadeOut(p);
    return p;
  }

  private scheduleFadeOut(c: Playing) {
    const g = c.gain.gain;
    const t = this.now();
    const end = this.boundary(c) - 0.02;
    const start = Math.max(c.endAt, Math.max(end - 0.35, c.fadeInEnd + 0.005));
    if (t >= start - 0.005 || start >= end) return;
    try {
      g.cancelScheduledValues(Math.max(t, c.fadeInEnd) + 0.002);
      g.setValueAtTime(1, start);
      g.linearRampToValueAtTime(0, end);
    } catch {
      /* ignore */
    }
  }

  private nextAyah(): number | null {
    const c = this.cur;
    if (!c) return null;
    if (this.opts.loop) return c.n;
    return this.opts.autoAdvance && c.n < this.opts.to ? c.n + 1 : null;
  }

  private arm() {
    this.clearTimers();
    this.dropPending();
    const c = this.cur;
    if (!c) return;
    const g = this.gen;
    const next = this.nextAyah();
    if (next !== null) {
      const url = this.cb.url(next);
      this.load(url)
        .then((clip) => {
          if (g !== this.gen || this.cur !== c || this.pending) return;
          const at = Math.max(this.boundary(c), c.fadeInEnd + 0.01);
          if (this.now() < at) this.pending = this.startSource(next, url, clip, at);
        })
        .catch(() => {});
      this.warm([next + 1, next + 2]);
    }
    const ms = Math.max(0, (this.boundary(c) - this.now() + 0.006) * 1000);
    this.timers.push(setTimeout(() => this.commit(c), ms));
    c.source.onended = () => this.commit(c);
  }

  private commit(c: Playing) {
    if (this.cur !== c || this.now() < this.boundary(c) - 0.05) return;
    c.source.onended = null;
    const next = this.nextAyah();
    if (this.pending) {
      const p = this.pending;
      this.pending = null;
      this.cur = p;
      this.emitTiming(p);
      c.source.onended = () => c.source.disconnect();
      if (p.n !== c.n) this.cb.onAyah(p.n);
      this.arm();
      return;
    }
    this.cur = null;
    this.clearTimers();
    c.source.disconnect();
    if (next === null) {
      if (this.opts.autoAdvance && !this.opts.loop) this.cb.onEnded();
      return;
    }
    if (next === c.n) this.play(next);
    else this.cb.onAyah(next);
  }

  private emitTiming(c: Playing) {
    if (!this.cb.onTiming) return;
    const t = this.now();
    const wall = Date.now();
    const startedAt = wall + (c.segStart - t) * 1000 - (c.playedBuf / (c.segSpeed || 1)) * 1000;
    this.cb.onTiming({ startedAt, endsAt: wall + (c.endAt - t) * 1000 });
  }

  private flushBoundary() {
    const c = this.cur;
    if (c && this.now() >= this.boundary(c)) this.commit(c);
  }

  /** No audio available (blocked or failed): advance on an estimated timer. */
  private fallback(ayah: number) {
    this.clearTimers();
    const g = this.gen;
    const ms = Math.max(500, this.cb.fallbackMs(ayah));
    this.cb.onTiming?.({ startedAt: Date.now(), endsAt: Date.now() + ms });
    this.timers.push(
      setTimeout(() => {
        if (g !== this.gen || !this.opts.autoAdvance || this.opts.loop) return;
        if (ayah < this.opts.to) this.cb.onAyah(ayah + 1);
        else this.cb.onEnded();
      }, ms),
    );
  }

  private dropPending() {
    const p = this.pending;
    if (!p) return;
    this.pending = null;
    try {
      p.source.stop();
    } catch {
      /* ignore */
    }
    p.source.disconnect();
  }

  private clearTimers() {
    for (const t of this.timers) clearTimeout(t);
    this.timers = [];
  }

  private stopAll() {
    this.clearTimers();
    this.dropPending();
    const c = this.cur;
    this.cur = null;
    if (!c) return;
    c.source.onended = null;
    const t = this.now();
    try {
      c.gain.gain.cancelScheduledValues(t);
      c.gain.gain.setValueAtTime(c.gain.gain.value, t);
      c.gain.gain.linearRampToValueAtTime(0, t + 0.03);
      c.source.stop(t + 0.035);
    } catch {
      /* ignore */
    }
  }
}
