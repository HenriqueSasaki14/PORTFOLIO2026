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

const pageStylesheets = {
  'index.html': 'index.css',
  'escola.html': 'escola.css',
  'ensino-medio.html': 'ensino-medio.css',
  'tecnico-desenvolvimento.html': 'tecnico-desenvolvimento.css',
  'ensino-medio-1-humanas.html': 'ensino-medio-1-humanas.css',
  'ensino-medio-1-matematica.html': 'ensino-medio-1-matematica.css',
  'ensino-medio-1-natureza.html': 'ensino-medio-1-natureza.css',
  'ensino-medio-1-linguagens.html': 'ensino-medio-1-linguagens.css'
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

function getStylesheetUrl(pageName) {
  const cssFile = pageStylesheets[pageName] || pageStylesheets['index.html'];

  if (window.location.protocol === 'file:') {
    return `../css/${cssFile}`;
  }

  return `/css/${cssFile}`;
}

async function getPageMainMarkup(url) {
  const response = await fetch(getFrameUrl(url), { cache: 'force-cache' });

  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${getFrameUrl(url)}`);
  }

  const html = await response.text();
  const pageDocument = new DOMParser().parseFromString(html, 'text/html');
  const main = pageDocument.querySelector('main');

  if (!main) {
    throw new Error(`Pagina sem main: ${getFrameUrl(url)}`);
  }

  return main.outerHTML;
}

function buildFrameDocument(url, mainMarkup) {
  const pageName = getPageName(url);
  const baseHref = window.location.protocol === 'file:'
    ? new URL('html/', window.location.href).href
    : `${window.location.origin}/html/`;

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="${baseHref}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${getStylesheetUrl(pageName)}">
  <style>
    body { background: transparent !important; min-height: auto !important; }
    main { padding-top: 24px !important; }
  </style>
</head>
<body>
  ${mainMarkup}
</body>
</html>`;
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
    appMain.removeAttribute('style');
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
      showPage(new URL(link.href, window.location.href), true).catch((error) => {
        console.error('Erro ao navegar no portfolio:', error);
      });
    });
  }

  async function showPage(url, addToHistory = true) {
    const pageName = getPageName(url);

    if (pageName === 'index.html') {
      showHomePage(url, addToHistory);
      return;
    }

    if (!pageFrame) {
      pageFrame = document.createElement('iframe');
      pageFrame.className = 'page-frame';
      pageFrame.title = 'Conteúdo do portfólio';
      pageFrame.setAttribute('width', '100%');
      pageFrame.setAttribute('height', '100%');
      Object.assign(pageFrame.style, {
        display: 'block',
        width: '100%',
        minWidth: '100%',
        height: 'calc(100vh - 112px)',
        minHeight: '760px',
        border: '0',
        background: 'transparent'
      });
      pageFrame.addEventListener('load', attachFrameNavigation);
    }

    appMain.className = 'frame-shell';
    Object.assign(appMain.style, {
      width: '100%',
      maxWidth: 'none',
      margin: '0',
      padding: '0'
    });
    appMain.replaceChildren(pageFrame);
    const mainMarkup = await getPageMainMarkup(url);
    pageFrame.srcdoc = buildFrameDocument(url, mainMarkup);
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
    showPage(new URL(link.href, window.location.href), true).catch((error) => {
      console.error('Erro ao navegar no portfolio:', error);
    });
  });

  window.addEventListener('popstate', () => {
    showPage(new URL(window.location.href), false).catch((error) => {
      console.error('Erro ao voltar no portfolio:', error);
    });
  });

  history.replaceState({ portfolioPage: true }, '', window.location.href);

  const initialUrl = new URL(window.location.href);

  if (getPageName(initialUrl) !== 'index.html') {
    showPage(initialUrl, false).catch((error) => {
      console.error('Erro ao abrir rota inicial do portfolio:', error);
    });
  }
}
