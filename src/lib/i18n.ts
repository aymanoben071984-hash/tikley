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

const phraseTranslations: Record<string, Partial<Record<Locale, string>>> = {
  "TOP LIKERS": { ar: "أفضل المتفاعلين بالإعجابات", fr: "TOP LIKEURS", de: "TOP LIKER", tr: "EN ÇOK BEĞENİ GÖNDERENLER", es: "TOP LIKERS", it: "TOP LIKERS" },
  "TOP GIFTERS": { ar: "أفضل المهدين", fr: "TOP DONATEURS", de: "TOP GESCHENKGEBER", tr: "EN ÇOK HEDİYE GÖNDERENLER", es: "TOP REGALADORES", it: "TOP DONATORI" },
  "TOP SHARERS": { ar: "أفضل المشاركين", fr: "TOP PARTAGES", de: "TOP GETEILTE", tr: "EN ÇOK PAYLAŞANLAR", es: "TOP COMPARTIDOS", it: "TOP CONDIVISIONI" },
  "WEEKLY SUPPORTERS": { ar: "داعمون هذا الأسبوع", fr: "SOUTIENS DE LA SEMAINE", de: "UNTERSTÜTZER DER WOCHE", tr: "HAFTANIN DESTEKÇİLERİ", es: "APOYOS DE LA SEMANA", it: "SOSTENITORI SETTIMANALI" },
  "ALL-TIME LEGENDS": { ar: "أساطير كل الأوقات", fr: "LÉGENDES DE TOUS LES TEMPS", de: "LEGENDEN ALLER ZEITEN", tr: "TÜM ZAMANLARIN EFSANELERİ", es: "LEYENDAS DE TODOS LOS TIEMPOS", it: "LEGGENDE DI SEMPRE" },
  "Daily Coin Goal": { ar: "هدف العملات اليومي", fr: "Objectif quotidien de pièces", de: "Tägliches Münzziel", tr: "Günlük jeton hedefi", es: "Meta diaria de monedas", it: "Obiettivo giornaliero di monete" },
  "Cinema Gift Action": { ar: "تأثير الهدية السينمائي", fr: "Action cadeau cinéma", de: "Kino-Geschenkaktion", tr: "Sinematik hediye efekti", es: "Acción de regalo cinematográfica", it: "Azione regalo cinematografica" },
  "New Gift Alert": { ar: "تنبيه هدية جديدة", fr: "Alerte nouveau cadeau", de: "Alarm: neues Geschenk", tr: "Yeni hediye uyarısı", es: "Alerta de nuevo regalo", it: "Avviso nuovo regalo" },
  "sent": { ar: "أرسل", fr: "a envoyé", de: "sendete", tr: "gönderdi", es: "envió", it: "ha inviato" },
  "coins": { ar: "عملات", fr: "pièces", de: "Münzen", tr: "jeton", es: "monedas", it: "monete" },
  "left": { ar: "متبقية", fr: "restantes", de: "übrig", tr: "kaldı", es: "restantes", it: "rimanenti" },
  "Latest Prize:": { ar: "آخر جائزة:", fr: "Dernier prix :", de: "Letzter Preis:", tr: "Son ödül:", es: "Último premio:", it: "Ultimo premio:" },
  "Waiting for viewers to join the dance floor…": { ar: "في انتظار انضمام المشاهدين إلى ساحة الرقص…", fr: "En attente des spectateurs sur la piste de danse…", de: "Warte auf Zuschauer auf der Tanzfläche…", tr: "İzleyicilerin dans pistine katılması bekleniyor…", es: "Esperando a que los espectadores se unan a la pista…", it: "In attesa che gli spettatori entrino in pista…" },
  "Game Store": { ar: "متجر الألعاب", fr: "Boutique de jeux", de: "Spiele-Shop", tr: "Oyun mağazası", es: "Tienda de juegos", it: "Negozio giochi" },
  "Search and filter all existing Tikley games by category.": { ar: "ابحث في ألعاب Tikley وصنّفها حسب الفئة.", fr: "Recherchez et filtrez les jeux Tikley par catégorie.", de: "Tikley-Spiele suchen und nach Kategorie filtern.", tr: "Tikley oyunlarını kategoriye göre arayın ve filtreleyin.", es: "Busca y filtra los juegos de Tikley por categoría.", it: "Cerca e filtra i giochi Tikley per categoria." },
  "No games match these filters": { ar: "لا توجد ألعاب تطابق هذه المرشحات", fr: "Aucun jeu ne correspond à ces filtres", de: "Keine Spiele entsprechen diesen Filtern", tr: "Bu filtrelere uygun oyun yok", es: "Ningún juego coincide con estos filtros", it: "Nessun gioco corrisponde a questi filtri" },
  "Try another category or clear your search.": { ar: "جرّب فئة أخرى أو امسح البحث.", fr: "Essayez une autre catégorie ou effacez la recherche.", de: "Versuche eine andere Kategorie oder lösche die Suche.", tr: "Başka bir kategori deneyin veya aramayı temizleyin.", es: "Prueba otra categoría o borra la búsqueda.", it: "Prova un'altra categoria o cancella la ricerca." },
  "Reset filters": { ar: "إعادة ضبط المرشحات", fr: "Réinitialiser les filtres", de: "Filter zurücksetzen", tr: "Filtreleri sıfırla", es: "Restablecer filtros", it: "Reimposta filtri" },
};

const navigationTranslations: Record<string, Partial<Record<Locale, string>>> = {
  "Dashboard": { ar: "لوحة التحكم", fr: "Tableau de bord", de: "Dashboard", tr: "Kontrol paneli", es: "Panel", it: "Dashboard" },
  "Live Room": { ar: "غرفة البث", fr: "Salle LIVE", de: "Live-Raum", tr: "Canlı yayın odası", es: "Sala LIVE", it: "Stanza LIVE" },
  "Performance": { ar: "الأداء", fr: "Performances", de: "Leistung", tr: "Performans", es: "Rendimiento", it: "Prestazioni" },
  "Live Viewers": { ar: "المشاهدون المباشرون", fr: "Spectateurs en direct", de: "Live-Zuschauer", tr: "Canlı izleyiciler", es: "Espectadores en directo", it: "Spettatori live" },
  "Top Lists": { ar: "قوائم المتصدرين", fr: "Classements", de: "Bestenlisten", tr: "Lider tabloları", es: "Clasificaciones", it: "Classifiche" },
  "Goals": { ar: "الأهداف", fr: "Objectifs", de: "Ziele", tr: "Hedefler", es: "Objetivos", it: "Obiettivi" },
  "Gift Alerts": { ar: "تنبيهات الهدايا", fr: "Alertes cadeaux", de: "Geschenkalarm", tr: "Hediye uyarıları", es: "Alertas de regalos", it: "Avvisi regali" },
  "Gift Videos & Actions": { ar: "فيديوهات وتأثيرات الهدايا", fr: "Vidéos et actions cadeaux", de: "Geschenk-Videos & Aktionen", tr: "Hediye videoları ve eylemler", es: "Vídeos y acciones de regalos", it: "Video e azioni regalo" },
  "Follow & Join Alerts": { ar: "تنبيهات المتابعة والانضمام", fr: "Alertes abonnements et arrivées", de: "Follow- und Beitrittsalarme", tr: "Takip ve katılım uyarıları", es: "Alertas de seguidores y entradas", it: "Avvisi follower e ingressi" },
  "Latest Events": { ar: "آخر الأحداث", fr: "Derniers événements", de: "Neueste Ereignisse", tr: "Son etkinlikler", es: "Últimos eventos", it: "Ultimi eventi" },
  "Chat Box": { ar: "صندوق الدردشة", fr: "Boîte de chat", de: "Chat-Feld", tr: "Sohbet kutusu", es: "Caja de chat", it: "Chat" },
  "Link Scenes": { ar: "مشاهد الربط", fr: "Scènes liées", de: "Verknüpfte Szenen", tr: "Bağlantılı sahneler", es: "Escenas vinculadas", it: "Scene collegate" },
  "Avatars & 68 Frames": { ar: "الشخصيات و68 إطاراً", fr: "Avatars et 68 cadres", de: "Avatare & 68 Rahmen", tr: "Avatarlar ve 68 çerçeve", es: "Avatares y 68 marcos", it: "Avatar e 68 cornici" },
  "Live Overlays": { ar: "شاشات البث", fr: "Overlays LIVE", de: "Live-Overlays", tr: "Canlı yayın katmanları", es: "Overlays en directo", it: "Overlay LIVE" },
  "Effects & Rising Hearts": { ar: "التأثيرات والقلوب الصاعدة", fr: "Effets et cœurs animés", de: "Effekte & aufsteigende Herzen", tr: "Efektler ve yükselen kalpler", es: "Efectos y corazones", it: "Effetti e cuori animati" },
  "Flag Hearts": { ar: "قلوب الأعلام", fr: "Cœurs drapeaux", de: "Flaggenherzen", tr: "Bayrak kalpleri", es: "Corazones con banderas", it: "Cuori con bandiere" },
  "TTS & Sound Alerts": { ar: "تحويل النص إلى كلام والتنبيهات الصوتية", fr: "Synthèse vocale et alertes sonores", de: "Sprachausgabe & Tonalarme", tr: "Metin seslendirme ve sesli uyarılar", es: "Texto a voz y alertas sonoras", it: "Sintesi vocale e avvisi audio" },
  "Social Media": { ar: "وسائل التواصل", fr: "Réseaux sociaux", de: "Soziale Medien", tr: "Sosyal medya", es: "Redes sociales", it: "Social media" },
  "Branding": { ar: "الهوية البصرية", fr: "Identité visuelle", de: "Markenauftritt", tr: "Marka kimliği", es: "Identidad de marca", it: "Identità del brand" },
  "Stream Notes": { ar: "ملاحظات البث", fr: "Notes du direct", de: "Stream-Notizen", tr: "Yayın notları", es: "Notas del directo", it: "Note della diretta" },
  "Background Library": { ar: "مكتبة الخلفيات", fr: "Bibliothèque d’arrière-plans", de: "Hintergrundbibliothek", tr: "Arka plan kitaplığı", es: "Biblioteca de fondos", it: "Libreria sfondi" },
  "Quran Recitation": { ar: "تلاوة القرآن", fr: "Récitation du Coran", de: "Koranrezitation", tr: "Kur'an tilaveti", es: "Recitación del Corán", it: "Recitazione del Corano" },
  "9:16 & 16:9 Display": { ar: "العرض 9:16 و16:9", fr: "Affichage 9:16 et 16:9", de: "Anzeige 9:16 & 16:9", tr: "9:16 ve 16:9 görünüm", es: "Pantalla 9:16 y 16:9", it: "Schermo 9:16 e 16:9" },
  "TikTok Studio & OBS": { ar: "TikTok Studio وOBS", fr: "TikTok Studio et OBS", de: "TikTok Studio & OBS", tr: "TikTok Studio ve OBS", es: "TikTok Studio y OBS", it: "TikTok Studio e OBS" },
  "Settings": { ar: "الإعدادات", fr: "Paramètres", de: "Einstellungen", tr: "Ayarlar", es: "Configuración", it: "Impostazioni" },
};

const dashboardTranslations: Record<string, Partial<Record<Locale, string>>> = {
  "Guide · OBS & LIVE Studio": { ar: "دليل OBS وLIVE Studio", fr: "Guide · OBS et LIVE Studio", de: "Anleitung · OBS & LIVE Studio", tr: "Rehber · OBS ve LIVE Studio", es: "Guía · OBS y LIVE Studio", it: "Guida · OBS e LIVE Studio" },
  "Welcome back": { ar: "مرحباً بعودتك", fr: "Bon retour", de: "Willkommen zurück", tr: "Tekrar hoş geldiniz", es: "Bienvenido de nuevo", it: "Bentornato" },
  "Fire Test Lion": { ar: "إطلاق هدية الأسد التجريبية", fr: "Tester le cadeau Lion", de: "Testgeschenk Löwe auslösen", tr: "Aslan test hediyesini gönder", es: "Probar regalo León", it: "Prova regalo Leone" },
  "Test Mode is running — sample events are flowing to your overlays.": { ar: "الوضع التجريبي يعمل — يتم إرسال أحداث تجريبية إلى الشاشات.", fr: "Le mode test est actif — des événements de démonstration alimentent vos overlays.", de: "Der Testmodus läuft — Beispieldaten werden an deine Overlays gesendet.", tr: "Test modu çalışıyor — örnek etkinlikler katmanlarınıza aktarılıyor.", es: "El modo de prueba está activo: se envían eventos de ejemplo a tus overlays.", it: "La modalità test è attiva: gli eventi di esempio arrivano agli overlay." },
};
export function translateText(locale: Locale, source: string): string {
  return phraseTranslations[source]?.[locale] ?? navigationTranslations[source]?.[locale] ?? dashboardTranslations[source]?.[locale] ?? source;
}
