"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { LanguageSwitcher, useLocale } from "@/components/LocaleProvider";
import { translateText } from "@/lib/i18n";

export default function LoginPage() {
  const { locale } = useLocale();
  const tx = (value: string) => translateText(locale, value);
  const router = useRouter();

  const [email, setEmail] = useState("aymanoben071984@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!response.ok) {
        setError(response.status === 429 ? tx("Too many attempts. Try again later.") : tx("Invalid email or password."));
        return;
      }
      const next = new URLSearchParams(window.location.search).get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError(tx("Unable to sign in. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white"><div className="absolute right-5 top-5"><LanguageSwitcher compact /></div>
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Tikley Security</p><h1 className="mt-2 text-2xl font-bold">{tx("Admin sign in")}</h1><p className="mt-1 text-sm text-slate-400">{tx("Sign in to manage your LIVE overlays.")}</p></div>
        <label className="block text-sm">{tx("Email")}<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        <label className="block text-sm">{tx("Password")}<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-50">{busy ? tx("Signing in…") : tx("Sign in")}</button>
        <a href="/setup" className="block text-center text-xs text-slate-500 hover:text-cyan-300">First-time Admin setup</a>
      </form>
    </main>
  );
}
