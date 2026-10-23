// Gemensam sidfot för alla sidor. Ändra texter och länkar här så uppdateras alla sidor.
// Skriptet läggs sist i <body>; data-base anger vägen till webbplatsens rot ("" eller "../").
(function () {
  const base = (document.currentScript && document.currentScript.dataset.base) || '';
  const footer = document.createElement('footer');
  footer.className = 'page-footer';
  footer.innerHTML = `
    <div class="page-footer__inner">
      <div class="page-footer__brand">
        <a href="${base}index.html" aria-label="Alkov, till startsidan">
          <img src="${base}assets/images/alkov-logga-ljus.png" alt="Alkov" width="1694" height="465" loading="lazy" decoding="async">
        </a>
        <p>En varm bistro för sena kvällar och goda vänner.</p>
        <p>Tack för att ni besöker oss!</p>
      </div>

      <div class="page-footer__col" id="hitta-hit">
        <h2>Hitta hit</h2>
        <address>
          <a href="https://www.google.com/maps/search/?api=1&query=J%C3%A4rntorget+6+413+04+G%C3%B6teborg" target="_blank" rel="noopener">Järntorget 6<br>413 04, Göteborg</a>
          <span>Närmaste hållplats: Järntorget</span>
        </address>
      </div>

      <div class="page-footer__col" id="kontakt">
        <h2>Kontakt</h2>
        <ul>
          <li><a href="tel:+46722150916">+46 72-215 09 16</a></li>
          <li><a href="mailto:alkov.bar@gmail.com">alkov.bar@gmail.com</a></li>
          <li>Instagram: <a href="https://www.instagram.com/baralkov" target="_blank" rel="noopener">@baralkov</a></li>
        </ul>
      </div>
    </div>
    <p class="page-footer__legal">&copy; 2026 Bar Alkov</p>`;
  document.body.append(footer);
})();
