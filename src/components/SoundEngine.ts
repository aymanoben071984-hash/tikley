"use client";

export type SoundEffectType =
  | "gift"
  | "lion"
  | "follow"
  | "join"
  | "win"
  | "tick"
  | "effect";

let sharedAudioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return null;
  if (!sharedAudioCtx) {
    sharedAudioCtx = new AudioCtx();
  }
  if (sharedAudioCtx.state === "suspended") {
    sharedAudioCtx.resume().catch(() => {});
  }
  return sharedAudioCtx;
}

export function playBroadcastSound(type: SoundEffectType, volume = 0.65): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const gainMaster = ctx.createGain();
    gainMaster.gain.value = Math.max(0.05, Math.min(1, volume)) * 0.25;
    gainMaster.connect(ctx.destination);

    const playNote = (
      freq: number,
      startOffset: number,
      duration: number,
      wave: OscillatorType = "triangle",
    ) => {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = wave;
      osc.frequency.setValueAtTime(freq, now + startOffset);
      g.gain.setValueAtTime(0.001, now + startOffset);
      g.gain.exponentialRampToValueAtTime(1, now + startOffset + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, now + startOffset + duration);
      osc.connect(g);
      g.connect(gainMaster);
      osc.start(now + startOffset);
      osc.stop(now + startOffset + duration + 0.02);
    };

    if (type === "gift") {
      playNote(523.25, 0, 0.14, "sine");
      playNote(659.25, 0.09, 0.16, "sine");
      playNote(783.99, 0.18, 0.28, "triangle");
    } else if (type === "lion" || type === "win") {
      playNote(440, 0, 0.14, "sawtooth");
      playNote(554.37, 0.11, 0.14, "sawtooth");
      playNote(659.25, 0.22, 0.16, "sawtooth");
      playNote(880, 0.34, 0.45, "triangle");
    } else if (type === "follow") {
      playNote(587.33, 0, 0.12, "sine");
      playNote(880, 0.1, 0.24, "sine");
    } else if (type === "join") {
      playNote(493.88, 0, 0.1, "sine");
      playNote(659.25, 0.08, 0.18, "sine");
    } else if (type === "tick") {
      playNote(920, 0, 0.04, "square");
    } else {
      playNote(640, 0, 0.12, "triangle");
      playNote(960, 0.09, 0.22, "sine");
    }
  } catch {
    // Ignore autoplay restrictions safely
  }
}

export function speakBroadcastTts(
  text: string,
  options?: { pitch?: number; rate?: number; volume?: number },
): void {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.pitch = options?.pitch ?? 1.05;
    utter.rate = options?.rate ?? 1.02;
    utter.volume = options?.volume ?? 0.9;
    window.speechSynthesis.speak(utter);
  } catch {
    // Ignore synthesis failures
  }
}

export function notifyOverlayChannel(payload: Record<string, unknown>): void {
  if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") {
    return;
  }
  try {
    const ch = new BroadcastChannel("overlaylive-sync");
    ch.postMessage(payload);
    ch.close();
  } catch {
    // Ignore channel errors
  }
}
