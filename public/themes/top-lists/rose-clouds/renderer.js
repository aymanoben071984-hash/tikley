/*
 * Rose Clouds renderer — the standard ThemeRenderer contract (mount / update /
 * setVisibleRanks / switchDataset / unmount) generalized to N slots (this board
 * ships TEN .rank-unit rows; the older podium renderers hardcoded five).
 * Slots are discovered from the DOM, so the same file works for any row count.
 */
(() => {
  let root = null;
  let slots = {};
  let maxSlots = 0;
  let visible = 10;
  const cache = {};
  const timers = new Set();

  function mount(el) {
    root = el;
    slots = {};
    maxSlots = 0;
    root.querySelectorAll(".rank-unit[data-rank]").forEach((unit) => {
      const rank = Number(unit.getAttribute("data-rank"));
      if (!Number.isInteger(rank)) return;
      slots[rank] = {
        unit,
        name: unit.querySelector(".player-name"),
        scoreValue: unit.querySelector(".score-value"),
        avatar: unit.querySelector(".avatar-img"),
      };
      cache[rank] = { nickname: null, score: null, avatar: null };
      if (rank > maxSlots) maxSlots = rank;
    });
    applyVisibility();
  }

  function fmt(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return String(n);
  }

  function fill(rank, e) {
    const s = slots[rank];
    if (!s) return;
    const nick = e.nickname || e.uniqueId || "مستخدم";
    const score = Number(e.score || 0);
    const av = e.avatar || "";
    const c = cache[rank];
    if (s.name && c.nickname !== nick) { s.name.textContent = nick; c.nickname = nick; }
    if (s.scoreValue && c.score !== score) { s.scoreValue.textContent = fmt(score); c.score = score; }
    if (s.avatar && c.avatar !== av) {
      s.avatar.src = av || `/avatars/a${((rank - 1) % 3) + 1}.png`;
      s.avatar.alt = nick;
      s.avatar.onerror = () => { s.avatar.src = `/avatars/a${((rank - 1) % 3) + 1}.png`; };
      c.avatar = av;
    }
    s.unit.style.display = "";
    s.unit.style.removeProperty("opacity");
  }

  function hide(rank) {
    const s = slots[rank];
    if (!s) return;
    s.unit.style.display = "none";
    s.unit.style.removeProperty("opacity");
    cache[rank] = { nickname: null, score: null, avatar: null };
  }

  function update(list) {
    if (!Array.isArray(list)) return;
    const shown = list.slice(0, Math.min(visible, maxSlots));
    shown.forEach((e, i) => fill(i + 1, e || {}));
    for (let r = shown.length + 1; r <= maxSlots; r++) hide(r);
  }

  function setVisibleRanks(n) {
    const v = Number(n);
    visible = Number.isInteger(v) ? Math.max(1, Math.min(v, maxSlots || 10)) : maxSlots || 10;
    applyVisibility();
  }

  function applyVisibility() {
    const holder = root && root.querySelector(".rows-container");
    if (holder) holder.setAttribute("data-visible-ranks", String(visible));
    for (let r = 1; r <= maxSlots; r++) {
      const s = slots[r];
      if (!s) continue;
      if (r <= visible) { s.unit.style.display = ""; s.unit.style.removeProperty("opacity"); }
      else hide(r);
    }
  }

  const wait = (ms) => new Promise((res) => setTimeout(res, ms));
  const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); };
  const clearTimers = () => { timers.forEach((t) => clearTimeout(t)); timers.clear(); };

  function activeRanks() {
    const out = [];
    for (let r = 1; r <= Math.min(visible, maxSlots); r++) {
      const s = slots[r];
      if (s && s.unit.style.display !== "none") out.push(r);
    }
    return out;
  }

  function stripSwitch(el) {
    el.classList.remove("tr-switch-out-up", "tr-switch-out-down", "tr-switch-in-from-up", "tr-switch-in-from-down", "tr-switch-in-rank1-from-down");
  }

  /* Likes↔coins flip: slide rows out one by one (top first), swap the data
   * while hidden, then slide them back in with the same stagger. */
  async function switchDataset(apply) {
    clearTimers();
    const ranks = activeRanks();
    const STEP = 110;
    const LEG = 560;
    ranks.forEach((rank, i) => {
      const u = slots[rank].unit;
      later(() => { stripSwitch(u); u.classList.add("tr-switch-out-up"); }, i * STEP);
    });
    await wait(LEG + Math.max(0, ranks.length - 1) * STEP + 40);
    if (typeof apply === "function") await apply();
    activeRanks().forEach((rank, i) => {
      const u = slots[rank].unit;
      later(() => {
        stripSwitch(u);
        u.classList.add("tr-switch-in-from-down");
        u.style.display = "";
        u.offsetHeight; // reflow so the transition FROM the offset state plays
        later(() => stripSwitch(u), 30 + i * STEP);
      }, i * STEP);
    });
    await wait(LEG + Math.max(0, ranks.length - 1) * STEP + 40);
    clearTimers();
  }

  function unmount() {
    clearTimers();
    Object.keys(cache).forEach((k) => { cache[k] = { nickname: null, score: null, avatar: null }; });
    slots = {};
    root = null;
  }

  window.ThemeRenderer = { mount, update, setVisibleRanks, switchDataset, unmount };
})();
