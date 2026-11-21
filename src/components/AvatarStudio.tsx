"use client";

import type { AvatarPreset } from "@/db/schema";
import { AnimatedOverlayName, FramedAvatar } from "@/components/FramedAvatar";
import {
  AVATAR_FRAMES,
  NAME_ANIMATIONS,
  REFERENCE_AVATARS,
  type AvatarFrameItem,
} from "@/lib/catalog";
import {
  Check,
  Copy,
  Crown,
  Play,
  Plus,
  Search,
  Sparkles,
  Trash2,
  UserCheck,
} from "lucide-react";
import React, { useMemo, useState } from "react";

interface AvatarStudioProps {
  presets: AvatarPreset[];
  onCreatePreset: (payload: Record<string, unknown>) => Promise<void>;
  onUpdateProfileAvatar: (avatarUrl: string, avatarFrame: string) => Promise<void>;
  onDeletePreset: (id: number) => Promise<void>;
  onFireEntrance: (payload: {
    displayName: string;
    username: string;
    avatarUrl: string;
    avatarFrame: string;
    message: string;
  }) => Promise<void>;
  onCopyUrl: (path: string, label: string) => void;
}

const CATEGORIES: Array<"All" | AvatarFrameItem["category"]> = [
  "All",
  "Mythic & Dragons",
  "Kawaii & Pastel",
  "Cyber & Arcade",
  "Celestial & Royal",
  "Nature & Cozy",
  "Action & Elemental",
];

export function AvatarStudio({
  presets,
  onCreatePreset,
  onUpdateProfileAvatar,
  onDeletePreset,
  onFireEntrance,
  onCopyUrl,
}: AvatarStudioProps) {
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState<string>("/avatars/a1.png");
  const [selectedFrameSlug, setSelectedFrameSlug] = useState<string>("ember-dragon");
  const [selectedAnim, setSelectedAnim] = useState<string>("aurora");
  const [customName, setCustomName] = useState<string>("Ava Stone");
  const [customHandle, setCustomHandle] = useState<string>("@yourname");
  const [customRole, setCustomRole] = useState<string>("vip");
  const [welcomeMsg, setWelcomeMsg] = useState<string>("entered the LIVE in style!");
  const [glowColor, setGlowColor] = useState<string>("#ff7a18");
  const [categoryFilter, setCategoryFilter] = useState<"All" | AvatarFrameItem["category"]>("All");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const filteredFrames = useMemo(() => {
    return AVATAR_FRAMES.filter((f) => {
      const matchesCat = categoryFilter === "All" || f.category === categoryFilter;
      const matchesSearch =
        !searchQuery.trim() ||
        f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        f.slug.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesSearch;
    });
  }, [categoryFilter, searchQuery]);

  const activeFrameObj =
    AVATAR_FRAMES.find((f) => f.slug === selectedFrameSlug) ?? AVATAR_FRAMES[0];

  return (
    <div className="space-y-6">
      {/* Studio Banner */}
      <div className="rounded-2xl border border-border bg-gradient-to-r from-orange-950/40 via-card to-cyan-950/40 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-orange/15 text-brand-orange ring-1 ring-brand-orange/35">
              <Crown className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-foreground">
                  Avatars &amp; 68 Ornate Frame Designer
                </h2>
                <span className="rounded-full bg-brand-cyan/20 px-2.5 py-0.5 text-[11px] font-extrabold text-brand-cyan ring-1 ring-brand-cyan/30">
                  17 AVATARS · 68 FRAMES · 20 ANIMATIONS
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Design VIP, Superfan, Top Gifter and Streamer avatars with genuine pixel-calibrated frames and particle halos for TikTok LIVE Studio &amp; OBS.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onCopyUrl("/overlay/follow-join", "VIP Avatar Entrance Overlay");
              setCopied(true);
              setTimeout(() => setCopied(false), 1800);
            }}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan px-4 py-2 text-xs font-bold text-white shadow hover:brightness-110"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
            Copy VIP Avatar Overlay URL
          </button>
        </div>
      </div>

      {/* Live Preview Stage + Builder Form */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="checkerboard-stage relative flex flex-col items-center justify-between rounded-2xl border border-border p-6">
          <div className="flex w-full items-center justify-between text-xs">
            <span className="inline-flex items-center gap-1.5 font-extrabold uppercase tracking-wider text-cyan-300">
              <Sparkles className="h-3.5 w-3.5" />
              Live Framed Avatar Stage
            </span>
            <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
              {activeFrameObj.name} · {activeFrameObj.category}
            </span>
          </div>

          <div className="my-6 flex flex-col items-center">
            <FramedAvatar
              avatarUrl={selectedAvatarUrl}
              frameSlug={selectedFrameSlug}
              size={188}
              glowColor={glowColor}
              showSignatureFx
            />

            <div className="mt-4 text-center">
              <span className="rounded-full bg-amber-400/20 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest text-amber-300 ring-1 ring-amber-400/35">
                {customRole}
              </span>
              <div className="mt-1.5 text-2xl font-black text-white">
                <AnimatedOverlayName text={customName || "Ava Stone"} animation={selectedAnim} />
              </div>
              <div className="text-xs font-medium text-cyan-300">{customHandle}</div>
              <div className="mt-1 text-xs text-white/75">{welcomeMsg}</div>
            </div>
          </div>

          {/* Night Owl Supporter Nameplate Reference Strip */}
          <div className="relative w-full max-w-sm overflow-hidden rounded-xl border border-white/10 bg-black/40 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/marketing/widgets/plate-night-owl.webp"
              alt="Night Owl Supporter Nameplate"
              className="mx-auto h-14 w-auto object-contain"
            />
          </div>

          <div className="mt-4 flex w-full flex-wrap gap-2">
            <button
              type="button"
              onClick={() =>
                onFireEntrance({
                  displayName: customName,
                  username: customHandle,
                  avatarUrl: selectedAvatarUrl,
                  avatarFrame: selectedFrameSlug,
                  message: welcomeMsg,
                })
              }
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-black text-slate-950 shadow hover:brightness-110"
            >
              <Play className="h-3.5 w-3.5" />
              Test Live Entrance on Stream
            </button>
            <button
              type="button"
              onClick={() => onUpdateProfileAvatar(selectedAvatarUrl, selectedFrameSlug)}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/15 px-3.5 py-2.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/25"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Equip on My Profile
            </button>
          </div>
        </div>

        {/* Customizer Controls */}
        <div className="space-y-4 rounded-2xl border border-border bg-card p-5">
          <h3 className="text-sm font-extrabold text-foreground">
            ✨ Customize Avatar Identity, Animation &amp; VIP Role
          </h3>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Display Name
              </label>
              <input
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-brand-cyan"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                TikTok @Username
              </label>
              <input
                value={customHandle}
                onChange={(e) => setCustomHandle(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-brand-cyan"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Badge / Role
              </label>
              <select
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
              >
                <option value="vip">VIP Regular</option>
                <option value="superfan">Superfan</option>
                <option value="top_gifter">Top #1 Gifter</option>
                <option value="moderator">Moderator</option>
                <option value="creator">Creator</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Halo Glow Color
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-background px-2.5 py-1.5">
                <input
                  type="color"
                  value={glowColor}
                  onChange={(e) => setGlowColor(e.target.value)}
                  className="h-6 w-8 cursor-pointer rounded border-0 bg-transparent"
                />
                <span className="font-mono text-xs text-muted-foreground">{glowColor}</span>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">
                Entrance Text
              </label>
              <input
                value={welcomeMsg}
                onChange={(e) => setWelcomeMsg(e.target.value)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none"
              />
            </div>
          </div>

          {/* 20 Name Animations */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              Live Nameplate Animation (All 20 Reference Styles)
            </label>
            <div className="flex flex-wrap gap-1.5">
              {NAME_ANIMATIONS.map((anim) => (
                <button
                  key={anim}
                  type="button"
                  onClick={() => setSelectedAnim(anim)}
                  className={`rounded-lg px-2.5 py-1 text-[11px] font-bold capitalize transition ${
                    selectedAnim === anim
                      ? "bg-brand-cyan text-slate-950 shadow"
                      : "bg-secondary/60 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {anim}
                </button>
              ))}
            </div>
          </div>

          {/* All 17 Reference Avatars Picker */}
          <div>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              All 17 Reference Avatars (Click to select)
            </label>
            <div className="grid grid-cols-6 gap-2 sm:grid-cols-9">
              {REFERENCE_AVATARS.map((av) => (
                <button
                  key={av.id}
                  type="button"
                  title={`${av.name} (${av.handle})`}
                  onClick={() => {
                    setSelectedAvatarUrl(av.url);
                    setCustomName(av.name);
                    setCustomHandle(av.handle);
                    setSelectedFrameSlug(av.defaultFrame);
                    const fr = AVATAR_FRAMES.find((f) => f.slug === av.defaultFrame);
                    if (fr) setGlowColor(fr.glow);
                  }}
                  className={`group relative overflow-hidden rounded-full p-0.5 transition ${
                    selectedAvatarUrl === av.url
                      ? "ring-2 ring-brand-cyan scale-105"
                      : "opacity-80 hover:opacity-100"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={av.url}
                    alt={av.name}
                    className="aspect-square w-full rounded-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() =>
              onCreatePreset({
                displayName: customName,
                tiktokUsername: customHandle,
                avatarUrl: selectedAvatarUrl,
                frameSlug: selectedFrameSlug,
                nameAnimation: selectedAnim,
                role: customRole,
                glowColor,
                welcomeMessage: welcomeMsg,
                coinsTotal: 1500,
              })
            }
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-cyan py-2.5 text-xs font-black text-white shadow hover:brightness-110"
          >
            <Plus className="h-4 w-4" />
            Save VIP Framed Avatar Preset to Database
          </button>
        </div>
      </div>

      {/* All 68 Avatar Frames Complete Vault */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-foreground">
              🖼️ All 68 Ornate Avatar Frames Vault ({filteredFrames.length} shown)
            </h3>
            <p className="text-xs text-muted-foreground">
              Click any frame to preview it live on {customName} and use it across Leaderboards, Join Alerts, Gift Alerts &amp; Games.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search 68 frames (dragon, cat, neon...)"
              className="w-full rounded-xl border border-border bg-background pl-8 pr-3 py-1.5 text-xs outline-none focus:border-brand-cyan"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="mb-4 flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition ${
                categoryFilter === cat
                  ? "bg-brand-cyan text-slate-950"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {filteredFrames.map((frame) => {
            const isSelected = selectedFrameSlug === frame.slug;
            return (
              <button
                key={frame.slug}
                type="button"
                onClick={() => {
                  setSelectedFrameSlug(frame.slug);
                  setGlowColor(frame.glow);
                }}
                className={`group relative flex flex-col items-center rounded-2xl border p-3 transition ${
                  isSelected
                    ? "border-brand-cyan bg-brand-cyan/10 ring-1 ring-brand-cyan"
                    : "border-border/70 bg-secondary/25 hover:border-brand-cyan/50 hover:bg-secondary/50"
                }`}
              >
                {frame.hasSignatureFx && (
                  <span className="absolute right-1.5 top-1.5 rounded bg-amber-400/20 px-1 py-0.2 text-[9px] font-extrabold text-amber-300">
                    FX
                  </span>
                )}
                <FramedAvatar
                  avatarUrl={selectedAvatarUrl}
                  frameSlug={frame.slug}
                  size={74}
                  glowColor={frame.glow}
                  showSignatureFx={false}
                />
                <span className="mt-2 line-clamp-1 text-[11px] font-bold text-foreground">
                  {frame.name}
                </span>
                <span className="text-[9px] text-muted-foreground">FREE</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved VIP & Community Roster */}
      <div className="rounded-2xl border border-border bg-card p-5">
        <h3 className="mb-3 text-base font-black text-foreground">
          👑 Saved VIP, Superfan &amp; Community Framed Avatars ({presets.length})
        </h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {presets.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between gap-2.5 rounded-2xl border border-border bg-secondary/25 p-3"
            >
              <div className="flex min-w-0 items-center gap-2.5">
                <FramedAvatar
                  avatarUrl={p.avatarUrl}
                  frameSlug={p.frameSlug}
                  size={56}
                  glowColor={p.glowColor}
                  showSignatureFx={false}
                />
                <div className="min-w-0">
                  <div className="truncate text-xs font-extrabold text-foreground">
                    {p.displayName}
                  </div>
                  <div className="truncate text-[11px] text-brand-cyan">
                    {p.tiktokUsername}
                  </div>
                  <div className="text-[10px] text-amber-300 font-bold">
                    🪙 {p.coinsTotal.toLocaleString()} · {p.frameSlug}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button
                  type="button"
                  title="Fire Live Entrance"
                  onClick={() =>
                    onFireEntrance({
                      displayName: p.displayName,
                      username: p.tiktokUsername,
                      avatarUrl: p.avatarUrl,
                      avatarFrame: p.frameSlug,
                      message: p.welcomeMessage,
                    })
                  }
                  className="rounded-lg bg-brand-cyan/20 p-1.5 text-brand-cyan hover:bg-brand-cyan/30"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  title="Remove Preset"
                  onClick={() => onDeletePreset(p.id)}
                  className="rounded-lg bg-red-500/15 p-1.5 text-red-400 hover:bg-red-500/25"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
