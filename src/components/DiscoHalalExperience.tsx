"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Copy, ExternalLink, Music2, Radio, RotateCcw, Users } from "lucide-react";

type LiveViewer = {
  id: string;
  name: string;
  username: string;
  avatar: string;
  score: number;
  coins: number;
  likes: number;
  role: string;
  move: "dance" | "spin" | "jump" | "spotlight";
  color: string;
  gift?: string;
};

type LiveEvent = {
  id: number;
  eventType: string;
  username?: string;
  displayName?: string;
  avatarUrl?: string;
  giftName?: string;
  coins?: number;
  likes?: number;
  message?: string;
};

type OverlayPayload = {
  profile?: {
    connectionStatus?: string;
    liveSessionId?: string | null;
    displayName?: string;
    tiktokHandle?: string;
  };
  avatars?: Array<{
    id: number;
    displayName: string;
    tiktokUsername: string;
    avatarUrl: string;
    role?: string;
    coinsTotal?: number;
    likesTotal?: number;
  }>;
  events?: LiveEvent[];
};

const COLORS = ["#fb4acb", "#39d9ff", "#ffc857", "#a78bfa", "#55e6a5", "#ff785e"];
export function DiscoHalalExperience({ preview = false }: { preview?: boolean }) {
  const [payload, setPayload] = useState<OverlayPayload | null>(null);
  const [dancers, setDancers] = useState<LiveViewer[]>([]);
  const [energy, setEnergy] = useState(18);
  const [lastEvent, setLastEvent] = useState("Waiting for the first dancer…");
  const [copied, setCopied] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());
  const sessionRef = useRef<string | null>(null);
  const initialized = useRef(false);

  const sync = useCallback(async () => {
    try {
      const response = await fetch("/api/overlay/state?target=disco-halal", { cache: "no-store" });
      if (!response.ok) return;
      const next = (await response.json()) as OverlayPayload;
      setPayload(next);
      const session = next.profile?.liveSessionId || null;
      if (sessionRef.current !== session) {
        sessionRef.current = session;
        seenIds.current.clear();
        initialized.current = false;
        setDancers([]);
        setEnergy(18);
      }
      const isLive = next.profile?.connectionStatus === "live";
      if (!isLive) {
        if (!preview) setDancers([]);
        return;
      }
      const events = [...(next.events || [])].sort((a, b) => a.id - b.id);
      if (!initialized.current) {
        events.forEach((event) => seenIds.current.add(event.id));
        initialized.current = true;
        return;
      }
      const fresh = events.filter((event) => !seenIds.current.has(event.id));
      if (!fresh.length) return;
      fresh.forEach((event) => seenIds.current.add(event.id));
      if (seenIds.current.size > 500) seenIds.current = new Set([...seenIds.current].slice(-250));
      setDancers((current) => {
        let updated = [...current];
        for (const event of fresh) {
          const kind = String(event.eventType || "").toLowerCase();
          const name = event.username || event.displayName || "LIVE Viewer";
          const existingIndex = updated.findIndex((viewer) => viewer.username.toLowerCase() === name.toLowerCase());
          const avatar = event.avatarUrl || next.avatars?.find((item) => item.tiktokUsername.toLowerCase() === name.toLowerCase())?.avatarUrl || "/avatars/a1.png";
          const move = kind === "gift" ? "spotlight" : kind === "share" ? "spin" : kind === "like" ? "jump" : "dance";
          const color = COLORS[Math.abs(name.length * 7) % COLORS.length];
          if (existingIndex >= 0) {
            const old = updated[existingIndex];
            updated[existingIndex] = {
              ...old,
              avatar,
              score: old.score + Math.max(1, Number(event.coins || event.likes || 1)),
              coins: old.coins + Number(event.coins || 0),
              likes: old.likes + Number(event.likes || 0),
              move,
              gift: event.giftName || old.gift,
            };
          } else if (["join", "follow", "share", "gift", "like", "chat"].includes(kind)) {
            updated.push({
              id: name.toLowerCase(),
              name: event.displayName || name.replace(/^@/, ""),
              username: name,
              avatar,
              score: Math.max(1, Number(event.coins || event.likes || 1)),
              coins: Number(event.coins || 0),
              likes: Number(event.likes || 0),
              role: "DANCER",
              move,
              color,
              gift: event.giftName,
            });
          }
          setLastEvent(kind === "gift" ? `🎁 ${event.displayName || name} sent ${event.giftName || "a gift"}` : kind === "like" ? `💗 ${event.displayName || name} sent likes` : `✨ ${event.displayName || name} joined the party`);
          if (kind === "gift") setEnergy((value) => Math.min(100, value + Math.max(5, Math.min(24, Number(event.coins || 5) / 20))));
          else setEnergy((value) => Math.min(100, value + 2));
        }
        return updated.slice(-18);
      });
    } catch {
      // A transient OBS network error should not stop the animation loop.
    }
  }, [preview]);

  useEffect(() => {
    void sync();
    const timer = window.setInterval(() => void sync(), 2200);
    return () => window.clearInterval(timer);
  }, [sync]);

  const isLive = payload?.profile?.connectionStatus === "live";
  const visibleDancers = useMemo(() => {
    if (dancers.length || !preview) return dancers;
    return [
      { id: "demo-1", name: "DJ Nova", username: "@dj_nova", avatar: "/avatars/a1.png", score: 250, coins: 25, likes: 0, role: "VIP", move: "spotlight" as const, color: COLORS[0] },
      { id: "demo-2", name: "Luna", username: "@luna_live", avatar: "/avatars/a4.png", score: 120, coins: 0, likes: 120, role: "DANCER", move: "spin" as const, color: COLORS[1] },
      { id: "demo-3", name: "Rami", username: "@rami_pro", avatar: "/avatars/a7.png", score: 80, coins: 0, likes: 80, role: "DANCER", move: "jump" as const, color: COLORS[2] },
    ];
  }, [dancers, preview]);

  const copyOverlay = async () => {
    const url = `${window.location.origin}/overlay/disco-halal`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copy OBS browser source URL", url);
    }
  };

  const resetPreview = () => {
    setDancers([]);
    setEnergy(18);
    seenIds.current.clear();
    initialized.current = false;
  };

  return (
    <div className={preview ? "min-h-full rounded-2xl border border-white/10 bg-[#090817] p-4 text-white" : "fixed inset-0 overflow-hidden bg-[#080615] text-white"}>
      <style jsx>{`
        .club-scene { perspective: 1000px; isolation: isolate; background: radial-gradient(ellipse at 50% 18%, rgba(126,42,180,.42), transparent 48%), linear-gradient(180deg,#120b29 0%,#080615 68%); }
        .club-floor { position:absolute; left:-25%; right:-25%; bottom:-22%; height:65%; transform:rotateX(62deg); transform-origin:bottom; background-image:linear-gradient(rgba(255,255,255,.11) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.11) 1px,transparent 1px); background-size:58px 58px; background-color:rgba(22,13,47,.75); box-shadow:0 -30px 80px rgba(211,40,255,.22); }
        .beam { position:absolute; top:-15%; width:18%; height:90%; filter:blur(22px); opacity:.28; transform-origin:top; animation:sweep 6s ease-in-out infinite alternate; }
        .beam.one { left:13%; background:linear-gradient(180deg,#ff39d2,transparent); transform:rotate(22deg); }
        .beam.two { right:15%; background:linear-gradient(180deg,#26d9ff,transparent); transform:rotate(-20deg); animation-delay:-2s; }
        .dancer { animation:bob 1.2s ease-in-out infinite; transform-style:preserve-3d; }
        .dancer.spin { animation:spinDance 2.2s ease-in-out infinite; }
        .dancer.jump { animation:jumpDance .75s ease-in-out infinite; }
        .dancer.spotlight { animation:spotDance .9s ease-in-out infinite; }
        @keyframes bob { 0%,100%{transform:translateY(0) rotate(-3deg)} 50%{transform:translateY(-12px) rotate(3deg)} }
        @keyframes spinDance { 0%,100%{transform:rotateY(-24deg) translateY(0)} 50%{transform:rotateY(24deg) translateY(-15px)} }
        @keyframes jumpDance { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-26px) scale(1.04)} }
        @keyframes spotDance { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-18px) scale(1.08)} }
        @keyframes sweep { from{opacity:.12;filter:blur(24px)} to{opacity:.42;filter:blur(12px)} }
        .equalizer span { display:block; width:4px; border-radius:4px; background:linear-gradient(#ff54d8,#42dfff); animation:eq .55s ease-in-out infinite alternate; }
        .equalizer span:nth-child(2){animation-delay:-.2s}.equalizer span:nth-child(3){animation-delay:-.35s}.equalizer span:nth-child(4){animation-delay:-.1s}
        @keyframes eq { to{height:5px} }
      `}</style>
      <div className={preview ? "relative h-[min(72vh,760px)] min-h-[480px] overflow-hidden rounded-xl club-scene" : "absolute inset-0 club-scene"}>
        <div className="beam one" /><div className="beam two" />
        <div className="absolute inset-x-0 top-0 z-20 flex items-start justify-between p-4 sm:p-7">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.28em] text-fuchsia-200"><Music2 size={14}/> Tikley presents</div>
            <div className="mt-1 text-2xl font-black tracking-tight sm:text-4xl">DISCO <span className="text-fuchsia-400">HALAL</span></div>
            <div className="mt-1 text-[10px] font-semibold tracking-[.2em] text-white/55">LIVE COMMUNITY DANCE FLOOR</div>
          </div>
          <div className="rounded-xl border border-white/15 bg-black/35 px-3 py-2 text-right backdrop-blur-md">
            <div className="flex items-center justify-end gap-1.5 text-[10px] font-black uppercase tracking-wider">{isLive ? <><span className="h-2 w-2 animate-pulse rounded-full bg-rose-500"/> LIVE</> : preview ? "PREVIEW MODE" : "WAITING FOR LIVE"}</div>
            <div className="mt-1 flex items-center justify-end gap-2 text-xs font-bold"><Users size={13}/>{visibleDancers.length} dancers</div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[18%] z-10 flex flex-col items-center">
          <div className="rounded-full border border-fuchsia-300/30 bg-fuchsia-500/10 px-4 py-1 text-[10px] font-black tracking-[.3em] text-fuchsia-100 shadow-[0_0_40px_rgba(232,60,255,.28)]">THE HALAL CLUB</div>
          <div className="mt-2 flex items-center gap-2 text-[10px] font-bold text-white/55"><span className="equalizer flex h-5 items-end gap-1"><span style={{height:14}}/><span style={{height:20}}/><span style={{height:11}}/><span style={{height:17}}/></span> PARTY ENERGY {Math.round(energy)}%</div>
        </div>
        <div className="club-floor"/>
        <div className="absolute inset-x-0 bottom-[15%] z-10 flex flex-wrap items-end justify-center gap-x-3 gap-y-7 px-3 sm:gap-x-7">
          {visibleDancers.map((dancer, index) => (
            <div key={dancer.id} className={`dancer ${dancer.move} relative flex w-[76px] flex-col items-center sm:w-[104px]`} style={{animationDelay:`${index * -0.17}s`, zIndex: 20 + index}}>
              <div className="absolute -inset-3 rounded-full opacity-50 blur-xl" style={{background:dancer.color}}/>
              <div className="relative mb-2 rounded-full p-[3px]" style={{background:`linear-gradient(135deg,${dancer.color},#fff,${dancer.color})`,boxShadow:`0 0 24px ${dancer.color}88`}}>
                <img src={dancer.avatar} alt="" className="h-14 w-14 rounded-full border-2 border-[#160d2b] object-cover sm:h-[76px] sm:w-[76px]"/>
                {dancer.coins >= 100 && <span className="absolute -right-2 -top-2 rounded-full bg-amber-300 px-1.5 py-0.5 text-[8px] font-black text-black">VIP</span>}
              </div>
              <div className="relative max-w-full truncate rounded-full border border-white/15 bg-black/60 px-2.5 py-1 text-[10px] font-extrabold shadow-lg backdrop-blur">{dancer.name}</div>
              <div className="mt-1 text-[9px] font-black" style={{color:dancer.color}}>{dancer.gift ? `🎁 ${dancer.gift}` : dancer.role}</div>
              <div className="mt-1 text-[9px] font-bold text-white/55">★ {dancer.score.toLocaleString()}</div>
            </div>
          ))}
        </div>
        <div className="absolute inset-x-0 bottom-0 z-20 flex items-center justify-between gap-3 border-t border-white/10 bg-black/45 px-4 py-3 backdrop-blur-md sm:px-7">
          <div className="min-w-0 truncate text-xs font-bold text-white/80">{lastEvent}</div>
          <div className="shrink-0 text-[9px] font-black tracking-[.18em] text-fuchsia-200">DANCE • GIFT • REPEAT</div>
        </div>
        {!isLive && !preview && <div className="absolute inset-0 z-30 grid place-items-center bg-black/35 backdrop-blur-[2px]"><div className="rounded-2xl border border-white/15 bg-black/65 px-6 py-5 text-center shadow-2xl"><Radio className="mx-auto mb-2 text-fuchsia-300" size={28}/><div className="text-sm font-black">Waiting for your TikTok LIVE</div><div className="mt-1 text-xs text-white/55">The dance floor activates only when the real LIVE session is connected.</div></div></div>}
      </div>
      {preview && <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs text-white/55">Real LIVE events: joins, gifts, likes and shares · updates every 2.2 seconds</div>
        <div className="flex gap-2">
          <button type="button" onClick={resetPreview} className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/10"><RotateCcw size={13}/> Reset preview</button>
          <button type="button" onClick={copyOverlay} className="inline-flex items-center gap-2 rounded-lg bg-fuchsia-500 px-3 py-2 text-xs font-black text-white hover:bg-fuchsia-400"><Copy size={13}/>{copied ? "Copied!" : "Copy OBS URL"}</button>
          <a href="/overlay/disco-halal" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border border-white/15 px-3 py-2 text-xs font-bold hover:bg-white/10"><ExternalLink size={13}/> Open overlay</a>
        </div>
      </div>}
    </div>
  );
}
