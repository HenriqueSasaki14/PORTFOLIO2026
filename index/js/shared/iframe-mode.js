export function enableIframeMode() {
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
}
