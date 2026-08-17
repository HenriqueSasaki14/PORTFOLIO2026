/**
 * Layered hero parallax + smooth scrolling.
 *
 * The hero is built from layers cut out of the same photo (background
 * plate, giant wordmark, subject cutout) plus the text content on top.
 * Each layer travels a different distance across the hero's scroll range,
 * which is what produces the sense of depth: things "closer to camera"
 * move more than things far away.
 *
 * Note on prefers-reduced-motion: this deliberately does NOT bail out on
 * it. The movement here is scroll-linked — it only advances while the
 * reader is actively scrolling, and stops when they stop — rather than
 * autoplaying at the page. Smooth scrolling IS gated on it, though, since
 * decoupling the page from the wheel is the disorienting part.
 *
 * Plain scroll listener + rAF for the layers — no animation library, so
 * the effect cannot break because a CDN is blocked or a script loads late.
 *
 * Mirrors the reveal-on-scroll pattern from animations.js: re-runs after
 * router.js swaps <main> during SPA navigation.
 */
(function () {
  'use strict';

  // Keep every layer at or below the CSS bleed (-24%) or a layer will run
  // out of image and expose an edge mid-scroll.
  // The bg/subject gap is deliberately small. The lantern lives in the
  // background plate (its glow has no clean edge to cut around), so a wide
  // gap would visibly walk the hand away from its own light. Depth instead
  // comes from the wordmark, which passes between the two.
  var SPEED = {
    bg: 0.05,       // night sky — nearly still
    word: 0.24,     // wordmark floating in between
    subject: 0.09   // you — just enough to lift off the background
  };

  var raf = null;
  var hero = null;
  var layers = {};

  function collect(root) {
    root = root || document;
    hero = root.querySelector('[data-parallax="hero"]');
    if (!hero) return false;

    layers.bg      = hero.querySelector('[data-parallax-layer="bg"]');
    layers.word    = hero.querySelector('[data-parallax-layer="word"]');
    layers.subject = hero.querySelector('[data-parallax-layer="subject"]');
    return true;
  }

  function apply() {
    raf = null;
    if (!hero) return;

    var rect = hero.getBoundingClientRect();
    var range = rect.height || 1;
    // 0 while the hero fills the viewport, → 1 once it has scrolled past.
    var progress = Math.min(1, Math.max(0, -rect.top / range));

    for (var key in SPEED) {
      var el = layers[key];
      if (!el) continue;
      var shift = progress * range * SPEED[key];
      el.style.transform = 'translate3d(0, ' + (-shift).toFixed(1) + 'px, 0)';
    }
  }

  function onScroll() {
    if (raf === null) raf = requestAnimationFrame(apply);
  }

  function init(root) {
    if (!collect(root)) return;
    apply();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () { init(); });
  } else {
    init();
  }

  // Re-init after SPA navigation (router.js replaces <main>)
  new MutationObserver(function () {
    var main = document.querySelector('main');
    if (main) init(main);
  }).observe(document.body, { childList: true });

  // ── Smooth scrolling ───────────────────────────────────────────────────
  // Not gated on prefers-reduced-motion, by explicit request. If you ever
  // want to honour that setting for motion-sensitive visitors, guard the
  // block below with:
  //   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (typeof Lenis === 'undefined') return;

  var lenis = new Lenis({
    duration: 1.05,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    touchMultiplier: 1.6
  });

  lenis.on('scroll', onScroll);

  (function loop(time) {
    lenis.raf(time);
    requestAnimationFrame(loop);
  })(0);

  // ── Anchor links ───────────────────────────────────────────────────────
  // router.js deliberately lets the browser handle same-page anchors
  // natively (see its click handler). That fights Lenis: the browser jumps
  // instantly while Lenis still believes it is somewhere else, so the page
  // lands, then snaps back — the "teleport". Hand those clicks to Lenis
  // instead, offset by the sticky header so the heading is not hidden
  // underneath it.
  function headerOffset() {
    var bar = document.querySelector('.topbar');
    return bar ? bar.getBoundingClientRect().height + 12 : 0;
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    var a = e.target.closest('a[href]');
    if (!a) return;

    var href = a.getAttribute('href');
    if (!href) return;

    // Only same-document anchors: "#id", or "path#id" on the current page.
    var url;
    try { url = new URL(a.href, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin) return;
    if (!url.hash || url.pathname !== window.location.pathname) return;

    var target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    lenis.scrollTo(target, {
      offset: -headerOffset(),
      duration: 1.2
    });
    history.pushState(null, '', url.hash);
  });
})();
