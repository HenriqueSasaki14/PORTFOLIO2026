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
  'index.html': 'Portfolio - Henrique Sasaki Tannous',
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

function getSourceUrl(pageName) {
  if (window.location.protocol === 'file:') {
    return `html/${pageName}`;
  }

  return `/html/${pageName}`;
}

function getStylesheetUrl(pageName) {
  const cssFile = pageStylesheets[pageName] || pageStylesheets['index.html'];

  if (window.location.protocol === 'file:') {
    return `css/${cssFile}`;
  }

  return `/css/${cssFile}`;
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

function normalizeAssetPaths(root) {
  root.querySelectorAll('[src]').forEach((element) => {
    const src = element.getAttribute('src');

    if (src && src.startsWith('../')) {
      element.setAttribute('src', src.replace(/^\.\.\//, ''));
    }
  });

  root.querySelectorAll('[href]').forEach((element) => {
    const href = element.getAttribute('href');

    if (href && href.startsWith('../')) {
      element.setAttribute('href', href.replace(/^\.\.\//, ''));
    }
  });
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

async function getMainFromPage(pageName) {
  const response = await fetch(getSourceUrl(pageName), { cache: 'force-cache' });

  if (!response.ok) {
    throw new Error(`Nao foi possivel carregar ${getSourceUrl(pageName)}`);
  }

  const html = await response.text();
  const pageDocument = new DOMParser().parseFromString(html, 'text/html');
  const main = pageDocument.querySelector('main');

  if (!main) {
    throw new Error(`Pagina sem main: ${getSourceUrl(pageName)}`);
  }

  normalizeAssetPaths(main);
  return main;
}

export function initFrameRouter() {
  let appMain = document.querySelector('main');
  const stylesheet = document.querySelector('link[rel="stylesheet"][href*="css/"]');

  if (!appMain) {
    return;
  }

  if (stylesheet) {
    stylesheet.setAttribute('href', getStylesheetUrl('index.html'));
  }

  const homeMain = appMain.cloneNode(true);
  normalizeAssetPaths(homeMain);

  async function showPage(url, addToHistory = true) {
    const pageName = getPageName(url);
    const nextMain = pageName === 'index.html'
      ? homeMain.cloneNode(true)
      : await getMainFromPage(pageName);

    normalizeAssetPaths(nextMain);
    appMain.replaceWith(nextMain);
    appMain = nextMain;
    document.title = pageTitles[pageName] || pageTitles['index.html'];

    if (addToHistory) {
      history.pushState({ portfolioPage: true }, '', getPublicUrl(url));
    }

    scrollToHash(url.hash);
  }

  document.addEventListener('click', (event) => {
    const link = event.target.closest('a');

    if (!link) {
      return;
    }

    const href = link.getAttribute('href');

    if (href && href.startsWith('#')) {
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
