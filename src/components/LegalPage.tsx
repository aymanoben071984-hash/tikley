import { OverlayLogo } from "@/components/OverlayLogo";
import Link from "next/link";
import React from "react";

export interface LegalSection {
  id: string;
  title: string;
  body: React.ReactNode;
}

interface LegalPageProps {
  title: string;
  intro: string;
  updated: string;
  sections: LegalSection[];
  current: "terms" | "privacy";
}

export function LegalPage({ title, intro, updated, sections, current }: LegalPageProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/dashboard" aria-label="OverlayLive dashboard">
            <OverlayLogo size={24} boxed showWordmark />
          </Link>
          <nav className="flex items-center gap-1 text-xs font-bold">
            <Link
              href="/terms"
              className={`rounded-lg px-3 py-1.5 ${current === "terms" ? "bg-brand-cyan/15 text-brand-cyan" : "text-muted-foreground hover:text-foreground"}`}
            >
              Terms of Service
            </Link>
            <Link
              href="/privacy"
              className={`rounded-lg px-3 py-1.5 ${current === "privacy" ? "bg-brand-cyan/15 text-brand-cyan" : "text-muted-foreground hover:text-foreground"}`}
            >
              Privacy Policy
            </Link>
            <Link href="/dashboard" className="ms-2 rounded-lg bg-gradient-to-r from-brand-blue to-brand-cyan px-3 py-1.5 text-white">
              Dashboard
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-20 space-y-1 text-xs">
            <div className="mb-2 font-extrabold uppercase tracking-wider text-muted-foreground">On this page</div>
            {sections.map((s) => (
              <a key={s.id} href={`#${s.id}`} className="block rounded-lg px-2 py-1 text-muted-foreground hover:bg-secondary hover:text-foreground">
                {s.title}
              </a>
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-8">
            <div className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-brand-cyan">Legal</div>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">{title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">Last updated: {updated}</p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">{intro}</p>
          </div>

          <div className="space-y-8">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-20">
                <h2 className="text-lg font-extrabold text-foreground">
                  {i + 1}. {s.title}
                </h2>
                <div className="mt-2 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:font-semibold [&_a]:text-brand-cyan [&_li]:ms-5 [&_li]:list-disc [&_strong]:text-foreground">
                  {s.body}
                </div>
              </section>
            ))}
          </div>

          <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-6 text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} OverlayLive. All rights reserved.</span>
            <span className="flex gap-4">
              <Link href="/terms" className="hover:text-foreground">Terms of Service</Link>
              <Link href="/privacy" className="hover:text-foreground">Privacy Policy</Link>
            </span>
          </footer>
        </article>
      </main>
    </div>
  );
}
