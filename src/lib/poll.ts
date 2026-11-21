/**
 * Polling intervals for overlays and the dashboard.
 *
 * Every poll is one serverless function call on Vercel (Hobby includes
 * 1,000,000 a month). NEXT_PUBLIC_POLL_SCALE multiplies every interval:
 *   1   = default (most responsive)
 *   2   = half the calls (recommended on Vercel Hobby with several overlays)
 * On Vercel the default is 1.5 unless you set it yourself.
 */
const configured = Number(process.env.NEXT_PUBLIC_POLL_SCALE);
const onVercel = Boolean(process.env.NEXT_PUBLIC_VERCEL_ENV);
export const POLL_SCALE = Number.isFinite(configured) && configured > 0 ? Math.min(10, Math.max(0.5, configured)) : onVercel ? 1.5 : 1;

export const pollMs = (base: number) => Math.round(base * POLL_SCALE);

/** True when the page is in a background tab (dashboard pages can skip polling then). */
export const pageHidden = () => typeof document !== "undefined" && document.visibilityState === "hidden";
