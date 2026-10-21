// Flip-animation: menykortet flyger fram, vänds 180° och visar menyn på baksidan.
// När animationen är klar öppnas menysidan, som ser likadan ut.

(function () {
  const links = document.querySelectorAll('[data-menu-link]');
  const cardImg = document.querySelector('.menu__card img');
  if (!links.length || !cardImg || !window.AlkovMenu) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let overlay = null;

  function flip(e) {
    const link = e.currentTarget;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button > 0) return; // ny flik etc.
    e.preventDefault();
    if (overlay) return;
    if (reduceMotion) { location.href = link.href; return; }

    const start = cardImg.getBoundingClientRect();

    // Bygg en kopia av menysidan ovanpå allt, med kortet där pappret ska hamna
    overlay = document.createElement('div');
    overlay.className = 'flip-overlay';
    const bg = document.createElement('div');
    bg.className = 'flip-overlay__bg';
    overlay.append(bg);
    const { paper } = window.AlkovMenu.renderPage(overlay, '');
    // Pappret får sina färger direkt, så att baksidan alltid är äggvit med röd text
    // även om en gammal stilmall ligger kvar i webbläsarens minne.
    const css = getComputedStyle(document.documentElement);
    paper.style.setProperty('background', css.getPropertyValue('--color-cream').trim() || '#efe3d3', 'important');
    paper.style.setProperty('color', css.getPropertyValue('--color-wine').trim() || '#5c1f2c', 'important');

    const card = document.createElement('div');
    card.className = 'flip-card';
    paper.replaceWith(card);
    const front = cardImg.cloneNode();
    front.className = 'flip-face--front';
    front.removeAttribute('width');
    front.removeAttribute('height');
    card.append(front, paper);

    // Ljus och skugga på kortets två sidor (mörknar när kortet vänds bort från ljuset)
    const face = cls => { const el = document.createElement('div'); el.className = cls; return el; };
    const frontShade = face('flip-shade flip-shade--front');
    const frontGloss = face('flip-gloss flip-gloss--front');
    const backShade  = face('flip-shade flip-shade--back');
    const backGloss  = face('flip-gloss flip-gloss--back');
    card.append(frontShade, frontGloss);
    paper.append(backShade, backGloss);

    // Kastad skugga under kortet (ligger utanför 3D-vändningen, under kortet)
    const cast = face('flip-cast');
    bg.after(cast);
    document.body.append(overlay);

    const end = card.getBoundingClientRect();
    const vw = window.innerWidth, vh = window.innerHeight;
    const endCx = end.left + end.width / 2, endCy = end.top + end.height / 2;

    // Start: exakt över bilden på sidan
    const sx = start.width / end.width, sy = start.height / end.height;
    const dx = start.left + start.width / 2 - endCx;
    const dy = start.top + start.height / 2 - endCy;

    // Mitten: kortet mitt på skärmen, större, på kant (90°)
    const midH = Math.min(vh * 0.8, start.height * 1.7);
    const midW = midH * (start.width / start.height);
    const mdx = vw / 2 - endCx, mdy = vh / 2 - endCy;

    const P = 'perspective(2400px)';
    cardImg.style.visibility = 'hidden';

    const anim = card.animate([
      { transform: `${P} translate(${dx}px, ${dy}px) scale(${sx}, ${sy}) rotateY(0deg)`, easing: 'cubic-bezier(.5, 0, .4, 1)' },
      { transform: `${P} translate(${mdx}px, ${mdy}px) scale(${midW / end.width}, ${midH / end.height}) rotateY(90deg)`, offset: 0.5, easing: 'cubic-bezier(.3, 0, .2, 1)' },
      { transform: `${P} translate(0px, 0px) scale(1, 1) rotateY(180deg)` },
    ], { duration: 1400, fill: 'forwards' });

    const T = { duration: 1400, fill: 'forwards' };

    // Skuggning: framsidan mörknar mot 90°, baksidan ljusnar från 90° till platt
    frontShade.animate([
      { opacity: 0 },
      { opacity: 0.85, offset: 0.5 },
      { opacity: 0.85 },
    ], { ...T, easing: 'ease-in' });
    backShade.animate([
      { opacity: 0.85 },
      { opacity: 0.85, offset: 0.5 },
      { opacity: 0.12, offset: 0.85 },
      { opacity: 0 },
    ], T);

    // Glansreflex som sveper över papperet medan det vrids
    frontGloss.animate([
      { backgroundPosition: '160% 0', opacity: 0 },
      { backgroundPosition: '60% 0', opacity: 1, offset: 0.25 },
      { backgroundPosition: '-60% 0', opacity: 0, offset: 0.5 },
      { backgroundPosition: '-60% 0', opacity: 0 },
    ], T);
    backGloss.animate([
      { backgroundPosition: '160% 0', opacity: 0 },
      { backgroundPosition: '160% 0', opacity: 0, offset: 0.5 },
      { backgroundPosition: '40% 0', opacity: 0.9, offset: 0.72 },
      { backgroundPosition: '-60% 0', opacity: 0 },
    ], T);

    // Kastad skugga: mäter kortets verkliga storlek på skärmen i varje bildruta,
    // så att skuggan alltid är bara lite bredare än menyn – även när den står på kant.
    // Den sjunker lite och blir mjukare när kortet är lyft, och tonar bort när det landar.
    const lift = Math.min(40, vh * 0.04);
    function trackShadow() {
      if (!overlay) return;
      const p = Math.min(1, (anim.currentTime || 0) / T.duration);
      const up = Math.sin(Math.PI * p);              // 0 vid start/landning, 1 mitt i vändningen
      const blur = 6 + 14 * up;
      const r = card.getBoundingClientRect();
      const extra = r.width * 0.03;                   // lite lite bredare än menyn
      const fade = p > 0.85 ? (1 - p) / 0.15 : 1;
      Object.assign(cast.style, {
        left: r.left - extra / 2 + blur * 0.5 + 'px',
        top: r.top + 4 + lift * up + blur * 0.5 + 'px',
        width: Math.max(0, r.width + extra - blur) + 'px',
        height: Math.max(0, r.height - blur) + 'px',
        filter: `blur(${blur}px)`,
        opacity: (0.3 - 0.08 * up) * fade,
      });
      if (p < 1) requestAnimationFrame(trackShadow);
    }
    requestAnimationFrame(trackShadow);

    bg.animate([{ opacity: 0 }, { opacity: 1, offset: 0.55 }, { opacity: 1 }], { duration: 1400, fill: 'forwards' });
    anim.finished.then(() => { location.href = link.href; });
  }

  links.forEach(a => a.addEventListener('click', flip));

  // Om man går tillbaka med webbläsarens bakåtknapp: återställ startsidan
  window.addEventListener('pageshow', () => {
    if (overlay) { overlay.remove(); overlay = null; }
    cardImg.style.visibility = '';
  });
})();
