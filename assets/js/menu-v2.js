// Ritar menypappret från menu-data.js.
// Används både av menysidan och av flip-animationen på startsidan,
// så att baksidan på kortet ser exakt ut som sidan man hamnar på.

window.AlkovMenu = (function () {
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // base = sökväg till webbplatsens rot ('' från startsidan, '../' från pages/)
  function renderPaper(base) {
    const menu = window.ALKOV_MENU;
    const paper = document.createElement('article');
    paper.className = 'paper';
    paper.innerHTML =
      `<h1 class="paper__title">${esc(menu.title)}</h1>` +
      '<div class="paper__groups">' +
      menu.groups.map(group =>
        '<section class="paper__section">' +
        `<h2 class="paper__heading">${esc(group.title)}</h2>` +
        '<ul class="paper__group">' +
        group.items.map(([name, price, desc]) =>
          `<li class="paper__item"><span class="paper__name">${esc(name)}` +
          (desc ? `<small class="paper__desc">${esc(desc)}</small>` : '') +
          `</span><span class="paper__price">${esc(price)}</span></li>`
        ).join('') +
        '</ul></section>'
      ).join('') +
      '</div>' +
      `<img class="paper__art" src="${esc(base + menu.illustration)}" alt="" width="486" height="418">`;
    return paper;
  }

  function renderPage(target, base) {
    const layout = document.createElement('div');
    layout.className = 'menu-layout';

    const paper = renderPaper(base);
    layout.append(paper);
    target.append(layout);
    return { layout, paper };
  }

  return { renderPaper, renderPage };
})();
