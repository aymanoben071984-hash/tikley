"use client";

/**
 * Renders an OverlayLive Top Lists theme exactly like the original: the theme's
 * template.html + style.css go into a shadow DOM and its renderer.js
 * (window.ThemeRenderer) fills in ranks, names, avatars and scores.
 */
import { accentOverrideCss, olTheme, stackedCss, supportsStacked } from "@/lib/olThemes";
import React, { useEffect, useLayoutEffect, useRef, useState } from "react";

export interface ThemeEntry {
  nickname: string;
  score: number;
  avatar: string;
}

interface ThemeRenderer {
  mount: (el: HTMLElement) => void;
  update: (rows: ThemeEntry[]) => void;
  setVisibleRanks?: (n: number) => void;
  unmount?: () => void;
}

const VERSION = "?v=1";
const fileCache = new Map<string, Promise<{ html: string; css: string }>>();
let scriptChain: Promise<unknown> = Promise.resolve();

function loadFiles(base: string) {
  let p = fileCache.get(base);
  if (!p) {
    p = (async () => {
      let last: unknown = null;
      for (let i = 0; i < 3; i++) {
        try {
          const [h, c] = await Promise.all([fetch(`${base}/template.html${VERSION}`), fetch(`${base}/style.css${VERSION}`)]);
          if (!h.ok || !c.ok) throw new Error(`HTTP ${h.status}/${c.status}`);
          return { html: await h.text(), css: await c.text() };
        } catch (e) {
          last = e;
          await new Promise((r) => setTimeout(r, 250 * (i + 1)));
        }
      }
      throw last instanceof Error ? last : new Error(String(last));
    })();
    p.catch(() => fileCache.delete(base));
    fileCache.set(base, p);
  }
  return p;
}

/** renderer.js publishes window.ThemeRenderer — load scripts one at a time so boards don't clash. */
function loadRenderer(base: string): Promise<{ renderer: ThemeRenderer | undefined; script: HTMLScriptElement }> {
  const run = scriptChain.then(
    () =>
      new Promise<{ renderer: ThemeRenderer | undefined; script: HTMLScriptElement }>((resolve, reject) => {
        const w = window as unknown as { ThemeRenderer?: ThemeRenderer };
        delete w.ThemeRenderer;
        const s = document.createElement("script");
        s.src = `${base}/renderer.js${VERSION}`;
        s.onload = () => {
          const r = w.ThemeRenderer;
          delete w.ThemeRenderer;
          resolve({ renderer: r, script: s });
        };
        s.onerror = () => reject(new Error(`renderer.js failed to load for ${base}`));
        document.body.appendChild(s);
      }),
  );
  scriptChain = run.catch(() => undefined);
  return run;
}

interface ThemeBoardProps {
  themeId: string;
  entries: ThemeEntry[];
  count: number;
  kind: "likes" | "gifts";
  accent?: string | null;
  orientation?: "horizontal" | "stacked";
  direction?: "ltr" | "rtl";
}

export function ThemeBoard({ themeId, entries, count, kind, accent, orientation = "horizontal", direction = "ltr" }: ThemeBoardProps) {
  const theme = olTheme(themeId);
  const hostRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const rendererRef = useRef<ThemeRenderer | null>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;
  const countRef = useRef(count);
  countRef.current = count;
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const stacked = orientation === "stacked" && !!theme && supportsStacked(theme.key);

  // (re)build the theme when the design changes
  useEffect(() => {
    if (!theme || !hostRef.current) return;
    let alive = true;
    setReady(false);
    setError(null);
    const base = `/themes/top-lists/${theme.base}`;
    (async () => {
      try {
        if (rendererRef.current?.unmount) {
          try {
            rendererRef.current.unmount();
          } catch {
            /* ignore */
          }
        }
        rendererRef.current = null;
        scriptRef.current?.remove();
        const { html, css } = await loadFiles(base);
        if (!alive || !hostRef.current) return;
        const root = shadowRef.current ?? hostRef.current.attachShadow({ mode: "open" });
        shadowRef.current = root;
        root.replaceChildren();
        const fa = document.createElement("link");
        fa.rel = "stylesheet";
        fa.href = "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css";
        root.appendChild(fa);
        const style = document.createElement("style");
        style.dataset.themeStyle = theme.key;
        style.textContent = css.replace(/:root\b/g, ":host");
        root.appendChild(style);
        const extra = stackedCss(theme.key);
        if (extra) {
          const st = document.createElement("style");
          st.textContent = extra;
          root.appendChild(st);
        }
        const over = document.createElement("style");
        over.dataset.lbOverrides = "1";
        root.appendChild(over);
        const content = document.createElement("div");
        content.style.visibility = "hidden";
        content.innerHTML = html;
        root.appendChild(content);
        contentRef.current = content;
        const { renderer, script } = await loadRenderer(base);
        if (!alive) {
          script.remove();
          return;
        }
        scriptRef.current = script;
        if (renderer) {
          renderer.mount(content);
          renderer.setVisibleRanks?.(Math.max(1, countRef.current));
          renderer.update(entriesRef.current.slice(0, countRef.current));
          rendererRef.current = renderer;
        }
        content.style.visibility = "";
        setReady(true);
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      }
    })();
    return () => {
      alive = false;
    };
  }, [theme]);

  // attributes: direction, orientation, kind, country
  useEffect(() => {
    const w = contentRef.current?.querySelector("#theme-wrapper");
    if (!w || !theme) return;
    w.setAttribute("data-direction", direction);
    w.setAttribute("data-orientation", stacked ? "stacked" : "horizontal");
    w.setAttribute("data-widget-type", kind === "likes" ? "top_likes" : "top_gifters");
    if (theme.country) w.setAttribute("data-country", theme.country);
  }, [ready, direction, stacked, kind, theme]);

  // accent colour overrides
  useEffect(() => {
    const over = shadowRef.current?.querySelector("style[data-lb-overrides]");
    if (over && theme) over.textContent = accent ? accentOverrideCss(theme.key, accent) : "";
  }, [ready, accent, theme]);

  // live data
  useEffect(() => {
    const r = rendererRef.current;
    if (!r || !ready) return;
    r.setVisibleRanks?.(Math.max(1, count));
    r.update(entries.slice(0, count));
  }, [entries, count, ready]);

  useEffect(
    () => () => {
      if (rendererRef.current?.unmount) {
        try {
          rendererRef.current.unmount();
        } catch {
          /* ignore */
        }
      }
      scriptRef.current?.remove();
    },
    [],
  );

  // fit width
  const outerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useLayoutEffect(() => {
    const o = outerRef.current;
    if (!o || !theme) return;
    const fit = () => {
      const natural = stacked ? 340 : theme.width;
      const avail = o.clientWidth || natural;
      setZoom(Math.max(0.2, Math.min(1, avail / natural)));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(o);
    return () => ro.disconnect();
  }, [theme, stacked]);

  if (!theme) return null;
  return (
    <div ref={outerRef} className="w-full">
      <div style={{ width: stacked ? 340 : theme.width, zoom, margin: "0 auto" }}>
        <div ref={hostRef} data-ol-theme={theme.key} />
        {error && <div className="p-3 text-center text-xs text-rose-300">Theme failed to load ({error}).</div>}
      </div>
    </div>
  );
}
