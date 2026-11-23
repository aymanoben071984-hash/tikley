/* Country Flags Top List renderer — shared by every flags-<country> design.
 * Standard ThemeRenderer contract: mount / update / setVisibleRanks / unmount.
 * The loader passes entries as {score, nickname, avatar} (avatar already runs
 * through the app's avatarSrc proxy) and sets data-widget-type + data-country
 * + data-direction on #theme-wrapper before mount. */
(() => {
  const FALLBACK_AVATARS = ["a1.png", "a2.png", "a3.png"]; // in /avatars — /assets/img never existed, so a viewer without a photo showed a broken image
  const RANK_CLASSES = ["first", "second", "third", "fourth", "fifth", "sixth", "seventh"];
  const TWEEN_MS = 1200;

  let root = null;
  let rows = [];
  let visibleRanks = 7;
  let widgetType = "top_likes";
  // Previous score per rank so the tween counts up from the shown value, not 0.
  let shownScores = [];
  let rafIds = [];

  function fmt(n) {
    return (n || 0).toLocaleString();
  }

  function readWidgetType() {
    const wrapper = root && root.querySelector("#theme-wrapper");
    if (wrapper) widgetType = wrapper.getAttribute("data-widget-type") || "top_likes";
  }

  function tween(rankIdx, from, to) {
    const row = rows[rankIdx];
    if (!row || !row.scoreValue) return;
    if (rafIds[rankIdx]) cancelAnimationFrame(rafIds[rankIdx]);
    if (from === to) {
      row.scoreValue.textContent = fmt(to);
      return;
    }
    const start = performance.now();
    const step = (now) => {
      const p = Math.min((now - start) / TWEEN_MS, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      row.scoreValue.textContent = fmt(Math.floor(from + (to - from) * eased));
      if (p < 1) rafIds[rankIdx] = requestAnimationFrame(step);
      else rafIds[rankIdx] = 0;
    };
    rafIds[rankIdx] = requestAnimationFrame(step);
  }

  function burst(rankIdx) {
    const row = rows[rankIdx];
    if (!row || !row.burst) return;
    const coins = widgetType === "top_gifters";
    for (let i = 0; i < 5; i++) {
      const p = document.createElement("span");
      p.className = "float-p";
      // Coins rise as the app's own TikTok coin artwork. The U+1FA99 emoji this
      // used to print is drawn by the OS as a SILVER coin, so a gifter burst
      // looked like the wrong currency next to the gold coin in the score box.
      if (coins) {
        const c = document.createElement("img");
        c.src = "/assets/tiktok-coin.svg";
        c.alt = "";
        p.appendChild(c);
      } else {
        p.textContent = "❤";
      }
      p.style.setProperty("--rx", (Math.random() * 44 - 22).toFixed(0) + "px");
      p.style.setProperty("--rr", (Math.random() * 140 - 70).toFixed(0) + "deg");
      p.style.animationDelay = (i * 0.06).toFixed(2) + "s";
      if (widgetType === "top_likes") p.style.color = "#ff2a6d";
      row.burst.appendChild(p);
      setTimeout(() => p.remove(), 1400 + i * 60);
    }
    // Re-trigger the metric pulse.
    if (row.metric) {
      row.metric.classList.remove("pulse");
      void row.metric.offsetWidth;
      row.metric.classList.add("pulse");
    }
  }

  function mount(holder) {
    root = holder;
    readWidgetType();
    rows = RANK_CLASSES.map((cls) => {
      const bar = holder.querySelector(".rank-bar." + cls);
      if (!bar) return null;
      return {
        bar,
        name: bar.querySelector(".name"),
        scoreValue: bar.querySelector(".score-value"),
        metric: bar.querySelector(".metric"),
        burst: bar.querySelector(".burst"),
        avatar: bar.querySelector(".avatar"),
      };
    });
    shownScores = rows.map(() => 0);
    rafIds = rows.map(() => 0);
    rows.forEach((row, i) => {
      if (row && i + 1 > visibleRanks) row.bar.style.display = "none";
    });
  }

  function update(entries) {
    if (!Array.isArray(entries)) return;
    readWidgetType();
    rows.forEach((row, i) => {
      if (!row) return;
      const entry = entries[i];
      const rank = i + 1;
      if (rank > visibleRanks || !entry || !(entry.score > 0)) {
        row.bar.style.display = "none";
        shownScores[i] = 0;
        return;
      }
      if (row.name) {
        const label = entry.nickname || "Player " + rank;
        row.name.textContent = label.length > 18 ? label.slice(0, 18) + "…" : label;
      }
      if (row.avatar) {
        const src = entry.avatar && String(entry.avatar).trim();
        row.avatar.src = src || "/avatars/" + FALLBACK_AVATARS[i % FALLBACK_AVATARS.length];
        row.avatar.alt = entry.nickname || "Rank " + rank;
      }
      const prev = shownScores[i] || 0;
      const next = entry.score || 0;
      if (next !== prev) {
        tween(i, prev, next);
        if (next > prev && prev > 0) burst(i);
        shownScores[i] = next;
      }
      row.bar.style.display = "flex";
    });
  }

  function setVisibleRanks(n) {
    visibleRanks = Math.max(1, Math.min(7, n || 7));
    rows.forEach((row, i) => {
      if (row && i + 1 > visibleRanks) row.bar.style.display = "none";
    });
  }

  function unmount() {
    rafIds.forEach((id) => id && cancelAnimationFrame(id));
    rows = [];
    shownScores = [];
    rafIds = [];
    root = null;
  }

  window.ThemeRenderer = { mount, update, setVisibleRanks, unmount };
})();
