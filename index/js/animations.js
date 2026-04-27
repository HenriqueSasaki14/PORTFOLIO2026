(function () {
  'use strict';

  var SELECTORS = [
    '.project',
    '.category-card',
    '.activity-card',
    '.about-photo',
    '.about-skills',
    '.form',
    '.contact > div',
  ].join(', ');

  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' });

  function initReveal(root) {
    root = root || document;
    root.querySelectorAll(SELECTORS).forEach(function (el) {
      if (el.dataset.revealInit) return;
      el.dataset.revealInit = '1';
      el.classList.add('reveal');

      // Escalonar irmãos dentro do mesmo pai
      var siblings = Array.from(el.parentElement.children).filter(function (c) {
        return c.matches(SELECTORS);
      });
      var idx = siblings.indexOf(el);
      if (idx > 0) el.style.transitionDelay = (idx * 90) + 'ms';

      revealObserver.observe(el);
    });
  }

  // Primeira execução
  initReveal();

  // Re-disparar após navegação SPA (router substitui <main>)
  new MutationObserver(function () {
    var main = document.querySelector('main');
    if (main) initReveal(main);
  }).observe(document.body, { childList: true });

})();
