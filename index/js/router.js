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

  // ── CSS sync ────────────────────────────────────────────────────────────────
  // Each stylesheet carries its resolved URL in data-abs, recorded once, here,
  // while the document base still matches the page it was authored for.
  //
  // Reading link.href instead would be wrong: that property re-resolves the
  // relative attribute against the *current* URL, so once pushState moves us
  // to /html/foo.html the original <link href="css/index.css"> starts
  // reporting /html/css/index.css. Comparing against that never matches, and
  // every navigation re-appends the same sheets.
  function tagSheets() {
    document.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      if (!l.dataset.abs) l.dataset.abs = l.href;
    });
  }
  tagSheets();

  // Make the live stylesheets match the page being shown: add what it needs,
  // then drop what belonged only to the page we are leaving. Without the
  // removal, styles from every page visited stay stacked and keep overriding
  // whichever page is on screen.
  function syncCss(doc, fromUrl) {
    const wanted = new Set();
    doc.querySelectorAll('link[rel="stylesheet"]').forEach(function (l) {
      const attr = l.getAttribute('href');
      if (attr) wanted.add(new URL(attr, fromUrl.href).href);
    });
    if (!wanted.size) return;

    const current = [...document.querySelectorAll('link[rel="stylesheet"]')];
    const have = new Set(current.map(l => l.dataset.abs));

    // Add first, remove after — swapping the other way flashes unstyled.
    wanted.forEach(function (abs) {
      if (have.has(abs)) return;
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.dataset.abs = abs;
      link.href = abs;
      document.head.appendChild(link);
    });

    current.forEach(function (l) {
      if (!wanted.has(l.dataset.abs)) l.remove();
    });
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

    // Match the live stylesheets to the page being shown
    syncCss(doc, url);

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
