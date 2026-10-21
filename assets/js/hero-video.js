// Bakgrundsfilmen i toppen startar direkt (se <video> och det lilla skriptet i index.html).
// Det här skriptet ser till att den håller igång:
//  - tonar in filmen över stillbilden så fort den spelar
//  - försöker igen om webbläsaren stoppade starten (t.ex. iPhone i strömsparläge släpper bara
//    igenom uppspelning efter en tryckning, så första tryck/scroll på sidan startar den då)
//  - pausar filmen när toppen inte syns eller fliken är dold (sparar batteri), och startar den igen
(function () {
  const video = document.getElementById('heroVideo');
  if (!video) return;

  let visible = true;

  const shown = () => { if (!video.paused && video.currentTime > 0) video.classList.add('is-playing'); };
  ['playing', 'timeupdate', 'loadeddata'].forEach(e => video.addEventListener(e, shown));
  shown();

  const tryPlay = () => {
    if (!visible || document.hidden || !video.paused) return;
    const p = video.play();
    if (p && p.catch) p.catch(() => {});
  };

  // fler försök medan filmen laddar
  ['loadedmetadata', 'canplay', 'canplaythrough', 'stalled', 'suspend'].forEach(e => video.addEventListener(e, tryPlay));

  // om uppspelning kräver en tryckning (strömsparläge m.m.): starta vid första interaktionen
  const gesture = () => {
    tryPlay();
    if (!video.paused) ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'wheel'].forEach(e => window.removeEventListener(e, gesture, true));
  };
  ['touchstart', 'touchend', 'pointerdown', 'click', 'keydown', 'wheel'].forEach(e => window.addEventListener(e, gesture, { capture: true, passive: true }));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) tryPlay(); else video.pause();
  }, { threshold: 0.05 }).observe(document.querySelector('.hero') || video);

  document.addEventListener('visibilitychange', () => { if (document.hidden) video.pause(); else tryPlay(); });
  window.addEventListener('pageshow', tryPlay);

  // sista utväg: kontrollera efter en stund
  setTimeout(tryPlay, 1500);
})();
