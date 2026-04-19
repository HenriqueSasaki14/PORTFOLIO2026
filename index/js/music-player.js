(function () {
  if (window.self !== window.top) {
    const style = document.createElement('style');
    style.textContent = `
      .topbar,
      .footer {
        display: none !important;
      }

      body {
        background: transparent !important;
      }

      main {
        padding-top: 24px !important;
      }
    `;
    document.head.appendChild(style);
    return;
  }

  const tracks = [
    {
      title: 'Lofi Lo-Fi',
      artist: 'BFCMusic',
      src: '../audio/bfcmusic-lofi-lo-fi-511230.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Good Night Lofi Cozy Chill Music',
      artist: 'FASSounds',
      src: '../audio/fassounds-good-night-lofi-cozy-chill-music-160166.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Study Calm Peaceful Chill Hop',
      artist: 'FASSounds',
      src: '../audio/fassounds-lofi-study-calm-peaceful-chill-hop-112191.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Chill Music',
      artist: 'FreeMusicForVideo',
      src: '../audio/freemusicforvideo-lofi-chill-music-495628.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Music',
      artist: 'LemonMusicLab',
      src: '../audio/lemonmusiclab-lofi-lofi-music-499264.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Girl Chill Ambient',
      artist: 'Lofi Music Library',
      src: '../audio/lofi_music_library-lofi-girl-chill-lofi-beats-lofi-ambient-461871.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Beats',
      artist: 'MondaMusic',
      src: '../audio/mondamusic-lofi-beats-499181.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Chill',
      artist: 'MondaMusic',
      src: '../audio/mondamusic-lofi-chill-chill-512854.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Chill Lofi Girl',
      artist: 'MondaMusic',
      src: '../audio/mondamusic-lofi-lofi-chill-lofi-girl-491690.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Girl Lofi Chill',
      artist: 'MondaMusic',
      src: '../audio/mondamusic-lofi-lofi-girl-lofi-chill-512853.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Chill Lofi Girl',
      artist: 'Paulyudin',
      src: '../audio/paulyudin-lofi-lofi-chill-lofi-girl-482399.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Chill Lofi Girl',
      artist: 'Playstarz Music',
      src: '../audio/playstarz_music-lofi-chill-lofi-girl-lofi-490880.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi',
      artist: 'The Mountain',
      src: '../audio/the_mountain-lofi-513863.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Music',
      artist: 'The Mountain',
      src: '../audio/the_mountain-lofi-lofi-music-496553.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Beat',
      artist: 'Vibehorn',
      src: '../audio/vibehorn-lofi-beat-lo-fi-music-512500.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Chill Lofi Girl',
      artist: 'Watermello Lofi',
      src: '../audio/watermello-lofi-chill-lofi-girl-lofi-488388.mp3',
      cover: '../Images/sesi.jpg'
    },
    {
      title: 'Lofi Girl Lofi Chill',
      artist: 'Watermello Lofi',
      src: '../audio/watermello-lofi-lofi-girl-lofi-chill-484610.mp3',
      cover: '../Images/sesi.jpg'
    }
  ];

  const storageKey = 'portfolioMusicPlayerState';

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) {
      return '00:00';
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  function readStoredState() {
    try {
      return JSON.parse(localStorage.getItem(storageKey)) || {};
    } catch {
      return {};
    }
  }

  function writeStoredState(state) {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Local storage can be unavailable in some browser privacy modes.
    }
  }

  function setupPersistentNavigation() {
    const stylesheet = document.querySelector('link[rel="stylesheet"][href*="css/"]');
    const pageCache = new Map();
    const appMain = document.querySelector('main');
    const homeMainMarkup = appMain ? appMain.innerHTML : '';
    const homeMainClass = appMain ? appMain.className : '';
    let pageFrame = null;
    const knownPages = [
      'index.html',
      'escola.html',
      'ensino-medio.html',
      'tecnico-desenvolvimento.html',
      'ensino-medio-1-humanas.html',
      'ensino-medio-1-matematica.html',
      'ensino-medio-1-natureza.html',
      'ensino-medio-1-linguagens.html'
    ];
    const pageStylesheets = new Map([
      ['index.html', 'index.css'],
      ['escola.html', 'escola.css'],
      ['ensino-medio.html', 'ensino-medio.css'],
      ['tecnico-desenvolvimento.html', 'tecnico-desenvolvimento.css'],
      ['ensino-medio-1-humanas.html', 'ensino-medio-1-humanas.css'],
      ['ensino-medio-1-matematica.html', 'ensino-medio-1-matematica.css'],
      ['ensino-medio-1-natureza.html', 'ensino-medio-1-natureza.css'],
      ['ensino-medio-1-linguagens.html', 'ensino-medio-1-linguagens.css']
    ]);
    let isLoadingPage = false;

    function isInternalPageLink(link) {
      if (!link || link.hasAttribute('download')) {
        return false;
      }

      const href = link.getAttribute('href');

      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        return false;
      }

      const url = new URL(link.href, window.location.href);
      const isSamePageHash = url.pathname === window.location.pathname && url.hash;
      const isSameOrigin = url.origin === window.location.origin ||
        (url.protocol === 'file:' && window.location.protocol === 'file:');

      return isSameOrigin && (url.pathname === '/' || url.pathname.endsWith('.html')) && !isSamePageHash;
    }

    function isPortfolioPageLink(link) {
      if (!isInternalPageLink(link)) {
        return false;
      }

      const pageName = getPageName(new URL(link.href, window.location.href));
      return knownPages.includes(pageName);
    }

    function getPageKey(url) {
      const pageUrl = new URL(url.href);
      pageUrl.hash = '';
      return pageUrl.pathname === '/' ? '/index.html' : pageUrl.pathname;
    }

    function getPageName(url) {
      const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
      return pathname.split('/').pop() || 'index.html';
    }

    function getFetchUrl(url) {
      if (window.location.protocol === 'file:') {
        if (isSpaShell()) {
          return new URL(`html/${getPageName(url)}`, window.location.href).href;
        }

        return url.href;
      }

      return `${window.location.origin}/html/${getPageName(url)}`;
    }

    function getPublicUrl(url) {
      const pageName = getPageName(url);
      const hash = url.hash || '';

      if (pageName === 'index.html') {
        return `/${hash}`;
      }

      return `/${pageName}${hash}`;
    }

    function getRouteHash(url) {
      const pageName = getPageName(url);
      const routeName = pageName.replace(/\.html$/, '');

      if (pageName === 'index.html') {
        return url.hash || '#/';
      }

      return `#/${routeName}`;
    }

    function isPageRouteHash(hash) {
      return hash === '#/' || hash.startsWith('#/');
    }

    function getUrlFromRouteHash(hash) {
      const routeName = hash.replace(/^#\//, '') || 'index';
      const pageName = routeName === 'index' ? 'index.html' : `${routeName}.html`;

      return new URL(pageName, window.location.href);
    }

    function getStylesheetUrl(pageName) {
      const cssFile = pageStylesheets.get(pageName);

      if (!cssFile) {
        return '';
      }

      if (window.location.protocol === 'file:') {
        return `../css/${cssFile}`;
      }

      return `/css/${cssFile}`;
    }

    function isSpaShell() {
      const script = document.querySelector('script[src$="js/music-player.js"]');
      const rootStylesheet = document.querySelector('link[rel="stylesheet"][href="css/index.css"]');

      return Boolean(script && rootStylesheet);
    }

    function getFrameUrl(url) {
      const pageName = getPageName(url);

      if (window.location.protocol === 'file:') {
        return `html/${pageName}`;
      }

      return `/html/${pageName}`;
    }

    function getPageTitle(pageName) {
      const titles = {
        'index.html': 'Portfólio — Henrique Sasaki Tannous',
        'escola.html': 'Projetos da Escola - Henrique Sasaki Tannous',
        'ensino-medio.html': 'Ensino Medio - Henrique Sasaki Tannous',
        'tecnico-desenvolvimento.html': 'Tecnico em Desenvolvimento de Sistemas - Henrique Sasaki Tannous',
        'ensino-medio-1-humanas.html': 'Humanas - 1 Trimestre - Henrique Sasaki Tannous',
        'ensino-medio-1-matematica.html': 'Matematica - 1 Trimestre - Henrique Sasaki Tannous',
        'ensino-medio-1-natureza.html': 'Ciencias da Natureza - 1 Trimestre - Henrique Sasaki Tannous',
        'ensino-medio-1-linguagens.html': 'Linguagens - 1 Trimestre - Henrique Sasaki Tannous'
      };

      return titles[pageName] || titles['index.html'];
    }

    function attachFrameNavigation() {
      if (!pageFrame || !pageFrame.contentDocument) {
        return;
      }

      const frameDocument = pageFrame.contentDocument;

      frameDocument.querySelectorAll('a[href]').forEach((link) => {
        if (isPortfolioPageLink(link)) {
          link.removeAttribute('target');
          link.removeAttribute('rel');
          return;
        }

        if (!isInternalPageLink(link)) {
          link.setAttribute('target', '_top');
          link.setAttribute('rel', 'noreferrer');
        }
      });

      frameDocument.addEventListener('click', (event) => {
        const link = event.target.closest('a');

        if (!link) {
          return;
        }

        if (!isPortfolioPageLink(link)) {
          const href = link.getAttribute('href');

          if (href && !href.startsWith('#')) {
            event.preventDefault();
            window.top.location.href = link.href;
          }

          return;
        }

        event.preventDefault();
        showFramedPage(new URL(link.href, window.location.href), true);
      });
    }

    function showHomePage(url, addToHistory = true) {
      if (!appMain) {
        return;
      }

      appMain.className = homeMainClass;
      appMain.innerHTML = homeMainMarkup;
      document.title = getPageTitle('index.html');

      if (addToHistory) {
        history.pushState({ portfolioPage: true }, '', getPublicUrl(new URL('index.html', window.location.href)));
      }

      scrollToPageTarget(url.hash);
    }

    function showFramedPage(url, addToHistory = true) {
      if (!appMain) {
        return;
      }

      const pageName = getPageName(url);

      if (pageName === 'index.html') {
        showHomePage(url, addToHistory);
        return;
      }

      if (!pageFrame) {
        pageFrame = document.createElement('iframe');
        pageFrame.className = 'page-frame';
        pageFrame.title = 'Conteúdo do portfólio';
        pageFrame.addEventListener('load', attachFrameNavigation);
      }

      appMain.className = 'frame-shell';
      appMain.innerHTML = '';
      appMain.appendChild(pageFrame);
      document.title = getPageTitle(pageName);
      pageFrame.src = getFrameUrl(url);

      if (addToHistory) {
        history.pushState({ portfolioPage: true }, '', getPublicUrl(url));
      }
    }

    function addResourceHint(href, rel, as) {
      if (!href || document.querySelector(`link[rel="${rel}"][href="${href}"]`)) {
        return;
      }

      const link = document.createElement('link');
      link.rel = rel;
      link.href = href;

      if (as) {
        link.as = as;
      }

      document.head.appendChild(link);
    }

    function readCachedPage(key) {
      if (pageCache.has(key)) {
        return pageCache.get(key);
      }

      try {
        return sessionStorage.getItem(`portfolio-page:${key}`);
      } catch {
        return null;
      }
    }

    function writeCachedPage(key, html) {
      pageCache.set(key, html);

      try {
        sessionStorage.setItem(`portfolio-page:${key}`, html);
      } catch {
        // Session storage can be unavailable or full; memory cache still helps.
      }
    }

    async function getPageHtml(url) {
      const key = getPageKey(url);
      const cachedPage = readCachedPage(key);

      if (cachedPage) {
        pageCache.set(key, cachedPage);
        return cachedPage;
      }

      const response = await fetch(getFetchUrl(url), { cache: 'force-cache' });

      if (!response.ok) {
        throw new Error(`Unable to load page: ${key}`);
      }

      const html = await response.text();
      writeCachedPage(key, html);
      return html;
    }

    function preloadInternalPages() {
      knownPages.forEach((page) => {
        const url = new URL(page, window.location.href);

        addResourceHint(getFetchUrl(url), 'prefetch');
        addResourceHint(getStylesheetUrl(page), 'preload', 'style');
        getPageHtml(url).catch(() => {});
      });

      document.querySelectorAll('a').forEach((link) => {
        if (!isInternalPageLink(link)) {
          return;
        }

        getPageHtml(new URL(link.href, window.location.href)).catch(() => {});
      });
    }

    function syncBackgroundShape(nextDocument) {
      const currentShape = document.querySelector('.bg-shape');
      const nextShape = nextDocument.querySelector('.bg-shape');

      if (nextShape && !currentShape) {
        document.body.insertAdjacentHTML('afterbegin', nextShape.outerHTML);
        return;
      }

      if (!nextShape && currentShape) {
        currentShape.remove();
      }
    }

    function scrollToPageTarget(hash) {
      if (!hash) {
        window.scrollTo({ top: 0, behavior: 'auto' });
        return;
      }

      const target = document.querySelector(hash);

      if (target) {
        target.scrollIntoView();
      }
    }

    async function loadPage(url, addToHistory = true) {
      if (isLoadingPage) {
        return;
      }

      isLoadingPage = true;
      try {
        const html = await getPageHtml(url);
        const nextDocument = new DOMParser().parseFromString(html, 'text/html');
        const nextMain = nextDocument.querySelector('main');
        const currentMain = document.querySelector('main');
        const nextFooter = nextDocument.querySelector('.footer');
        const currentFooter = document.querySelector('.footer');
        const nextNav = nextDocument.querySelector('.nav');
        const currentNav = document.querySelector('.nav');
        const nextStylesheet = nextDocument.querySelector('link[rel="stylesheet"][href*="../css/"]');

        if (!nextMain || !currentMain) {
          throw new Error(`Invalid page: ${url.href}`);
        }

        document.title = nextDocument.title;
        currentMain.replaceWith(nextMain);

        if (nextFooter && currentFooter) {
          currentFooter.replaceWith(nextFooter);
        }

        if (nextNav && currentNav) {
          currentNav.innerHTML = nextNav.innerHTML;
        }

        if (stylesheet) {
          const nextStylesheetUrl = getStylesheetUrl(getPageName(url));

          if (nextStylesheetUrl) {
            stylesheet.setAttribute('href', nextStylesheetUrl);
          } else if (nextStylesheet) {
            stylesheet.setAttribute('href', nextStylesheet.getAttribute('href'));
          }
        }

        syncBackgroundShape(nextDocument);
        preloadInternalPages();

        if (addToHistory) {
          history.pushState({ portfolioPage: true }, '', getPublicUrl(url));
        }

        scrollToPageTarget(url.hash);
      } finally {
        isLoadingPage = false;
      }
    }

    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');

      if (!isInternalPageLink(link)) {
        const href = link && link.getAttribute('href');

        if (href && href.startsWith('#') && !document.querySelector(href)) {
          event.preventDefault();
          showHomePage(new URL(`index.html${href}`, window.location.href), true);
        }

        return;
      }

      event.preventDefault();

      if (isSpaShell()) {
        const targetUrl = new URL(link.href, window.location.href);
        showFramedPage(targetUrl, true);
        return;
      }

      loadPage(new URL(link.href, window.location.href)).catch(() => {
        isLoadingPage = false;
      });
    });

    window.addEventListener('hashchange', () => {
      if (isSpaShell()) {
        return;
      }

      if (!isPageRouteHash(window.location.hash)) {
        return;
      }

      loadPage(getUrlFromRouteHash(window.location.hash), false).catch(() => {
        isLoadingPage = false;
      });
    });

    window.addEventListener('popstate', () => {
      if (isSpaShell()) {
        showFramedPage(new URL(window.location.href), false);
        return;
      }

      loadPage(new URL(window.location.href), false).catch(() => {
        isLoadingPage = false;
      });
    });

    if ('navigation' in window && typeof window.navigation.addEventListener === 'function') {
      window.navigation.addEventListener('navigate', (event) => {
        const url = new URL(event.destination.url);
        const isSameOrigin = url.origin === window.location.origin;
        const isHtmlRoute = url.pathname === '/' || url.pathname.endsWith('.html');

        if (!event.canIntercept || !isSameOrigin || !isHtmlRoute) {
          return;
        }

        event.intercept({
          handler: () => {
            if (isSpaShell()) {
              showFramedPage(url, false);
              return Promise.resolve();
            }

            return loadPage(url, false);
          }
        });
      });
    }

    writeCachedPage('/index.html', document.documentElement.outerHTML);
    history.replaceState({ portfolioPage: true }, '', window.location.href);
    preloadInternalPages();

    const initialUrl = isPageRouteHash(window.location.hash)
      ? getUrlFromRouteHash(window.location.hash)
      : new URL(window.location.href);

    if (isSpaShell() && getPageName(initialUrl) !== 'index.html') {
      showFramedPage(initialUrl, false);
    }
  }

  document.querySelectorAll('.music-player').forEach((player) => {
    const audio = player.querySelector('.music-audio');
    const title = player.querySelector('.music-track');
    const artist = player.querySelector('.music-artist');
    const current = player.querySelector('.music-current');
    const duration = player.querySelector('.music-duration');
    const progress = player.querySelector('.music-progress');
    const playButton = player.querySelector('.music-play');
    const nextButton = player.querySelector('.music-next');
    const prevButton = player.querySelector('.music-prev');
    const volume = player.querySelector('.music-volume');
    const storedState = readStoredState();
    let currentTrack = Number.isInteger(storedState.track) ? storedState.track : 0;
    let pendingStartTime = Number.isFinite(storedState.time) ? storedState.time : 0;
    let shouldResume = storedState.isPlaying === true;
    let isLeavingPage = false;
    let seeking = false;

    if (currentTrack < 0 || currentTrack >= tracks.length) {
      currentTrack = 0;
    }

    if (Number.isFinite(storedState.volume)) {
      volume.value = Math.min(100, Math.max(0, storedState.volume));
    }

    function getVolumeValue() {
      const value = Number(volume.value);

      if (!Number.isFinite(value)) {
        return 0.55;
      }

      const normalizedVolume = Math.min(1, Math.max(0, value / 100));

      return normalizedVolume * normalizedVolume * normalizedVolume;
    }

    function updateVolume() {
      audio.volume = getVolumeValue();
    }

    function saveState(isPlaying) {
      writeStoredState({
        track: currentTrack,
        time: Number.isFinite(audio.currentTime) ? audio.currentTime : pendingStartTime,
        volume: Number(volume.value),
        isPlaying
      });
    }

    function loadTrack(index, startTime = 0) {
      const track = tracks[index];
      pendingStartTime = Number.isFinite(startTime) ? startTime : 0;
      title.textContent = track.title;
      artist.textContent = track.artist;
      audio.src = track.src;
      progress.value = 0;
      current.textContent = '00:00';
      duration.textContent = '00:00';
    }

    function waitForResumeGesture() {
      const resume = () => {
        document.removeEventListener('pointerdown', resume);
        document.removeEventListener('keydown', resume);
        playTrack();
      };

      document.addEventListener('pointerdown', resume);
      document.addEventListener('keydown', resume);
    }

    function playTrack(retryOnGesture = false) {
      audio.play().then(() => {
        player.classList.add('is-playing');
        player.classList.remove('has-audio-error');
        saveState(true);
      }).catch((error) => {
        const wasBlockedByBrowser = error && error.name === 'NotAllowedError';

        if (!wasBlockedByBrowser) {
          player.classList.add('has-audio-error');
        }

        if (retryOnGesture) {
          waitForResumeGesture();
        }
      });
    }

    function nextTrack() {
      currentTrack = (currentTrack + 1) % tracks.length;
      loadTrack(currentTrack);
      playTrack();
      saveState(true);
    }

    function previousTrack() {
      currentTrack = (currentTrack - 1 + tracks.length) % tracks.length;
      loadTrack(currentTrack);
      playTrack();
      saveState(true);
    }

    playButton.addEventListener('click', () => {
      if (audio.paused) {
        playTrack();
        return;
      }

      audio.pause();
      player.classList.remove('is-playing');
      saveState(false);
    });

    nextButton.addEventListener('click', nextTrack);
    prevButton.addEventListener('click', previousTrack);

    volume.addEventListener('input', () => {
      updateVolume();
      saveState(!audio.paused);
    });

    progress.addEventListener('input', () => {
      seeking = true;
      const target = (Number(progress.value) / 100) * audio.duration;
      current.textContent = formatTime(target);
    });

    progress.addEventListener('change', () => {
      if (Number.isFinite(audio.duration)) {
        audio.currentTime = (Number(progress.value) / 100) * audio.duration;
      }
      seeking = false;
      saveState(!audio.paused);
    });

    audio.addEventListener('loadedmetadata', () => {
      if (pendingStartTime > 0 && Number.isFinite(audio.duration)) {
        audio.currentTime = Math.min(pendingStartTime, Math.max(0, audio.duration - 1));
        pendingStartTime = 0;
      }

      duration.textContent = formatTime(audio.duration);

      if (shouldResume) {
        shouldResume = false;
        playTrack(true);
      }
    });

    audio.addEventListener('timeupdate', () => {
      if (seeking || !Number.isFinite(audio.duration)) {
        return;
      }

      progress.value = (audio.currentTime / audio.duration) * 100 || 0;
      current.textContent = formatTime(audio.currentTime);
      duration.textContent = formatTime(audio.duration);
      saveState(!audio.paused);
    });

    audio.addEventListener('ended', nextTrack);
    audio.addEventListener('pause', () => {
      if (!isLeavingPage) {
        saveState(false);
      }
    });
    audio.addEventListener('play', () => saveState(true));
    window.addEventListener('pagehide', () => {
      isLeavingPage = true;
      saveState(!audio.paused);
    });
    window.addEventListener('beforeunload', () => {
      isLeavingPage = true;
      saveState(!audio.paused);
    });

    updateVolume();
    loadTrack(currentTrack, pendingStartTime);
  });

  setupPersistentNavigation();
})();
