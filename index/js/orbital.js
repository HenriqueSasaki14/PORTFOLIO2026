/**
 * Radial orbital timeline.
 *
 * One self-contained orbital system per trimester — three side by side,
 * each with its own core and its own subjects circling it. (Not concentric
 * rings: those read as a single system, which is the wrong idea here.)
 *
 * Progressive enhancement: the markup is a real heading + list of links and
 * stays perfectly usable on its own. This script only adds `is-orbiting`
 * and positions the nodes — if it never runs, the page degrades to those
 * lists rather than to nothing.
 *
 * Below NARROW_AT the orbit is dropped for the list: the systems get too
 * small to read, and moving targets are near-impossible to tap.
 *
 * Plain rAF, no animation library — consistent with parallax.js.
 */
(function () {
  'use strict';

  var NARROW_AT = 720;   // px; below this the list layout is used
  var RADIUS    = 0.34;  // ring radius as a fraction of system size
  var SPEED     = 0.22;  // rad/s

  var instances = [];
  var raf = null;
  var last = 0;

  // In orbit mode the dot has to sit *on* the ring with its label hanging
  // below it, so the label needs to be positionable on its own. Wrapping is
  // done here rather than in the markup because it is purely an artefact of
  // this layout — the list fallback wants the plain text it already has.
  function wrapLabels(nodes) {
    nodes.forEach(function (node) {
      var target = node.firstElementChild;   // the <a> or <span>
      if (!target || target.querySelector('.orbital-label')) return;

      var label = document.createElement('span');
      label.className = 'orbital-label';
      while (target.firstChild) label.appendChild(target.firstChild);
      target.appendChild(label);
    });
  }

  function build(el, i) {
    var nodes = [].slice.call(el.querySelectorAll('.orbital-node'));
    if (!nodes.length) return null;

    wrapLabels(nodes);

    var inst = {
      el: el,
      nodes: nodes,
      paused: false,
      size: 0,
      // Offset each system's phase and flip every other one's direction, so
      // the three don't move as one synchronised block.
      angle: -Math.PI / 2 + i * 0.7,
      speed: SPEED * (i % 2 === 0 ? 1 : -1)
    };

    // Pausing on hover/focus is what makes the nodes clickable at all —
    // chasing a moving target with the pointer is miserable otherwise.
    el.addEventListener('mouseenter', function () { setPaused(inst, true); });
    el.addEventListener('mouseleave', function () { setPaused(inst, false); });
    el.addEventListener('focusin', function () { setPaused(inst, true); });
    el.addEventListener('focusout', function () { setPaused(inst, false); });

    return inst;
  }

  function setPaused(inst, on) {
    inst.paused = on;
    inst.el.classList.toggle('is-paused', on);
  }

  function measure(inst) {
    // Cached because place() runs every frame and clientWidth forces layout.
    inst.size = inst.el.clientWidth;
  }

  // The size has to be re-read whenever the box actually changes, not just
  // once at start-up. Arriving through router.js, orbital.css is appended
  // and loads asynchronously — measuring before it applies caught each
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
      // rather than a flat wheel.
      var depth = (1 + Math.sin(a)) / 2;          // 0 = far, 1 = near
      node.style.transform = 'translate(' + x.toFixed(1) + 'px, ' +
                                            y.toFixed(1) + 'px)';
      node.style.opacity = (0.45 + 0.55 * depth).toFixed(3);
      node.style.zIndex = String(Math.round(10 + 20 * depth));
    });
  }

  function tick(now) {
    raf = requestAnimationFrame(tick);

    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0;
    last = now;

    instances.forEach(function (inst) {
      if (!inst.paused) inst.angle += inst.speed * dt;
      place(inst);
    });
  }

  function enable(inst) {
    inst.el.classList.add('is-orbiting');
    measure(inst);
    place(inst);
  }

  function disable(inst) {
    inst.el.classList.remove('is-orbiting', 'is-paused');
    inst.nodes.forEach(function (node) {
      node.style.transform = '';
      node.style.opacity = '';
      node.style.zIndex = '';
    });
  }

  function applyMode() {
    var wide = window.innerWidth > NARROW_AT;

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

    instances = els.map(build).filter(Boolean);
    if (ro) instances.forEach(function (inst) { ro.observe(inst.el); });

    applyMode();
  }

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
