// Alkovs meny – ändra rätter och priser här.
// Varje grupp har en rubrik och en lista rätter: [namn, pris] eller [namn, pris, beskrivning].
window.ALKOV_MENU = {
  title: 'Meny',
  illustration: 'assets/images/gubbe-v2.svg',
  groups: [
    {
      title: 'Smått',
      items: [
        ['Ostron', '45 :- /st', 'citron & migonette'],
        ['Nocellara Oliver', '55 :-'],
        ['Marconamandlar', '65 :-'],
        ['Pickles', '75 :-', 'smetana & honung'],
        ['Brioche', '75 :-', 'vispat olivsmör'],
        ['Chips med dipp', '85 :-'],
        ['Boqueros', '125 :-', 'citron, surdegsbröd & gremolata'],
      ],
    },
    {
      title: 'Ost & chark',
      items: [
        ['Månadens ost', '“dagspris”', 'marmelad & valnöt'],
        ['Gruyère', '125 :-', 'brynt smör, friterad kapris'],
        ['Charktallrik', '165 :-', 'kallskuret, ost, cornichons. Serveras med surdegsbröd'],
      ],
    },
    {
      title: 'Att äta',
      items: [
        ['Råbiff', '145 / 235 :-', 'nötinnanlår, persiljakräm, grovsenap, cornichons, kapris, friterad grönkål, comté'],
        ['Gräddstekta kantareller', '185 :-', 'på brioche med tångkaviar'],
        ['Fläskmacka', '185 :-', 'senapskräm, långkokt fläskkarré, gruyere, gremolata på surdegsbröd'],
      ],
    },
    {
      title: 'Sött',
      items: [
        ['Clementine Pannacotta', '95 :-'],
        ['Affogato', '75 :-'],
      ],
    },
  ],
};
