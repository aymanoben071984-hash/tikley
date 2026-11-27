"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Check, Clock3, Eye, EyeOff, Play, RotateCcw, SkipForward } from "lucide-react";

type PictureQuestion = {
  id: string;
  category: string;
  prompt: string;
  answer: string;
  options: [string, string, string, string];
  correctIndex: number;
  image: string;
  fact: string;
};

const QUESTION_BANK: PictureQuestion[] = [
  { id: "country-egypt", category: "البلدان", prompt: "أي بلد يظهر في الصورة؟", answer: "مصر", options: ["مصر", "المغرب", "الأردن", "العراق"], correctIndex: 0, image: "https://images.unsplash.com/photo-1539650116574-75c0c6d73f6e?w=1200&auto=format&fit=crop&q=85", fact: "تشتهر مصر بأهرامات الجيزة ونهر النيل." },
  { id: "country-france", category: "البلدان", prompt: "في أي بلد يقع هذا المعلم؟", answer: "فرنسا", options: ["إيطاليا", "فرنسا", "إسبانيا", "البرتغال"], correctIndex: 1, image: "https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1200&auto=format&fit=crop&q=85", fact: "يقع برج إيفل في العاصمة الفرنسية باريس." },
  { id: "country-japan", category: "البلدان", prompt: "ما البلد الذي تشتهر بهذه المناظر؟", answer: "اليابان", options: ["الصين", "كوريا الجنوبية", "اليابان", "تايلاند"], correctIndex: 2, image: "https://images.unsplash.com/photo-1493976001445-7d7a764b8f4b?w=1200&auto=format&fit=crop&q=85", fact: "تشتهر اليابان بأزهار الساكورا وجبل فوجي." },
  { id: "food-couscous", category: "الأكلات", prompt: "ما اسم هذه الأكلة؟", answer: "الكسكسي", options: ["الباييلا", "الكسكسي", "البرياني", "المنسف"], correctIndex: 1, image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=1200&auto=format&fit=crop&q=85", fact: "الكسكسي من الأطباق المعروفة في بلدان المغرب العربي." },
  { id: "food-pizza", category: "الأكلات", prompt: "من أي مطبخ جاءت هذه الأكلة؟", answer: "المطبخ الإيطالي", options: ["المطبخ التركي", "المطبخ المكسيكي", "المطبخ الإيطالي", "المطبخ الهندي"], correctIndex: 2, image: "https://images.unsplash.com/photo-157 pizza".replace("photo-157 pizza","photo-1579751626657-72bc17010498") + "?w=1200&auto=format&fit=crop&q=85", fact: "تُعد البيتزا من أشهر أطباق المطبخ الإيطالي." },
  { id: "food-sushi", category: "الأكلات", prompt: "ما اسم هذا الطبق الياباني؟", answer: "السوشي", options: ["السوشي", "الرامن", "التاكو", "الديم سم"], correctIndex: 0, image: "https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=1200&auto=format&fit=crop&q=85", fact: "يُحضّر السوشي غالباً بالأرز مع مكونات متنوعة مثل السمك والخضروات." },
  { id: "religion-quran", category: "أسئلة دينية", prompt: "ما اسم الكتاب المقدّس عند المسلمين؟", answer: "القرآن الكريم", options: ["الإنجيل", "التوراة", "القرآن الكريم", "الزبور"], correctIndex: 2, image: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=1200&auto=format&fit=crop&q=85", fact: "القرآن الكريم هو كتاب الإسلام." },
  { id: "religion-kaaba", category: "أسئلة دينية", prompt: "إلى أي مدينة يتجه المسلمون في الصلاة؟", answer: "مكة المكرمة", options: ["المدينة المنورة", "القدس", "مكة المكرمة", "الطائف"], correctIndex: 2, image: "https://images.unsplash.com/photo-1564769625905-50e93615e769?w=1200&auto=format&fit=crop&q=85", fact: "الكعبة المشرفة في المسجد الحرام بمكة المكرمة هي قبلة المسلمين." },
  { id: "religion-month", category: "أسئلة دينية", prompt: "في أي شهر يصوم المسلمون؟", answer: "رمضان", options: ["شعبان", "رمضان", "شوّال", "محرّم"], correctIndex: 1, image: "https://images.unsplash.com/photo-1519817650390-64a93db51149?w=1200&auto=format&fit=crop&q=85", fact: "صيام شهر رمضان ركن من أركان الإسلام." },
  { id: "culture-space", category: "ثقافة عامة", prompt: "ما اسم الكوكب المعروف بالكوكب الأحمر؟", answer: "المريخ", options: ["الزهرة", "المشتري", "عطارد", "المريخ"], correctIndex: 3, image: "https://images.unsplash.com/photo-1614728263952-84ea256f9679?w=1200&auto=format&fit=crop&q=85", fact: "يبدو المريخ مائلاً إلى اللون الأحمر بسبب أكاسيد الحديد على سطحه." },
  { id: "culture-books", category: "ثقافة عامة", prompt: "من مؤلف رواية البؤساء؟", answer: "فيكتور هوغو", options: ["فيكتور هوغو", "تشارلز ديكنز", "ألكسندر دوما", "ليو تولستوي"], correctIndex: 0, image: "https://images.unsplash.com/photo-1507842217343-583bb7270b66?w=1200&auto=format&fit=crop&q=85", fact: "نشر فيكتور هوغو رواية البؤساء سنة 1862." },
  { id: "culture-music", category: "ثقافة عامة", prompt: "ما الآلة الموسيقية الظاهرة في الصورة؟", answer: "البيانو", options: ["الكمان", "العود", "البيانو", "التشيلو"], correctIndex: 2, image: "https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?w=1200&auto=format&fit=crop&q=85", fact: "يصدر البيانو الصوت عند ضغط مفاتيحه التي تحرّك مطارقاً تضرب الأوتار." },
];

const CATEGORIES = ["البلدان", "الأكلات", "أسئلة دينية", "ثقافة عامة", "مختلط"];
const DEFAULTS = { category: "مختلط", duration: 20, revealEvery: 4, questionCount: 10, currentQuestionIndex: 0, startedAt: 0, revealed: false, answerIndex: -1 };

type Props = {
  state: Record<string, unknown>;
  interactive?: boolean;
  onUpdateState?: (patch: Record<string, unknown>) => void;
};

export function PictureQuizStage({ state, interactive = false, onUpdateState }: Props) {
  const settings = { ...DEFAULTS, ...state } as typeof DEFAULTS;
  const category = String(state.category || DEFAULTS.category);
  const questions = useMemo(() => {
    const filtered = category === "مختلط" ? QUESTION_BANK : QUESTION_BANK.filter((q) => q.category === category);
    return filtered.length ? filtered : QUESTION_BANK;
  }, [category]);
  const index = Math.abs(Number(state.currentQuestionIndex || 0)) % questions.length;
  const question = questions[index];
  const duration = Math.max(5, Math.min(90, Number(state.duration || DEFAULTS.duration)));
  const revealEvery = Math.max(1, Math.min(15, Number(state.revealEvery || DEFAULTS.revealEvery)));
  const startedAt = Number(state.startedAt || 0);
  const [now, setNow] = useState(Date.now());
  const [selected, setSelected] = useState<number | null>(null);
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, []);
  useEffect(() => setSelected(null), [index, startedAt]);
  const elapsed = startedAt ? Math.max(0, (now - startedAt) / 1000) : 0;
  const timeLeft = startedAt ? Math.max(0, duration - elapsed) : duration;
  const revealLevel = startedAt ? Math.min(4, Math.floor(elapsed / revealEvery)) : 0;
  const finished = Boolean(state.revealed) || (startedAt > 0 && timeLeft <= 0);
  const blur = finished ? 0 : Math.max(0, 22 - revealLevel * 5.5);
  const progress = startedAt ? Math.min(100, (elapsed / duration) * 100) : 0;
  const update = (patch: Record<string, unknown>) => onUpdateState?.(patch);

  return (
    <section dir="rtl" className="mx-auto w-full max-w-2xl overflow-hidden rounded-3xl border border-cyan-300/20 bg-[#080d1d] text-white shadow-[0_20px_60px_rgba(0,0,0,.5)]">
      <div className="flex items-center justify-between gap-3 bg-gradient-to-l from-cyan-500/20 via-indigo-500/15 to-fuchsia-500/20 px-4 py-3">
        <div><div className="text-[10px] font-black tracking-[.18em] text-cyan-200">TIKLEY • تحدّي الصور</div><div className="mt-1 text-sm font-black">{question.category} · السؤال {index + 1} / {questions.length}</div></div>
        <div className={`flex items-center gap-2 rounded-xl border px-3 py-2 font-mono text-lg font-black ${timeLeft <= 5 && startedAt && !finished ? "border-rose-400/50 bg-rose-500/20 text-rose-200" : "border-white/10 bg-black/30 text-white"}`}><Clock3 size={17}/>{String(Math.ceil(timeLeft)).padStart(2, "0")}s</div>
      </div>
      <div className="p-4 sm:p-5">
        <div className="mb-3 flex items-center justify-between gap-2"><h3 className="text-base font-black sm:text-lg">{question.prompt}</h3><span className="rounded-full bg-white/10 px-3 py-1 text-[10px] font-bold text-cyan-100">تظهر الصورة تدريجياً</span></div>
        <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-white/15 bg-slate-900">
          <img src={question.image} alt="صورة السؤال" className="h-full w-full object-cover transition-all duration-700" style={{ filter: `blur(${blur}px) brightness(${finished ? 1 : 0.78}) saturate(${finished ? 1 : 0.7})`, transform: `scale(${1.08 - revealLevel * 0.015})` }} />
          {!finished && <div className="absolute inset-0 bg-gradient-to-t from-black/35 via-transparent to-black/10"/>}
          <div className="absolute bottom-3 right-3 flex gap-1.5">{[0,1,2,3].map((n)=><span key={n} className={`h-1.5 w-8 rounded-full ${n < revealLevel ? "bg-cyan-300" : "bg-white/35"}`}/>)}</div>
          {finished && <div className="absolute left-3 top-3 rounded-lg bg-emerald-400 px-3 py-1 text-xs font-black text-slate-950">الإجابة: {question.answer}</div>}
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2">
          {question.options.map((option, i) => <button key={option} type="button" disabled={!interactive || !startedAt || finished} onClick={() => setSelected(i)} className={`min-h-12 rounded-xl border px-3 py-2 text-sm font-bold transition ${selected === i ? "border-cyan-300 bg-cyan-400/20 text-cyan-100" : "border-white/10 bg-white/[.05] hover:bg-white/10"} ${finished && i === question.correctIndex ? "border-emerald-400 bg-emerald-500/20 text-emerald-200" : ""}`}>{["أ","ب","ج","د"][i]} · {option}</button>)}
        </div>
        {finished && <div className="mt-3 rounded-xl border border-emerald-400/25 bg-emerald-500/10 p-3 text-sm"><div className="font-black text-emerald-200">أحسنت! الإجابة الصحيحة: {question.answer}</div><p className="mt-1 text-xs leading-6 text-white/70">{question.fact}</p></div>}
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-l from-cyan-300 to-fuchsia-400 transition-all duration-200" style={{width: `${progress}%`}}/></div>
        {interactive && <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="text-[11px] font-bold text-white/70">الفئة<select value={category} onChange={(e)=>update({category:e.target.value,currentQuestionIndex:0,startedAt:0,revealed:false})} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-xs text-white">{CATEGORIES.map((v)=><option key={v}>{v}</option>)}</select></label>
            <label className="text-[11px] font-bold text-white/70">وقت الإجابة<select value={duration} onChange={(e)=>update({duration:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-xs text-white">{[10,15,20,30,45,60,90].map(v)=><option key={v} value={v}>{v} ثانية</option>)}</select></label>
            <label className="text-[11px] font-bold text-white/70">سرعة كشف الصورة<select value={revealEvery} onChange={(e)=>update({revealEvery:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-xs text-white">{[2,3,4,5,7,10].map(v)=><option key={v} value={v}>كل {v} ثوانٍ</option>)}</select></label>
            <label className="text-[11px] font-bold text-white/70">عدد الأسئلة<select value={Number(state.questionCount || 10)} onChange={(e)=>update({questionCount:Number(e.target.value)})} className="mt-1 w-full rounded-lg border border-white/15 bg-slate-900 px-2 py-2 text-xs text-white">{[5,10,15,20].map(v)=><option key={v} value={v}>{v} أسئلة</option>)}</select></label>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={()=>update({startedAt:Date.now(),revealed:false,answerIndex:-1})} className="inline-flex items-center gap-2 rounded-xl bg-cyan-400 px-4 py-2.5 text-xs font-black text-slate-950 hover:bg-cyan-300"><Play size={14}/> ابدأ السؤال</button>
            <button type="button" onClick={()=>update({revealed:true})} className="inline-flex items-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-500/15 px-4 py-2.5 text-xs font-bold text-emerald-200"><Eye size={14}/> كشف الإجابة</button>
            <button type="button" onClick={()=>update({currentQuestionIndex:index+1,startedAt:0,revealed:false})} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-xs font-bold"><SkipForward size={14}/> السؤال التالي</button>
            <button type="button" onClick={()=>update({currentQuestionIndex:0,startedAt:0,revealed:false})} className="inline-flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/70"><RotateCcw size={14}/> إعادة الجولة</button>
          </div>
          <p className="text-[10px] leading-5 text-white/45">تُحفظ الإعدادات في إعدادات اللعبة، ويظهر العدّ التنازلي وكشف الصورة في معاينة البث ونافذة OBS.</p>
        </div>}
      </div>
    </section>
  );
}
