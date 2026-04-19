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

const pageTitles = {
  'index.html': 'Portfólio — Henrique Sasaki Tannous',
  'escola.html': 'Projetos da Escola - Henrique Sasaki Tannous',
  'ensino-medio.html': 'Ensino Medio - Henrique Sasaki Tannous',
  'tecnico-desenvolvimento.html': 'Tecnico em Desenvolvimento de Sistemas - Henrique Sasaki Tannous',
  'ensino-medio-1-humanas.html': 'Humanas - 1 Trimestre - Henrique Sasaki Tannous',
  'ensino-medio-1-matematica.html': 'Matematica - 1 Trimestre - Henrique Sasaki Tannous',
  'ensino-medio-1-natureza.html': 'Ciencias da Natureza - 1 Trimestre - Henrique Sasaki Tannous',
  'ensino-medio-1-linguagens.html': 'Linguagens - 1 Trimestre - Henrique Sasaki Tannous'
};

function getPageName(url) {
  const pathname = url.pathname === '/' ? '/index.html' : url.pathname;
  return pathname.split('/').pop() || 'index.html';
}

function getPublicUrl(url) {
  const pageName = getPageName(url);

  if (pageName === 'index.html') {
    return url.hash || '/';
  }

  return `/${pageName}${url.hash || ''}`;
}

function getFrameUrl(url) {
  const pageName = getPageName(url);

  if (window.location.protocol === 'file:') {
    return `html/${pageName}`;
  }

  return `/html/${pageName}`;
}

function isPortfolioPageLink(link) {
  if (!link || link.hasAttribute('download')) {
    return false;
  }

  const href = link.getAttribute('href');

  if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) {
    return false;
  }

  const url = new URL(link.href, window.location.href);
  const isSameOrigin = url.origin === window.location.origin ||
    (url.protocol === 'file:' && window.location.protocol === 'file:');

  return isSameOrigin && knownPages.includes(getPageName(url));
}

function scrollToHash(hash) {
  if (!hash) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  const target = document.querySelector(hash);

  if (target) {
    target.scrollIntoView();
  }
}

export function initFrameRouter() {
  const appMain = document.querySelector('main');

  if (!appMain) {
    return;
  }

  const homeMainMarkup = appMain.innerHTML;
  const homeMainClass = appMain.className;
  let pageFrame = null;

  function showHomePage(url, addToHistory = true) {
    appMain.className = homeMainClass;
    appMain.innerHTML = homeMainMarkup;
    document.title = pageTitles['index.html'];

    if (addToHistory) {
      history.pushState({ portfolioPage: true }, '', getPublicUrl(new URL('index.html', window.location.href)));
    }

    scrollToHash(url.hash);
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

      link.setAttribute('target', '_top');
      link.setAttribute('rel', 'noreferrer');
    });

    frameDocument.addEventListener('click', (event) => {
      const link = event.target.closest('a');

      if (!link || !isPortfolioPageLink(link)) {
        return;
      }

      event.preventDefault();
      showPage(new URL(link.href, window.location.href), true);
    });
  }

  function showPage(url, addToHistory = true) {
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
    appMain.replaceChildren(pageFrame);
    pageFrame.src = getFrameUrl(url);
    document.title = pageTitles[pageName] || pageTitles['index.html'];

    if (addToHistory) {
      history.pushState({ portfolioPage: true }, '', getPublicUrl(url));
    }
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (!link) {
      return;
    }

    const href = link.getAttribute('href');

    if (href && href.startsWith('#') && !document.querySelector(href)) {
      event.preventDefault();
      showHomePage(new URL(`index.html${href}`, window.location.href), true);
      return;
    }

    if (!isPortfolioPageLink(link)) {
      return;
    }

    event.preventDefault();
    showPage(new URL(link.href, window.location.href), true);
  });

  window.addEventListener('popstate', () => {
    showPage(new URL(window.location.href), false);
  });

  history.replaceState({ portfolioPage: true }, '', window.location.href);

  const initialUrl = new URL(window.location.href);

  if (getPageName(initialUrl) !== 'index.html') {
    showPage(initialUrl, false);
  }
}
