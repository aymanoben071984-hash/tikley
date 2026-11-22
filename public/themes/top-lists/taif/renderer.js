/* Lumen (taif) theme renderer — fills .player-name / .score-value / .avatar-img
 * inside each .rank[data-rank] and shows/hides ranks per the configured count.
 * Rewritten from the shared 5-rank renderer for the 10-rank board.
 *
 * Contract (same as every top-list renderer):
 *   window.ThemeRenderer = { mount, update, setVisibleRanks, unmount }
 *
 * Show = CLEAR the inline display (falls back to the stylesheet's flex row);
 * never force display:block — that stacked the flex bar vertically. Hide =
 * inline display:none.
 */
(() => {
  const MAX = 10;
  let root = null;
  let visible = 5;
  const slots = {}; // rank -> { unit, name, scoreValue, avatar }
  const cache = {}; // rank -> { nickname, score, avatar } (skip no-op DOM writes)

  function blankCache(rank) {
    cache[rank] = { nickname: null, score: null, avatar: null };
  }

  function fmt(n) {
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return `${n}`;
  }

  function mount(el) {
    root = el;
    for (let r = 1; r <= MAX; r++) {
      const unit = root.querySelector(`.rank[data-rank="${r}"]`);
      if (!unit) continue;
      slots[r] = {
        unit,
        name: unit.querySelector(".player-name"),
        scoreValue: unit.querySelector(".score-value"),
        avatar: unit.querySelector(".avatar-img"),
      };
      blankCache(r);
    }
    applyVisibility();
  }

  function show(rank, entry) {
    const s = slots[rank];
    if (!s) return;
    const nick = entry.nickname || entry.uniqueId || "مستخدم";
    const score = Number(entry.score || 0);
    const ava = entry.avatar || "";
    const c = cache[rank];
    if (s.name && c.nickname !== nick) {
      s.name.textContent = nick; // CSS ellipsis handles overflow
      c.nickname = nick;
    }
    if (s.scoreValue && c.score !== score) {
      s.scoreValue.textContent = fmt(score);
      c.score = score;
    }
    if (s.avatar && c.avatar !== ava) {
      s.avatar.src = ava || `/avatars/a${rank}.png`;
      s.avatar.alt = nick;
      s.avatar.onerror = () => {
        s.avatar.src = `/avatars/a${rank}.png`;
      };
      c.avatar = ava;
    }
    s.unit.style.display = ""; // clear inline → stylesheet flex row applies
  }

  function hide(rank) {
    const s = slots[rank];
    if (!s) return;
    s.unit.style.display = "none";
    blankCache(rank);
  }

  function update(entries) {
    if (!Array.isArray(entries)) return;
    const top = entries.slice(0, Math.min(visible, MAX));
    top.forEach((e, i) => show(i + 1, e || {}));
    for (let r = top.length + 1; r <= MAX; r++) hide(r);
  }

  function setVisibleRanks(n) {
    const v = Number(n);
    visible = Number.isInteger(v) ? Math.max(1, Math.min(MAX, v)) : 5;
    applyVisibility();
  }

  function applyVisibility() {
    const container = root?.querySelector(".container");
    if (container) container.setAttribute("data-visible-ranks", visible);
    for (let r = visible + 1; r <= MAX; r++) hide(r);
  }

  function unmount() {
    for (let r = 1; r <= MAX; r++) {
      blankCache(r);
      delete slots[r];
    }
    root = null;
  }

  window.ThemeRenderer = { mount, update, setVisibleRanks, unmount };
})();
