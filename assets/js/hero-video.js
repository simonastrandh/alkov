// Bakgrundsfilm i toppen. Sidan ska ladda snabbt trots filmen, och filmen ska starta snabbt:
//  - Stillbilden (poster) laddas först och visas direkt. Filmen börjar hämtas så fort stillbilden
//    är klar (eller efter en kort stund om den dröjer), alltså inte först när allt annat laddats.
//  - Filmen hoppas över vid "minska rörelse", databesparing och mycket långsamt nät.
//  - Smala skärmar får en mindre fil (768 px) än breda (1280 px). Båda är gjorda för snabb start
//    (ingen ljudspår, "fast start" så att uppspelning kan börja medan filen laddas).
//  - Filmen pausas när toppen inte syns och när fliken är dold (sparar batteri och data).
(function () {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  const conn = navigator.connection || {};
  const slow = conn.saveData || /(^|-)2g$/.test(conn.effectiveType || '');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (slow || reduce) return;                       // stillbilden räcker

  const narrow = window.matchMedia('(max-width: 800px)').matches;
  const src = video.dataset[narrow ? 'srcSmall' : 'srcLarge'];
  if (!src) return;

  let wanted = true;            // synlig + fliken aktiv
  let started = false;
  const update = () => {
    if (!started) return;
    if (wanted && !document.hidden) video.play().catch(() => {});
    else video.pause();
  };

  function start() {
    if (started) return;
    started = true;
    video.muted = true;                              // krävs för autoplay
    video.preload = 'auto';
    video.addEventListener('playing', () => video.classList.add('is-playing'), { once: true });
    video.src = src;
    video.load();
    update();
  }

  // Starta när stillbilden är klar, men senast efter 700 ms. (Inte requestIdleCallback:
  // animationen på sidan håller huvudtråden upptagen, så "ledig tid" kan dröja flera sekunder.)
  const poster = document.querySelector('.hero__photo');
  if (poster && !poster.complete) {
    poster.addEventListener('load', start, { once: true });
    poster.addEventListener('error', start, { once: true });
    setTimeout(start, 700);
  } else {
    start();
  }

  new IntersectionObserver(([e]) => { wanted = e.isIntersecting; update(); }, { threshold: 0.05 })
    .observe(document.querySelector('.hero') || video);
  document.addEventListener('visibilitychange', update);
})();
