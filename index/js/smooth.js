/**
 * Smooth scrolling, site-wide.
 *
 * Split out of parallax.js because it belongs on every page, while the
 * parallax only belongs on the home page. Loading it only on the home page
 * meant a reader who refreshed, or arrived by direct link, got no smooth
 * scrolling at all on that page.
 *
 * Not gated on prefers-reduced-motion, by explicit request. To honour that
 * setting for motion-sensitive visitors, add at the top of the IIFE:
 *   if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
 */
(function () {
  'use strict';

  if (typeof Lenis === 'undefined') return;

  var lenis = new Lenis({
    duration: 1.05,
    easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)); },
    smoothWheel: true,
    touchMultiplier: 1.6
  });

  (function loop(time) {
    lenis.raf(time);
    requestAnimationFrame(loop);
  })(0);

  // router.js swaps <main>, which changes the document height. Lenis caches
  // those dimensions, so it has to be told or it keeps the old scroll limit.
  new MutationObserver(function () {
    lenis.resize();
  }).observe(document.body, { childList: true });

  // ── Anchor links ─────────────────────────────────────────────────────────
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
    if (!a.getAttribute('href')) return;

    // Only same-document anchors: "#id", or "path#id" on the current page.
    var url;
    try { url = new URL(a.href, window.location.href); } catch (_) { return; }
    if (url.origin !== window.location.origin) return;
    if (!url.hash || url.pathname !== window.location.pathname) return;

    var target = document.querySelector(url.hash);
    if (!target) return;

    e.preventDefault();
    lenis.scrollTo(target, { offset: -headerOffset(), duration: 1.2 });
    history.pushState(null, '', url.hash);
  });
})();
