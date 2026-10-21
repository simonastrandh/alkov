// Alkov – huvudskript
// Scrollstyrd animation: flaskan tippar, häller vin och vinet fyller skärmen.

(function () {
  const section = document.getElementById('pour');
  if (!section) return;

  const stage   = section.querySelector('.pour__stage');
  const bottle  = document.getElementById('bottle');
  const mouth   = document.getElementById('mouth');
  const wine    = document.getElementById('wine');
  const body    = document.getElementById('wineBody');
  const wave1   = document.getElementById('wave1');
  const wave2   = document.getElementById('wave2');
  const bandEdge = document.getElementById('bandEdge');
  const stream  = document.getElementById('stream');
  const streamFill = document.getElementById('streamFill');
  const streamL    = document.getElementById('streamL');
  const streamR    = document.getElementById('streamR');
  const streamMid  = document.getElementById('streamMid');
  const ripple     = document.getElementById('ripple');
  const hours   = document.getElementById('hours');
  const tagline = section.querySelector('.pour__tagline');
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Det röda vinet är ett band med vågig över- och underkant. Bandet har alltid samma höjd
  // (BAND av skärmhöjden, plus den statiska vågen under). Det stiger tills överkanten ligger RED_TOP ner på skärmen,
  // och släpper då taget: sidan scrollar vidare och bandet följer med, hela tiden lika högt.
  const RED_TOP = 0.10, BAND = 0.72;   // BAND krymper automatiskt på låga skärmar så att vågen under ryms
  let bandFrac = BAND;
  const FINAL_ANGLE = -118; // grader; flaskhalsen pekar snett nedåt vänster

  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const range = (p, start, end) => clamp((p - start) / (end - start));
  const ease  = t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const lerp  = (a, b, t) => a + (b - a) * t;

  let W = 0, H = 0;
  function resize() {
    W = stage.clientWidth;
    H = stage.clientHeight;
    wine.setAttribute('viewBox', `0 0 ${W} ${H}`);
    // Menyn börjar strax under det röda bandet, oavsett skärmstorlek
    const waveH = bandEdge.getBoundingClientRect().height * 0.95;
    bandFrac = Math.min(BAND, 1 - RED_TOP - (waveH + 8) / H);
    section.style.marginBottom = (H * (RED_TOP + bandFrac) + waveH + 48 - H) + 'px';
  }

  // Vågig yta: y-värde för x vid tid t
  function surfaceY(x, base, t, amp, phase) {
    return base
      + amp * Math.sin(x * 0.012 + t * 1.6 + phase)
      + amp * 0.45 * Math.sin(x * 0.029 - t * 2.1 + phase * 2);
  }

  function wavePath(base, t, amp, phase, closed) {
    let d = '';
    for (let x = -20; x <= W + 20; x += 16) {
      d += (x === -20 ? 'M' : 'L') + x.toFixed(1) + ',' + surfaceY(x, base, t, amp, phase).toFixed(1);
    }
    if (closed) d += `L${W + 20},${H + 20}L-20,${H + 20}Z`;
    return d;
  }

  // Vinstrålen ritas som ett fyllt band med handritade konturlinjer,
  // som flaskan och vågorna. Bandet växer från mynningen ner mot ytan.
  function drawStream(mx, my, dx, dy, hitX, hitY, pouring, t) {
    const endY = Math.max(hitY, my + 60);
    const c1x = mx + dx * 40, c1y = my + dy * 40;
    const c2x = hitX,         c2y = my + 50;
    const N = 28;
    const L = [], R = [], M = [];

    for (let i = 0; i <= N; i++) {
      const u = pouring * i / N;
      const v = 1 - u;
      // punkt och riktning på kurvan (kubisk bezier)
      const x = v*v*v*mx + 3*v*v*u*c1x + 3*v*u*u*c2x + u*u*u*hitX;
      const y = v*v*v*my + 3*v*v*u*c1y + 3*v*u*u*c2y + u*u*u*endY;
      let tx = 3*v*v*(c1x - mx) + 6*v*u*(c2x - c1x) + 3*u*u*(hitX - c2x);
      let ty = 3*v*v*(c1y - my) + 6*v*u*(c2y - c1y) + 3*u*u*(endY - c2y);
      const len = Math.hypot(tx, ty) || 1;
      tx /= len; ty /= len;
      const nx = -ty, ny = tx;

      // bredd: smal vid mynningen, bredare nedåt, lätt vacklande
      const grow = 0.55 + 0.45 * Math.min(1, i / 6);
      const wobble = 1 + 0.12 * Math.sin(i * 0.8 - t * 5);
      const w = lerp(9, 15, pouring) * grow * wobble;

      L.push([x + nx * w / 2, y + ny * w / 2]);
      R.push([x - nx * w / 2, y - ny * w / 2]);
      M.push([x + nx * w * 0.16, y + ny * w * 0.16]);
    }

    const line = pts => pts.map((q, i) => (i ? 'L' : 'M') + q[0].toFixed(1) + ',' + q[1].toFixed(1)).join('');
    const last = L.length - 1;
    // rundad spets längst ner på bandet medan det växer
    const tipX = (L[last][0] + R[last][0]) / 2;
    const tipY = Math.max(L[last][1], R[last][1]) + 5;
    streamFill.setAttribute('d',
      line(L) + `Q${tipX.toFixed(1)},${tipY.toFixed(1)} ${R[last][0].toFixed(1)},${R[last][1].toFixed(1)}` +
      line(R.slice().reverse()).replace('M', 'L') + 'Z');
    streamL.setAttribute('d', line(L));
    streamR.setAttribute('d', line(R));
    streamMid.setAttribute('d', line(M));

    // ringar och stänk där strålen möter vinytan
    if (pouring > 0.97) {
      const k = 1 + 0.12 * Math.sin(t * 3);
      const y = hitY + 2, a = 30 * k, b = 54 * k;
      ripple.setAttribute('d',
        `M${hitX - a},${y} Q${hitX},${y + 14} ${hitX + a},${y}` +
        `M${hitX - b},${y + 4} Q${hitX},${y + 24} ${hitX + b},${y + 4}` +
        `M${hitX - 14},${y - 4} q-4,-10 -12,-14 M${hitX + 14},${y - 4} q4,-10 12,-14`);
    } else {
      ripple.setAttribute('d', '');
    }
  }

  // Bandet: vågig överkant, rak underkant (den statiska vågen bandEdge sitter fast under)
  function bandPath(top, bottom, t, amp) {
    let d = '';
    for (let x = -20; x <= W + 20; x += 16) {
      d += (x === -20 ? 'M' : 'L') + x.toFixed(1) + ',' + surfaceY(x, top, t, amp, 0).toFixed(1);
    }
    return d + `L${W + 20},${bottom.toFixed(1)}L-20,${bottom.toFixed(1)}Z`;
  }

  function progress() {
    // Startar redan när scenen kommit en bit upp på skärmen (före den låsts fast)
    const r = section.getBoundingClientRect();
    const lead = window.innerHeight * 0.75;
    return clamp((lead - r.top) / (r.height - window.innerHeight + lead));
  }

  function frame(ms) {
    if (!H || !W) { resize(); requestAnimationFrame(frame); return; }  // layouten är inte klar än
    const t = reduceMotion ? 0 : ms / 1000;
    const p = progress();

    // 1. Flaskan roterar och lyfts lite
    const rot = ease(range(p, 0, 0.3));
    const angle = FINAL_ANGLE * rot;
    const narrow = W < 700;
    bottle.style.top = lerp(narrow ? 70 : 40, narrow ? 64 : 30, rot) + '%';
    bottle.style.transform = `translate(-50%, -50%) rotate(${angle}deg)`;

    // 2. Vinytan stiger från under skärmen till ovanför
    // Accelererande stigning, så att farten vid släppet matchar scrollfarten (ingen stillastående stund)
    const level = Math.pow(range(p, 0.27, 1), 1.8);
    const base = lerp(H + 40, H * RED_TOP, level);
    const bandH = H * bandFrac;
    const bottomY = base + bandH;
    const amp = lerp(10, 16, level);

    body.setAttribute('d', bandPath(base, bottomY, t, amp));
    wave1.setAttribute('d', wavePath(base - 16, t * 0.9, amp, 1.3, false));
    wave2.setAttribute('d', wavePath(base - 30, t * 1.1, amp * 0.8, 2.6, false));
    bandEdge.style.transform = `translateY(${bottomY - 1}px)`;

    // 3. Vinstrålen från mynningen ned till ytan
    const m = mouth.getBoundingClientRect();
    const s = stage.getBoundingClientRect();
    const mx = m.left + m.width / 2 - s.left;
    const my = m.top + m.height / 2 - s.top;
    const rad = angle * Math.PI / 180;
    const dx = Math.sin(rad), dy = -Math.cos(rad); // halsens riktning
    const hitX = mx + dx * 55;
    const hitY = surfaceY(hitX, base, t, amp, 0) + 6;
    const pouring = range(rot, 0.8, 1) * (hitY > my + 20 ? 1 : 0);

    if (pouring > 0) {
      drawStream(mx, my, dx, dy, hitX, hitY, pouring, t);
      stream.style.display = '';
    } else {
      stream.style.display = 'none';
      ripple.setAttribute('d', '');
    }

    // Flaskan tonar ut när vinytan når upp till den
    bottle.style.opacity = clamp((base - my + 40) / 140);

    // 4. Text in/ut
    tagline.style.opacity = 1 - range(p, 0.5, 0.65);
    // Öppettiderna följer vinytan uppåt tills de hamnar mitt på skärmen
    // Öppettiderna sitter fast i bandet (med samma avstånd till över- och underkant hela tiden).
    // Mer luft ovanför än nedanför, så att innehållet ligger lite nedanför mitten.
    const hh = hours.offsetHeight;
    const scale = Math.min(1, (bandH * 0.72) / hh);   // skalas ned om de annars inte ryms
    const shown = hh * scale;
    const topPad = (bandH - shown) * 0.68;
    // Innehållet kommer upp lite efter bandet: det ligger först en bit efter (längre ner)
    // och glider upp snabbare än bandet, bromsar in och landar på sin plats vid släppet.
    const enter = range(p, 0.45, 1);
    const lag = Math.pow(1 - enter, 3) * H * 0.30;
    hours.style.transform = `translateY(${base + topPad + lag}px) scale(${scale})`;

    requestAnimationFrame(frame);
  }

  // Knapparna i toppen: mjuk scroll till menyn respektive öppettiderna
  document.querySelectorAll('[data-scroll]').forEach(a => a.addEventListener('click', e => {
    e.preventDefault();
    const y = a.dataset.scroll === 'hours'
      ? section.offsetTop + (section.offsetHeight - window.innerHeight) * 0.95
      : document.getElementById('meny').getBoundingClientRect().top + window.scrollY - window.innerHeight * 0.1;
    window.scrollTo({ top: y, behavior: reduceMotion ? 'auto' : 'smooth' });
  }));

  resize();
  window.addEventListener('resize', resize);
  requestAnimationFrame(frame);
})();
