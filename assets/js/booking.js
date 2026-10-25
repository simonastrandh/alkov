// Boka bord – gränssnittet. Det här skriptet bläddrar mellan stegen, markerar val, visar valen i
// sammanfattningen och ser till att man bara kan välja dagar och tider då restaurangen har öppet.
// Bokningen skickas som e-post till restaurangen via Web3Forms (gratisvarianten).
// Gästen ser en bekräftelse på sidan; restaurangen svarar gästen själv genom att svara på mejlet.

(function () {
  const form = document.getElementById('booking');
  if (!form) return;

  // ---- Web3Forms: bokningen skickas som e-post ----
  // 1. Gå till https://web3forms.com, skriv in den e-postadress som ska få bokningarna och hämta nyckeln.
  // 2. Klistra in nyckeln här. Den är offentlig och är ingen hemlighet, den kan bara skicka e-post till din adress.
  // Byta mottagare senare: skapa en ny nyckel med den nya adressen och byt ut den här.
  const WEB3FORMS_KEY = 'b662d343-0730-4540-90e9-dea721a932dc';   // mottagare just nu: simon.a.strandh@gmail.com (test)
  const WEB3FORMS_URL = 'https://api.web3forms.com/submit';
  const RESTAURANT_PHONE = '+46 72-215 09 16';
  const DEMO = /[?&]demo/.test(location.search);    // ?demo i adressen: visa bekräftelsen utan att skicka något

  // ---- Öppettider: ändra här om de ändras ----
  // Veckodag: 0 = söndag, 1 = måndag ... 6 = lördag. null = stängt hela dagen.
  const HOURS = {
    0: { open: '17:00', close: '22:00' },   // söndag
    1: null,                                // måndag: stängt
    2: { open: '16:00', close: '23:00' },   // tisdag
    3: { open: '16:00', close: '23:00' },
    4: { open: '16:00', close: '23:00' },
    5: { open: '16:00', close: '23:00' },
    6: { open: '16:00', close: '23:00' },   // lördag
  };
  const SITTING_MIN = 120;   // ett bord är bokat i 2 timmar, så sista tiden är 2 timmar före stängning
  const SLOT_MIN = 30;       // en ny tid var 30:e minut

  const steps = [...form.querySelectorAll('.step')];
  const stepperItems = [...form.querySelectorAll('.stepper__item')];
  const dateInput = document.getElementById('date');
  const dateText = document.getElementById('dateText');
  const dateHint = document.getElementById('dateHint');
  const timesBox = document.getElementById('times');
  const noTimes = document.getElementById('noTimes');
  const toTimes = document.getElementById('toTimes');

  const state = { guests: '2', date: null, time: null };

  const DAYS = ['Sön', 'Mån', 'Tis', 'Ons', 'Tors', 'Fre', 'Lör'];
  const DAYS_LONG = ['söndag', 'måndag', 'tisdag', 'onsdag', 'torsdag', 'fredag', 'lördag'];
  const MONTHS_LONG = ['januari', 'februari', 'mars', 'april', 'maj', 'juni', 'juli', 'augusti', 'september', 'oktober', 'november', 'december'];
  const MONTHS = ['jan', 'feb', 'mars', 'apr', 'maj', 'juni', 'juli', 'aug', 'sep', 'okt', 'nov', 'dec'];
  const pad = n => String(n).padStart(2, '0');
  const iso = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
  const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const toTime = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const sameDay = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const today = new Date(); today.setHours(0, 0, 0, 0);

  // ---- Tider för en dag ----
  // Alla starttider från öppning till sista tid (stängning minus bordstiden). Passerade tider i dag tas bort.
  function slotsFor(date) {
    if (!date || date < today) return [];
    const h = HOURS[date.getDay()];
    if (!h) return [];
    const last = toMin(h.close) - SITTING_MIN;
    const now = new Date();
    const nowMin = sameDay(date, now) ? now.getHours() * 60 + now.getMinutes() : -1;
    const out = [];
    for (let m = toMin(h.open); m <= last; m += SLOT_MIN) if (m > nowMin) out.push(toTime(m));
    return out;
  }
  const isOpenDay = date => !!(date && HOURS[date.getDay()]);

  // närmaste öppna dag från och med en dag
  function nextOpen(date) {
    const d = new Date(date);
    for (let i = 0; i < 8 && !(isOpenDay(d) && slotsFor(d).length); i++) d.setDate(d.getDate() + 1);
    return d;
  }

  // ---- Steg ----
  function canEnter(n) {
    return n === 1 || slotsFor(state.date).length > 0;   // inga tider = inget steg 2 eller 3
  }
  function goto(n) {
    if (!canEnter(n)) return;
    steps.forEach(s => { s.hidden = Number(s.dataset.step) !== n; });
    stepperItems.forEach((b, i) => {
      const active = i + 1 === n;
      b.classList.toggle('is-active', active);
      if (active) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
    });
    updateSummary();
    // på mobil: se till att kortets topp syns när steget byts
    const top = form.getBoundingClientRect().top;
    if (top < 0 || top > window.innerHeight * 0.4) form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  form.addEventListener('click', e => {
    const b = e.target.closest('[data-goto]');
    if (b && !b.disabled) goto(Number(b.dataset.goto));
  });

  // ---- Val av antal gäster och tid (radioknappar) ----
  function radioGroup(id, key) {
    const group = document.getElementById(id);
    group.addEventListener('click', e => {
      const btn = e.target.closest('[role=radio]');
      if (!btn) return;
      group.querySelectorAll('[role=radio]').forEach(x => {
        const on = x === btn;
        x.classList.toggle('is-selected', on);
        x.setAttribute('aria-checked', on);
      });
      state[key] = btn.dataset.value;
      updateSummary();
    });
    // piltangenter flyttar markeringen, som för vanliga radioknappar
    group.addEventListener('keydown', e => {
      if (!['ArrowRight', 'ArrowLeft', 'ArrowDown', 'ArrowUp'].includes(e.key)) return;
      const all = [...group.querySelectorAll('[role=radio]')];
      const i = all.indexOf(document.activeElement);
      if (i < 0) return;
      e.preventDefault();
      const next = all[(i + (e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : -1) + all.length) % all.length];
      next.focus(); next.click();
    });
  }
  radioGroup('guests', 'guests');
  radioGroup('times', 'time');

  // ---- Bygg tiderna för valt datum ----
  function renderTimes() {
    const slots = slotsFor(state.date);
    if (state.time && !slots.includes(state.time)) state.time = null;   // vald tid finns inte den här dagen
    timesBox.innerHTML = slots.map(t =>
      `<button type="button" class="time${t === state.time ? ' is-selected' : ''}" role="radio" aria-checked="${t === state.time}" data-value="${t}">${t}</button>`
    ).join('');
    timesBox.hidden = slots.length === 0;

    if (!state.date || !slots.length) {
      noTimes.hidden = false;
      noTimes.textContent = !state.date || state.date < today
        ? 'Välj ett datum som inte har passerat.'
        : !isOpenDay(state.date)
          ? `Vi har stängt på ${DAYS_LONG[state.date.getDay()]}ar. Gå tillbaka och välj en annan dag.`
          : 'Det finns inga fler tider i dag. Gå tillbaka och välj en annan dag.';
    } else {
      noTimes.hidden = true;
    }
  }

  // ---- Datum ----
  const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1);
  dateInput.min = iso(today);
  dateInput.value = iso(nextOpen(tomorrow));      // förvalt: nästa dag som är öppen

  function updateDate() {
    state.date = dateInput.value ? parse(dateInput.value) : null;
    dateText.textContent = state.date
      ? `${pad(state.date.getDate())}/${pad(state.date.getMonth() + 1)}-${state.date.getFullYear()}`
      : 'Välj datum';

    // text under datumet: öppettider för dagen, eller varför man inte kan boka
    const slots = slotsFor(state.date);
    dateHint.classList.toggle('is-closed', !slots.length);
    if (!state.date) {
      dateHint.textContent = 'Välj ett datum.';
    } else if (state.date < today) {
      dateHint.textContent = 'Datumet har passerat. Välj ett datum från och med i dag.';
    } else if (!isOpenDay(state.date)) {
      dateHint.textContent = `Vi har stängt på ${DAYS_LONG[state.date.getDay()]}ar. Välj en annan dag, vi har öppet tisdag till söndag.`;
    } else if (!slots.length) {
      dateHint.textContent = 'Det finns inga fler tider i dag. Välj en annan dag.';
    } else {
      const h = HOURS[state.date.getDay()];
      const lastStart = toTime(toMin(h.close) - SITTING_MIN);
      dateHint.textContent = `${DAYS_LONG[state.date.getDay()][0].toUpperCase() + DAYS_LONG[state.date.getDay()].slice(1)}: öppet ${h.open}–${h.close}. Sista bordstid är ${lastStart}.`;
    }

    toTimes.disabled = !slots.length;     // man kommer inte vidare om det inte finns några tider
    renderTimes();
    updateSummary();
  }
  dateInput.addEventListener('input', updateDate);
  dateInput.addEventListener('change', updateDate);
  // öppna datumväljaren när man klickar var som helst i rutan
  dateInput.addEventListener('click', () => { try { dateInput.showPicker(); } catch (e) { /* äldre webbläsare öppnar den själva */ } });

  // ---- Sammanfattning (steg 3) ----
  function updateSummary() {
    const g = state.guests;
    document.getElementById('sumGuests').textContent = g === '1' ? '1 person' : `${g} personer`;
    document.getElementById('sumDate').textContent = state.date
      ? `${DAYS[state.date.getDay()]} · ${state.date.getDate()} ${MONTHS[state.date.getMonth()]}` : '–';
    document.getElementById('sumTime').textContent = state.time || '–';
  }

  // ---- Skicka och bekräftelse ----
  const stepper = document.getElementById('stepper');
  const confirmBox = document.getElementById('confirm');
  const REQUIRED = ['fornamn', 'efternamn', 'epost'];
  const emailOk = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

  function validate() {
    let first = null;
    REQUIRED.forEach(id => {
      const input = document.getElementById(id);
      const v = input.value.trim();
      const bad = !v || (id === 'epost' && !emailOk(v));
      input.closest('.field').classList.toggle('has-error', bad);
      input.setAttribute('aria-invalid', bad);
      document.getElementById('err-' + id).hidden = !bad;
      if (bad && !first) first = input;
    });
    if (first) first.focus();
    return !first;
  }
  REQUIRED.forEach(id => document.getElementById(id).addEventListener('input', e => {
    const f = e.target.closest('.field');
    if (f.classList.contains('has-error')) {      // ta bort felet så fort det rättas
      const v = e.target.value.trim();
      if (v && (id !== 'epost' || emailOk(v))) {
        f.classList.remove('has-error');
        e.target.setAttribute('aria-invalid', 'false');
        document.getElementById('err-' + id).hidden = true;
      }
    }
  }));

  function showConfirmation() {
    const val = id => document.getElementById(id).value.trim();
    const set = (id, text) => { document.getElementById(id).textContent = text; };
    const g = state.guests;
    set('cName', val('fornamn'));
    set('cEmail', val('epost'));
    set('cGuests', g === '1' ? '1 person' : `${g} personer`);
    set('cDate', `${DAYS_LONG[state.date.getDay()][0].toUpperCase()}${DAYS_LONG[state.date.getDay()].slice(1)} ${state.date.getDate()} ${MONTHS[state.date.getMonth()]} ${state.date.getFullYear()}`);
    set('cTime', state.time || '–');
    set('cFullName', `${val('fornamn')} ${val('efternamn')}`);
    set('cEmail2', val('epost'));
    set('cPhone', val('telefon'));
    document.getElementById('cPhoneRow').hidden = !val('telefon');
    set('cMsg', val('meddelande'));
    document.getElementById('cMsgRow').hidden = !val('meddelande');

    steps.forEach(x => { x.hidden = true; });
    stepper.hidden = true;
    confirmBox.hidden = false;
    const title = document.getElementById('h-confirm');
    title.focus({ preventScroll: true });
    form.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }

  const submitBtn = document.getElementById('submitBtn');
  const submitLabel = document.getElementById('submitLabel');
  const submitError = document.getElementById('submitError');
  let sending = false;

  function showError(text) { submitError.textContent = text; submitError.hidden = false; }

  // Färdigt bekräftelsemeddelande som restaurangen kan kopiera från mejlet och skicka till gästen
  function confirmationText({ first, dateLong, time, guests, name, phone, wishes }) {
    const lines = [
      `Hej ${first}!`,
      '',
      'Din bokning på Alkov är bekräftad. Vi ser fram emot att träffa er!',
      '',
      `Datum: ${dateLong}`,
      `Tid: ${time}`,
      `Sällskap: ${guests}`,
      `Namn: ${name}`,
    ];
    if (phone) lines.push(`Telefon: ${phone}`);
    if (wishes) lines.push(`Allergier och önskemål: ${wishes}`);
    lines.push(
      '',
      'Bordet är ert i 2 timmar. Behöver du ändra eller avboka, svara på det här mejlet eller ring oss på ' + RESTAURANT_PHONE + '.',
      '',
      'Varma hälsningar',
      'Alkov',
      'Järntorget 6, 413 04 Göteborg'
    );
    return lines.join('\n');
  }

  // mejlet till restaurangen: fälten visas i den här ordningen
  function buildPayload() {
    const val = id => document.getElementById(id).value.trim();
    const d = state.date;
    const dayName = DAYS_LONG[d.getDay()][0].toUpperCase() + DAYS_LONG[d.getDay()].slice(1);
    const dateLong = `${dayName} ${d.getDate()} ${MONTHS_LONG[d.getMonth()]} ${d.getFullYear()}`;
    const g = state.guests;
    const guests = g === '1' ? '1 person' : g === '6+' ? '6 personer eller fler (stort sällskap, behöver svar)' : `${g} personer`;
    const name = `${val('fornamn')} ${val('efternamn')}`;
    return {
      access_key: WEB3FORMS_KEY,
      subject: `Ny bokning: ${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]} kl ${state.time}, ${g === '6+' ? '6+' : g} pers – ${name}`,
      from_name: 'Bordsbokning - baralkov.se',
      Datum: dateLong,
      Tid: state.time,
      Sällskap: guests,
      Namn: name,
      email: val('epost'),                                   // används även som svarsadress, så "Svara" går till gästen
      Telefon: val('telefon') || '(ej angivet)',
      'Allergier och önskemål': val('meddelande') || '(inga)',
      Skickad: new Date().toLocaleString('sv-SE'),
      'Bekräftelse till gästen (kopiera och skicka)': confirmationText({
        first: val('fornamn'), dateLong, time: state.time, guests: g === '6+' ? '6 personer eller fler' : guests,
        name, phone: val('telefon'), wishes: val('meddelande'),
      }),
      botcheck: document.getElementById('botcheck').checked,
    };
  }

  async function sendBooking(payload) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20000);
    try {
      const res = await fetch(WEB3FORMS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
        signal: ctrl.signal,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) throw new Error(data.message || `Fel ${res.status}`);
      return data;
    } finally { clearTimeout(timer); }
  }

  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (sending) return;
    submitError.hidden = true;
    if (!validate()) return;
    if (!state.date || !state.time) { showError('Välj datum och tid innan du skickar bokningen.'); return; }

    if (DEMO) { showConfirmation(); return; }
    if (WEB3FORMS_KEY.startsWith('KLISTRA_IN')) {
      console.error('Boka bord: Web3Forms-nyckeln saknas. Lägg in den överst i assets/js/booking.js (eller testa med ?demo i adressen).');
      showError(`Bokningen kan inte skickas just nu. Ring oss gärna på ${RESTAURANT_PHONE}.`);
      return;
    }

    sending = true;
    submitBtn.classList.add('is-sending');
    submitLabel.textContent = 'Skickar …';
    try {
      await sendBooking(buildPayload());
      showConfirmation();
    } catch (err) {
      console.error('Boka bord: kunde inte skicka', err);
      showError(`Det gick inte att skicka bokningen. Kontrollera din uppkoppling och försök igen, eller ring oss på ${RESTAURANT_PHONE}.`);
    } finally {
      sending = false;
      submitBtn.classList.remove('is-sending');
      submitLabel.textContent = 'Slutför bokning';
    }
  });

  // "Boka ett bord till": börja om med ett tomt formulär
  document.getElementById('again').addEventListener('click', () => {
    form.reset();
    document.querySelectorAll('.field.has-error').forEach(f => f.classList.remove('has-error'));
    document.querySelectorAll('.field__error').forEach(x => { x.hidden = true; });
    submitError.hidden = true;
    state.guests = '2'; state.time = null;
    document.querySelectorAll('#guests [role=radio]').forEach(b => {
      const on = b.dataset.value === '2';
      b.classList.toggle('is-selected', on);
      b.setAttribute('aria-checked', on);
    });
    dateInput.value = iso(nextOpen(tomorrow));
    confirmBox.hidden = true;
    stepper.hidden = false;
    updateDate();
    goto(1);
  });

  updateDate();
})();
