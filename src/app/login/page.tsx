"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
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
        setError(response.status === 429 ? "Too many attempts. Try again later." : "Invalid email or password.");
        return;
      }
      const next = search.get("next");
      router.replace(next?.startsWith("/") && !next.startsWith("//") ? next : "/dashboard");
      router.refresh();
    } catch {
      setError("Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-white">
      <form onSubmit={submit} className="w-full max-w-sm space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div><p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Tikley Security</p><h1 className="mt-2 text-2xl font-bold">Admin sign in</h1><p className="mt-1 text-sm text-slate-400">Sign in to manage your LIVE overlays.</p></div>
        <label className="block text-sm">Email<input required type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        <label className="block text-sm">Password<input required type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" /></label>
        {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
        <button disabled={busy} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-50">{busy ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}
