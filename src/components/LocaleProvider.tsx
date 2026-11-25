"use client";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, LOCALE_META, normalizeLocale, translate, type Locale, type MessageKey } from "@/lib/i18n";
type LocaleContextValue = { locale: Locale; setLocale: (locale: Locale) => void; t: (key: MessageKey) => string };
const LocaleContext = createContext<LocaleContextValue | null>(null);
export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);
  useEffect(() => {
    const stored = normalizeLocale(window.localStorage.getItem("tikley-locale") || document.cookie.match(/(?:^|; )tikley-locale=([^;]+)/)?.[1]);
    setLocaleState(stored);
  }, []);
  const setLocale = useCallback((next: Locale) => {
    const safe = normalizeLocale(next);
    setLocaleState(safe);
    window.localStorage.setItem("tikley-locale", safe);
    document.cookie = `tikley-locale=${safe}; Path=/; Max-Age=31536000; SameSite=Lax`;
  }, []);
  useEffect(() => {
    const meta = LOCALE_META[locale];
    document.documentElement.lang = locale;
    document.documentElement.dir = meta.dir;
    document.documentElement.dataset.locale = locale;
  }, [locale]);
  const value = useMemo(() => ({ locale, setLocale, t: (key: MessageKey) => translate(locale, key) }), [locale, setLocale]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}
export function useLocale() {
  const value = useContext(LocaleContext);
  if (!value) throw new Error("useLocale must be used inside LocaleProvider");
  return value;
}
export function LanguageSwitcher({ value, onChange, compact = false }: { value?: string; onChange?: (locale: Locale) => void; compact?: boolean }) {
  const context = useLocale();
  const selected = normalizeLocale(value ?? context.locale);
  return <label className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground" aria-label="Language">
    {!compact && <span>{translate(selected, "language")}</span>}
    <select value={selected} onChange={(event) => { const next = normalizeLocale(event.target.value); context.setLocale(next); onChange?.(next); }} className="max-w-[132px] rounded-lg border border-border bg-secondary/70 px-2 py-1.5 text-xs font-bold text-foreground outline-none focus:ring-2 focus:ring-primary">
      {Object.entries(LOCALE_META).filter(([code]) => code !== "en").map(([code, meta]) => <option key={code} value={code}>{meta.native}</option>)}
      <option value="en">English</option>
    </select>
  </label>;
}
