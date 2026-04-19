(function () {
  const scriptUrl = document.currentScript ? document.currentScript.src : 'js/music-player.js';
  const appUrl = new URL('app.js', scriptUrl);

  import(appUrl.href).catch((error) => {
    console.error('Erro ao carregar o player do portfolio:', error);
  });
})();
