/**
 * Lofi Music Player — persistent across MPA page navigations
 * State is stored in sessionStorage so the music resumes seamlessly
 * when the user navigates between pages.
 *
 * Fix: uses window 'pageshow' to re-init after bfcache restore (back/forward).
 */

(function () {
  'use strict';

  // ── Playlist ────────────────────────────────────────────────────────────────
  // Build an absolute URL to /audio/ using the script's own src as anchor.
  // document.currentScript is set while the script is first parsed (synchronous),
  // so this works even after SPA navigation changes window.location.
  const BASE = (function () {
    const src = document.currentScript ? document.currentScript.src : '';
    if (src) {
      // src is like "http://host/js/player.js" → replace tail with "/audio/"
      return src.replace(/\/js\/player\.js(\?.*)?$/, '/audio/');
    }
    // Fallback: root-relative (works when site is at domain root)
    return '/audio/';
  })();

  const tracks = [
    { file: 'bfcmusic-lofi-lo-fi-511230.mp3',                         title: 'Lo-Fi',               artist: 'BFC Music' },
    { file: 'fassounds-good-night-lofi-cozy-chill-music-160166.mp3',  title: 'Good Night Lofi',     artist: 'Fassounds' },
    { file: 'fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3', title: 'Lofi Study',          artist: 'Fassounds' },
    { file: 'freemusicforvideo-lofi-chill-music-495628.mp3',           title: 'Lofi Chill',          artist: 'Free Music For Video' },
    { file: 'lemonmusiclab-lofi-lofi-music-499264.mp3',                title: 'Lofi Music',          artist: 'Lemon Music Lab' },
    { file: 'lofi_music_library-lofi-girl-chill-lofi-beats-lofi-ambient-461871.mp3', title: 'Lofi Girl Ambient', artist: 'Lofi Music Library' },
    { file: 'mondamusic-lofi-beats-499181.mp3',                        title: 'Lofi Beats',          artist: 'Monda Music' },
    { file: 'mondamusic-lofi-chill-chill-512854.mp3',                  title: 'Lofi Chill',          artist: 'Monda Music' },
    { file: 'mondamusic-lofi-lofi-chill-lofi-girl-491690.mp3',         title: 'Lofi Girl',           artist: 'Monda Music' },
    { file: 'mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3',         title: 'Lofi Girl II',        artist: 'Monda Music' },
    { file: 'paulyudin-lofi-lofi-chill-lofi-girl-482399.mp3',          title: 'Lofi Chill',          artist: 'Paulyudin' },
    { file: 'playstarz_music-lofi-chill-lofi-girl-lofi-490880.mp3',    title: 'Lofi Girl',           artist: 'Playstarz Music' },
    { file: 'the_mountain-lofi-513863.mp3',                            title: 'Lofi',                artist: 'The Mountain' },
    { file: 'the_mountain-lofi-lofi-music-496553.mp3',                 title: 'Lofi Music',          artist: 'The Mountain' },
    { file: 'vibehorn-lofi-beat-lo-fi-music-512500.mp3',               title: 'Lofi Beat',           artist: 'Vibehorn' },
    { file: 'watermello-lofi-chill-lofi-girl-lofi-488388.mp3',         title: 'Lofi Chill',          artist: 'Watermello' },
    { file: 'watermello-lofi-lofi-girl-lofi-chill-484610.mp3',         title: 'Lofi Girl',           artist: 'Watermello' },
  ];

  // ── State keys ──────────────────────────────────────────────────────────────
  const KEY_INDEX   = 'lp_index';
  const KEY_TIME    = 'lp_time';
  const KEY_VOL     = 'lp_vol';
  const KEY_PLAYING = 'lp_playing';

  // ── Helpers ─────────────────────────────────────────────────────────────────
  function fmt(s) {
    s = Math.floor(s || 0);
    const m = Math.floor(s / 60);
    const sec = String(s % 60).padStart(2, '0');
    return m + ':' + sec;
  }

  function saveState(playing) {
    sessionStorage.setItem(KEY_INDEX,   state.index);
    sessionStorage.setItem(KEY_TIME,    audio.currentTime);
    sessionStorage.setItem(KEY_VOL,     audio.volume);
    sessionStorage.setItem(KEY_PLAYING, playing ? '1' : '0');
  }

  function readState() {
    state.index      = parseInt(sessionStorage.getItem(KEY_INDEX)   || '0', 10);
    state.wasPlaying = sessionStorage.getItem(KEY_PLAYING) === '1';
    state.resumeTime = parseFloat(sessionStorage.getItem(KEY_TIME)  || '0');
    state.vol        = parseFloat(sessionStorage.getItem(KEY_VOL)   || '0.5');
    if (state.index >= tracks.length) state.index = 0;
  }

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  const $ = id => document.getElementById(id);

  // ── Audio element ────────────────────────────────────────────────────────────
  const audio = new Audio();
  audio.preload = 'auto';

  // ── Runtime state ────────────────────────────────────────────────────────────
  const state = { index: 0, wasPlaying: false, resumeTime: 0, vol: 0.5 };

  // ── Load a track ─────────────────────────────────────────────────────────────
  function loadTrack(index, seek, autoplay) {
    state.index = index;
    const t = tracks[index];
    audio.src = BASE + t.file;
    audio.volume = state.vol;

    audio.addEventListener('canplay', function onCanPlay() {
      audio.removeEventListener('canplay', onCanPlay);
      if (seek > 0) audio.currentTime = seek;
      if (autoplay) audio.play().catch(() => {});
      updateUI();
    }, { once: true });

    audio.load();
    updateMeta();
  }

  // ── Update UI ────────────────────────────────────────────────────────────────
  function updateMeta() {
    const t = tracks[state.index];
    const title  = $('lp-title');
    const artist = $('lp-artist');
    if (title)  title.textContent  = t.title;
    if (artist) artist.textContent = t.artist;
  }

  function updateUI() {
    updateMeta();
    const btn = $('lp-playpause');
    if (!btn) return;
    if (audio.paused) {
      btn.innerHTML = '▶';
      btn.setAttribute('aria-label', 'Play');
    } else {
      btn.innerHTML = '⏸';
      btn.setAttribute('aria-label', 'Pause');
    }
  }

  function updateProgress() {
    const bar      = $('lp-bar');
    const current  = $('lp-current');
    const duration = $('lp-duration');
    if (!bar) return;
    const pct = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    bar.style.width = pct + '%';
    if (current)  current.textContent  = fmt(audio.currentTime);
    if (duration) duration.textContent = fmt(audio.duration);
  }

  // ── Audio events ─────────────────────────────────────────────────────────────
  audio.addEventListener('timeupdate', updateProgress);
  audio.addEventListener('ended', () => loadTrack((state.index + 1) % tracks.length, 0, true));
  audio.addEventListener('play',  updateUI);
  audio.addEventListener('pause', updateUI);

  // ── Controls ─────────────────────────────────────────────────────────────────
  function togglePlay() {
    if (audio.paused) {
      audio.play().catch(() => {});
    } else {
      audio.pause();
    }
  }

  function prevTrack() {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      return;
    }
    const i = (state.index - 1 + tracks.length) % tracks.length;
    loadTrack(i, 0, !audio.paused);
  }

  function nextTrack() {
    const i = (state.index + 1) % tracks.length;
    loadTrack(i, 0, !audio.paused);
  }

  // ── Progress bar scrubbing ────────────────────────────────────────────────────
  function setupScrub() {
    const track = $('lp-progress');
    if (!track) return;

    let scrubbing = false;

    function scrubTo(e) {
      const rect = track.getBoundingClientRect();
      const x    = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left;
      const pct  = Math.max(0, Math.min(1, x / rect.width));
      if (audio.duration) audio.currentTime = pct * audio.duration;
    }

    track.addEventListener('mousedown',  e => { scrubbing = true; scrubTo(e); });
    track.addEventListener('touchstart', e => { scrubbing = true; scrubTo(e); }, { passive: true });
    window.addEventListener('mousemove',  e => { if (scrubbing) scrubTo(e); });
    window.addEventListener('touchmove',  e => { if (scrubbing) scrubTo(e); }, { passive: true });
    window.addEventListener('mouseup',  () => { scrubbing = false; });
    window.addEventListener('touchend', () => { scrubbing = false; });
  }

  // ── Volume slider ─────────────────────────────────────────────────────────────
  function setupVolume() {
    const vol = $('lp-volume');
    if (!vol) return;
    vol.value = state.vol * 100;
    vol.addEventListener('input', () => {
      audio.volume = vol.value / 100;
      state.vol    = audio.volume;
    });
  }

  // ── Wire up buttons ───────────────────────────────────────────────────────────
  function wireButtons() {
    const play = $('lp-playpause');
    const prev = $('lp-prev');
    const next = $('lp-next');

    if (play) play.addEventListener('click', togglePlay);
    if (prev) prev.addEventListener('click', prevTrack);
    if (next) next.addEventListener('click', nextTrack);
  }

  // ── Save state before page unload ────────────────────────────────────────────
  window.addEventListener('pagehide', () => saveState(!audio.paused));
  window.addEventListener('beforeunload', () => saveState(!audio.paused));
  // Periodic save while playing
  setInterval(() => { if (!audio.paused) saveState(true); }, 2000);

  // ── bfcache restoration (back/forward button) ────────────────────────────────
  // When the browser restores a page from its Back-Forward Cache, 'pageshow'
  // fires with event.persisted === true. We re-read fresh state from
  // sessionStorage and re-wire everything so the player works correctly.
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return; // normal load — handled below by init()
    // Page was restored from bfcache — re-read state and re-connect UI
    readState();
    wireButtons();
    setupScrub();
    setupVolume();
    updateMeta();
    updateProgress();
    updateUI();
    // Reload audio at the saved position (bfcache froze the audio element)
    loadTrack(state.index, state.resumeTime, state.wasPlaying);
  });

  // ── Init ──────────────────────────────────────────────────────────────────────
  function init() {
    readState();
    wireButtons();
    setupScrub();
    setupVolume();
    updateMeta();
    loadTrack(state.index, state.resumeTime, state.wasPlaying);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
