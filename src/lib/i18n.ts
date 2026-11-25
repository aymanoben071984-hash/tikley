export const SUPPORTED_LOCALES = ["ar", "fr", "de", "tr", "es", "it", "en"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const LOCALE_META: Record<Locale, { label: string; native: string; dir: "rtl" | "ltr" }> = {
  ar: { label: "Arabic", native: "العربية", dir: "rtl" },
  fr: { label: "French", native: "Français", dir: "ltr" },
  de: { label: "German", native: "Deutsch", dir: "ltr" },
  tr: { label: "Turkish", native: "Türkçe", dir: "ltr" },
  es: { label: "Spanish", native: "Español", dir: "ltr" },
  it: { label: "Italian", native: "Italiano", dir: "ltr" },
  en: { label: "English", native: "English", dir: "ltr" },
};
export const DEFAULT_LOCALE: Locale = "en";
export function normalizeLocale(value: unknown): Locale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)
    ? (value as Locale) : DEFAULT_LOCALE;
}
const messages = {
  en: { dashboard: "Dashboard", settings: "Settings", language: "Language", live: "LIVE ON AIR", waiting: "WAITING FOR LIVE", overview: "Overview", save: "Save", cancel: "Cancel", loading: "Loading…" },
  ar: { dashboard: "لوحة التحكم", settings: "الإعدادات", language: "اللغة", live: "البث مباشر", waiting: "في انتظار البث", overview: "نظرة عامة", save: "حفظ", cancel: "إلغاء", loading: "جارٍ التحميل…" },
  fr: { dashboard: "Tableau de bord", settings: "Paramètres", language: "Langue", live: "EN DIRECT", waiting: "EN ATTENTE DU DIRECT", overview: "Vue d’ensemble", save: "Enregistrer", cancel: "Annuler", loading: "Chargement…" },
  de: { dashboard: "Dashboard", settings: "Einstellungen", language: "Sprache", live: "LIVE", waiting: "WARTET AUF LIVE", overview: "Übersicht", save: "Speichern", cancel: "Abbrechen", loading: "Wird geladen…" },
  tr: { dashboard: "Kontrol Paneli", settings: "Ayarlar", language: "Dil", live: "CANLI YAYIN", waiting: "CANLI YAYIN BEKLENİYOR", overview: "Genel Bakış", save: "Kaydet", cancel: "İptal", loading: "Yükleniyor…" },
  es: { dashboard: "Panel", settings: "Configuración", language: "Idioma", live: "EN DIRECTO", waiting: "ESPERANDO EL DIRECTO", overview: "Resumen", save: "Guardar", cancel: "Cancelar", loading: "Cargando…" },
  it: { dashboard: "Dashboard", settings: "Impostazioni", language: "Lingua", live: "IN DIRETTA", waiting: "IN ATTESA DELLA DIRETTA", overview: "Panoramica", save: "Salva", cancel: "Annulla", loading: "Caricamento…" },
} satisfies Record<Locale, Record<string, string>>;
export type MessageKey = keyof typeof messages.en;
export function translate(locale: Locale, key: MessageKey): string {
  return messages[locale][key] ?? messages.en[key];
}
