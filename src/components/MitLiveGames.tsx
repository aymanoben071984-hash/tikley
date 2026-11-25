"use client";
import React, { useEffect, useRef } from "react";

type Mode = "halay" | "arena";
type Viewer = { name: string; avatar?: string; score?: number; mass?: number; action?: string; lastGift?: string };
export function MitLiveGameCanvas({ mode, state }: { mode: Mode; state: Record<string, unknown> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewersRef = useRef<Viewer[]>([]);
  const simRef = useRef<Array<Viewer & { x: number; y: number; vx: number; vy: number }>>([]);
  const imagesRef = useRef<Map<string, HTMLImageElement>>(new Map());
  useEffect(() => {
    const key = mode === "halay" ? "dancers" : "players";
    const incoming = Array.isArray(state[key]) ? (state[key] as Viewer[]) : [];
    viewersRef.current = incoming.filter((v) => v && typeof v.name === "string").slice(-40);
    if (mode === "arena") {
      const previous = new Map(simRef.current.map((p) => [p.name.toLowerCase(), p]));
      simRef.current = viewersRef.current.map((v, i) => {
        const old = previous.get(v.name.toLowerCase());
        let seed = 0;
        for (const ch of v.name) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
        return { ...v, x: old?.x ?? 0.12 + ((seed + i * 73) % 760) / 1000, y: old?.y ?? 0.12 + ((seed * 3 + i * 41) % 700) / 1000, vx: old?.vx ?? 0.02, vy: old?.vy ?? -0.018 };
      });
    }
  }, [mode, state]);
  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0, last = 0, elapsed = 0, w = 1, h = 1;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = Math.max(320, rect.width); h = Math.max(260, rect.height);
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
    observer?.observe(canvas);
    const imageFor = (url: string) => {
      if (!url || (!url.startsWith("/") && !url.startsWith("https://") && !url.startsWith("http://"))) return null;
      let img = imagesRef.current.get(url);
      if (!img) { img = new Image(); img.crossOrigin = "anonymous"; img.src = url; imagesRef.current.set(url, img); }
      return img.complete && img.naturalWidth > 0 ? img : null;
    };
    const drawAvatar = (v: Viewer, x: number, y: number, r: number, glow: string) => {
      ctx.save(); ctx.shadowColor = glow; ctx.shadowBlur = 15; ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(x, y, r + 3, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
      let hue = 0; for (const ch of v.name) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
      ctx.fillStyle = "hsl(" + hue + " 65% 42%)"; ctx.fillRect(x-r, y-r, r*2, r*2);
      const img = imageFor(v.avatar || "");
      if (img) ctx.drawImage(img, x-r, y-r, r*2, r*2);
      else { ctx.fillStyle = "#fff"; ctx.font = "800 " + Math.max(12,r) + "px system-ui"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(v.name.slice(0,1).toUpperCase(),x,y); }
      ctx.restore();
    };
    const drawHalay = (time: number) => {
      const bpm = Math.max(80, Math.min(180, Number(state.bpm || 105)));
      const dancers = viewersRef.current.slice(0, 12);
      const beat = time * bpm / 60 * Math.PI * 2;
      const bg = ctx.createLinearGradient(0,0,w,h); bg.addColorStop(0,"#160d35"); bg.addColorStop(.55,"#111a3b"); bg.addColorStop(1,"#071c2b");
      ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);
      for(let i=0;i<4;i++){ const x=w*(.12+i*.25)+Math.sin(time*.8+i*2)*w*.08; const g=ctx.createLinearGradient(x,0,x,h); g.addColorStop(0,"rgba(255,210,63,.18)"); g.addColorStop(1,"rgba(168,85,247,0)"); ctx.fillStyle=g; ctx.beginPath(); ctx.moveTo(x-18,0);ctx.lineTo(x+18,0);ctx.lineTo(x+w*.16,h);ctx.lineTo(x-w*.16,h);ctx.fill(); }
      ctx.fillStyle="rgba(168,85,247,.18)";ctx.fillRect(0,h*.68,w,h*.32);
      const gap=Math.min(72,w*.82/Math.max(1,dancers.length-1)), start=w/2-(dancers.length-1)*gap/2;
      ctx.strokeStyle="#ffd23f";ctx.lineWidth=5;ctx.lineCap="round";ctx.beginPath();
      dancers.forEach((d,i)=>{const u=dancers.length>1?(i/(dancers.length-1))*2-1:0;const x=start+i*gap;const y=h*.69-Math.cos(u*1.15)*h*.075-Math.abs(Math.sin(beat+i*.55))*12;if(i===0)ctx.moveTo(x,y-24);else ctx.lineTo(x,y-24);});ctx.stroke();
      dancers.forEach((d,i)=>{const u=dancers.length>1?(i/(dancers.length-1))*2-1:0;const x=start+i*gap;const bounce=Math.abs(Math.sin(beat+i*.55))*15;const y=h*.69-Math.cos(u*1.15)*h*.075-bounce;const leader=i===0;
        ctx.strokeStyle="#d8e4ff";ctx.lineWidth=5;const leg=Math.sin(beat+i)*10;ctx.beginPath();ctx.moveTo(x-7,y+10);ctx.lineTo(x-11+leg,y+34);ctx.moveTo(x+7,y+10);ctx.lineTo(x+11-leg,y+34);ctx.stroke();
        ctx.fillStyle=leader?"#fbbf24":"#8b5cf6";ctx.beginPath();ctx.roundRect(x-13,y-16,26,34,8);ctx.fill();drawAvatar(d,x,y-36,17,leader?"#fbbf24":"#d946ef");
        ctx.fillStyle=leader?"#fcd34d":"#fff";ctx.font="700 11px system-ui";ctx.textAlign="center";ctx.fillText(d.name.slice(0,12),x,y+53);
        if(leader){ctx.font="22px system-ui";ctx.fillText("👑",x,y-62);ctx.fillStyle="#fff";ctx.beginPath();ctx.moveTo(x-18,y-12);ctx.quadraticCurveTo(x-45+Math.sin(beat*1.7)*8,y-48,x-30,y-67);ctx.quadraticCurveTo(x-5,y-42,x-18,y-12);ctx.fill();}
      });
      ctx.fillStyle="#f0abfc";ctx.font="800 18px system-ui";ctx.textAlign="center";ctx.fillText("HALAY PARTY · "+dancers.length+"/24 · "+Math.round(bpm)+" BPM",w/2,30);
      if(!dancers.length){ctx.fillStyle="rgba(255,255,255,.8)";ctx.font="600 14px system-ui";ctx.fillText("Waiting for viewers to join the dance",w/2,h*.48);}
    };
    const drawArena = (dt: number) => {
      const players=simRef.current;
      const bg=ctx.createRadialGradient(w/2,h/2,10,w/2,h/2,Math.max(w,h)*.75);bg.addColorStop(0,"#202b43");bg.addColorStop(1,"#080d18");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      ctx.strokeStyle="rgba(148,163,184,.10)";ctx.lineWidth=1;for(let x=0;x<w;x+=40){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,h);ctx.stroke();}for(let y=0;y<h;y+=40){ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
      for(let i=0;i<players.length;i++){const p=players[i];let target:typeof p|undefined;let best=Infinity;for(let j=0;j<players.length;j++){if(i===j)continue;const q=players[j];const dist=Math.hypot(q.x-p.x,q.y-p.y);if(dist<best&&dist>.01){best=dist;target=q;}}
        if(target){const bigger=Number(target.mass||100)>Number(p.mass||100)*1.12;const dx=target.x-p.x,dy=target.y-p.y,len=Math.max(1,Math.hypot(dx,dy));const dir=bigger?-1:1;p.vx+=dx/len*dir*dt*.035;p.vy+=dy/len*dir*dt*.035;}
        p.vx*=.992;p.vy*=.992;p.x=Math.max(.06,Math.min(.94,p.x+p.vx*dt));p.y=Math.max(.08,Math.min(.86,p.y+p.vy*dt));
      }
      for(let i=players.length-1;i>=0;i--){for(let j=i-1;j>=0;j--){const a=players[i],b=players[j];const ar=Math.max(20,Math.min(54,13+Math.sqrt(Number(a.mass||100))*.68));const br=Math.max(20,Math.min(54,13+Math.sqrt(Number(b.mass||100))*.68));const dist=Math.hypot((a.x-b.x)*w,(a.y-b.y)*h);if(dist<(ar+br)*.42){if(Number(a.mass||100)>Number(b.mass||100)*1.2){a.mass=Math.min(4000,Number(a.mass||100)+Number(b.mass||100)*.55);players.splice(j,1);i--;}else if(Number(b.mass||100)>Number(a.mass||100)*1.2){b.mass=Math.min(4000,Number(b.mass||100)+Number(a.mass||100)*.55);players.splice(i,1);break;}}}}
      for(const p of players){const r=Math.max(20,Math.min(54,13+Math.sqrt(Number(p.mass||100))*.68));const x=p.x*w,y=p.y*h;drawAvatar(p,x,y,r,"#22d3ee");ctx.fillStyle="#fff";ctx.font="700 11px system-ui";ctx.textAlign="center";ctx.fillText(p.name.slice(0,13),x,y+r+14);ctx.fillStyle="#fcd34d";ctx.font="700 10px system-ui";ctx.fillText(Math.round(Number(p.mass||100))+" pts",x,y+r+27);}
      const king=[...players].sort((a,b)=>Number(b.mass||0)-Number(a.mass||0))[0];ctx.fillStyle="#fbbf24";ctx.font="800 18px system-ui";ctx.textAlign="center";ctx.fillText("AVATAR ARENA · LAST AVATAR STANDING",w/2,28);if(king){ctx.font="700 12px system-ui";ctx.fillText("👑 Leader: "+king.name,w/2,50);}else{ctx.fillStyle="#fff";ctx.font="600 14px system-ui";ctx.fillText("Join with a comment, like or gift to enter",w/2,h/2);}
    };
    const loop=(stamp:number)=>{const dt=last?Math.min(.05,(stamp-last)/1000):0;last=stamp;elapsed+=dt;if(mode==="halay")drawHalay(elapsed);else drawArena(dt);raf=requestAnimationFrame(loop);};
    raf=requestAnimationFrame(loop);
    return()=>{cancelAnimationFrame(raf);observer?.disconnect();};
  },[mode,state]);
  return <div className="w-full overflow-hidden rounded-2xl border border-white/15 bg-slate-950 shadow-[0_18px_45px_rgba(0,0,0,.45)]">
    <canvas ref={canvasRef} className="block h-[380px] w-full sm:h-[440px]" aria-label={mode==="halay"?"Halay dance party":"Avatar arena battle"} />
    <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-[10px] font-semibold text-white/70">
      <span>{mode==="halay"?"MIT adaptation · !dance / !jump / !spin / gifts":"MIT adaptation · comments / likes / gifts grow avatars"}</span>
      <span>{mode==="halay"?"Dance chain · live BPM":"Larger avatars absorb smaller ones"}</span>
    </div>
  </div>;
}
