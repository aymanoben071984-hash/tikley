"use client";

import type { AvatarPreset, GameConfig, LiveEvent, StreamerProfile } from "@/db/schema";
import { ExtraOverlayStudio } from "@/components/ExtraOverlayStudio";
import { STORE_OVERLAYS } from "@/lib/liveOverlays";
import { BreakingNewsStudio } from "@/components/BreakingNewsStudio";
import { FramedAvatar } from "@/components/FramedAvatar";
import { notifyOverlayChannel, playBroadcastSound } from "@/components/SoundEngine";
import {
  DEFAULT_QUIZ_QUESTIONS,
  FREE_GAMES_CATALOG,
  GIFT_CATALOG,
  QUIZ_CARD_THEMES,
  type QuizQuestion,
} from "@/lib/catalog";
import {
  Check,
  Copy,
  Crown,
  ExternalLink,
  Flame,
  Gamepad2,
  Play,
  Plus,
  RotateCcw,
  ShieldAlert,
  Sparkles,
  Swords,
  Trophy,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

interface GameOverlayStageProps {
  gameSlug: string;
  gameConfig?: GameConfig;
  avatars: AvatarPreset[];
  interactive?: boolean;
  onUpdateState?: (patch: Record<string, unknown>, cardTheme?: string) => void;
}

const SCRAMBLE_WORDS = [
  { word: "STREAMER", scrambled: "R M E A T S R E", hint: "Creator broadcasting live on TikTok" },
  { word: "UNIVERSE", scrambled: "V E R S E U N I", hint: "Legendary 44,999-coin TikTok gift" },
  { word: "OVERLAY", scrambled: "Y A L R E V O", hint: "Browser source layer in OBS or LIVE Studio" },
  { word: "DRAGON", scrambled: "G O N D R A", hint: "Fire-breathing mythic avatar frame" },
];

export function GameOverlayStage({
  gameSlug,
  gameConfig,
  avatars,
  interactive = false,
  onUpdateState,
}: GameOverlayStageProps) {
  const state = (gameConfig?.stateJson || {}) as Record<string, unknown>;
  const themeObj =
    QUIZ_CARD_THEMES.find((t) => t.id === gameConfig?.cardTheme) ?? QUIZ_CARD_THEMES[0];

  const [guessInput, setGuessInput] = useState("");
  const [spinning, setSpinning] = useState(false);
  const [droppingPuck, setDroppingPuck] = useState(false);

  const partyAvatars = avatars.length > 0 ? avatars : [];

  if (gameSlug === "live-quiz") {
    const questions =
      (state.questions as QuizQuestion[] | undefined) ?? DEFAULT_QUIZ_QUESTIONS;
    const qIdx = Number(state.currentQuestionIndex || 0) % questions.length;
    const q = questions[qIdx];
    const revealed = Boolean(state.revealed);
    const votes = (state.votes as Record<string, number> | undefined) ?? {
      0: 14,
      1: 42,
      2: 9,
      3: 6,
    };
    const totalVotes = Math.max(
      1,
      Object.values(votes).reduce((acc, v) => acc + Number(v || 0), 0),
    );
    const letters = ["A", "B", "C", "D"];

    return (
      <div
        className={`mx-auto w-full max-w-lg rounded-2xl border border-white/15 bg-gradient-to-br ${themeObj.bg} p-4 shadow-[0_18px_45px_rgba(0,0,0,0.65)] backdrop-blur-md`}
      >
        <div className="mb-3 flex items-center justify-between">
          <span
            className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wider"
            style={{ color: themeObj.accent }}
          >
            <Sparkles className="h-3.5 w-3.5" />
            LIVE Quiz · Q{qIdx + 1}/{questions.length} · {q.category}
          </span>
          <span className="text-xs font-bold text-white/75">
            Type A, B, C or D in Chat!
          </span>
        </div>

        <h3 className="mb-3.5 text-base font-black leading-snug text-white sm:text-lg">
          {q.question}
        </h3>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {q.options.map((opt, idx) => {
            const count = Number(votes[idx] || 0);
            const pct = Math.round((count / totalVotes) * 100);
            const isCorrect = idx === q.correctIndex;
            return (
              <button
                key={opt}
                type="button"
                disabled={!interactive}
                onClick={() => {
                  if (!interactive || !onUpdateState) return;
                  playBroadcastSound("tick");
                  onUpdateState({
                    votes: { ...votes, [idx]: count + 5 },
                  });
                }}
                className={`relative overflow-hidden rounded-xl border p-3 text-left transition ${
                  revealed && isCorrect
                    ? "border-emerald-400 bg-emerald-500/25 ring-2 ring-emerald-400/50"
                    : "border-white/15 bg-white/[0.06] hover:bg-white/[0.11]"
                }`}
              >
                <div
                  className="pointer-events-none absolute inset-y-0 left-0 bg-white/[0.08] transition-all duration-500"
                  style={{ width: `${pct}%` }}
                />
                <div className="relative z-10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="grid h-6 w-6 shrink-0 place-items-center rounded-lg text-xs font-black text-slate-950"
                      style={{ backgroundColor: revealed && isCorrect ? "#34d399" : themeObj.accent }}
                    >
                      {letters[idx]}
                    </span>
                    <span className="text-xs font-bold text-white">{opt}</span>
                  </div>
                  <span className="text-xs font-extrabold text-white/80">{pct}%</span>
                </div>
              </button>
            );
          })}
        </div>

        {revealed && (
          <div className="mt-3 flex items-center justify-between rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-200 ring-1 ring-emerald-400/30 animate-ol-pop">
            <span>✅ Correct Answer: {letters[q.correctIndex]} — {q.options[q.correctIndex]}</span>
            <span>🏆 +100 pts to {votes[q.correctIndex] || 12} chatters!</span>
          </div>
        )}
      </div>
    );
  }

  if (gameSlug === "coin-battle") {
    const frozen = Boolean(state.frozen);
    const timeLeft = Number(state.timeLeft ?? 75);
    const contenders =
      (state.contenders as Array<{
        name: string;
        avatar: string;
        frame: string;
        coins: number;
      }>) ??
      partyAvatars.slice(0, 3).map((a) => ({
        name: a.displayName,
        avatar: a.avatarUrl,
        frame: a.frameSlug,
        coins: a.coinsTotal,
      }));
    const sorted = [...contenders].sort((a, b) => b.coins - a.coins);
    const maxCoins = Math.max(100, sorted[0]?.coins || 100);

    return (
      <div className={`mx-auto w-full max-w-lg rounded-2xl border border-amber-400/30 bg-slate-950/90 p-4 shadow-[0_18px_45px_rgba(245,158,11,0.22)] backdrop-blur-md ${frozen ? "battle-frozen" : ""}`}>
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="h-4 w-4 text-amber-400" />
            <span className="text-xs font-black uppercase tracking-wider text-amber-300">
              Timed Coin Battle
            </span>
            {frozen && (
              <span className="rounded-full bg-cyan-400/20 px-2 py-0.5 text-[10px] font-bold text-cyan-300 ring-1 ring-cyan-400/40">
                🧊 FROZEN x2
              </span>
            )}
          </div>
          <span className="rounded-lg bg-red-500/20 px-2.5 py-1 font-mono text-xs font-black text-red-300 ring-1 ring-red-400/30">
            ⏱ 0:{String(timeLeft % 60).padStart(2, "0")}
          </span>
        </div>

        <div className="space-y-2.5">
          {sorted.map((c, idx) => {
            const widthPct = Math.max(12, Math.round((c.coins / maxCoins) * 100));
            return (
              <div
                key={c.name}
                className="rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    {idx === 0 && <Crown className="h-4 w-4 text-amber-400" />}
                    <FramedAvatar
                      avatarUrl={c.avatar}
                      frameSlug={c.frame}
                      size={44}
                      showSignatureFx={false}
                    />
                    <span className="text-sm font-extrabold text-white">{c.name}</span>
                  </div>
                  <span className="text-xs font-black text-amber-300">
                    <span className="battle-coin">🪙</span> {c.coins.toLocaleString()}
                  </span>
                </div>
                <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-500"
                    style={{ width: `${widthPct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (gameSlug === "team-battle") {
    const redScore = Number(state.redScore ?? 1420);
    const blueScore = Number(state.blueScore ?? 1180);
    const total = Math.max(1, redScore + blueScore);
    const redPct = Math.round((redScore / total) * 100);

    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-white/15 bg-slate-950/90 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between text-xs font-black uppercase">
          <span className="text-rose-400">🐉 {String(state.redName || "Ember Dragons")}</span>
          <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] text-white/80">
            TEAM TUG-OF-WAR
          </span>
          <span className="text-cyan-400">{String(state.blueName || "Cyber Wolves")} 🐺</span>
        </div>

        <div className="mb-3 flex items-center justify-between px-2">
          <div className="flex flex-col items-center">
            <FramedAvatar
              avatarUrl="/avatars/a1.png"
              frameSlug="ember-dragon"
              size={68}
              glowColor="#f43f5e"
            />
            <span className="mt-1 text-sm font-black text-rose-300">
              {redScore.toLocaleString()} pts
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="text-xl font-black italic text-amber-400">VS</div>
            <span className="battle-heart text-lg">❤</span>
          </div>
          <div className="flex flex-col items-center">
            <FramedAvatar
              avatarUrl="/avatars/a3.png"
              frameSlug="stormfang-wolf"
              size={68}
              glowColor="#22d3ee"
            />
            <span className="mt-1 text-sm font-black text-cyan-300">
              {blueScore.toLocaleString()} pts
            </span>
          </div>
        </div>

        <div className="relative h-6 w-full overflow-hidden rounded-full border border-white/20 bg-cyan-500/40">
          <div
            className="h-full bg-gradient-to-r from-rose-600 to-orange-500 transition-all duration-500"
            style={{ width: `${redPct}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-between px-3 text-[11px] font-black text-white drop-shadow">
            <span>{redPct}% (!red)</span>
            <span>{100 - redPct}% (!blue)</span>
          </div>
        </div>
      </div>
    );
  }

  if (gameSlug === "lucky-wheel") {
    const slices = (state.slices as string[]) ?? [
      "VIP Frame Shoutout",
      "Choose Next Song",
      "20x Squat Challenge",
      "Mod Badge for LIVE",
      "Mystery Gift Box",
      "Double Quiz Points",
      "Follow Back!",
      "Spin Again x2",
    ];
    const rotation = Number(state.rotation ?? 0);
    const winnerSlice = String(state.winnerSlice || slices[0]);
    const colors = [
      "#0ea5e9",
      "#ec4899",
      "#f59e0b",
      "#8b5cf6",
      "#10b981",
      "#f43f5e",
      "#06b6d4",
      "#eab308",
    ];

    return (
      <div className="mx-auto flex w-full max-w-md flex-col items-center rounded-2xl border border-fuchsia-400/30 bg-slate-950/90 p-4 backdrop-blur-md">
        <div className="relative mb-3 flex items-center justify-center">
          <div className="absolute -top-2 z-20 text-xl drop-shadow">🔻</div>
          <div
            className="relative h-52 w-52 rounded-full border-4 border-white/30 shadow-[0_0_32px_rgba(236,72,153,0.4)] transition-transform duration-[2600ms] ease-out overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              background: `conic-gradient(${slices
                .map(
                  (_, i) =>
                    `${colors[i % colors.length]} ${(i * 100) / slices.length}% ${
                      ((i + 1) * 100) / slices.length
                    }%`,
                )
                .join(", ")})`,
            }}
          >
            <div className="absolute inset-0 grid place-items-center">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-white bg-slate-950 text-xs font-black text-white shadow-lg">
                SPIN
              </div>
            </div>
          </div>
        </div>

        <div className="flex w-full items-center justify-between rounded-xl bg-white/[0.07] px-3.5 py-2 text-xs">
          <span className="text-white/70">Latest Prize:</span>
          <span className="font-black text-amber-300">🎁 {winnerSlice}</span>
        </div>

        {interactive && onUpdateState && (
          <button
            type="button"
            disabled={spinning}
            onClick={() => {
              setSpinning(true);
              playBroadcastSound("lion");
              const pickIdx = Math.floor(Math.random() * slices.length);
              const nextRot = rotation + 1440 + Math.floor(Math.random() * 360);
              onUpdateState({
                rotation: nextRot,
                winnerSlice: slices[pickIdx],
              });
              setTimeout(() => setSpinning(false), 2600);
            }}
            className="mt-3 w-full rounded-xl bg-gradient-to-r from-fuchsia-500 to-cyan-500 py-2 text-xs font-black text-white shadow-lg hover:brightness-110 disabled:opacity-60"
          >
            {spinning ? "Spinning Wheel..." : "🎰 Spin Lucky Wheel Now"}
          </button>
        )}
      </div>
    );
  }

  if (gameSlug === "avatar-race") {
    const racers =
      (state.racers as Array<{
        name: string;
        avatar: string;
        frame: string;
        progress: number;
      }>) ??
      partyAvatars.slice(1, 5).map((a, idx) => ({
        name: a.displayName,
        avatar: a.avatarUrl,
        frame: a.frameSlug,
        progress: 45 + idx * 12,
      }));

    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-emerald-400/30 bg-slate-950/90 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between text-xs font-black">
          <span className="text-emerald-300">🏁 FRAMED AVATAR DERBY RACE</span>
          <span className="text-white/60">!join or Tap Likes to Boost</span>
        </div>
        <div className="space-y-2.5">
          {racers.map((r) => (
            <div
              key={r.name}
              className="relative h-12 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] px-2 flex items-center"
            >
              <div className="absolute right-2 top-0 bottom-0 w-1.5 bg-repeating-linear-gradient bg-emerald-400/40" />
              <div
                className="flex items-center gap-2 transition-all duration-500"
                style={{ marginLeft: `${Math.min(76, Math.max(2, r.progress * 0.76))}%` }}
              >
                <FramedAvatar
                  avatarUrl={r.avatar}
                  frameSlug={r.frame}
                  size={40}
                  showSignatureFx={false}
                />
                <span className="rounded bg-slate-900/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                  {r.name} ({Math.min(100, r.progress)}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameSlug === "word-scramble") {
    const scrambled = String(state.scrambled || "R M E A T S R E");
    const word = String(state.word || "STREAMER");
    const hint = String(state.hint || "Creator broadcasting live on TikTok");
    const solvedBy = state.solvedBy ? String(state.solvedBy) : null;

    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-indigo-400/35 bg-slate-950/90 p-4 text-center backdrop-blur-md">
        <div className="text-[11px] font-extrabold uppercase tracking-widest text-indigo-300">
          🔤 Live Chat Word Scramble
        </div>
        <div className="my-3 flex flex-wrap justify-center gap-1.5">
          {scrambled.split(" ").map((ch, idx) => (
            <span
              key={`${idx}-${ch}`}
              className="grid h-9 w-9 place-items-center rounded-xl border border-cyan-400/40 bg-cyan-500/15 text-base font-black text-white shadow"
            >
              {solvedBy ? word[idx] || ch : ch}
            </span>
          ))}
        </div>
        <p className="text-xs text-white/75">💡 Hint: {hint}</p>
        {solvedBy ? (
          <div className="mt-3 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-black text-emerald-300 animate-ol-pop">
            🏆 {solvedBy} unscrambled &ldquo;{word}&rdquo; first! (+250 Coins)
          </div>
        ) : (
          interactive &&
          onUpdateState && (
            <div className="mt-3 flex gap-2">
              <input
                value={guessInput}
                onChange={(e) => setGuessInput(e.target.value)}
                placeholder="Type guess (e.g. STREAMER)..."
                className="flex-1 rounded-xl border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-white outline-none focus:border-cyan-400"
              />
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("win");
                  onUpdateState({
                    solvedBy:
                      guessInput.trim().toUpperCase() === word
                        ? "You (Streamer)"
                        : "Mira Lee (@mira_lee)",
                  });
                  setGuessInput("");
                }}
                className="rounded-xl bg-cyan-500 px-3 py-1.5 text-xs font-black text-slate-950"
              >
                Solve
              </button>
            </div>
          )
        )}
      </div>
    );
  }

  if (gameSlug === "boss-raid") {
    const hp = Math.max(0, Number(state.hp ?? 6450));
    const maxHp = Math.max(1, Number(state.maxHp ?? 10000));
    const hpPct = Math.round((hp / maxHp) * 100);

    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-orange-500/40 bg-gradient-to-b from-stone-950/95 to-red-950/85 p-4 text-center backdrop-blur-md">
        <div className="flex items-center justify-between text-xs font-black text-orange-300">
          <span className="inline-flex items-center gap-1">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            CO-OP RAID BOSS
          </span>
          <span>MVP: {String(state.mvp || "LeoFlame")} 👑</span>
        </div>
        <div className="my-2 flex flex-col items-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/frames/ember-dragon.png"
            alt="Ember Dragon Boss"
            className="h-28 w-28 object-contain drop-shadow-[0_0_24px_rgba(249,115,22,0.75)] animate-ol-float"
          />
          <div className="text-sm font-black text-white">
            {hp === 0 ? "💀 BOSS DEFEATED! LOOT UNLOCKED!" : String(state.bossName || "Obsidian Ember Dragon")}
          </div>
        </div>
        <div className="h-4 w-full overflow-hidden rounded-full border border-white/20 bg-black/50 p-0.5">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 via-orange-500 to-amber-400 transition-all duration-300"
            style={{ width: `${hpPct}%` }}
          />
        </div>
        <div className="mt-1.5 text-xs font-extrabold text-amber-200">
          ❤️ {hp.toLocaleString()} / {maxHp.toLocaleString()} HP ({hpPct}%)
        </div>
      </div>
    );
  }

  if (gameSlug === "neon-dance-floor") {
    return (
      <div className="mx-auto w-full max-w-lg rounded-2xl border border-fuchsia-500/40 bg-gradient-to-br from-purple-950/90 via-slate-950/95 to-cyan-950/90 p-4 backdrop-blur-md">
        <div className="mb-3 flex items-center justify-between text-xs font-black text-fuchsia-300">
          <span>🪩 3D NEON AVATAR DANCE PARTY</span>
          <span>🎵 {Number(state.bpm || 128)} BPM · !dance</span>
        </div>
        <div className="grid grid-cols-4 gap-3 rounded-xl border border-white/15 bg-[radial-gradient(circle_at_center,rgba(236,72,153,0.22),transparent_70%)] p-3">
          {partyAvatars.slice(0, 8).map((av, idx) => (
            <div
              key={av.id}
              className="flex flex-col items-center animate-ol-float"
              style={{ animationDelay: `${idx * 0.22}s` }}
            >
              <FramedAvatar
                avatarUrl={av.avatarUrl}
                frameSlug={av.frameSlug}
                size={54}
                showSignatureFx={false}
              />
              <span className="mt-1 max-w-full truncate text-[10px] font-bold text-white">
                {av.displayName}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameSlug === "gift-plinko") {
    const buckets = ["1x", "2x", "5x", "10x JACKPOT", "5x", "2x", "1x"];
    const lastMult = String(state.lastMultiplier || "5x");
    const lastWinner = String(state.lastWinner || "MaxVolt");

    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-amber-400/35 bg-slate-950/90 p-4 text-center backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-amber-300">
          <span>🟡 NEON AVATAR PLINKO</span>
          <span>Jackpot: 🪙 {Number(state.jackpotPool || 2450)}</span>
        </div>
        <div className="relative my-2 flex flex-col items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] py-3">
          <div className={droppingPuck ? "animate-bounce" : ""}>
            <FramedAvatar
              avatarUrl="/avatars/a16.png"
              frameSlug="tidepool-otter"
              size={48}
              showSignatureFx={false}
            />
          </div>
          <div className="space-y-1.5 text-white/35 text-xs tracking-[1.1em]">
            <div>• • • • •</div>
            <div>• • • • • •</div>
            <div>• • • • •</div>
          </div>
          <div className="mt-1 flex w-full justify-around px-2">
            {buckets.map((b, i) => (
              <span
                key={`${b}-${i}`}
                className={`rounded-md px-1.5 py-1 text-[10px] font-black ${
                  b === lastMult
                    ? "bg-amber-400 text-slate-950 ring-2 ring-white"
                    : "bg-white/10 text-white/80"
                }`}
              >
                {b}
              </span>
            ))}
          </div>
        </div>
        <div className="text-xs font-bold text-emerald-300">
          🎉 {lastWinner} hit <span className="text-amber-300">{lastMult}</span>!
        </div>
        {interactive && onUpdateState && (
          <button
            type="button"
            onClick={() => {
              setDroppingPuck(true);
              playBroadcastSound("gift");
              const pick = buckets[Math.floor(Math.random() * buckets.length)];
              const rndAv = partyAvatars[Math.floor(Math.random() * Math.max(1, partyAvatars.length))];
              onUpdateState({
                lastMultiplier: pick,
                lastWinner: rndAv?.displayName || "Mira Lee",
                jackpotPool: Number(state.jackpotPool || 2450) + 50,
              });
              setTimeout(() => setDroppingPuck(false), 900);
            }}
            className="mt-2.5 w-full rounded-xl bg-amber-400 py-1.5 text-xs font-black text-slate-950 hover:brightness-110"
          >
            🪙 Drop Avatar Plinko Puck
          </button>
        )}
      </div>
    );
  }

  if (gameSlug === "emoji-royale") {
    const alive = Math.max(1, Number(state.aliveCount ?? 6));
    const champ = String(state.champion || "Tariq99");
    return (
      <div className="mx-auto w-full max-w-md rounded-2xl border border-rose-400/35 bg-slate-950/90 p-4 backdrop-blur-md">
        <div className="mb-2 flex items-center justify-between text-xs font-black text-rose-300">
          <span>⚔️ AVATAR BATTLE ROYALE</span>
          <span>{alive === 1 ? `🏆 Champion: ${champ}` : `${alive} Fighters Alive`}</span>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
          {partyAvatars.slice(0, alive).map((av) => (
            <div key={av.id} className="flex flex-col items-center animate-ol-pop">
              <FramedAvatar
                avatarUrl={av.avatarUrl}
                frameSlug={av.frameSlug}
                size={52}
                showSignatureFx={false}
              />
              <span className="mt-0.5 text-[10px] font-bold text-white">{av.displayName}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (gameSlug === "chat-tic-tac-toe") {
    const board = (state.board as string[]) ?? ["X", "O", "", "", "X", "", "", "", "O"];
    const coords = ["A1", "A2", "A3", "B1", "B2", "B3", "C1", "C2", "C3"];
    return (
      <div className="mx-auto w-full max-w-xs rounded-2xl border border-cyan-400/35 bg-slate-950/90 p-4 text-center backdrop-blur-md">
        <div className="mb-2 text-xs font-black text-cyan-300">
          ❌ Streamer (X) vs Chat Vote (O) ⭕
        </div>
        <div className="grid grid-cols-3 gap-2">
          {board.map((cell, idx) => (
            <button
              key={coords[idx]}
              type="button"
              disabled={!interactive || Boolean(cell)}
              onClick={() => {
                if (!interactive || !onUpdateState || cell) return;
                playBroadcastSound("tick");
                const next = [...board];
                next[idx] = state.turn === "O" ? "O" : "X";
                onUpdateState({
                  board: next,
                  turn: state.turn === "O" ? "X" : "O",
                });
              }}
              className="grid h-16 place-items-center rounded-xl border border-white/15 bg-white/[0.06] text-xl font-black text-white hover:border-cyan-400"
            >
              {cell === "X" ? (
                <span className="text-cyan-400">X</span>
              ) : cell === "O" ? (
                <span className="text-pink-400">O</span>
              ) : (
                <span className="text-[10px] text-white/30">{coords[idx]}</span>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  // hot-potato
  const holder = String(state.holder || "Kairos");
  const holderAvatar = String(state.holderAvatar || "/avatars/a5.png");
  const holderFrame = String(state.holderFrame || "volt-fox");
  const fuse = Number(state.fuseSec ?? 12);

  return (
    <div className="mx-auto w-full max-w-sm rounded-2xl border border-red-500/40 bg-slate-950/90 p-4 text-center backdrop-blur-md">
      <div className="mb-2 flex items-center justify-between text-xs font-black text-red-300">
        <span>💣 TICKING NEON BOMB</span>
        <span className="rounded bg-red-500/25 px-2 py-0.5 font-mono">
          {fuse > 0 ? `${fuse}s FUSE` : "💥 BOOM!"}
        </span>
      </div>
      <div className="my-2 flex flex-col items-center">
        <FramedAvatar avatarUrl={holderAvatar} frameSlug={holderFrame} size={82} glowColor="#ef4444" />
        <div className="mt-1.5 text-sm font-black text-white">
          {fuse > 0 ? `${holder} holds the bomb!` : `💥 Exploded on ${holder}!`}
        </div>
        <div className="text-[11px] text-white/65">Type !pass or send a Rose to pass it!</div>
      </div>
    </div>
  );
}

interface FreeGamesArenaProps {
  games: GameConfig[];
  avatars: AvatarPreset[];
  events?: LiveEvent[];
  profile?: StreamerProfile;
  initialSlug?: string;
  onFireEvent?: (payload: Record<string, unknown>) => Promise<void>;
  onSaveGame: (
    gameSlug: string,
    patch: { cardTheme?: string; stateJson?: Record<string, unknown> },
  ) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

export function FreeGamesArena({
  games,
  avatars,
  events = [],
  profile,
  initialSlug,
  onFireEvent,
  onSaveGame,
  onCopyUrl,
}: FreeGamesArenaProps) {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialSlug && FREE_GAMES_CATALOG.some((g) => g.slug === initialSlug) ? initialSlug : "breaking-news",
  );
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const [storeSearch, setStoreSearch] = useState("");
  const [storeCategory, setStoreCategory] = useState<string>("all");
  const [storeFreeOnly, setStoreFreeOnly] = useState(true);
  const storeCategories = [
    { id: "all", label: "All games" },
    { id: "quiz", label: "Quiz" },
    { id: "battle", label: "Battles" },
    { id: "wheel", label: "Wheels" },
    { id: "race", label: "Racing" },
    { id: "word", label: "Word games" },
    { id: "arcade", label: "Arcade" },
    { id: "news", label: "Stream tools" },
  ];
  const visibleGames = FREE_GAMES_CATALOG.filter((game) => {
    const matchesCategory = storeCategory === "all" || game.category === storeCategory;
    const searchable = `${game.title} ${game.subtitle} ${game.triggerLabel}`.toLowerCase();
    return matchesCategory && searchable.includes(storeSearch.trim().toLowerCase()) && (!storeFreeOnly || game.isFree);
  });
  const [newQText, setNewQText] = useState("");
  const [newOpts, setNewOpts] = useState<[string, string, string, string]>([
    "",
    "",
    "",
    "",
  ]);
  const [newCorrect, setNewCorrect] = useState(0);

  const selectedMeta =
    FREE_GAMES_CATALOG.find((g) => g.slug === selectedSlug) ?? FREE_GAMES_CATALOG[0];
  const selectedConfig = games.find((g) => g.gameSlug === selectedSlug);
  const currentState = (selectedConfig?.stateJson || {}) as Record<string, unknown>;

  const updateGameState = async (
    statePatch: Record<string, unknown>,
    cardTheme?: string,
  ) => {
    await onSaveGame(selectedSlug, { stateJson: statePatch, cardTheme });
    notifyOverlayChannel({ type: "game-update", gameSlug: selectedSlug });
  };

  const handleCopyGameOverlay = (slug: string, title: string) => {
    onCopyUrl(`/overlay/game/${slug}`, title);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1800);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-r from-cyan-950/45 via-card to-fuchsia-950/35 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-cyan/15 text-brand-cyan ring-1 ring-brand-cyan/35">
              <Gamepad2 className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">
                  Live Overlays
                </h2>
                <span className="rounded-full bg-emerald-500/20 px-2.5 py-0.5 text-[11px] font-extrabold text-emerald-300 ring-1 ring-emerald-400/30">
                  ALL {FREE_GAMES_CATALOG.length} FREE
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quizzes, battles, wheels, races and arcade games your chat plays live — each one a transparent Web Source for TikTok LIVE Studio and Browser Source for OBS, with your 68 avatar frames.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleCopyGameOverlay(selectedSlug, selectedMeta.title)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-3.5 py-2 text-xs font-bold text-white shadow hover:brightness-110"
            >
              {copiedSlug === selectedSlug ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              Copy Game Overlay URL
            </button>
            <a
              href={`/overlay/game/${selectedSlug}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl border border-border bg-secondary/60 px-3 py-2 text-xs font-semibold text-foreground hover:bg-secondary"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open OBS / Studio View
            </a>
          </div>
        </div>
      </div>

      {selectedSlug === "news-ticker" || selectedSlug === "stream-timer" ? (
        <ExtraOverlayStudio
          key={selectedSlug}
          slug={selectedSlug}
          game={selectedConfig}
          profile={profile}
          onSave={(stateJson) => onSaveGame(selectedSlug, { stateJson })}
          onCopyUrl={onCopyUrl}
        />
      ) : selectedSlug === "breaking-news" ? (
        <BreakingNewsStudio
          game={selectedConfig}
          events={events}
          onSave={(stateJson) => onSaveGame("breaking-news", { stateJson })}
          onFireEvent={async (p) => {
            await onFireEvent?.(p);
          }}
          onCopyUrl={onCopyUrl}
        />
      ) : (
      <>
      {/* Active Game Live Stage + Streamer Controls */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="checkerboard-stage relative flex min-h-[360px] flex-col justify-between rounded-2xl border border-border p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-wider text-white/90">
                LIVE PREVIEW · {selectedMeta.title}
              </span>
            </div>
            <span className="rounded-lg bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-300">
              Trigger: {selectedMeta.triggerLabel}
            </span>
          </div>

          <div className="my-auto py-2">
            <GameOverlayStage
              gameSlug={selectedSlug}
              gameConfig={selectedConfig}
              avatars={avatars}
              interactive
              onUpdateState={(patch, theme) => updateGameState(patch, theme)}
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3 text-[11px] text-white/65">
            <span>💡 {selectedMeta.howToPlay}</span>
            <span className="font-mono text-cyan-300">/overlay/game/{selectedSlug}</span>
          </div>
        </div>

        {/* Game-Specific Instant Action Deck */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-foreground">
              🎮 Live Host Controls &amp; Card Design
            </h3>
            <span className="rounded-full bg-brand-cyan/15 px-2.5 py-0.5 text-[10px] font-bold text-brand-cyan">
              Instant Sync
            </span>
          </div>

          {/* 8 Card Design Picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Overlay Card Theme (8 Broadcast Styles)
            </label>
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
              {QUIZ_CARD_THEMES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => updateGameState({}, t.id)}
                  className={`rounded-xl border px-2.5 py-1.5 text-left text-[11px] font-bold transition ${
                    (selectedConfig?.cardTheme || "cyber-cyan") === t.id
                      ? "border-brand-cyan bg-brand-cyan/15 text-foreground ring-1 ring-brand-cyan"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className="mr-1.5 inline-block h-2 w-2 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                  {t.name}
                </button>
              ))}
            </div>
          </div>

          {/* Dynamic Controls by Game */}
          {selectedSlug === "live-quiz" && (
            <div className="space-y-3 pt-1">
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    playBroadcastSound("gift");
                    const v = (currentState.votes as Record<string, number>) ?? {};
                    updateGameState({
                      votes: {
                        0: Number(v[0] || 10) + Math.floor(Math.random() * 12),
                        1: Number(v[1] || 20) + Math.floor(Math.random() * 18),
                        2: Number(v[2] || 8) + Math.floor(Math.random() * 10),
                        3: Number(v[3] || 5) + Math.floor(Math.random() * 9),
                      },
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs font-bold text-foreground hover:bg-secondary/80"
                >
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  Sim Votes
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBroadcastSound("win");
                    updateGameState({ revealed: !currentState.revealed });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-500/20 px-3 py-2 text-xs font-bold text-emerald-300 ring-1 ring-emerald-400/30 hover:bg-emerald-500/30"
                >
                  <Trophy className="h-3.5 w-3.5" />
                  {currentState.revealed ? "Hide Answer" : "Reveal Answer"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    playBroadcastSound("tick");
                    updateGameState({
                      currentQuestionIndex: Number(currentState.currentQuestionIndex || 0) + 1,
                      revealed: false,
                      votes: { 0: 4, 1: 6, 2: 5, 3: 3 },
                    });
                  }}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-brand-cyan px-3 py-2 text-xs font-black text-slate-950 hover:brightness-110"
                >
                  <Play className="h-3.5 w-3.5" />
                  Next Q
                </button>
              </div>

              {/* Add Custom Question */}
              <div className="rounded-xl border border-border bg-secondary/25 p-3 space-y-2">
                <div className="text-xs font-bold text-foreground">
                  + Add Custom Trivia Question
                </div>
                <input
                  value={newQText}
                  onChange={(e) => setNewQText(e.target.value)}
                  placeholder="Write your question for chat..."
                  className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-brand-cyan"
                />
                <div className="grid grid-cols-2 gap-1.5">
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-1">
                      <input
                        type="radio"
                        checked={newCorrect === i}
                        onChange={() => setNewCorrect(i)}
                      />
                      <input
                        value={newOpts[i]}
                        onChange={(e) => {
                          const copy = [...newOpts] as [string, string, string, string];
                          copy[i] = e.target.value;
                          setNewOpts(copy);
                        }}
                        placeholder={`Option ${["A", "B", "C", "D"][i]}`}
                        className="w-full rounded-lg border border-border bg-background px-2 py-1 text-xs"
                      />
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (!newQText.trim() || newOpts.some((o) => !o.trim())) return;
                    const existingQs =
                      (currentState.questions as QuizQuestion[]) ?? DEFAULT_QUIZ_QUESTIONS;
                    const createdQ: QuizQuestion = {
                      id: `q-${Date.now()}`,
                      question: newQText.trim(),
                      options: newOpts,
                      correctIndex: newCorrect,
                      category: "Custom",
                    };
                    updateGameState({
                      questions: [...existingQs, createdQ],
                      currentQuestionIndex: existingQs.length,
                      revealed: false,
                    });
                    setNewQText("");
                    setNewOpts(["", "", "", ""]);
                  }}
                  className="inline-flex items-center gap-1 rounded-lg bg-brand-cyan/20 px-3 py-1.5 text-xs font-bold text-brand-cyan hover:bg-brand-cyan/30"
                >
                  <Plus className="h-3.5 w-3.5" /> Add &amp; Jump to Question
                </button>
              </div>
            </div>
          )}

          {selectedSlug === "coin-battle" && (
            <div className="space-y-2.5 pt-1">
              <div className="grid grid-cols-2 gap-2">
                {GIFT_CATALOG.slice(0, 4).map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => {
                      playBroadcastSound(g.coins > 1000 ? "lion" : "gift");
                      const list =
                        (currentState.contenders as Array<{
                          name: string;
                          avatar: string;
                          frame: string;
                          coins: number;
                        }>) ?? [];
                      if (list.length > 0) {
                        const idx = Math.floor(Math.random() * list.length);
                        const mult = currentState.frozen ? 2 : 1;
                        const updated = list.map((item, i) =>
                          i === idx
                            ? { ...item, coins: item.coins + Math.min(2500, g.coins) * mult }
                            : item,
                        );
                        updateGameState({ contenders: updated });
                      }
                    }}
                    className="flex items-center gap-2 rounded-xl border border-border bg-secondary/50 px-3 py-2 text-xs font-bold hover:border-amber-400/50"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={g.icon} alt={g.name} className="h-5 w-5 object-contain" />
                    <span>Sim {g.name}</span>
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => updateGameState({ frozen: !currentState.frozen })}
                  className="flex-1 rounded-xl bg-cyan-500/20 py-2 text-xs font-bold text-cyan-300 ring-1 ring-cyan-400/30"
                >
                  🧊 Toggle x2 Freeze Glove
                </button>
                <button
                  type="button"
                  onClick={() => updateGameState({ timeLeft: 90 })}
                  className="rounded-xl bg-secondary px-3 py-2 text-xs font-bold"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}

          {selectedSlug === "team-battle" && (
            <div className="grid grid-cols-2 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("gift");
                  updateGameState({
                    redScore: Number(currentState.redScore || 1420) + 250,
                  });
                }}
                className="rounded-xl bg-rose-500/25 py-2.5 text-xs font-black text-rose-300 ring-1 ring-rose-400/40 hover:bg-rose-500/35"
              >
                🐉 +250 Red Dragons
              </button>
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("gift");
                  updateGameState({
                    blueScore: Number(currentState.blueScore || 1180) + 250,
                  });
                }}
                className="rounded-xl bg-cyan-500/25 py-2.5 text-xs font-black text-cyan-300 ring-1 ring-cyan-400/40 hover:bg-cyan-500/35"
              >
                🐺 +250 Blue Wolves
              </button>
            </div>
          )}

          {selectedSlug === "avatar-race" && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("gift");
                  const currentRacers =
                    (currentState.racers as Array<{
                      name: string;
                      avatar: string;
                      frame: string;
                      progress: number;
                    }>) ?? [];
                  updateGameState({
                    racers: currentRacers.map((r) => ({
                      ...r,
                      progress: Math.min(100, r.progress + Math.floor(Math.random() * 18) + 4),
                    })),
                  });
                }}
                className="flex-1 rounded-xl bg-emerald-500 py-2.5 text-xs font-black text-slate-950"
              >
                🚀 Turbo Boost Racers
              </button>
              <button
                type="button"
                onClick={() => {
                  const currentRacers =
                    (currentState.racers as Array<{
                      name: string;
                      avatar: string;
                      frame: string;
                      progress: number;
                    }>) ?? [];
                  updateGameState({
                    racers: currentRacers.map((r) => ({ ...r, progress: 8 })),
                  });
                }}
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold"
              >
                Reset Track
              </button>
            </div>
          )}

          {selectedSlug === "word-scramble" && (
            <button
              type="button"
              onClick={() => {
                const next =
                  SCRAMBLE_WORDS[Math.floor(Math.random() * SCRAMBLE_WORDS.length)];
                updateGameState({
                  word: next.word,
                  scrambled: next.scrambled,
                  hint: next.hint,
                  solvedBy: null,
                });
              }}
              className="w-full rounded-xl bg-indigo-500 py-2.5 text-xs font-black text-white"
            >
              🔀 Load New Scrambled Word
            </button>
          )}

          {selectedSlug === "boss-raid" && (
            <div className="grid grid-cols-3 gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("tick");
                  updateGameState({
                    hp: Math.max(0, Number(currentState.hp ?? 6450) - 350),
                  });
                }}
                className="rounded-xl bg-rose-500/20 py-2 text-xs font-bold text-rose-300"
              >
                ❤️ Likes (-350)
              </button>
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("lion");
                  updateGameState({
                    hp: Math.max(0, Number(currentState.hp ?? 6450) - 2500),
                    mvp: "Mira Lee",
                  });
                }}
                className="rounded-xl bg-amber-500/25 py-2 text-xs font-black text-amber-300"
              >
                🦁 Lion (-2500)
              </button>
              <button
                type="button"
                onClick={() => updateGameState({ hp: 10000, maxHp: 10000 })}
                className="rounded-xl bg-secondary py-2 text-xs font-bold"
              >
                Respawn Boss
              </button>
            </div>
          )}

          {(selectedSlug === "emoji-royale" ||
            selectedSlug === "chat-tic-tac-toe" ||
            selectedSlug === "hot-potato" ||
            selectedSlug === "neon-dance-floor") && (
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  playBroadcastSound("gift");
                  if (selectedSlug === "emoji-royale") {
                    const nextAlive = Math.max(1, Number(currentState.aliveCount ?? 6) - 1);
                    updateGameState({ aliveCount: nextAlive });
                  } else if (selectedSlug === "chat-tic-tac-toe") {
                    updateGameState({
                      board: ["", "", "", "", "", "", "", "", ""],
                      turn: "X",
                    });
                  } else if (selectedSlug === "hot-potato") {
                    const rnd =
                      avatars[Math.floor(Math.random() * Math.max(1, avatars.length))];
                    updateGameState({
                      holder: rnd?.displayName || "Zeyad K",
                      holderAvatar: rnd?.avatarUrl || "/avatars/a3.png",
                      holderFrame: rnd?.frameSlug || "stormfang-wolf",
                      fuseSec: Math.max(0, Number(currentState.fuseSec ?? 12) - 3),
                    });
                  } else {
                    updateGameState({ bpm: Number(currentState.bpm || 128) === 128 ? 145 : 128 });
                  }
                }}
                className="flex-1 rounded-xl bg-brand-cyan py-2.5 text-xs font-black text-slate-950"
              >
                ⚡ Trigger Live Game Action
              </button>
              <button
                type="button"
                onClick={() =>
                  updateGameState({
                    aliveCount: 8,
                    fuseSec: 15,
                    board: ["", "", "", "", "", "", "", "", ""],
                  })
                }
                className="rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </div>

      </>
      )}

      {/* OverlayLive Game Store — all overlays */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-extrabold text-foreground">🏪 Game Store — all {STORE_OVERLAYS.length} OverlayLive overlays</h3>
            <p className="text-xs text-muted-foreground">
              {STORE_OVERLAYS.filter((o) => o.status === "ready").length} ready to use now · {STORE_OVERLAYS.filter((o) => o.status === "soon").length} coming next. Free / Pro labels will be added once the plan list is confirmed.
            </p>
          </div>
        </div>
        {(["Stats & Info", "Gifts", "Games", "Community"] as const).map((grp) => (
          <div key={grp} className="mb-4 last:mb-0">
            <div className="mb-2 text-[11px] font-extrabold uppercase tracking-wider text-muted-foreground">{grp}</div>
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {STORE_OVERLAYS.filter((o) => o.group === grp).map((o) => {
                const ready = o.status === "ready";
                const active = selectedSlug === o.slug;
                return (
                  <button
                    key={o.slug}
                    type="button"
                    disabled={!ready}
                    onClick={() => ready && setSelectedSlug(o.slug)}
                    title={o.designs.length ? `Designs: ${o.designs.join(", ")}` : undefined}
                    className={`flex items-start gap-3 rounded-xl border p-3 text-left transition ${
                      active
                        ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan"
                        : ready
                          ? "border-border bg-secondary/25 hover:border-brand-cyan/50"
                          : "cursor-not-allowed border-border/60 bg-secondary/10 opacity-60"
                    }`}
                  >
                    <span className="text-2xl leading-none">{o.emoji}</span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-xs font-extrabold text-foreground">{o.title}</span>
                        <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-black uppercase ${ready ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground"}`}>
                          {ready ? "Ready" : "Soon"}
                        </span>
                      </span>
                      <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-muted-foreground">{o.description}</span>
                      {o.designs.length > 0 && (
                        <span className="mt-1 block text-[9px] font-bold text-brand-cyan">{o.designs.length} design{o.designs.length > 1 ? "s" : ""}</span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Searchable store controls. The original catalog remains untouched. */}
      <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-foreground">Game Store</h3>
            <p className="mt-1 text-xs text-muted-foreground">Search and filter all existing Tikley games by category.</p>
          </div>
          <span className="rounded-xl border border-emerald-400/25 bg-emerald-500/10 px-3 py-2 text-xs font-extrabold text-emerald-300">{visibleGames.length} / {FREE_GAMES_CATALOG.length} · FREE</span>
        </div>
        <div className="mb-4 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-secondary/30 px-3 py-2.5">
            <span className="text-muted-foreground">⌕</span>
            <input value={storeSearch} onChange={(event) => setStoreSearch(event.target.value)} placeholder="Search games, features or LIVE triggers..." aria-label="Search games" className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground" />
            {storeSearch && <button type="button" onClick={() => setStoreSearch("")} className="text-xs font-bold text-brand-cyan">Clear</button>}
          </label>
          <button type="button" aria-pressed={storeFreeOnly} onClick={() => setStoreFreeOnly((value) => !value)} className={`rounded-xl border px-4 py-2.5 text-xs font-extrabold transition ${storeFreeOnly ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-300" : "border-border bg-secondary/30 text-muted-foreground"}`}>
            {storeFreeOnly ? "✓ Free games only" : "Show all access types"}
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {storeCategories.map((category) => {
            const count = category.id === "all" ? FREE_GAMES_CATALOG.length : FREE_GAMES_CATALOG.filter((game) => game.category === category.id).length;
            return <button key={category.id} type="button" aria-pressed={storeCategory === category.id} onClick={() => setStoreCategory(category.id)} className={`shrink-0 rounded-full border px-3.5 py-2 text-xs font-bold transition ${storeCategory === category.id ? "border-brand-cyan bg-brand-cyan/15 text-brand-cyan" : "border-border bg-secondary/30 text-muted-foreground hover:border-brand-cyan/40 hover:text-foreground"}`}>{category.label} <span className="ml-1 opacity-70">{count}</span></button>;
          })}
        </div>
      </section>

      {/* All Live Overlays catalog */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-extrabold text-foreground">
            🕹️ All {FREE_GAMES_CATALOG.length} Live Overlays (click one to set it up and preview it)
          </h3>
          <span className="text-xs text-muted-foreground">
            Works in OBS Studio &amp; TikTok LIVE Studio
          </span>
        </div>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visibleGames.map((g) => {
            const active = selectedSlug === g.slug;
            return (
              <div
                key={g.slug}
                onClick={() => setSelectedSlug(g.slug)}
                className={`group cursor-pointer rounded-2xl border p-4 transition-all ${
                  active
                    ? "border-brand-cyan bg-brand-cyan/[0.08] shadow-[0_8px_28px_-8px_rgba(40,199,250,0.45)]"
                    : "border-border bg-card hover:border-brand-cyan/40"
                }`}
              >
                <div className="mb-3 flex items-start justify-between gap-2">
                  <div
                    className="grid h-11 w-11 place-items-center rounded-xl p-2 ring-1 ring-white/15"
                    style={{
                      background: `linear-gradient(135deg, ${g.accentFrom}33, ${g.accentTo}33)`,
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={g.keySvg}
                      alt={g.title}
                      className="h-7 w-7 object-contain"
                    />
                  </div>
                  <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[10px] font-extrabold text-emerald-300 ring-1 ring-emerald-400/30">
                    {g.badge}
                  </span>
                </div>

                <h4 className="text-sm font-extrabold text-foreground group-hover:text-brand-cyan">
                  {g.title}
                </h4>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {g.subtitle}
                </p>

                <div className="mt-3 flex items-center justify-between border-t border-border/70 pt-2.5 text-[11px]">
                  <span className="inline-flex items-center gap-1 font-semibold text-muted-foreground">
                    <Flame className="h-3 w-3 text-orange-400" />
                    {g.triggerLabel}
                  </span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyGameOverlay(g.slug, g.title);
                    }}
                    className="font-bold text-brand-cyan hover:underline"
                  >
                    {copiedSlug === g.slug ? "Copied!" : "Copy URL"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
        {visibleGames.length === 0 && (
          <div className="mt-3 rounded-2xl border border-dashed border-border p-8 text-center">
            <div className="text-2xl">🎮</div>
            <p className="mt-2 text-sm font-bold text-foreground">No games match these filters</p>
            <p className="mt-1 text-xs text-muted-foreground">Try another category or clear your search.</p>
            <button type="button" onClick={() => { setStoreSearch(""); setStoreCategory("all"); setStoreFreeOnly(true); }} className="mt-3 rounded-lg bg-brand-cyan px-3 py-2 text-xs font-black text-slate-950">Reset filters</button>
          </div>
        )}
      </div>
    </div>
  );
}
