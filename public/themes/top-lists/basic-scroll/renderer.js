/* Basic Scroll renderer (2026-10-30). The shared lean positional renderer
 * (see _shared/renderer.js) plus ONE extra job: keep the column scrolling.
 *
 * - Rows 1..N are the contract rows (`.rank-unit[data-rank]`), filled in place
 *   and cache-guarded exactly like Basic.
 * - The viewport is a CONSTANT 400 px (about five rows) whatever the row
 *   count, so the OBS source never changes size.
 * - The list ALWAYS scrolls (no switch): the filled list is mirrored into
 *   persistent clones (as many as cover window + one list height), and the
 *   track is moved by ONE Web Animations transform from 0 to exactly -one list
 *   height, looping forever, so the loop is seamless at any row count.
 * - Clones are built once per clone-count and then updated IN PLACE on every
 *   tick (text, avatar src, visibility, inline styles). Re-cloning on each
 *   live tick created fresh <img> elements that decoded a frame late — the
 *   column flickered ("switching") under live likes. Clones carry no
 *   data-rank: the host's row queries and the contract only see originals.
 * - The animation is left alone across ticks. Only a changed list height
 *   (rows came or went) re-targets it, carrying the pixel offset over so the
 *   column never jumps back to the top.
 * - Duration = 2.4 s per shown row, min 4 s.
 */
(function () {
  var VIEW_H = 400;
  var SEC_PER_ROW = 2.4;
  var slots = [];
  var visible = 20;
  var list = null, track = null, viewport = null;
  var clones = [];
  var anim = null;
  var animListH = 0;
  var animDuration = 0;
  var raf = 0;
  var ro = null;

  function fmt(n) {
    n = Number(n) || 0;
    if (n >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
    return String(n);
  }

  function clearClones() {
    for (var i = 0; i < clones.length; i++) if (clones[i].el.parentNode) clones[i].el.parentNode.removeChild(clones[i].el);
    clones = [];
  }

  function stopAnim() {
    if (anim) { try { anim.cancel(); } catch (e) { /* already gone */ } }
    anim = null;
    animListH = 0;
    animDuration = 0;
    if (track) track.style.transform = "";
  }

  /** Current scroll offset in px (0 when nothing runs). */
  function currentOffset() {
    if (!anim || !animDuration) return 0;
    try {
      var ct = Number(anim.currentTime) || 0;
      return ((ct % animDuration) / animDuration) * animListH;
    } catch (e) { return 0; }
  }

  function mount(root) {
    slots = [];
    list = root.querySelector("#ts-list");
    track = root.querySelector("#ts-track");
    viewport = root.querySelector("#ts-viewport");
    clearClones();
    stopAnim();
    if (viewport) viewport.style.height = VIEW_H + "px";
    // The list's size is the whole story (0 while a preview is still hidden or
    // being measured, growing as rows/fonts land): re-sync on every change, not
    // only on data ticks — a board that was laid out at 0 px when data arrived
    // would otherwise never start moving.
    if (ro) ro.disconnect();
    ro = null;
    if (list && typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(function () { scheduleSync(); });
      ro.observe(list);
    }
    var rows = root.querySelectorAll(".rank-unit[data-rank]");
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
    scheduleSync();
  }

  /** Build one clone of the list: same rows (by index), no ids / data-rank. */
  function buildClone() {
    var c = list.cloneNode(true);
    c.removeAttribute("id");
    c.setAttribute("aria-hidden", "true");
    c.classList.add("list-clone");
    var ranked = c.querySelectorAll("[data-rank]");
    var rows = [];
    for (var r = 0; r < ranked.length; r++) {
      ranked[r].removeAttribute("data-rank");
      rows.push({
        row: ranked[r],
        name: ranked[r].querySelector(".name, .player-name"),
        score: ranked[r].querySelector(".score-value"),
        avatar: ranked[r].querySelector(".avatar, .avatar-img"),
      });
    }
    track.appendChild(c);
    return { el: c, rows: rows };
  }

  /** Copy the originals' current state into one clone, touching only what differs. */
  function mirror(clone) {
    for (var i = 0; i < slots.length && i < clone.rows.length; i++) {
      var s = slots[i], m = clone.rows[i];
      var disp = s.row.style.display;
      if (m.row.style.display !== disp) m.row.style.display = disp;
      if (!s.cache.shown) continue;
      if (m.name && s.name) {
        if (m.name.textContent !== s.name.textContent) m.name.textContent = s.name.textContent;
        var css = s.name.style.cssText;
        if (m.name.style.cssText !== css) m.name.style.cssText = css;
      }
      if (m.score && s.score) {
        if (m.score.textContent !== s.score.textContent) m.score.textContent = s.score.textContent;
        var scss = s.score.style.cssText;
        if (m.score.style.cssText !== scss) m.score.style.cssText = scss;
      }
      if (m.avatar && s.avatar) {
        var src = s.avatar.getAttribute("src") || "";
        if (m.avatar.getAttribute("src") !== src) m.avatar.setAttribute("src", src);
        if (m.avatar.alt !== s.avatar.alt) m.avatar.alt = s.avatar.alt;
      }
    }
  }

  /** Mirror the clones, keep the loop running; re-target only on a height change. */
  function sync() {
    if (!list || !track || !viewport) return;
    var shownCount = 0;
    for (var i = 0; i < slots.length; i++) if (slots[i].cache.shown) shownCount++;
    viewport.style.height = VIEW_H + "px";
    if (!shownCount) {
      clearClones();
      stopAnim();
      return;
    }
    var listH = list.offsetHeight;
    if (!listH) { // not laid out yet (hidden preview, display:none) — the ResizeObserver brings us back
      stopAnim();
      return;
    }
    // Picker tiles are held still by StillPreview (it injects a style into the
    // shadow root); a scrolling tile would be the one thing on the page moving.
    var rootNode = track.getRootNode ? track.getRootNode() : null;
    var still = !!(rootNode && rootNode.querySelector && rootNode.querySelector("style[data-motion-still]"));

    // Enough copies that the track still covers the window after it has moved
    // one full list height (at least one, so a short list loops too).
    var needed = Math.max(1, Math.ceil(VIEW_H / listH) + 1);
    if (clones.length !== needed) {
      clearClones();
      for (var k = 0; k < needed; k++) clones.push(buildClone());
    } else {
      for (var c = 0; c < clones.length; c++) mirror(clones[c]);
    }

    if (still) { stopAnim(); return; }
    if (anim && animListH === listH) return; // untouched: the loop keeps rolling

    // Re-target: same pixel offset (modulo the new height), new period.
    var offset = currentOffset() % listH;
    stopAnim();
    if (typeof track.animate !== "function") return;
    var duration = Math.max(4, shownCount * SEC_PER_ROW) * 1000;
    anim = track.animate(
      [{ transform: "translate3d(0, 0, 0)" }, { transform: "translate3d(0, " + -listH + "px, 0)" }],
      { duration: duration, iterations: Infinity, easing: "linear" }
    );
    animListH = listH;
    animDuration = duration;
    if (offset > 0) anim.currentTime = (offset / listH) * duration;
  }

  function scheduleSync() {
    if (raf) cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function () { raf = 0; sync(); });
  }

  function applyVisibility() {
    for (var i = 0; i < slots.length; i++) {
      if (slots[i].rank > visible) {
        slots[i].row.style.display = "none";
        slots[i].cache.shown = false;
      }
    }
    scheduleSync();
  }

  function setVisibleRanks(n) {
    var max = slots.length || 20;
    visible = Math.max(1, Math.min(max, Number(n) || 20));
    applyVisibility();
  }

  /** likes↔coins switch: NO slide-out / fade / flip — the new rows are applied
   *  at once under the running scroll (the host routes basic-scroll here; see
   *  resolveSwapAnim). The clones mirror on the next sync, the offset is kept. */
  function switchDataset(apply) {
    return Promise.resolve().then(function () { return apply(); }).then(function () { scheduleSync(); });
  }

  function unmount() {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    if (ro) ro.disconnect();
    ro = null;
    clearClones();
    stopAnim();
    slots = [];
    list = track = viewport = null;
  }

  window.ThemeRenderer = {
    mount: mount,
    update: update,
    setVisibleRanks: setVisibleRanks,
    unmount: unmount,
    switchDataset: switchDataset,
    applyClassicColors: function () {},
    applyTopRankersColors: function () {},
    applyCyberColors: function () {},
  };
})();
