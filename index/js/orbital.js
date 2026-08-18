/**
 * Radial orbital timeline.
 *
 * One self-contained orbital system per trimester — three side by side,
 * each with its own core and its own subjects circling it. (Not concentric
 * rings: those read as a single system, which is the wrong idea here.)
 *
 * Clicking a node does what the 21st.dev template does: rotation stops, the
 * orbit turns until that node sits at the top, and a card opens under it
 * with a short description — plus, here, a button through to the subject's
 * activities.
 *
 * Progressive enhancement: the markup is a real heading + list of links and
 * stays perfectly usable on its own. This script only adds `is-orbiting`
 * and positions the nodes — if it never runs, the page degrades to those
 * lists rather than to nothing, and every node is still a working link.
 *
 * Below NARROW_AT the orbit is dropped for the list: the systems get too
 * small to read, and moving targets are near-impossible to tap.
 *
 * Plain rAF, no animation library — consistent with parallax.js.
 */
(function () {
  'use strict';

  var NARROW_AT = 720;           // px; below this the list layout is used
  var RADIUS    = 0.34;          // ring radius as a fraction of system size
  var SPEED     = 0.22;          // rad/s
  var TOP       = -Math.PI / 2;  // screen coords: y grows downward
  var SNAP_MS   = 700;           // travel time when a node swings to the top

  var LABEL = {
    concluido: 'Concluído',
    andamento: 'Em andamento',
    pendente:  'Em breve'
  };

  var instances = [];
  var open = null;   // the single expanded node, across every system
  var raf = null;
  var last = 0;

  // ── Card ─────────────────────────────────────────────────────────────────
  // Built on demand from the node's own data rather than written into the
  // markup: in the list fallback the link alone is the whole feature, and a
  // card there would only be noise.
  function buildCard(node) {
    var trigger = node.firstElementChild;   // the <a> or <span>
    var label   = trigger.querySelector('.orbital-label');
    var status  = node.getAttribute('data-status') || 'pendente';
    var href    = trigger.getAttribute('href');

    var card = document.createElement('div');
    card.className = 'orbital-card';

    var badge = document.createElement('span');
    badge.className = 'orbital-card-status';
    badge.textContent = LABEL[status] || '';
    card.appendChild(badge);

    var title = document.createElement('h3');
    title.textContent = (trigger.getAttribute('title') ||
      (label ? label.textContent : trigger.textContent)).trim();
    card.appendChild(title);

    var desc = node.getAttribute('data-desc');
    if (desc) {
      var p = document.createElement('p');
      p.textContent = desc;
      card.appendChild(p);
    }

    if (href) {
      var btn = document.createElement('a');
      btn.className = 'orbital-card-btn';
      btn.href = href;
      btn.textContent = 'Ver atividades';
      card.appendChild(btn);
    }

    node.appendChild(card);
    return card;
  }

  function closeCard() {
    if (!open) return;
    open.node.classList.remove('is-open');
    open.inst.el.classList.remove('has-open');
    open = null;
  }

  function openCard(inst, node, index) {
    closeCard();

    if (!node.querySelector('.orbital-card')) buildCard(node);
    node.classList.add('is-open');
    inst.el.classList.add('has-open');
    open = { inst: inst, node: node };

    // Swing this node up to the top, going the shorter way round.
    var n = inst.nodes.length;
    var target = TOP - (Math.PI * 2 / n) * index;
    var delta = (target - inst.angle) % (Math.PI * 2);
    if (delta > Math.PI) delta -= Math.PI * 2;
    if (delta < -Math.PI) delta += Math.PI * 2;

    inst.tween = { from: inst.angle, to: inst.angle + delta, t: 0 };
  }

  // ── Setup ────────────────────────────────────────────────────────────────
  // In orbit mode the dot has to sit *on* the ring with its label hanging
  // below it, so the label needs to be positionable on its own. Wrapping is
  // done here rather than in the markup because it is purely an artefact of
  // this layout — the list fallback wants the plain text it already has.
  function wrapLabels(nodes) {
    nodes.forEach(function (node) {
      var target = node.firstElementChild;
      if (!target || target.querySelector('.orbital-label')) return;

      var label = document.createElement('span');
      label.className = 'orbital-label';
      while (target.firstChild) label.appendChild(target.firstChild);
      target.appendChild(label);
    });
  }

  function build(el, i) {
    // Uma instância por elemento, guardada nele. init() pode rodar de novo
    // (o MutationObserver dispara em qualquer troca de filhos do body), e
    // sem isto a segunda passada criava um objeto novo para o mesmo DOM: os
    // cliques continuavam presos à instância antiga enquanto o loop de
    // animação percorria a nova, então o card abria e nada girava.
    // Na navegação SPA o <main> é substituído, os elementos são outros e a
    // marca não existe neles — ali a reconstrução acontece normalmente.
    if (el.__orbital) return el.__orbital;

    var nodes = [].slice.call(el.querySelectorAll('.orbital-node'));
    if (!nodes.length) return null;

    wrapLabels(nodes);

    var inst = {
      el: el,
      nodes: nodes,
      paused: false,
      tween: null,
      size: 0,
      // Offset each system's phase and flip every other one's direction, so
      // the three do not move as one synchronised block.
      angle: TOP + i * 0.7,
      speed: SPEED * (i % 2 === 0 ? 1 : -1)
    };

    // Pausing on hover/focus is what makes the nodes clickable at all —
    // chasing a moving target with the pointer is miserable otherwise.
    el.addEventListener('mouseenter', function () { setPaused(inst, true); });
    el.addEventListener('mouseleave', function () { setPaused(inst, false); });
    el.addEventListener('focusin',    function () { setPaused(inst, true); });
    el.addEventListener('focusout',   function () { setPaused(inst, false); });

    nodes.forEach(function (node, idx) {
      var trigger = node.firstElementChild;
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        // Only take over while orbiting; in the list fallback the link
        // should follow through as an ordinary link.
        if (!el.classList.contains('is-orbiting')) return;
        e.preventDefault();
        // router.js escuta cliques em document e navega em qualquer link
        // interno. Este listener está no próprio elemento, então corre
        // antes — parar a propagação aqui é o que impede o router de levar
        // a página embora antes do card abrir.
        e.stopPropagation();
        if (open && open.node === node) { closeCard(); return; }
        openCard(inst, node, idx);
      });
    });

    el.__orbital = inst;
    return inst;
  }

  function setPaused(inst, on) {
    // A system holding an open card stays still regardless of the pointer.
    if (!on && open && open.inst === inst) return;
    inst.paused = on;
    inst.el.classList.toggle('is-paused', on);
  }

  function measure(inst) {
    // Cached because place() runs every frame and clientWidth forces layout.
    inst.size = inst.el.clientWidth;
  }

  // The size has to be re-read whenever the box actually changes, not just
  // once at start-up. Arriving through router.js, orbital.css is appended
  // and loads asynchronously — measuring before it applied caught each
  // system at full container width, and the nodes orbited at roughly three
  // times the ring's radius. A ResizeObserver covers that, plus late fonts
  // and window resizes, without re-reading layout every frame.
  var ro = typeof ResizeObserver !== 'undefined'
    ? new ResizeObserver(function () { instances.forEach(measure); })
    : null;

  function place(inst) {
    var n = inst.nodes.length;
    if (!n) return;

    var r = (inst.size || inst.el.clientWidth) * RADIUS;

    inst.nodes.forEach(function (node, i) {
      var a = inst.angle + (Math.PI * 2 / n) * i;
      var x = Math.cos(a) * r;
      var y = Math.sin(a) * r;

      // Depth cue, as in the original: nodes on the far side of the orbit
      // sit dimmer and behind, so the ring reads as a circle in space
      // rather than a flat wheel. The open node is exempt — it has to stay
      // fully lit while its card is up.
      var depth = (1 + Math.sin(a)) / 2;
      var isOpen = open && open.node === node;

      node.style.transform = 'translate(' + x.toFixed(1) + 'px, ' +
                                            y.toFixed(1) + 'px)';
      node.style.opacity = isOpen ? '1' : (0.45 + 0.55 * depth).toFixed(3);
      node.style.zIndex = isOpen ? '80' : String(Math.round(10 + 20 * depth));
    });
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);

    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;

    instances.forEach(function (inst) {
      if (inst.tween) {
        inst.tween.t += (dt * 1000) / SNAP_MS;
        var k = Math.min(1, inst.tween.t);
        var e = 1 - Math.pow(1 - k, 3);   // easeOutCubic
        inst.angle = inst.tween.from + (inst.tween.to - inst.tween.from) * e;
        if (k >= 1) inst.tween = null;
      } else if (!inst.paused) {
        inst.angle += inst.speed * dt;
      }
      place(inst);
    });
  }

  function enable(inst) {
    inst.el.classList.add('is-orbiting');
    measure(inst);
    place(inst);
  }

  function disable(inst) {
    inst.el.classList.remove('is-orbiting', 'is-paused', 'has-open');
    inst.tween = null;
    inst.nodes.forEach(function (node) {
      node.classList.remove('is-open');
      node.style.transform = '';
      node.style.opacity = '';
      node.style.zIndex = '';
    });
  }

  function applyMode() {
    var wide = window.innerWidth > NARROW_AT;

    if (!wide) closeCard();
    instances.forEach(function (inst) {
      if (wide) { enable(inst); } else { disable(inst); }
    });

    if (wide && raf === null) {
      last = 0;
      raf = requestAnimationFrame(tick);
    } else if (!wide && raf !== null) {
      cancelAnimationFrame(raf);
      raf = null;
    }
  }

  function init(root) {
    root = root || document;
    var els = [].slice.call(root.querySelectorAll('[data-orbital]'));
    if (!els.length) return;

    if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
    if (ro) ro.disconnect();
    open = null;

    instances = els.map(build).filter(Boolean);
    if (ro) instances.forEach(function (inst) { ro.observe(inst.el); });

    applyMode();
  }

  // Clicking away from the card, or pressing Escape, closes it.
  document.addEventListener('click', function (e) {
    if (!open) return;
    if (e.target.closest('.orbital-node')) return;
    closeCard();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeCard();
  });

  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      instances.forEach(measure);
      applyMode();
    }, 120);
  });

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
})();
