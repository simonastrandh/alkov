// Gemensam navigering högst upp på alla sidor. Ändra länkar här så uppdateras alla sidor.
// Skriptet ligger direkt efter <body>; data-base anger vägen till webbplatsens rot ("" eller "../").
(function () {
  const base = (document.currentScript && document.currentScript.dataset.base) || '';
  const home = document.body.classList.contains('home');
  const path = location.pathname;
  const here = href => path.endsWith(href.replace(/^.*\//, '')) && href.includes('pages/');

  // [text, adress, scroll-mål]. scroll-mål 'hours'/'footer' glider på startsidan, och går annars till startsidan respektive ner i sidfoten.
  const links = [
    ['Meny', base + 'pages/meny.html'],
    ['Öppettider', home ? '#pour' : base + 'index.html#oppettider', 'hours'],
    ['Hitta hit', '#hitta-hit', 'footer'],
    ['Kontakt', '#kontakt', 'footer'],
  ];

  const nav = document.createElement('header');
  nav.className = 'site-nav' + (home ? ' site-nav--home' : '');
  nav.innerHTML = `
    <div class="site-nav__bar">
      <a class="site-nav__logo" href="${base}index.html" aria-label="Alkov, till startsidan">
        <img src="${base}assets/images/alkov-logo.svg" alt="Alkov" width="2972" height="815">
      </a>
      <button class="site-nav__burger" type="button" aria-label="Meny" aria-expanded="false" aria-controls="siteNavLinks">
        <span></span><span></span><span></span>
      </button>
      <nav class="site-nav__links" id="siteNavLinks" aria-label="Huvudmeny">
        <ul>
          ${links.map(([t, h, s]) => `<li><a href="${h}"${s ? ` data-scroll="${s}"` : ''}${here(h) ? ' aria-current="page"' : ''}>${t}</a></li>`).join('')}
        </ul>
        <a class="site-nav__cta" href="${base}pages/boka-bord.html"${here('pages/boka-bord.html') ? ' aria-current="page"' : ''}>Boka bord</a>
      </nav>
    </div>`;
  document.body.prepend(nav);

  // Hamburgare på smala skärmar
  const burger = nav.querySelector('.site-nav__burger');
  const setOpen = open => { nav.classList.toggle('is-open', open); burger.setAttribute('aria-expanded', open); };
  burger.addEventListener('click', () => setOpen(!nav.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setOpen(false); });
  addEventListener('resize', () => { if (innerWidth > 800) setOpen(false); });
  nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setOpen(false)));

  // Startsidan: genomskinligt över bilden, mörkt fält när man scrollat
  function onScroll() { nav.classList.toggle('is-scrolled', scrollY > 24); }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Undersidor: "Hitta hit" och "Kontakt" glider ner till sidfoten (på startsidan sköter main.js det)
  if (!home) {
    nav.querySelectorAll('a[data-scroll="footer"]').forEach(a => a.addEventListener('click', e => {
      const f = document.querySelector('.page-footer');
      if (!f) return;
      e.preventDefault();
      scrollTo({ top: f.getBoundingClientRect().top + scrollY, behavior: 'smooth' });
    }));
  }
})();
