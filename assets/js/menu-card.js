// Menykortet på startsidan: på smala skärmar (max 800 px, där man inte kan peka) får kortet samma
// lyft som vid hover när det ligger mitt på skärmen. På bredare skärmar händer ingenting här,
// där gäller bara vanlig hover.
(function () {
  const card = document.querySelector('.menu__card');
  if (!card) return;

  const narrow = window.matchMedia('(max-width: 800px)');
  const ZONE = 0.2;           // kortets mitt ska ligga inom 20 % av skärmhöjden från skärmens mitt
  let queued = false;

  function update() {
    queued = false;
    if (!narrow.matches) { card.classList.remove('is-centered'); return; }
    const r = card.getBoundingClientRect();
    const dist = Math.abs((r.top + r.height / 2) - window.innerHeight / 2);
    card.classList.toggle('is-centered', dist < window.innerHeight * ZONE);
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }

  window.addEventListener('scroll', schedule, { passive: true });
  window.addEventListener('resize', schedule);
  narrow.addEventListener('change', schedule);
  schedule();
})();
