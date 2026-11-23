/* Universal lean Top List renderer (shared source of truth).
 *
 * POSITIONAL + cache-guarded: the host (DynamicLeaderboardTheme) hands us an
 * already-sorted array (rank 1 = highest) and we fill each rank slot 1..N in
 * place. Every field is compared to a cache before touching the DOM, so an
 * unchanged value costs nothing — a quiet stream (or a board that only churns
 * below the visible count) triggers zero DOM work. No per-tick colour loops, no
 * animation libraries, no framer-motion. Works for BOTH list designs
 * (`.rank-bar[data-rank]`) and podium designs (`.rank-unit[data-rank]`).
 *
 * Heart-vs-coin is pure CSS via the wrapper's [data-widget-type]; this file
 * never rewrites icon markup. Colours/fonts are applied by the host directly on
 * the DOM, so the optional apply* hooks below are harmless no-ops kept only so
 * older host code that calls them doesn't need a guard.
 */
(function () {
  var slots = [];      // [{rank, row, name, score, avatar, cache}]
  var container = null; // element carrying data-visible-ranks (podium CSS)
  var visible = 10;

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function mount(root) {
    slots = [];
    container = root.querySelector("[data-visible-ranks]");
    var rows = root.querySelectorAll(".rank-bar[data-rank], .rank-unit[data-rank]");
    rows.forEach(function (row) {
      var rank = Number(row.getAttribute("data-rank")) || 0;
      if (!rank) return;
      slots.push({
        rank: rank,
        row: row,
        name: row.querySelector(".name, .player-name"),
        score: row.querySelector(".score-value"),
        avatar: row.querySelector(".avatar, .avatar-img"),
        cache: { name: null, score: null, avatar: null, shown: null },
      });
    });
    // Keep the visual rank order (podiums list 4|2|1|3|5 in the DOM).
    slots.sort(function (a, b) { return a.rank - b.rank; });
    applyVisibility();
  }

  function update(data) {
    if (!Array.isArray(data)) return;
    for (var i = 0; i < slots.length; i++) {
      var s = slots[i];
      var d = data[s.rank - 1];
      var show = s.rank <= visible && !!d && Number(d.score) > 0;
      if (s.cache.shown !== show) {
        s.row.style.display = show ? "" : "none";
        s.cache.shown = show;
      }
      if (!show) continue;

      var name = d.nickname || "";
      if (s.name && s.cache.name !== name) { s.name.textContent = name; s.cache.name = name; }

      var score = fmt(d.score);
      if (s.score && s.cache.score !== score) { s.score.textContent = score; s.cache.score = score; }

      var av = d.avatar || "";
      if (s.avatar && s.cache.avatar !== av) {
        if (av) s.avatar.src = av;
        s.avatar.alt = name;
        s.cache.avatar = av;
      }
    }
  }

  function applyVisibility() {
    if (container) container.setAttribute("data-visible-ranks", String(visible));
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].rank > visible) {
        slots[i].row.style.display = "none";
        slots[i].cache.shown = false;
      }
    }
  }

  function setVisibleRanks(n) {
    var max = slots.length || 10;
    visible = Math.max(1, Math.min(max, Number(n) || 10));
    applyVisibility();
  }

  function unmount() { slots = []; container = null; }

  window.ThemeRenderer = {
    mount: mount,
    update: update,
    setVisibleRanks: setVisibleRanks,
    unmount: unmount,
    // Harmless no-ops: the host applies colours/fonts on the DOM directly now.
    applyClassicColors: function () {},
    applyTopRankersColors: function () {},
    applyCyberColors: function () {},
  };
})();
