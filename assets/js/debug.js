// Felsökningsruta. Visas bara om adressen innehåller ?debug (t.ex. .../alkov/?debug=1).
// Visar vad webbläsaren faktiskt räknar med, så att vi kan se varför sidan inte når ner/upp bakom fälten.
(function () {
  const box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:6px;top:calc(env(safe-area-inset-top,0px) + 6px);z-index:99999;max-width:92vw;padding:8px 10px;' +
    'border-radius:8px;background:rgba(0,0,0,.78);color:#7CFF9B;font:11px/1.35 ui-monospace,Menlo,monospace;white-space:pre;pointer-events:none';
  document.body.append(box);

  // mätare i CSS-enheter (svh = fälten synliga, lvh = fälten borta, dvh = just nu) och säkra marginaler
  const meter = document.createElement('div');
  meter.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;visibility:hidden;pointer-events:none';
  meter.innerHTML = ['100svh', '100lvh', '100dvh', 'env(safe-area-inset-top,0px)', 'env(safe-area-inset-bottom,0px)']
    .map(h => `<div style="height:${h}"></div>`).join('');
  document.body.append(meter);

  function update() {
    const [svh, lvh, dvh, top, bottom] = [...meter.children].map(c => Math.round(c.getBoundingClientRect().height));
    const vv = window.visualViewport;
    const hero = document.querySelector('.hero'), stage = document.querySelector('.pour__stage');
    const js = document.querySelector('script[src*="main.js"]');
    box.textContent = [
      'version: ' + ((js && js.src.split('?v=')[1]) || 'ingen stämpel (gammal sida?)'),
      'viewport-meta: ' + document.querySelector('meta[name=viewport]').content,
      'inner: ' + innerWidth + ' x ' + innerHeight + '   visual: ' + (vv ? Math.round(vv.height) : '?'),
      'skärm: ' + screen.width + ' x ' + screen.height + '   dpr ' + devicePixelRatio,
      'svh ' + svh + '  lvh ' + lvh + '  dvh ' + dvh,
      'säker marginal  upptill ' + top + '  nedtill ' + bottom,
      'hero ' + (hero ? Math.round(hero.getBoundingClientRect().height) : '-') + '   scen ' + (stage ? Math.round(stage.getBoundingClientRect().height) : '-'),
      'hero ovankant (y) ' + (hero ? Math.round(hero.getBoundingClientRect().top) : '-') + '   scrollY ' + Math.round(scrollY),
      'standalone: ' + (navigator.standalone === true || matchMedia('(display-mode: standalone)').matches)
    ].join('\n');
  }
  ['scroll', 'resize'].forEach(e => addEventListener(e, update, { passive: true }));
  if (window.visualViewport) visualViewport.addEventListener('resize', update);
  setInterval(update, 500);
  update();
})();
