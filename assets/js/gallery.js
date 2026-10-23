// Välkomna-bilderna: en oändlig slinga. Originalen kopieras före och efter, och när man närmar sig
// en kant hoppar vi ett helt varv, så att man kan scrolla hur långt som helst åt båda håll.
// Pilar för dem med mus; på telefon sveper man; piltangenter fungerar när bilderna har fokus.
(function () {
  const track = document.getElementById('galleryTrack');
  if (!track) return;
  const prev = document.querySelector('.gallery__arrow--prev');
  const next = document.querySelector('.gallery__arrow--next');
  const originals = Array.from(track.querySelectorAll('.print'));
  if (!originals.length) return;

  function copy(el) {
    const c = el.cloneNode(true);
    c.setAttribute('aria-hidden', 'true');
    c.querySelector('img').alt = '';
    return c;
  }
  const before = originals.map(copy), after = originals.map(copy);
  before.forEach(c => track.insertBefore(c, originals[0]));
  after.forEach(c => track.appendChild(c));

  let setW = 0;
  function measure() {
    setW = after[0].offsetLeft - originals[0].offsetLeft;   // ett helt varv, inklusive mellanrum
  }
  // en bild i mitten av första skärmen när vi startar
  function home() {
    measure();
    track.scrollLeft = setW + originals[0].offsetLeft - (track.clientWidth - originals[0].offsetWidth) / 2;
  }

  let settle;
  function wrap(force) {
    if (!setW) return;
    const x = track.scrollLeft;
    if (x < setW * 0.5 || x > setW * 1.5) {
      track.style.scrollSnapType = 'none';        // hoppet får inte snäppa till något annat
      track.scrollLeft = x < setW * 0.5 ? x + setW : x - setW;
      requestAnimationFrame(() => { track.style.scrollSnapType = ''; });
    }
  }
  track.addEventListener('scroll', () => {
    clearTimeout(settle);
    settle = setTimeout(wrap, 90);                 // när rörelsen lugnat sig
    const x = track.scrollLeft;
    if (x < setW * 0.1 || x > setW * 1.9) wrap(true);   // snabbt kast: hoppa direkt
  }, { passive: true });

  function go(dir) {
    const step = originals[0].getBoundingClientRect().width * 1.5;
    track.scrollBy({ left: dir * step, behavior: 'smooth' });
  }
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));

  window.addEventListener('resize', () => { const f = track.scrollLeft / (setW || 1); measure(); track.scrollLeft = f * setW; });
  track.querySelectorAll('img').forEach(i => i.addEventListener('load', () => { const f = track.scrollLeft - setW; measure(); track.scrollLeft = setW + f; }));
  home();
  window.addEventListener('load', home);
})();
