"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ADMIN_EMAIL = "aymanoben071984@gmail.com";

export default function SetupPage() {
  const router = useRouter();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/auth/bootstrap", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => setAvailable(Boolean(data.available)))
      .catch(() => setAvailable(false));
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 14) {
      setError("Use at least 14 characters for your password.");
      return;
    }
    if (password !== confirm) {
      setError("The passwords do not match.");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch("/api/auth/bootstrap", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-tikley-bootstrap-secret": token,
        },
        body: JSON.stringify({ email: ADMIN_EMAIL, password }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error || "Unable to complete setup.");
        return;
      }
      router.replace("/login?setup=complete");
    } catch {
      setError("Unable to complete setup. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
      <form onSubmit={submit} className="w-full max-w-md space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-8 shadow-2xl">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-400">Tikley Security</p>
          <h1 className="mt-2 text-2xl font-bold">Create your first Admin</h1>
          <p className="mt-1 text-sm text-slate-400">This one-time setup is restricted to the configured account.</p>
        </div>
        {available === null ? (
          <p className="text-sm text-slate-400">Checking setup status…</p>
        ) : !available ? (
          <div role="status" className="rounded-lg border border-amber-400/30 bg-amber-400/10 p-3 text-sm text-amber-200">
            First-admin setup is closed because an account already exists or setup is unavailable.
          </div>
        ) : (
          <>
            <label className="block text-sm">Admin email
              <input readOnly value={ADMIN_EMAIL} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-slate-300" />
            </label>
            <label className="block text-sm">One-time setup token
              <input required type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            <label className="block text-sm">Create password
              <input required minLength={14} maxLength={128} type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            <label className="block text-sm">Confirm password
              <input required minLength={14} maxLength={128} type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="mt-1 w-full rounded-lg border border-white/10 bg-slate-950 px-3 py-2 outline-none focus:border-cyan-400" />
            </label>
            {error && <p role="alert" className="text-sm text-rose-400">{error}</p>}
            <button disabled={busy} className="w-full rounded-lg bg-cyan-500 px-4 py-2.5 font-semibold text-slate-950 disabled:opacity-50">
              {busy ? "Creating Admin…" : "Create Admin account"}
            </button>
          </>
        )}
        <a href="/login" className="block text-center text-sm text-cyan-300 hover:underline">Back to sign in</a>
      </form>
    </main>
  );
}
