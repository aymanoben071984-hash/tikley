/* PUBG Mobile weapon Top List renderer — identical across weapon bundles.
 * Standard ThemeRenderer contract: mount / update / setVisibleRanks / unmount.
 * The loader passes entries as {score, nickname, avatar} (avatar already runs
 * through the app's avatar proxy) and sets data-widget-type on #theme-wrapper. */
(() => {
  const FALLBACK_AVATARS = ["a1.png", "a2.png", "a3.png"]; // in /avatars — /assets/img never existed
  const RANK_CLASSES = ["first", "second", "third", "fourth", "fifth"];
  const TWEEN_MS = 1200;

  let root = null;
  let rows = [];
  let visibleRanks = 5;
  let widgetType = "top_likes";
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
    // A counting number reads identically at 30fps and at 60, but every write
    // costs a toLocaleString() plus a layout pass on the row — with ten rows
    // tweening at once that was ~600 Intl formats and ~600 DOM writes a second,
    // and it measured as 2.3x the idle CPU of the boards that don't tween.
    // So: skip any frame whose digits would be unchanged, and cap the rest to
    // ~30fps. The final value is always written exactly.
    let lastShown = null;
    let lastAt = 0;
    const step = (now) => {
      const p = Math.min((now - start) / TWEEN_MS, 1);
      const eased = 1 - Math.pow(1 - p, 4);
      const v = Math.floor(from + (to - from) * eased);
      if (v !== lastShown && now - lastAt >= 32) {
        row.scoreValue.textContent = fmt(v);
        lastShown = v;
        lastAt = now;
      }
      if (p < 1) rafIds[rankIdx] = requestAnimationFrame(step);
      else {
        if (lastShown !== to) row.scoreValue.textContent = fmt(to);
        rafIds[rankIdx] = 0;
      }
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
      if (widgetType === "top_likes") p.style.color = "#ff3355";
      row.burst.appendChild(p);
      setTimeout(() => p.remove(), 1400 + i * 60);
    }
    if (row.scoreBox) {
      row.scoreBox.classList.remove("pulse");
      void row.scoreBox.offsetWidth;
      row.scoreBox.classList.add("pulse");
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
        scoreBox: bar.querySelector(".score-box"),
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
        row.name.textContent = label.length > 16 ? label.slice(0, 16) + "…" : label;
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
    visibleRanks = Math.max(1, Math.min(5, n || 5));
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
