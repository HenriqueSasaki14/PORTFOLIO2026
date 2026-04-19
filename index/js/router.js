/**
 * Lightweight SPA Router
 * Intercepts internal link clicks, fetches new page content via fetch(),
 * and swaps <main>, <nav> and <title> without a full page reload.
 * This keeps the music player (and its <audio> element) alive at all times.
 */
(function () {
  'use strict';

  // ── Page cache ───────────────────────────────────────────────────────────────
  const cache = new Map(); // href string → parsed Document

  async function fetchPage(url) {
    const key = url.href;
    if (cache.has(key)) return cache.get(key);

    const res = await fetch(url.href, { credentials: 'same-origin' });
    if (!res.ok) throw new Error('HTTP ' + res.status);

    const text = await res.text();
    const doc  = new DOMParser().parseFromString(text, 'text/html');
    cache.set(key, doc);
    return doc;
  }

  // ── CSS loader — resolves relative hrefs against the fetched page URL ────────
  function ensureCss(attr, fromUrl) {
    if (!attr) return;
    const abs = new URL(attr, fromUrl.href).href;
    const loaded = new Set(
      [...document.querySelectorAll('link[rel="stylesheet"]')].map(l => l.href)
    );
    if (!loaded.has(abs)) {
      const link = document.createElement('link');
      link.rel   = 'stylesheet';
      link.href  = abs;
      document.head.appendChild(link);
    }
  }

  // ── Apply fetched document to the live DOM ───────────────────────────────────
  function applyPage(doc, url, restoreScrollY) {
    // Title
    document.title = doc.title;

    // Swap <nav> — keeps the player widget (which sits outside <nav>) intact
    const newNav = doc.querySelector('nav.nav');
    const curNav = document.querySelector('nav.nav');
    if (newNav && curNav) curNav.replaceWith(newNav.cloneNode(true));

    // Swap <main>
    const newMain = doc.querySelector('main');
    const curMain = document.querySelector('main');
    if (newMain && curMain) curMain.replaceWith(newMain.cloneNode(true));

    // Swap <footer>
    const newFoot = doc.querySelector('footer');
    const curFoot = document.querySelector('footer');
    if (newFoot && curFoot) curFoot.replaceWith(newFoot.cloneNode(true));

    // Ensure any new CSS from the fetched page is loaded
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      ensureCss(l.getAttribute('href'), url);
    });

    // Restore scroll position
    requestAnimationFrame(function () {
      window.scrollTo(0, restoreScrollY || 0);
    });
  }

  // ── Navigate ─────────────────────────────────────────────────────────────────
  let busy = false;

  async function navigate(url, opts) {
    opts = opts || {};
    const pushState   = opts.pushState !== false;
    const restoreScroll = opts.scrollY || 0;

    if (busy) return;
    busy = true;

    // Save current scroll in history state before leaving
    try {
      history.replaceState(
        Object.assign({}, history.state || {}, { scrollY: window.scrollY }),
        ''
      );
    } catch (_) {}

    try {
      const doc = await fetchPage(url);

      applyPage(doc, url, restoreScroll);

      if (pushState) {
        history.pushState(
          { scrollY: 0 },
          document.title,
          url.pathname + url.search + url.hash
        );
      }

      // Scroll to hash anchor after render
      if (url.hash) {
        requestAnimationFrame(function () {
          const el = document.querySelector(url.hash);
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        });
      }

    } catch (err) {
      // Network error or non-200 — fall back to a full page load
      window.location.href = url.href;
    } finally {
      busy = false;
    }
  }

  // ── Click interceptor ────────────────────────────────────────────────────────
  document.addEventListener('click', function (e) {
    // Ignore modified clicks (open in new tab, etc.)
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;

    const a = e.target.closest('a[href]');
    if (!a) return;

    // Ignore links that explicitly open in a new context
    const target = a.getAttribute('target');
    if (target && target !== '_self') return;
    if (a.hasAttribute('download')) return;

    let url;
    try { url = new URL(a.href, window.location.href); }
    catch (_) { return; }

    // Only intercept same-origin HTTP(S) navigations
    if (url.origin !== window.location.origin) return;
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

    // Let the browser handle same-page anchor scrolling natively
    if (url.pathname === window.location.pathname && url.hash) return;

    e.preventDefault();
    navigate(url);
  });

  // ── Browser Back / Forward ───────────────────────────────────────────────────
  window.addEventListener('popstate', function (e) {
    const scrollY = (e.state && e.state.scrollY) ? e.state.scrollY : 0;
    navigate(new URL(window.location.href), { pushState: false, scrollY: scrollY });
  });

})();
