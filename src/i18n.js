/* L'Atrium · langues (français par défaut, anglais).
   Choix : ?lang=en|fr  >  localStorage 'atrium.lang'  >  langue du navigateur.
   T('texte') ou T`texte ${x}` : traduit à la source, clé = texte français ({0}, {1}… pour les valeurs).
   TD(s) : traduit à l'affichage les données du registre et du coffre, qui restent en français dans la sauvegarde. */

const LANG = (() => {
  let l = null;
  try { l = new URLSearchParams(location.search).get('lang'); } catch (e) {}
  if (l === 'fr' || l === 'en'){ try { localStorage.setItem('atrium.lang', l); } catch (e) {} return l; }
  try { l = localStorage.getItem('atrium.lang'); } catch (e) {}
  if (l === 'fr' || l === 'en') return l;
  const nav = (navigator.languages && navigator.languages[0]) || navigator.language || 'fr';
  return /^fr\b/i.test(nav) ? 'fr' : 'en';
})();
const LOCALE = LANG === 'en' ? 'en-US' : 'fr-FR';
const EN = window.ATRIUM_EN || {};

function T(strs, ...vals){
  if (typeof strs === 'string'){
    if (LANG !== 'en') return strs;
    const e = EN[strs]; return e != null ? e : strs;
  }
  const key = strs.reduce((a, s, i) => a + s + (i < vals.length ? `{${i}}` : ''), '');
  const tpl = LANG === 'en' && EN[key] != null ? EN[key] : key;
  return tpl.replace(/\{(\d+)\}/g, (_, i) => vals[+i]);
}

/* ---------- données du registre et du coffre ---------- */
const TD_EXACT = {
  'toi':'you', 'toi (en face)':'you (across the water)', 'registre':'ledger', 'machine':'machine',
  'Mira et Oskar':'Mira and Oskar', 'machine du vote':'voting machine', 'machine des piques':'spades machine',
  'machine du pari':'betting machine', 'coffre du pont des trois gardiens':"three-keeper bridge's chest",
  'pont des trois gardiens':'three-keeper bridge', 'grand pont':'great bridge', 'gardiens':'keepers',
  'habitants':'residents', 'passerelle de la salle':'room gateway', 'serment de Nonce':"Nonce's pledge",
  'jardinière commune':'shared planter', 'trésor commun':'common treasury', 'Atrium':'the Atrium',
  '1 graine de palmier':'1 palm seed', '2 cristaux (rendus à la main)':'2 crystals (given back by hand)',
  'dessin n°1 « Le chat qui dort »':'drawing #1 “The Sleeping Cat”',
  'dessin unique n°1 « Le chat qui dort »':'unique drawing #1 “The Sleeping Cat”',
  'dessin n°1 « Le chat qui dort » (contre 4 cristaux)':'drawing #1 “The Sleeping Cat” (for 4 crystals)',
  'jeu de cartes doré':'golden card deck', '1 coquillage acheté':'1 shell bought',
  'annulation pendant le délai':'cancelled during the delay', '4 cristaux (pluie)':'4 crystals (rain)',
  '4 cristaux (soleil, selon le messager)':'4 crystals (sunshine, according to the messenger)',
  'échange terminé':'trade complete', 'caution confisquée':'deposit confiscated', '1 cristal brûlé':'1 crystal burned',
  '1 cristal (prêt rendu)':'1 crystal (loan repaid)', "révocation de l'autorisation de Célestin":"revoked Célestin's permission",
  '« Merci Gwei de m’avoir montré le chemin. »':'“Thank you Gwei for showing me the way.”',
  '1 cristal (verrouillé ici, imprimé en face)':'1 crystal (locked here, printed across the water)',
  '1 cristal (avance, 0,1 de frais)':'1 crystal (advance, 0.1 fee)',
  'cinq messagers':'five messengers', 'confier le trésor à Célestin':'give the treasury to Célestin'
};
const plural = (n, one, many) => `${n} ${parseFloat(String(n).replace(/[^\d.,]/g, '').replace(',', '.')) > 1 ? many : one}`;
const lowerEN = s => { // une proposition en minuscules → sa traduction en minuscules
  if (TD_EXACT[s] != null) return TD_EXACT[s];
  for (const k in EN) if (k.toLowerCase() === s) return EN[k].toLowerCase();
  return s;
};
const TD_RULES = [
  [/^([\d\s ,.]+) cristaux$/, m => plural(m[1].trim(), 'crystal', 'crystals')],
  [/^([\d\s ,.]+) cristal$/, m => `${m[1].trim()} crystal`],
  [/^(.+) cristal \(récompenses de gardien\)$/, m => `${m[1]} crystal (keeper rewards)`],
  [/^(.+) cristal de récompense$/, m => `${m[1]} reward crystal`],
  [/^([\d\s ,.]+) piques?$/, m => plural(m[1].trim(), 'spade', 'spades')],
  [/^machine des piques \((.+) piques\)$/, m => `spades machine (${m[1]} spades)`],
  [/^machine à promesses n°(\d+)$/, m => `promise machine #${m[1]}`],
  [/^page scellée \((\d+) transactions?\)$/, m => `page sealed (${plural(m[1], 'transaction', 'transactions')})`],
  [/^page proposée \((\d+) demandes, (\d+) places\)$/, m => `page proposed (${m[1]} requests, ${m[2]} slots)`],
  [/^résumé de la salle \((\d+) échanges\)$/, m => `room summary (${m[1]} trades)`],
  [/^proposition : (.+)$/, m => `proposal: ${lowerEN(m[1])}`],
  [/^10 cristaux : (.+)$/, m => `10 crystals: ${lowerEN(m[1])}`],
  [/^messager : (.+?)(, avec caution)?$/, m => `messenger: ${TD(m[1])}${m[2] ? ', with a deposit' : ''}`]
];
function TD(s){
  if (LANG !== 'en' || typeof s !== 'string') return s;
  if (TD_EXACT[s] != null) return TD_EXACT[s];
  if (EN[s] != null) return EN[s];
  for (const [re, f] of TD_RULES){ const m = s.match(re); if (m) return f(m); }
  return s;
}

const POOL_EN = ['palm','moon','tide','glass','column','lantern','sand','storm','feather','echo','hive','pebble','sail','cherry','mist','lighthouse','root','comet','ivy','anchor','prism','clock','garden','wave','pollen','cliff','mirror','cloud','fern','compass','pastel','crystal','bee','drum','cedar','star','path','coral','snowflake','moss','brush','river','tile','fig','fox','bell','clay','owl'];

/* ---------- textes fixes de la page + choix de langue ---------- */
(function initLang(){
  document.documentElement.lang = LANG;
  if (LANG === 'en'){
    document.title = T(document.title);
    const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = []; while (walk.nextNode()) nodes.push(walk.currentNode);
    for (const n of nodes){
      const t = n.nodeValue.trim(); if (!t) continue;
      const e = EN[t]; if (e != null) n.nodeValue = n.nodeValue.replace(t, e);
    }
    document.querySelectorAll('[aria-label]').forEach(el => { const e = EN[el.getAttribute('aria-label')]; if (e != null) el.setAttribute('aria-label', e); });
  }
  const card = document.querySelector('#title .card');
  if (card){
    const b = document.createElement('button');
    b.className = 'lang-btn'; b.type = 'button';
    b.textContent = LANG === 'en' ? 'Français' : 'English';
    b.setAttribute('lang', LANG === 'en' ? 'fr' : 'en');
    b.addEventListener('click', () => {
      const next = LANG === 'en' ? 'fr' : 'en';
      try { localStorage.setItem('atrium.lang', next); } catch (e) {}
      const u = new URL(location.href); u.searchParams.set('lang', next); location.href = u.toString();
    });
    card.appendChild(b);
  }
})();
