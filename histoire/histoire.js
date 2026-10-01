/* L'Atrium · histoire vraie. Chapitre 1 : Frontier (30 juillet – 7 août 2015).
   Même moteur et même style que L'Atrium. Les personnages (Lena, Karim, Wei) sont inventés ;
   les dates, numéros de bloc, empreintes et chiffres sont réels (voir FACTS, sources en bas de la carte de fin). */
(() => {
'use strict';
const W = 1600, H = 900, HOR = 560, TAU = Math.PI * 2;
const css = getComputedStyle(document.documentElement);
const K = n => css.getPropertyValue('--' + n).trim();
const C = { ink:K('ink'), ink2:K('ink-2'), paper:K('paper'), mist:K('mist'), floor:K('floor'), lav:K('lav'), violet:K('violet'),
  peri:K('peri'), cyan:K('cyan'), teal:K('teal'), peach:K('peach'), skin:K('skin'), ground:K('ground'), parch:K('parchment') };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const sfx = name => window.Sound && window.Sound.sfx(name);
const track = (name, data) => { try { if (window.va && location.hash !== '#debug') window.va('event', data ? { name, data } : { name }); } catch (e) { /* ignore */ } };
const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');
const DEBUG = location.hash === '#debug';

const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2;
function hexA(h, a){ h = h.replace('#',''); const n = parseInt(h, 16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function quad(p0,p1,p2,u){ const v = 1-u; return [v*v*p0[0]+2*v*u*p1[0]+u*u*p2[0], v*v*p0[1]+2*v*u*p1[1]+u*u*p2[1]]; }
function persp(y){ return 0.5 + (y - HOR) / (H - HOR) * 0.62; }
function poly(g, pts, close = true){ g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i=1;i<pts.length;i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); }
function fs(g, fill, stroke = C.ink, lw = 2){ if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }
function rr(g, x, y, w, h, r){ g.beginPath(); g.roundRect ? g.roundRect(x, y, w, h, r) : g.rect(x, y, w, h); }
const fmt = n => n.toLocaleString('fr-FR').replace(/ | /g, ' ');
const short = a => a.slice(0, 6) + '…' + a.slice(-4);
const wait = ms => new Promise(r => setTimeout(r, DEBUG && window.__fast ? 0 : ms));

/* ---------- faits réels (vérifiés) ---------- */
// Bloc 0 : empreinte et extraData lus sur etherscan.io/block/0 ; bloc 46147 : etherscan.io/block/46147 ;
// lancement, plafond de 5 000 : ethereum.org/fr/history ; prévente : blog.ethereum.org (« Launching the Ether Sale », 22/07/2014).
const GENESIS_EXTRA = '0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa';
const GENESIS_HASH = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3';
const FAKE_HASH = '0x5f3e9a27c41b86d0e2a7f95c318b4d6e0a9c72f1b5d83e46c0f2a19e7d5b38c4'; // inventé : le fichier piégé du jeu
const FACTS = {
  presale:{ date:'22 juillet 2014', title:"La prévente de l'ether", text:"La prévente de l'ether commence. Elle dure 42 jours et se paie en bitcoin : 2 000 ETH pour 1 BTC pendant les deux premières semaines. Les ethers achetés seront inscrits directement dans le bloc zéro." },
  genesis:{ date:'30 juillet 2015', title:"L'empreinte du bloc 1 028 201", text:"Le bloc zéro n'est distribué par personne : chacun le fabrique avec un script public. Son champ extraData est l'empreinte du bloc 1 028 201 du réseau de test (0x11bb…82fa), impossible à connaître à l'avance." },
  launch:{ date:'30 juillet 2015 · 15:26 UTC', title:'Frontier démarre', text:"Lancement de Frontier, une version « pour développeurs » d'Ethereum. Empreinte du bloc zéro : 0xd4e5…8fa3. Chaque bloc trouvé rapporte 5 ETH à son mineur." },
  gas:{ date:'30 juillet 2015', title:'Un plafond de 5 000', text:"Le plafond de gaz de Frontier est de 5 000 par bloc. Un simple envoi d'ether en demande 21 000 : au début, aucune transaction ne peut entrer dans un bloc. Les blocs sont vides." },
  rule:{ date:'Règle du protocole', title:'Un 1 024e à la fois', text:"À chaque bloc, le mineur peut déplacer le plafond de gaz d'au plus 1/1024 de sa valeur. Pour passer de 5 000 à 21 000, il faut au moins 1 470 blocs d'affilée, soit environ six heures." },
  first:{ date:'7 août 2015 · 03:30 UTC', title:'La première transaction', text:"Bloc 46 147 : le plafond atteint 21 003. La première transaction du réseau y entre, avec 21 000 unités de gaz." },
};
Object.assign(FACTS, {
  homestead:{ date:'14 mars 2016 · bloc 1 150 000', title:'Homestead', text:"Deuxième grande version d'Ethereum : plusieurs changements du protocole, et un changement réseau qui permet de faire de futures mises à jour." },
  daosale:{ date:'30 avril – 28 mai 2016', title:'The DAO lève des fonds', text:"The DAO, un fonds géré par un contrat, collecte des ethers pendant 28 jours. En mai, elle a attiré près de 14 % de tous les ethers émis, auprès de plus de 11 000 investisseurs." },
  hack:{ date:'17 juin 2016', title:'The DAO est vidée', text:"Une faille d'appel récursif est exploitée : plus de 3,6 millions d'ETH, environ un tiers des 11,5 millions de The DAO, partent vers une « DAO enfant »." },
  delay:{ date:'17 juin 2016', title:'27 jours de répit', text:"Les ethers détournés restent bloqués environ 27 jours, la période de création de la DAO enfant. Le voleur ne peut rien retirer avant." },
  softfork:{ date:'28 juin 2016', title:'Le soft fork tombe', text:"Une faille de déni de service est découverte dans le soft fork proposé pour geler les fonds. On recommande de ne pas l'activer." },
  fork:{ date:'20 juillet 2016 · 13:20 UTC', title:'Bloc 1 920 000', text:"Le hard fork déplace environ 12 millions d'ETH des contrats de The DAO vers un contrat de récupération. Environ 85 % des mineurs le suivent." },
  etc:{ date:'20 juillet 2016', title:'Ethereum Classic', text:"Une partie de la communauté reste sur la chaîne d'origine, non modifiée : Ethereum Classic (ETC). Au moment de la séparation, chaque solde existe sur les deux chaînes. Les deux existent toujours." },
});
const FACT_ORDER1 = ['presale', 'genesis', 'launch', 'gas', 'rule', 'first'];
const FACT_ORDER2 = ['homestead', 'daosale', 'hack', 'delay', 'softfork', 'fork', 'etc'];
Object.assign(FACTS, {
  parityhack:{ date:'19 juillet 2017', title:'Le premier coup contre Parity', text:"Une faille des portefeuilles multisig Parity permet de dérober 153 037 ETH. La bibliothèque de code est corrigée et redéployée dès le 20 juillet." },
  erc20:{ date:'19 novembre 2015', title:'Le standard ERC-20', text:"L'EIP-20 décrit ce qu'un jeton doit savoir faire sur Ethereum. En 2017, des centaines de projets s'en servent pour vendre leurs jetons : les ICO." },
  byzantium:{ date:'16 octobre 2017 · bloc 4 370 000', title:'Byzantium', text:"Byzantium réduit la récompense des mineurs de 5 à 3 ETH par bloc." },
  parityfreeze:{ date:'6 novembre 2017', title:'513 774 ETH gelés', text:"Un utilisateur initialise la bibliothèque des multisigs Parity, en devient propriétaire, puis la détruit. 513 774 ETH restent bloqués dans 587 portefeuilles. Aucun fork ne les a débloqués." },
  kitties:{ date:'28 novembre 2017', title:'CryptoKitties', text:"Lancement de CryptoKitties, des chats numériques uniques (ERC-721). Le jeu représente environ un quart du trafic d'Ethereum et fait exploser les transactions en attente." },
  blackthursday:{ date:'12 mars 2020', title:'Le Jeudi noir', text:"L'ether passe d'environ 197 $ à 89 $ en moins de 36 heures. Le réseau saturé, des liquidateurs remportent des coffres Maker pour 0 DAI : environ 8,32 millions de dollars d'ethers." },
  comp:{ date:'15 juin 2020', title:'COMP et la culture de rendement', text:"Compound commence à distribuer son jeton COMP à ceux qui prêtent et empruntent : 2 880 par jour. C'est le début de l'« été de la DeFi »." },
  uni:{ date:'17 septembre 2020', title:'400 UNI', text:"Uniswap lance son jeton UNI et en offre 400 à chaque adresse qui avait déjà utilisé le protocole." },
  deposit:{ date:'14 octobre 2020 · bloc 11 052 984', title:'Le contrat de dépôt', text:"Le contrat de dépôt du staking est déployé. Chaque validateur y dépose 32 ETH." },
  beacon:{ date:'1er décembre 2020 · 12:00 UTC', title:'La Beacon Chain', text:"La Beacon Chain, la chaîne de preuve d'enjeu, produit ses premiers blocs. Elle tourne à côté d'Ethereum, sans encore le remplacer." },
  london:{ date:'5 août 2021 · 12:33 UTC · bloc 12 965 000', title:'London', text:"London active l'EIP-1559 : chaque bloc a des frais de base, les mêmes pour tous, et l'utilisateur ajoute un pourboire pour celui qui produit le bloc." },
  burn:{ date:'5 août 2021', title:'Des ethers brûlés', text:"Depuis London, les frais de base de chaque transaction sont détruits au lieu d'aller au mineur." },
  bellatrix:{ date:'6 septembre 2022', title:'Bellatrix', text:"Bellatrix prépare la Beacon Chain à la Fusion." },
  merge:{ date:'15 septembre 2022 · 06:42 UTC', title:'La Fusion', text:"La difficulté totale atteint 58 750 000 000 000 000 000 000. Au bloc 15 537 394, la preuve de travail s'arrête et la preuve d'enjeu prend le relais. Le minage n'est plus possible." },
  energy:{ date:'15 septembre 2022', title:'99,95 % d’énergie en moins', text:"L'Ethereum Foundation estimait que la preuve d'enjeu réduirait la consommation d'énergie du réseau d'environ 99,95 %." },
  shapella:{ date:'12 avril 2023 · 22:27 UTC', title:'Shapella', text:"Shapella permet enfin de retirer les ethers mis en jeu depuis 2020." },
  dencun:{ date:'13 mars 2024 · 13:55 UTC', title:'Dencun et les blobs', text:"Dencun introduit les « blobs » (EIP-4844), un espace de données bon marché pour les L2. Chez plusieurs d'entre eux, les frais chutent de plus de 90 %." },
  pectra:{ date:'7 mai 2025 · 10:05 UTC', title:'Pectra', text:"Avec l'EIP-7702, un compte classique peut déléguer son fonctionnement à un contrat intelligent. Un validateur peut désormais avoir jusqu'à 2 048 ETH en jeu." },
  tenyears:{ date:'30 juillet 2025', title:'Dix ans', text:"Dix ans, jour pour jour, après le lancement de Frontier." },
  fusaka:{ date:'3 décembre 2025', title:'Fusaka', text:"La mise à jour suivante, Fusaka, continue d'agrandir l'espace disponible pour les L2 (PeerDAS)." },
});
const FACT_ORDERS = { 1:FACT_ORDER1, 2:FACT_ORDER2, 3:['erc20', 'parityhack', 'byzantium', 'parityfreeze', 'kitties'], 4:['blackthursday', 'comp', 'uni', 'deposit', 'beacon'], 5:['london', 'burn'], 6:['bellatrix', 'merge', 'energy', 'shapella'], 7:['dencun', 'pectra', 'tenyears', 'fusaka'] };
const FACT_ORDER = [1, 2, 3, 4, 5, 6, 7].flatMap(n => FACT_ORDERS[n]);
const ERAS = [['2015', 'Frontier'], ['2016', 'The DAO'], ['2017', 'La ruée des ICO'], ['2020', "L'été de la DeFi"], ['2021', 'London'], ['2022', 'La Fusion'], ['2024 – 2025', 'Dix ans']];
const KEEP = ["Le mot de passe sur un post-it, sous l'écran", 'Le fichier et le mot de passe dans un e-mail à moi-même', 'Le mot de passe sur papier chez moi, le fichier sur une clé USB'];
const KEEP_SHORT = ['Post-it sous l’écran', 'E-mail à toi-même', 'Papier + clé USB, séparés'];

/* ---------- viewport ---------- */
let dpr = 1, scale = 1, viewW = W, viewH = H, cache = null;
const cam = { x:0, y:0 };
function resize(){
  const w = stage.clientWidth, vh = window.innerHeight;
  const compact = vh < 520 && window.innerWidth > vh;
  document.documentElement.classList.toggle('compact', compact);
  let h;
  if (compact) h = Math.max(220, vh - 16);
  else { const avail = vh - 32 - 40; h = w * 9 / 16; if (w < 900) h = Math.max(h, Math.min(avail * .92, 660)); h = clamp(h, 340, Math.max(340, avail)); }
  stage.style.height = Math.round(h) + 'px';
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = Math.max(w / W, h / H); viewW = w / scale; viewH = h / scale;
  buildCache(); snapCam();
}
function buildCache(){
  cache = document.createElement('canvas');
  const k = scale * dpr;
  cache.width = Math.ceil(W * k); cache.height = Math.ceil(H * k);
  const g = cache.getContext('2d'); g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
  drawStatic(g);
}

/* ---------- le hackerspace (décor fixe) ---------- */
function drawStatic(g){
  // mur du fond
  g.fillStyle = C.paper; g.fillRect(0, 0, W, HOR);
  g.strokeStyle = hexA(C.lav, .55); g.lineWidth = 1.5;
  for (let y = 70; y < HOR - 20; y += 34){ const off = (y / 34 % 2) * 60; for (let x = -60 + off; x < W; x += 120){ g.beginPath(); g.moveTo(x, y); g.lineTo(x + 104, y); g.stroke(); } }
  // poutre du plafond
  g.fillStyle = C.mist; g.fillRect(0, 0, W, 48); g.beginPath(); g.moveTo(0, 48); g.lineTo(W, 48); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  // sol en lattes, en perspective
  g.fillStyle = '#f1eefb'; g.fillRect(0, HOR, W, H - HOR);
  g.strokeStyle = hexA(C.lav, .9); g.lineWidth = 1.5;
  for (let i = -14; i <= 14; i++){ g.beginPath(); g.moveTo(800 + i * 64, HOR); g.lineTo(800 + i * 190, H); g.stroke(); }
  for (let k = 1; k < 9; k++){ const y = HOR + (H - HOR) * Math.pow(k / 9, 1.5); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.strokeStyle = hexA(C.lav, .5); g.stroke(); }
  // plinthe
  g.fillStyle = C.lav; g.fillRect(0, HOR - 12, W, 12); g.beginPath(); g.moveTo(0, HOR - 12); g.lineTo(W, HOR - 12); g.moveTo(0, HOR); g.lineTo(W, HOR); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  drawBoard(g); drawPoster(g); drawShelves(g);
  // câble de la machine de Karim jusqu'à la prise
  g.beginPath(); g.moveTo(1300, 700); g.quadraticCurveTo(1360, 600, 1352, 540); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
  rr(g, 1340, 520, 24, 20, 3); fs(g, C.paper);
}
function drawBoard(g){
  rr(g, 140, 150, 330, 230, 6); fs(g, C.paper, C.ink, 3);
  g.fillStyle = C.lav; g.fillRect(150, 380, 310, 8); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(150, 380, 310, 8);
  if (chap === 2) return drawBoard2(g);
  if (chap >= 3) return drawBoardN(g, BOARDS[chap]);
  g.fillStyle = C.ink; g.font = '400 34px Gloock, Georgia, serif'; g.fillText('30 · 07 · 2015', 170, 200);
  // trois blocs reliés
  for (let i = 0; i < 3; i++){ const x = 176 + i * 92; g.strokeStyle = C.ink2; g.lineWidth = 2.2; g.strokeRect(x, 222, 54, 40); g.fillStyle = C.ink2; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText(String(i), x + 21, 249);
    if (i < 2){ g.beginPath(); g.moveTo(x + 58, 242); g.lineTo(x + 86, 242); g.moveTo(x + 80, 236); g.lineTo(x + 86, 242); g.lineTo(x + 80, 248); g.stroke(); } }
  g.fillStyle = C.ink2; g.font = '600 19px "JetBrains Mono", monospace'; g.fillText('#1 028 201', 176, 305);
  g.beginPath(); g.ellipse(236, 298, 78, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace'; g.fillText('gas limit : 5 000 ?!', 176, 348); g.fillText('tx : 21 000', 348, 305);
}
function drawBoard2(g){
  g.fillStyle = C.ink; g.font = '400 34px Gloock, Georgia, serif'; g.fillText('The DAO', 170, 200);
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace';
  g.fillText('retirer() :', 176, 236); g.fillText('1. envoyer', 196, 260); g.fillText('2. solde = 0', 196, 284);
  g.fillStyle = hexA('#d9607e', 1); g.font = '600 22px "JetBrains Mono", monospace'; g.fillText('?!', 340, 284);
  g.beginPath(); g.moveTo(320, 250); g.quadraticCurveTo(352, 262, 322, 276); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 19px "JetBrains Mono", monospace'; g.fillText('#1 920 000', 176, 334);
  g.beginPath(); g.ellipse(236, 327, 78, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText('ETH | ETC ?', 330, 334);
}
const BOARDS = {
  3:{ title:'2017', lines:['ICO = ?', 'white paper ≠ code', 'gaz : enchère ?!'], circle:'#4 370 000', side:'5 → 3 ETH' },
  4:{ title:'DeFi', lines:['coffre ≥ 150 %', 'APY 12 000 % ?!', '→ lire le code'], circle:'32 ETH', side:'Beacon' },
  5:{ title:'London', lines:['base fee → brûlée', '+ pourboire', 'EIP-1559'], circle:'#12 965 000', side:'burn' },
  6:{ title:'La Fusion', lines:['TTD :', '58 750 000 000', '000 000 000 000'], circle:'#15 537 394', side:'PoW → PoS' },
  7:{ title:'Dix ans', lines:['blobs → L2', 'EIP-7702', '30.07.2015 → 2025'], circle:'#22 431 084', side:'merci !' },
};
function drawBoardN(g, B){
  g.fillStyle = C.ink; g.font = '400 34px Gloock, Georgia, serif'; g.fillText(B.title, 170, 200);
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace'; B.lines.forEach((l, i) => g.fillText(l, 176, 236 + i * 24));
  g.fillStyle = C.ink2; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText(B.circle, 176, 334);
  const w = g.measureText(B.circle).width; g.beginPath(); g.ellipse(176 + w / 2, 327, w / 2 + 16, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 17px "JetBrains Mono", monospace'; g.fillText(B.side, 212 + w, 334);
}
function drawPoster(g){
  rr(g, 500, 160, 86, 132, 4); fs(g, C.peri, C.ink, 2.5);
  const cx = 543, cy = 212;
  poly(g, [[cx, cy - 34], [cx - 22, cy + 2], [cx, cy + 14], [cx + 22, cy + 2]]); fs(g, C.cyan, C.ink, 2);
  poly(g, [[cx, cy + 20], [cx - 22, cy + 7], [cx, cy + 38], [cx + 22, cy + 7]]); fs(g, C.lav, C.ink, 2);
  g.fillStyle = C.paper; g.font = '600 12px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText('FRONTIER', cx, 278); g.textAlign = 'left';
}
function drawShelves(g){
  for (const y of [200, 312]){ g.fillStyle = C.lav; g.fillRect(1100, y, 390, 10); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(1100, y, 390, 10); }
  // étagère du haut : classeurs, un routeur, un petit palmier
  const cols = [C.peach, C.cyan, C.violet, C.lav, C.peach];
  cols.forEach((c, i) => { rr(g, 1116 + i * 22, 132 + (i % 2) * 8, 18, 68 - (i % 2) * 8, 2); fs(g, c); });
  rr(g, 1260, 170, 90, 30, 4); fs(g, C.paper); for (let i = 0; i < 4; i++){ g.fillStyle = i % 2 ? C.teal : C.cyan; g.beginPath(); g.arc(1276 + i * 18, 186, 3.5, 0, TAU); g.fill(); }
  g.beginPath(); g.moveTo(1272, 170); g.lineTo(1266, 140); g.moveTo(1336, 170); g.lineTo(1342, 140); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  rr(g, 1410, 170, 40, 30, 4); fs(g, C.peach); g.beginPath(); g.moveTo(1430, 170); g.quadraticCurveTo(1428, 140, 1440, 118); g.strokeStyle = C.ink; g.lineWidth = 2.5; g.stroke();
  for (const [a, l] of [[-2.6, 34], [-1.9, 30], [-.9, 32], [-.3, 28]]){ g.beginPath(); g.moveTo(1440, 118); g.quadraticCurveTo(1440 + Math.cos(a) * l * .6, 118 + Math.sin(a) * l * .6 - 8, 1440 + Math.cos(a) * l, 118 + Math.sin(a) * l + 8); g.strokeStyle = C.teal; g.lineWidth = 5; g.stroke(); }
  // étagère du bas : cartons, bobine de câble, fer à souder
  rr(g, 1116, 262, 80, 50, 3); fs(g, C.parch); g.fillStyle = C.ink2; g.font = '600 12px "JetBrains Mono", monospace'; g.fillText('CÂBLES', 1128, 292);
  rr(g, 1206, 272, 64, 40, 3); fs(g, C.parch);
  g.beginPath(); g.arc(1320, 290, 20, 0, TAU); fs(g, C.violet); g.beginPath(); g.arc(1320, 290, 7, 0, TAU); fs(g, C.paper);
  rr(g, 1370, 296, 90, 14, 4); fs(g, C.mist); g.beginPath(); g.moveTo(1460, 303); g.lineTo(1480, 303); g.strokeStyle = C.ink; g.stroke();
}

/* ---------- décor animé ---------- */
function drawWindow(g, t){
  const x = 640, y = 104, w = 380, h = 300;
  const grd = g.createLinearGradient(0, y, 0, y + h);
  if (sky === 'dawn'){ grd.addColorStop(0, '#c9d2f7'); grd.addColorStop(.55, '#e9e4fb'); grd.addColorStop(1, '#fbd9c0'); }
  else if (sky === 'day'){ grd.addColorStop(0, '#9fdcea'); grd.addColorStop(.6, '#d6f2f4'); grd.addColorStop(1, '#f3f6fd'); }
  else { grd.addColorStop(0, '#aab6f3'); grd.addColorStop(.6, '#d9cff6'); grd.addColorStop(1, '#f7c8a6'); }
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  // soleil bas
  g.fillStyle = hexA(sky === 'dawn' ? '#fff3e2' : sky === 'day' ? '#fffbe8' : '#fde3c9', .95); g.beginPath(); if (sky === 'day') g.arc(x + w - 80, y + 60, 26, 0, TAU); else g.arc(sky === 'dawn' ? x + 90 : x + w - 90, y + h - 70, 28, 0, TAU); g.fill();
  // toits de zinc et cheminées
  g.fillStyle = hexA(C.ink, .22);
  g.beginPath(); g.moveTo(x, y + h);
  const roof = [[0, 210], [40, 196], [40, 180], [52, 180], [52, 196], [110, 188], [150, 210], [190, 170], [250, 170], [262, 150], [276, 150], [276, 172], [300, 176], [330, 204], [380, 196]];
  roof.forEach(([rx, ry]) => g.lineTo(x + rx, y + ry)); g.lineTo(x + w, y + h); g.closePath(); g.fill();
  g.fillStyle = hexA(C.ink, .12); g.fillRect(x, y + 238, w, h - 238);
  // un pigeon sur la barre d'appui
  const bob = reduce ? 0 : Math.sin(t * 2.2) * 1.2;
  g.save(); g.translate(x + 300, y + h - 8 + bob); g.beginPath(); g.ellipse(0, -8, 12, 8, 0, 0, TAU); fs(g, C.mist, C.ink, 1.6); g.beginPath(); g.arc(9, -16, 5, 0, TAU); fs(g, C.mist, C.ink, 1.6); g.restore();
  // châssis
  g.strokeStyle = C.ink; g.lineWidth = 6; g.strokeRect(x, y, w, h);
  g.lineWidth = 4; g.beginPath(); g.moveTo(x + w / 2, y); g.lineTo(x + w / 2, y + h); g.moveTo(x, y + h * .42); g.lineTo(x + w, y + h * .42); g.stroke();
  g.fillStyle = C.lav; g.fillRect(x - 14, y + h, w + 28, 12); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(x - 14, y + h, w + 28, 12);
}
function drawLamps(g, t){
  for (const x of [400, 800, 1200]){
    g.beginPath(); g.moveTo(x, 48); g.lineTo(x, 92); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
    if (sky === 'evening'){ const r = 90 + (reduce ? 0 : Math.sin(t * 1.3 + x) * 3); const gr = g.createRadialGradient(x, 110, 5, x, 110, r); gr.addColorStop(0, hexA('#fff1dc', .8)); gr.addColorStop(1, hexA('#fff1dc', 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, 110, r, 0, TAU); g.fill(); }
    poly(g, [[x - 10, 92], [x + 10, 92], [x + 26, 116], [x - 26, 116]]); fs(g, C.peach);
  }
}
function laptop(g, x, y, t, mine){
  poly(g, [[x - 46, y], [x + 46, y], [x + 54, y + 12], [x - 54, y + 12]]); fs(g, C.mist);
  rr(g, x - 44, y - 60, 88, 60, 5); fs(g, C.ink);
  const lines = mine ? 5 : 6;
  for (let i = 0; i < lines; i++){
    const w = 20 + ((Math.sin(i * 7.3 + x) + 1) * 26) + (reduce ? 0 : Math.sin(t * 2 + i) * 3);
    g.fillStyle = hexA(i === lines - 1 ? C.peach : C.cyan, .85); g.fillRect(x - 36, y - 52 + i * 9, w, 4);
  }
  if (mine && (phase === 'genesis' || phase === 'node' || phase === 'c2-drain' || phase === 'c2-fork' || goal === 'laptop') && !busy){ const a = reduce ? .8 : .45 + Math.sin(t * 4) * .35; g.strokeStyle = hexA(C.peach, a); g.lineWidth = 5; g.strokeRect(x - 49, y - 65, 98, 70); }
}
function drawDesk(g, t){
  g.strokeStyle = C.ink; g.lineWidth = 6; g.beginPath(); g.moveTo(284, 712); g.lineTo(284, 770); g.moveTo(776, 712); g.lineTo(776, 770); g.stroke();
  poly(g, [[300, 648], [760, 648], [790, 700], [270, 700]]); fs(g, C.paper, C.ink, 2.5);
  poly(g, [[270, 700], [790, 700], [790, 712], [270, 712]]); fs(g, C.lav, C.ink, 2.5);
  // boîtes de pizza
  poly(g, [[680, 664], [748, 664], [756, 682], [672, 682]]); fs(g, C.parch); poly(g, [[684, 654], [744, 654], [750, 664], [678, 664]]); fs(g, C.parch);
  // tasse
  rr(g, 462, 664, 18, 20, 3); fs(g, C.cyan); g.beginPath(); g.arc(482, 673, 5, -1.3, 1.3); g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
  laptop(g, 380, 682, t, false); laptop(g, 572, 686, t, true);
}
function drawRig(g, t){
  const x = 1150, y = 650, w = 170, h = 90;
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(x + w / 2, y + h + 4, 104, 14, 0, 0, TAU); g.fill();
  rr(g, x + 8, y + 18, w - 16, h - 26, 4); fs(g, C.lav);
  rr(g, x + w - 64, y + h - 34, 52, 26, 3); fs(g, C.paper);
  for (let i = 0; i < 3; i++){
    const cx = x + 14 + i * 52;
    rr(g, cx, y - 64, 44, 70, 4); fs(g, C.peri, C.ink, 2.2);
    const fx0 = cx + 22, fy = y - 32; g.beginPath(); g.arc(fx0, fy, 16, 0, TAU); fs(g, C.mist, C.ink, 1.8);
    g.save(); g.translate(fx0, fy); g.rotate(rig.spin + i); for (let b = 0; b < 3; b++){ g.rotate(TAU / 3); g.beginPath(); g.ellipse(7, 0, 7, 3.2, .4, 0, TAU); g.fillStyle = C.ink2; g.fill(); } g.restore();
    g.beginPath(); g.arc(fx0, fy, 3, 0, TAU); fs(g, C.paper, C.ink, 1.2);
    const on = rig.on ? (reduce ? 1 : (Math.sin(t * 6 + i * 2) > -.3 ? 1 : .35)) : .35;
    g.fillStyle = hexA(C.teal, on); g.beginPath(); g.arc(cx + 8, y - 56, 3, 0, TAU); g.fill();
  }
  g.strokeStyle = C.ink; g.lineWidth = 3.5; g.strokeRect(x, y, w, h);
  g.beginPath(); g.moveTo(x, y); g.lineTo(x + 16, y - 12); g.lineTo(x + w + 16, y - 12); g.lineTo(x + w, y); g.moveTo(x + w + 16, y - 12); g.lineTo(x + w + 16, y + h - 12); g.lineTo(x + w, y + h); g.stroke();
  if (rig.retired){ const px = x + w / 2, py = y - 66; rr(g, px - 20, py - 26, 40, 30, 5); fs(g, C.peach);
    g.beginPath(); g.moveTo(px, py - 26); g.quadraticCurveTo(px - 4, py - 60, px + 8, py - 84); g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke();
    for (const [a, l] of [[-2.7, 44], [-2.1, 40], [-1.2, 42], [-.5, 38], [-.1, 34]]){ g.beginPath(); g.moveTo(px + 8, py - 84); g.quadraticCurveTo(px + 8 + Math.cos(a) * l * .6, py - 84 + Math.sin(a) * l * .6 - 10, px + 8 + Math.cos(a) * l, py - 84 + Math.sin(a) * l + 10); g.strokeStyle = C.teal; g.lineWidth = 6; g.stroke(); } }
  if (rig.flash > 0){ const a = rig.flash; const gr = g.createRadialGradient(x + w / 2, y, 10, x + w / 2, y, 170); gr.addColorStop(0, hexA(C.cyan, .6 * a)); gr.addColorStop(1, hexA(C.cyan, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x + w / 2, y, 170, 0, TAU); g.fill(); }
}
function drawSofa(g){
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(222, 852, 150, 14, 0, 0, TAU); g.fill();
  rr(g, 96, 734, 252, 72, 16); fs(g, C.violet);
  rr(g, 90, 792, 264, 52, 12); fs(g, C.lav);
  g.beginPath(); g.moveTo(222, 796); g.lineTo(222, 840); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
  rr(g, 70, 760, 40, 90, 14); fs(g, C.violet); rr(g, 334, 760, 40, 90, 14); fs(g, C.violet);
  // un coussin et un plaid
  rr(g, 120, 758, 58, 40, 10); fs(g, C.peach); poly(g, [[250, 790], [320, 786], [330, 836], [262, 842]]); fs(g, C.cyan);
  if (sleeping){ g.fillStyle = C.ink2; g.font = '600 22px "JetBrains Mono", monospace'; const z = reduce ? 0 : (time * .6) % 1; g.globalAlpha = 1 - z; g.fillText('z', 200 + z * 20, 740 - z * 40); g.globalAlpha = 1; }
}
function drawCoffee(g){
  rr(g, 1386, 600, 118, 82, 4); fs(g, C.paper, C.ink, 2.5);
  g.beginPath(); g.moveTo(1445, 604); g.lineTo(1445, 678); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.stroke();
  rr(g, 1402, 540, 56, 60, 6); fs(g, C.peri); rr(g, 1414, 560, 32, 22, 3); fs(g, C.ink); rr(g, 1422, 584, 14, 14, 2); fs(g, C.cyan);
  rr(g, 1472, 580, 18, 20, 3); fs(g, C.peach);
}
function drawEth(g, x, y, k, col){
  g.save(); g.translate(x, y); g.scale(k, k);
  poly(g, [[0, -16], [-10, 1], [0, 7], [10, 1]]); fs(g, col || C.cyan, C.ink, 1.8);
  poly(g, [[0, 10], [-10, 4], [0, 18], [10, 4]]); fs(g, C.lav, C.ink, 1.8);
  g.restore();
}

/* ---------- personnages ---------- */
function limb(g, pts, w, col){
  g.lineCap = 'round'; g.lineJoin = 'round';
  g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.strokeStyle = C.ink; g.lineWidth = w + 4.4; g.stroke(); g.strokeStyle = col; g.lineWidth = w; g.stroke();
}
function hand(g, x, y, skin){ g.beginPath(); g.arc(x, y, 4.2, 0, TAU); fs(g, skin, C.ink, 1.8); }
function head(g, hy, p){
  if (p.style === 'long'){ g.beginPath(); g.moveTo(-17, hy - 4); g.quadraticCurveTo(-20, hy + 22, -12, hy + 26); g.lineTo(6, hy + 22); g.lineTo(8, hy); g.closePath(); fs(g, p.hair); }
  limb(g, [[0, hy + 12], [0, hy + 20]], 6, p.skin);
  g.beginPath(); g.arc(0, hy, 15, 0, TAU); fs(g, p.skin);
  if (p.cap){ g.beginPath(); g.arc(-1, hy - 3, 16, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); fs(g, p.cap); g.beginPath(); g.moveTo(12, hy - 6); g.quadraticCurveTo(24, hy - 6, 28, hy - 2); g.lineTo(12, hy - 2); g.closePath(); fs(g, p.cap); }
  else { g.beginPath(); g.arc(-1, hy - 2, 16, Math.PI * .95, Math.PI * 2.02); g.quadraticCurveTo(4, hy - 8, -3, hy - 5); g.quadraticCurveTo(-10, hy - 2, -16, hy + 2); g.closePath(); fs(g, p.hair); }
  if (p.glasses){ g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.arc(9, hy + 1, 5, 0, TAU); g.moveTo(4, hy); g.lineTo(-6, hy - 2); g.stroke(); }
  else { g.fillStyle = C.ink; g.beginPath(); g.arc(8, hy + 1, 1.9, 0, TAU); g.fill(); }
  g.fillStyle = hexA(C.peach, .8); g.beginPath(); g.arc(6, hy + 7, 3, 0, TAU); g.fill();
  if (p.smile){ g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.arc(7, hy + 4, 5, .35, 1.9); g.stroke(); }
}
function drawPerson(g, p, t){
  const s = persp(p.y) * (p.tall || 1);
  g.save(); g.translate(p.x, p.y);
  g.fillStyle = hexA(C.ink, .13); g.beginPath(); g.ellipse(0, 0, 24 * s, 6 * s, 0, 0, TAU); g.fill();
  g.scale(s * p.face, s);
  const sw = p.moving ? Math.sin(p.walk) : 0;
  const bob = p.moving ? -Math.abs(Math.cos(p.walk)) * 2.5 : (reduce ? 0 : Math.sin(t * 1.6 + p.x) * .6);
  g.translate(0, bob);
  if (!p.gesture){ limb(g, [[11, -106], [13 - sw*7, -86], [12 - sw*10, -68]], 8, p.shirt); hand(g, 12 - sw*10, -68, p.skin); }
  const spread = p.moving ? 1.5 : 5;
  const leg = (hx, ph) => {
    const a = p.moving ? Math.sin(p.walk + ph) * .42 : 0;
    const lift = p.moving ? Math.max(0, Math.cos(p.walk + ph)) : 0;
    const knee = [hx + Math.sin(a) * 30, -60 + Math.cos(a) * 30];
    const b = a - lift * .75;
    const foot = [knee[0] + Math.sin(b) * 29, Math.min(-3, knee[1] + Math.cos(b) * 29 - lift * 3)];
    limb(g, [[hx, -60], knee, foot], 10, p.pants);
    g.fillStyle = C.ink; g.beginPath(); g.ellipse(foot[0] + 3, foot[1] + 2, 7, 3.6, 0, 0, TAU); g.fill();
  };
  leg(spread, Math.PI); leg(-spread, 0);
  g.beginPath(); g.moveTo(-15, -60); g.lineTo(-17, -104); g.quadraticCurveTo(-16, -117, -3, -118); g.lineTo(4, -118); g.quadraticCurveTo(17, -117, 17, -104); g.lineTo(15, -60); g.closePath(); fs(g, p.shirt);
  g.beginPath(); g.moveTo(-15, -64); g.lineTo(15, -64); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
  if (p.logo){ poly(g, [[2, -104], [-4, -94], [2, -90], [8, -94]]); fs(g, C.paper, C.ink, 1.3); }
  head(g, -136, p);
  limb(g, [[-11, -106], [-13 + sw*7, -86], [-11 + sw*10, -68]], 8, p.shirt); hand(g, -11 + sw*10, -68, p.skin);
  if (p.gesture){ limb(g, [[11, -106], [25, -108], [31, -130]], 8, p.shirt); hand(g, 31, -131, p.skin); }
  g.restore();
}
function drawCat(g, c, t){
  const s = persp(c.y) * .95;
  g.save(); g.translate(c.x, c.y); g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(0, 0, 24 * s, 5 * s, 0, 0, TAU); g.fill();
  g.scale(s * c.face, s); g.lineJoin = 'round';
  if (c.sleep){
    const br = reduce ? 0 : Math.sin(t * 1.8) * 1.2;
    limb(g, [[-20, -6], [-30, -2], [-18, 2], [8, 2]], 5, C.peach);
    g.beginPath(); g.ellipse(0, -13 - br / 2, 24, 13 + br / 2, 0, 0, TAU); fs(g, C.peach);
    poly(g, [[10, -24], [12, -36], [18, -26]]); fs(g, C.peach); poly(g, [[20, -24], [26, -34], [27, -21]]); fs(g, C.peach);
    g.beginPath(); g.arc(18, -16, 11, 0, TAU); fs(g, C.peach);
    g.strokeStyle = C.ink; g.lineWidth = 1.6; g.beginPath(); g.moveTo(16, -17); g.quadraticCurveTo(19, -15, 22, -17); g.stroke();
  } else {
    const tw = reduce ? 0 : Math.sin(t * 2) * 4;
    limb(g, [[-10, -4], [-28, -2], [-30, -18 + tw]], 5, C.peach);
    g.beginPath(); g.ellipse(0, -22, 15, 21, 0, 0, TAU); fs(g, C.peach);
    poly(g, [[-6, -51], [-5, -65], [3, -56]]); fs(g, C.peach); poly(g, [[6, -56], [14, -65], [15, -50]]); fs(g, C.peach);
    g.beginPath(); g.arc(4, -46, 12, 0, TAU); fs(g, C.peach);
    g.fillStyle = C.ink; g.beginPath(); g.arc(1, -47, 1.7, 0, TAU); g.arc(9, -47, 1.7, 0, TAU); g.fill();
  }
  g.restore();
}
function drawMarker(g, x, y, t){
  const b = reduce ? 0 : Math.sin(t * 3) * 6;
  poly(g, [[x, y - 22 + b], [x - 10, y - 6 + b], [x, y + 2 + b], [x + 10, y - 6 + b]]); fs(g, C.cyan, C.ink, 2);
}

/* ---------- état ---------- */
const player = {}, lena = {}, karim = {}, cat = {}, rig = { on:false, spin:0, flash:0 };
let phase = 'title', lock = true, busy = false, time = 0, sky = 'evening', sleeping = false, chapterDone = 0, addr = '';
const ch1 = {}, ch2 = {}; const facts = []; let chap = 1;
const CHS = { 1:ch1, 2:ch2, 3:{}, 4:{}, 5:{}, 6:{}, 7:{} };
const newbie = { vis:false };
const fx = [], tweens = [];

function newAddr(){ let s = '0x'; for (let i = 0; i < 40; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return s; }
function resetWorld(){
  Object.assign(player, { x:800, y:960, face:-1, walk:0, moving:false, target:null, shirt:C.peach, pants:C.lav, hair:C.violet, style:'short', skin:C.skin, gesture:false });
  Object.assign(lena, { x:430, y:800, face:1, walk:0, moving:false, target:null, shirt:C.lav, pants:C.peri, hair:C.peach, style:'long', skin:C.skin, glasses:true, gesture:false });
  Object.assign(karim, { x:1070, y:792, face:1, walk:0, moving:false, target:null, shirt:C.teal, pants:C.ink2, hair:C.ink, cap:C.violet, skin:C.skin, logo:true, gesture:false });
  Object.assign(cat, { x:1372, y:792, face:-1, sleep:true });
  Object.assign(rig, { on:false, spin:0, flash:0, retired:false });
  for (let n = 3; n <= 7; n++) for (const k of Object.keys(CHS[n])) delete CHS[n][k];
  newbie.vis = false; if (typeof goal !== 'undefined') goal = null;
  Object.assign(ch2, { invested:false, spotted:null, chain:null, heard:0 });
  Object.assign(ch1, { downloaded:false, built:false, keep:null, keepChanged:false, eth:0, lenaEth:false, account:false });
  facts.length = 0; fx.length = 0; tweens.length = 0;
  sky = 'evening'; sleeping = false; addr = newAddr();
  setObjective(null); $('carnetBtn').hidden = true; $('panel').hidden = true; renderPanel();
}

/* ---------- déplacements ---------- */
function obstacles(){ return [[530, 708, 300, 62], [1238, 726, 116, 26], [222, 812, 150, 44], [1445, 664, 72, 22], [lena.x, lena.y, 32, 12], [karim.x, karim.y, 32, 12]].concat(newbie.vis ? [[newbie.x, newbie.y, 32, 12]] : []); }
function collide(e){
  for (const [cx, cy, rx, ry] of obstacles()){
    let dx = (e.x - cx) / rx, dy = (e.y - cy) / ry, d = dx*dx + dy*dy;
    if (d < 1){ if (d < 1e-4){ dx = 0; dy = 1; d = 1; } const k = 1 / Math.sqrt(d); e.x = cx + dx * k * rx; e.y = cy + dy * k * ry; }
  }
  e.x = clamp(e.x, 110, 1490); e.y = clamp(e.y, 606, 878);
}
function walkTo(e, x, y, sp = 230, collideOn = false){ return new Promise(res => { e.target = { x, y, sp, res, collide:collideOn, stuck:0 }; }); }
function moveEntity(e, dt){
  const TG = e.target; if (!TG){ e.moving = false; return; }
  const dx = TG.x - e.x, dy = TG.y - e.y, d = Math.hypot(dx, dy), step = TG.sp * persp(e.y) * dt;
  if (Math.abs(dx) > 1.5) e.face = dx > 0 ? 1 : -1;
  if (d <= step){ e.x = TG.x; e.y = TG.y; e.target = null; e.moving = false; TG.res && TG.res(); return; }
  e.x += dx / d * step; e.y += dy / d * step; e.moving = true; e.walk += dt * 10;
  if (TG.collide){ collide(e); if (Math.hypot(TG.x - e.x, TG.y - e.y) >= d - .05){ TG.stuck += dt; if (TG.stuck > .35){ e.target = null; e.moving = false; TG.res && TG.res(); } } else TG.stuck = 0; }
}
const face = (a, b) => { a.face = b.x > a.x ? 1 : -1; };
function flyEth(from, to, dur){
  sfx('gift');
  return new Promise(res => fx.push({ t:0, dur, res, draw(g, u){
    const e = ease(u), c = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 120];
    for (let k = 6; k >= 1; k--){ const pk = quad(from, c, to, Math.max(0, e - k * .03)); g.fillStyle = hexA(C.cyan, .5 - k * .06); g.beginPath(); g.arc(pk[0], pk[1], 7 - k * .7, 0, TAU); g.fill(); }
    const p = quad(from, c, to, e); g.fillStyle = hexA(C.cyan, .45); g.beginPath(); g.arc(p[0], p[1], 20, 0, TAU); g.fill(); drawEth(g, p[0], p[1] - 2, 1.1);
  }}));
}
function floatText(x, y, txt){
  fx.push({ t:0, dur:1.8, res(){}, draw(g, u){ g.globalAlpha = 1 - u * u; g.fillStyle = C.ink; g.font = '600 30px "JetBrains Mono", monospace'; g.textAlign = 'center'; g.fillText(txt, x, y - u * 70); g.textAlign = 'left'; g.globalAlpha = 1; } });
}

/* ---------- HUD, carnet, faits ---------- */
function setObjective(txt){ $('objective').hidden = !txt; if (txt) $('objText').textContent = txt; }
function setDate(txt){ $('objDate').textContent = txt; }
let toastTm = 0;
function learn(id){
  if (facts.includes(id)) return; facts.push(id);
  const f = FACTS[id]; $('toastHead').textContent = 'Fait réel · ' + f.date; $('toastRow').textContent = f.title;
  const t = $('toast'); t.classList.add('show'); sfx('ledger'); clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('show'), 3400);
  renderPanel(); pulseCarnet();
}
function pulseCarnet(){ const b = $('carnetBtn'); b.classList.remove('pulse'); void b.offsetWidth; if (!reduce) b.classList.add('pulse'); }
function renderPanel(){
  const rows = [
    ['Adresse', ch1.account ? short(addr) : 'Pas encore de compte'],
    ['Solde', ch1.eth ? `${ch1.eth} ETH` : '0 ETH'],
    ['Clé et mot de passe', ch1.keep != null ? KEEP_SHORT[ch1.keep] : '—'],
    ['Ton bloc zéro', ch1.built ? (ch1.downloaded ? 'Fabriqué toi-même (après un faux fichier)' : 'Fabriqué toi-même') : '—'],
  ];
  if (chap === 2 || ch2.chain){
    rows[1][1] = ch2.invested ? (ch2.chain === 'eth' ? '1 ETH (à récupérer via le contrat de remboursement)' : ch2.chain === 'etc' ? '1 ETH placé dans The DAO, qui reste soumis à son code' : 'Jetons DAO (contre 1 ETH)') : (ch1.eth ? '1 ETH' : '0 ETH');
    rows.push(['The DAO', ch2.invested ? 'Tu y as mis ton ether' : 'Tu n’y as pas touché']);
    rows.push(['Chaîne suivie', ch2.chain === 'eth' ? 'Ethereum (avec le fork)' : ch2.chain === 'etc' ? 'Ethereum Classic (sans le fork)' : '—']);
  }
  if (typeof journeyLines === 'function') journeyLines().slice(2).forEach(([y, t]) => rows.push([y, t]));
  if (CHS[7].guardians) rows[2][1] += ' · + gardiens (EIP-7702)';
  if (chap >= 3 || chapterDone >= 3) rows.splice(1, 1);
  $('acct').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const got = FACT_ORDER.filter(id => facts.includes(id));
  $('frise').innerHTML = got.length ? got.map(id => `<li><b>${FACTS[id].date}</b><strong>${FACTS[id].title}</strong>${FACTS[id].text}</li>`).join('') : '<li class="empty">Rien pour l’instant. Les faits réels s’ajoutent ici au fil du chapitre.</li>';
}
function togglePanel(){ const p = $('panel'); p.hidden = !p.hidden; if (p.hidden) document.activeElement && document.activeElement.blur(); }
$('carnetBtn').addEventListener('click', togglePanel);
$('panelClose').addEventListener('click', () => { $('panel').hidden = true; document.activeElement && document.activeElement.blur(); });

/* ---------- dialogue ---------- */
const dlg = $('dialog'), speakerEl = $('speaker'), lineEl = $('line'), choicesEl = $('choices'), moreEl = $('more');
let advanceFn = null;
function say(who, text, choices){
  return new Promise(res => {
    dlg.hidden = false; dlg.classList.toggle('narration', !who);
    speakerEl.hidden = !who; speakerEl.textContent = who || ''; speakerEl.dataset.who = who || '';
    lena.gesture = who === 'Lena'; karim.gesture = who === 'Karim';
    lineEl.textContent = ''; choicesEl.innerHTML = ''; moreEl.hidden = true;
    let i = 0, done = false, timer = null;
    const finish = () => {
      clearInterval(timer); lineEl.textContent = text; done = true;
      if (choices){
        advanceFn = null;
        choices.forEach((c, idx) => { const b = document.createElement('button'); b.className = 'choice'; b.textContent = c;
          b.addEventListener('click', ev => { ev.stopPropagation(); sfx('select'); choicesEl.innerHTML = ''; res(idx); }); choicesEl.appendChild(b); });
        choicesEl.firstChild.focus({ preventScroll:true });
      } else moreEl.hidden = false;
    };
    advanceFn = () => { if (!done) finish(); else if (!choices){ advanceFn = null; res(0); } };
    if (reduce || (DEBUG && window.__fast)) finish(); else timer = setInterval(() => { i += 1; lineEl.textContent = text.slice(0, i); if (i % 4 === 0 && text[i] !== ' ') sfx('blip'); if (i >= text.length) finish(); }, 20);
  });
}
function closeDialog(){ dlg.hidden = true; advanceFn = null; lena.gesture = false; karim.gesture = false; document.activeElement && document.activeElement.blur(); }
dlg.addEventListener('click', () => advanceFn && advanceFn());
async function chat(lines){
  if (busy) return; busy = true; const was = lock; lock = true;
  for (const [w, t] of lines) await say(w, t);
  closeDialog(); lock = was; busy = false;
}
function free(){ closeDialog(); busy = false; lock = false; }

/* ---------- fenêtres (terminal, choix) ---------- */
const modal = $('modal'), mcard = $('modalCard');
function closeModal(){ modal.hidden = true; mcard.className = 'card'; document.activeElement && document.activeElement.blur(); }
const term = {
  open(title){ mcard.className = 'card term'; mcard.innerHTML = `<p class="eyebrow">${title}</p><div class="screen" id="scr" role="log" aria-live="polite"></div><div id="textra"></div><div class="row" id="trow"></div>`; modal.hidden = false; },
  line(txt, cls = ''){ const d = document.createElement('div'); d.className = 'tl ' + cls; d.textContent = txt; const s = $('scr'); s.appendChild(d); s.scrollTop = s.scrollHeight; return d; },
  async cmd(txt){ const d = term.line('', 'cmd'); if (reduce || (DEBUG && window.__fast)){ d.textContent = txt; return; } for (let i = 1; i <= txt.length; i++){ d.textContent = txt.slice(0, i); if (i % 3 === 0) sfx('blip'); await wait(16); } await wait(250); },
  extra(html){ $('textra').innerHTML = html; },
  buttons(list){
    return new Promise(res => { const row = $('trow'); row.innerHTML = '';
      list.forEach(([label, primary], i) => { const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
        b.addEventListener('click', () => { sfx('select'); row.innerHTML = ''; res(i); }); row.appendChild(b); });
      row.firstChild.focus({ preventScroll:true }); });
  },
};
function showKeep(){
  return new Promise(res => {
    let pick = null;
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Ton compte</p><h2>Où gardes-tu ta clé ?</h2><p>Ton fichier de clé (le « keystore ») et ton mot de passe. Sans les deux, ce compte est perdu pour toujours. Avec les deux, n'importe qui peut le vider.</p><div class="rules">${KEEP.map((k, i) => `<button class="rule radio" aria-pressed="false" data-k="${i}">${k}</button>`).join('')}</div><div class="row"><button class="btn primary" id="kOk" disabled>C'est décidé</button></div>`;
    modal.hidden = false; mcard.querySelector('.rule').focus({ preventScroll:true });
    mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => { sfx('select'); pick = +b.dataset.k; mcard.querySelectorAll('.rule').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('kOk').disabled = false; }));
    $('kOk').addEventListener('click', () => { closeModal(); res(pick); });
  });
}
function showSendFail(){
  return new Promise(res => {
    mcard.className = 'card';
    mcard.innerHTML = `<p class="eyebrow">Portable de Karim · 30 juillet 2015</p><h2>Envoyer 1 ETH</h2><ul class="txs"><li><span>À</span><b>${short(addr)}</b></li><li><span>Montant</span><b>1 ETH</b></li><li><span>Gaz nécessaire</span><b>21 000</b></li><li><span>Plafond de gaz d'un bloc</span><b>5 000</b></li></ul><div class="verdict ko"><span class="pill">Refusée</span>Cette transaction ne tient dans aucun bloc.</div><div class="row"><button class="btn primary" id="fOk">Hein ?</button></div>`;
    modal.hidden = false; sfx('fail'); $('fOk').focus({ preventScroll:true });
    $('fOk').addEventListener('click', () => { closeModal(); res(); });
  });
}
function showGasLimit(){
  return new Promise(res => {
    const LO = 18000, HI = 22000, pct = v => clamp((v - LO) / (HI - LO) * 100, 0, 100);
    let L = 19850, crossed = false, sent = false, blocks = 0, timer = null;
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Machine de Karim · vendredi 7 août 2015</p><h2>Le plafond monte</h2>
      <p>À chaque bloc, le mineur relève le plafond de gaz d'au plus 1/1024. Un simple envoi a besoin de 21 000.</p>
      <div class="meter big"><div class="fill" id="gFill"></div><i class="mark" style="left:${pct(21000)}%"><span>21 000</span></i></div>
      <p class="meter-legend"><span>Plafond du bloc : <b id="gVal"></b></span><span id="gBlocks"></span></p>
      <p class="gblock" id="gBlock"></p>
      <ul class="tradelog" id="gLog"></ul>
      <div class="row"><button class="btn primary" id="gSend">Envoyer l'ether de Karim (21 000 gaz)</button></div>
      <p class="small">Montée accélérée pour le jeu. Le plafond de 21 003 au bloc 46 147 est réel.</p>`;
    modal.hidden = false; $('gSend').focus({ preventScroll:true });
    const log = (txt, cls) => { const li = document.createElement('li'); li.textContent = txt; if (cls) li.className = cls; const ul = $('gLog'); ul.appendChild(li); while (ul.children.length > 4) ul.firstChild.remove(); };
    const draw = () => { $('gFill').style.width = pct(L) + '%'; $('gFill').classList.toggle('over', L < 21000); $('gVal').textContent = fmt(L); $('gBlocks').textContent = crossed ? '' : `+${blocks} blocs`; };
    const tick = () => {
      if (crossed) return;
      blocks++; L = L + Math.floor(L / 1024);
      if (L >= 21000){ L = 21003; crossed = true; clearInterval(timer); sfx('ledger');
        $('gBlock').textContent = 'Bloc 46 147 · 7 août 2015, 03:30:33 UTC';
        log('Plafond : 21 003. Une transaction y entre, tout juste : 21 000 gaz. Ce n’est pas celle de Karim. C’est la toute première du réseau.');
        learn('first');
        $('gSend').textContent = "Renvoyer l'ether de Karim"; }
      draw();
    };
    draw(); timer = setInterval(tick, DEBUG && window.__fast ? 5 : 120);
    $('gSend').addEventListener('click', () => {
      if (sent){ closeModal(); res(); return; }
      if (!crossed){ sfx('fail'); log(`Refusée : 21 000 ne tient pas dans ${fmt(L)}.`); return; }
      sent = true; sfx('gift'); log('Quelques blocs plus tard : incluse. 1 ETH arrive sur ton adresse.', 'ok');
      $('gSend').textContent = 'Continuer';
    });
  });
}
function fadeTo(txt){ const f = $('fade'); f.textContent = txt; f.classList.add('on'); return wait(reduce ? 200 : 1000); }
function fadeOut(){ $('fade').classList.remove('on'); return wait(reduce ? 100 : 900); }

/* ---------- chapitre 1 : Frontier ---------- */
async function chapter1(){
  resetWorld(); chap = 1; buildCache(); { const d = readSave(); chapterDone = d ? d.chapterDone : 0; } phase = 'intro'; lock = true; busy = true;
  setDate('Jeudi 30 juillet 2015 · 17:02'); track('Histoire lancée', { chapitre:1 });
  await wait(250);
  await walkTo(player, 800, 820, 220);
  player.face = -1;
  await say(null, "Jeudi 30 juillet 2015, fin d'après-midi. Un hackerspace à Paris, deux étages au-dessus d'une imprimerie. Ça sent le café froid et la soudure.");
  face(lena, player);
  await say('Lena', "Tu es venu ! Ce soir, Ethereum démarre pour de vrai. Pas un réseau de test : le vrai, celui qui ne s'arrêtera plus.");
  await say('Lena', "L'été dernier, pendant la prévente, j'ai acheté des ethers avec des bitcoins. Deux mille ethers pour un bitcoin, les deux premières semaines.");
  $('carnetBtn').hidden = false; learn('presale');
  const c = await say('Lena', "Depuis un an, je n'ai rien d'autre qu'un petit fichier et un mot de passe.", ['Juste un fichier ?', 'Et si tu perds le mot de passe ?']);
  if (c === 0) await say('Lena', "Un fichier chiffré, oui. Mes ethers sont déjà inscrits dans le bloc zéro de la chaîne. Ce fichier contient la clé qui permet de les réclamer.");
  else await say('Lena', "Alors personne ne pourra m'aider. Pas de support, pas de « mot de passe oublié ». Je l'ai recopié à trois endroits, et je vérifie presque tous les soirs.");
  await say('Lena', "Va voir Karim, près de la machine qui ronronne. Il t'expliquera ce qu'on attend.");
  setObjective('Parle à Karim, près de la machine qui ronronne'); phase = 'karim'; free();
}
async function karimIntro(){
  lock = true; busy = true; face(karim, player);
  await say('Karim', "Salut ! Tu entends ce bruit ? Trois cartes graphiques. Cette nuit, elles vont calculer sans s'arrêter pour trouver des blocs. Chaque bloc trouvé rapporte 5 ethers à son mineur.");
  await say('Karim', "Mais d'abord, il faut une chaîne. Et personne ne va appuyer sur un bouton « lancer ». Chacun va fabriquer lui-même le bloc zéro, la genèse, sur sa propre machine.");
  const c = await say('Karim', "Si tout le monde obtient exactement le même bloc zéro, on est tous sur la même chaîne. Sinon, non.", ['Comment tout le monde tombe d’accord ?', 'Pourquoi ne pas le télécharger ?']);
  const how = ["Le script de genèse est public. Il prend une donnée que personne ne connaît encore : l'empreinte d'un bloc futur du réseau de test, le numéro 1 028 201.", "Tant que ce bloc n'est pas miné, personne ne peut préparer sa genèse en avance. Pas même ceux qui ont écrit le code."];
  const why = ["Le télécharger, c'est faire confiance à celui qui te le donne. Si tu le fabriques toi-même et que tu tombes sur la même empreinte que les autres, tu n'as besoin de croire personne."];
  for (const l of (c === 0 ? [...how, ...why] : [...why, ...how])) await say('Karim', l);
  await say('Karim', "Le bloc 1 028 201 arrive dans quelques minutes. File à ton portable, sur la grande table.");
  setObjective('Fabrique le bloc zéro sur ton portable'); phase = 'genesis'; free();
}
async function genesisTerminal(){
  lock = true; busy = true;
  term.open('Ton portable · terminal');
  await term.cmd('python mk_genesis_block.py --extradata ???');
  term.line("Il manque l'empreinte du bloc 1 028 201 du réseau de test. Personne ne la connaît encore.", 'dim');
  const ctr = term.line('', 'big');
  for (let n = 1028189; n <= 1028201; n++){ ctr.textContent = `Réseau de test · bloc ${fmt(n)}`; sfx('blip'); await wait(reduce ? 60 : 360); }
  sfx('ledger');
  term.line('Bloc 1 028 201 miné. Son empreinte :');
  term.line(GENESIS_EXTRA, 'hash');
  learn('genesis');
  term.extra('<p class="chatmsg"><b>#ethereum</b> · un inconnu : « Pas le temps de lancer le script ? genesis_block.json tout prêt ici, vérifié, 100 % officiel. »</p>');
  const c = await term.buttons([['Lancer le script moi-même', true], ['Télécharger le fichier tout prêt']]);
  term.extra('');
  if (c === 1){
    ch1.downloaded = true;
    await term.cmd('wget http://…/genesis_block.json');
    term.line('genesis_block.json enregistré. Empreinte du bloc zéro :');
    term.line(FAKE_HASH, 'hash bad');
    await term.buttons([['Montrer à Lena', true]]);
    closeModal(); face(lena, player); face(player, lena);
    await say('Lena', "Fais voir… Ton bloc zéro commence par 0x5f3e. Le mien par 0xd4e5. Celui de Karim aussi.");
    await say('Lena', "Ce fichier te mettrait sur une autre chaîne que la nôtre, avec d'autres soldes dedans. Une blague ou un piège, on ne le saura jamais. Supprime-le et fabrique le tien : c'est tout l'intérêt du script.");
    closeDialog();
    term.open('Ton portable · terminal');
    await term.cmd('rm genesis_block.json');
  }
  await term.cmd(`python mk_genesis_block.py --extradata ${GENESIS_EXTRA} > genesis_block.json`);
  for (const s of ['Ajout des soldes de la prévente… ok', 'Calcul du bloc zéro… ok', 'Écriture de genesis_block.json… ok']){ await wait(reduce ? 80 : 520); term.line(s, 'dim'); }
  term.line('Empreinte de ton bloc zéro :');
  term.line(GENESIS_HASH, 'hash good');
  ch1.built = true; renderPanel();
  await term.buttons([['Comparer avec Lena et Karim', true]]);
  const sh = GENESIS_HASH.slice(0, 10) + '…' + GENESIS_HASH.slice(-6);
  term.extra(`<ul class="cmp">${['Toi', 'Lena', 'Karim'].map(n => `<li><b>${n}</b><code>${sh}</code><i>✓</i></li>`).join('')}</ul>`);
  term.line('Trois machines, trois fois le même bloc zéro. Personne ne l’a donné à personne.', 'ok');
  sfx('gift');
  await term.buttons([['Continuer', true]]);
  closeModal();
  face(karim, player);
  await say('Karim', "Même empreinte partout, parfait ! Crée ton compte et lance ton nœud. Il est 17 h 20 : le premier bloc ne va plus tarder.");
  setDate('Jeudi 30 juillet 2015 · 17:20');
  setObjective('Crée ton compte et lance ton nœud (portable)'); phase = 'node'; free();
}
async function nodeTerminal(){
  lock = true; busy = true;
  term.open('Ton portable · terminal');
  await term.cmd('geth account new');
  term.line('Your new account is locked with a password. Please give a password. Do not forget this password.', 'dim');
  term.line('Passphrase: ••••••••••••', 'dim'); term.line('Repeat passphrase: ••••••••••••', 'dim');
  await wait(400);
  term.line(`Address: {${addr.slice(2)}}`, 'ok');
  ch1.account = true; renderPanel();
  term.line("Ta clé est enregistrée dans un fichier, chiffré par ton mot de passe. Sans les deux, ce compte est perdu pour toujours.", 'note');
  await term.buttons([['Choisir où les garder', true]]);
  closeModal();
  let k = await showKeep();
  face(lena, player);
  for (;;){
    if (k === 2){ await say('Lena', "Le mot de passe sur papier chez toi, le fichier sur une clé USB : deux choses séparées, loin d'Internet. C'est aussi ce que j'ai fait."); break; }
    const txt = k === 0 ? "Un post-it sous l'écran ? Dans un hackerspace où passent vingt personnes par soir ? Le premier qui copie ton fichier et lit le post-it a ton compte."
      : "Un e-mail à toi-même… Le jour où ta boîte mail se fait pirater, le voleur trouve le fichier et le mot de passe au même endroit.";
    const r = await say('Lena', txt, ['Tu as raison, je change', 'Je garde comme ça']);
    if (r === 1){ await say('Lena', "C'est ton compte. Personne ne peut décider à ta place. Ni t'aider après coup."); break; }
    closeDialog(); ch1.keepChanged = true; k = await showKeep();
  }
  ch1.keep = k; renderPanel(); closeDialog();
  term.open('Ton portable · terminal');
  await term.cmd('geth --genesis genesis_block.json console');
  term.line('Nœud démarré. Recherche de pairs…', 'dim');
  const peers = term.line('', 'dim');
  for (let p = 1; p <= 9; p++){ peers.textContent = `Pairs connectés : ${p}`; await wait(reduce ? 40 : 220); }
  term.line('En attente du premier bloc…', 'dim');
  await wait(1100);
  setDate('Jeudi 30 juillet 2015 · 17:26');
  term.line('15:26 UTC · la chaîne démarre', 'ok'); sfx('ledger');
  for (let b = 1; b <= 4; b++){ await wait(reduce ? 100 : 700); term.line(`Bloc #${b} importé · 0 transaction`, 'dim'); }
  learn('launch');
  term.line('Les blocs arrivent, un par un. Ils sont tous vides.', 'note');
  await term.buttons([["Lever les yeux de l'écran", true]]);
  closeModal();
  await launchNight();
}
async function launchNight(){
  rig.on = true;
  await say(null, "17 h 26 à Paris, 15 h 26 à Greenwich. Pendant quelques secondes, personne ne parle. Puis tout le monde parle en même temps.");
  face(lena, player);
  await say('Lena', "À mon tour. Je vais enfin ouvrir mon fichier de prévente.");
  closeDialog();
  term.open('Portable de Lena');
  await term.cmd('geth wallet import presale.wallet');
  term.line('Passphrase: ••••••••••••••••', 'dim');
  await wait(900);
  term.line('Address: {…}', 'ok');
  term.line('Solde : ses ethers de la prévente, présents depuis le bloc zéro.', 'ok');
  ch1.lenaEth = true;
  await term.buttons([['Continuer', true]]);
  closeModal();
  await say('Lena', "Ils sont là. Ils y étaient depuis le début, dans le bloc zéro. Un an à regarder un fichier, et maintenant c'est… vrai.");
  closeDialog(); await wait(500);
  rig.flash = 1; sfx('grow'); floatText(1235, 560, '+5 ETH'); face(karim, player);
  await say('Karim', "J'en ai un ! Ma machine vient de trouver un bloc ! Cinq ethers, à moi, écrits dans la chaîne !");
  await say('Karim', "Attends, je t'en envoie un. Ton premier ether, pour fêter ça. Donne-moi ton adresse.");
  closeDialog();
  await showSendFail();
  await say('Karim', "Ah oui. J'avais oublié. C'est fait exprès.");
  learn('gas');
  await say('Lena', "Frontier démarre avec un plafond de 5 000 unités de gaz par bloc. Un simple envoi en demande 21 000. Donc personne ne peut rien envoyer, à personne.");
  const c = await say('Lena', "Les premiers jours servent à ça : laisser les mineurs s'installer, et vérifier que la chaîne tient debout.", ['Et ensuite ?', 'Ça va durer longtemps ?']);
  if (c === 1) await say('Lena', "Personne ne sait vraiment. Ça dépend des mineurs.");
  await say('Lena', "Ce sont eux qui relèvent le plafond. À chaque bloc, celui qui l'a trouvé peut le bouger d'un tout petit peu : un 1 024e, au maximum. De 5 000 à 21 000, il faut au moins 1 470 blocs d'affilée.");
  learn('rule');
  await say('Karim', "Moi, je ne bouge pas d'ici. Toi, va dormir un peu. Le canapé est libre.");
  setDate('Jeudi 30 juillet 2015 · 23:40');
  setObjective('Fais une pause sur le canapé'); phase = 'sleep'; free();
}
async function sleepWeek(){
  lock = true; busy = true;
  await walkTo(player, 360, 836, 220, true);
  sleeping = true;
  await fadeTo('Une semaine plus tard.');
  sky = 'dawn'; sleeping = false;
  Object.assign(player, { x:380, y:846, face:1, target:null });
  Object.assign(lena, { x:880, y:800, face:1 });
  Object.assign(karim, { x:1070, y:792, face:-1 });
  cat.sleep = false; Object.assign(cat, { x:980, y:850, face:-1 });
  setDate('Vendredi 7 août 2015 · 05:28');
  snapCam();
  await fadeOut();
  await say(null, "Une semaine a passé. Des dizaines de milliers de blocs, tous vides. Vendredi 7 août 2015, 5 h 28 du matin.");
  karim.gesture = true;
  await say('Karim', "Hé ! Réveille-toi ! Le plafond monte, on y est presque. Viens voir !");
  setObjective('Rejoins Karim à sa machine'); phase = 'thaw'; free();
}
async function thaw(){
  lock = true; busy = true; face(karim, player);
  await showGasLimit();
  ch1.eth = 1; renderPanel();
  await flyEth([karim.x, karim.y - 140 * persp(karim.y)], [player.x, player.y - 120 * persp(player.y)], 1.1);
  await say('Karim', "Ton premier ether. Pas le premier du monde, mais le tien.");
  face(lena, player);
  await say('Lena', "Et maintenant que les transactions passent, tout le monde va pouvoir construire. Des contrats, des jetons, des organisations entières écrites en code…");
  await say('Karim', "Tu dis ça comme si rien ne pouvait mal tourner.");
  await say('Lena', "Rien ne peut mal tourner. C'est du code.");
  closeDialog();
  chapterDone = Math.max(chapterDone, 1); phase = 'free'; setObjective(null);
  const saved = writeSave();
  track('Histoire chapitre fini', { chapitre:1, telecharge:ch1.downloaded, cle:ch1.keep });
  showEnd(saved);
}
function showEnd(saved){
  const keepTxt = ch1.keep === 2 ? 'Tu as rangé ton mot de passe sur papier et ton fichier sur une clé USB, séparément.' : `Tu as gardé ta clé ainsi : ${KEEP[ch1.keep].toLowerCase()}. ${ch1.keepChanged ? 'Tu avais pourtant changé d’avis une fois.' : 'Lena n’était pas d’accord.'}`;
  const you = [
    ch1.downloaded ? 'Tu as d’abord téléchargé un bloc zéro tout prêt. Il ne correspondait à celui de personne : tu as fini par fabriquer le tien.' : 'Tu as fabriqué ton bloc zéro toi-même, et il correspondait à celui des autres.',
    keepTxt, 'Tu as reçu ton premier ether, une semaine après le lancement.',
  ];
  const truth = FACT_ORDER1.map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  $('endCard').innerHTML = `<p class="eyebrow">Chapitre 1 terminé · Frontier</p><h2>La semaine où tout a démarré</h2>
    <p class="endsec">Ce que tu as fait</p><ul class="recap">${you.map(r => `<li>${r}</li>`).join('')}</ul>
    <p class="endsec">Ce qui s'est vraiment passé</p><ol class="truth">${truth}</ol>
    <p class="hint">Lena, Karim, Wei et le hackerspace sont inventés. Les dates, les blocs, les empreintes et les chiffres sont réels : <a href="https://ethereum.org/fr/history/" target="_blank" rel="noopener">ethereum.org/fr/history</a> · <a href="https://etherscan.io/block/0" target="_blank" rel="noopener">bloc 0</a> · <a href="https://etherscan.io/block/46147" target="_blank" rel="noopener">bloc 46 147</a>.</p>
    <p class="teaser"><b>Chapitre 2 · 2016, The DAO.</b> Un fonds d'investissement géré uniquement par du code, plus de 3,6 millions d'ethers siphonnés, et une question que personne n'avait prévue : a-t-on le droit de réécrire l'histoire ?</p>
    <div class="row"></div>${saved ? '<p class="hint">Progression sauvegardée sur cet appareil.</p>' : ''}`;
  const row = $('endCard').querySelector('.row');
  endButtons(1).forEach(([label, fn, primary]) => {
    const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}

/* ---------- chapitre 2 : The DAO (mai – juillet 2016) ---------- */
function showCode(){
  return new Promise(res => {
    const OPTS = ['Le solde est remis à zéro après l’envoi des ethers', 'Il n’y a pas de mot de passe', 'Le montant est mal calculé'];
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Portable de Karim · version simplifiée</p><h2>Ce qui chiffonne Karim</h2>
      <pre class="code">fonction retirer(qui) :
  montant = solde[qui]
  envoyer(montant, qui)
  solde[qui] = 0</pre>
      <p>Quand un contrat reçoit des ethers, il peut exécuter son propre code… y compris rappeler <code>retirer()</code> avant que la ligne suivante ne s'exécute.</p>
      <p><b>Qu'est-ce qui cloche ?</b></p>
      <div class="rules">${OPTS.map((o, i) => `<button class="rule radio" aria-pressed="false" data-o="${i}">${o}</button>`).join('')}</div>
      <div id="cVerdict"></div><div class="row" id="cRow"></div>`;
    modal.hidden = false; mcard.querySelector('.rule').focus({ preventScroll:true });
    mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => {
      if ($('cRow').firstChild) return;
      const ok = b.dataset.o === '0'; sfx(ok ? 'gift' : 'fail');
      mcard.querySelectorAll('.rule').forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.disabled = true; });
      $('cVerdict').innerHTML = `<div class="verdict ${ok ? 'ok' : 'ko'}"><span class="pill">${ok ? 'Bien vu' : 'Pas tout à fait'}</span>Le contrat envoie les ethers <b>avant</b> de mettre le solde à zéro. Un contrat malin peut rappeler <code>retirer()</code> pendant l'envoi, encore et encore : son solde n'a pas encore bougé. On appelle ça un appel récursif, ou « réentrance ».</div>`;
      const c = document.createElement('button'); c.className = 'btn primary'; c.textContent = 'Continuer'; $('cRow').appendChild(c); c.focus({ preventScroll:true });
      c.addEventListener('click', () => { closeModal(); res(ok); });
    }));
  });
}
function showDrain(){
  return new Promise(res => {
    const TOTAL = 11500000, TARGET = 3640000;
    let child = 0, calls = 0, timer = null, ended = false;
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Ton portable · vendredi 17 juin 2016</p><h2>Quelqu'un vide The DAO</h2>
      <div class="counters" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="pricey"><span>The DAO</span><b id="dDao"></b><small>ETH</small></div><div><span>« DAO enfant » de l'attaquant</span><b id="dChild"></b><small>ETH</small></div></div>
      <ul class="tradelog" id="dLog"></ul>
      <div class="row"><button class="btn primary" id="dStop">Arrêter ça</button></div>
      <p class="small">Animation. Chiffres réels : plus de 3,6 millions d'ETH, environ un tiers des 11,5 millions de The DAO.</p>`;
    modal.hidden = false; $('dStop').focus({ preventScroll:true });
    const log = t => { const li = document.createElement('li'); li.textContent = t; const ul = $('dLog'); ul.appendChild(li); while (ul.children.length > 4) ul.firstChild.remove(); };
    const draw = () => { $('dDao').textContent = fmt(Math.round((TOTAL - child) / 1000) * 1000); $('dChild').textContent = fmt(Math.round(child / 1000) * 1000); };
    draw();
    timer = setInterval(() => {
      calls++; child = Math.min(TARGET, child + 52000 + (calls % 3) * 9000); sfx('pop');
      if (calls % 9 === 0) log(`retirer() → retirer() → retirer()… appel n° ${calls}`);
      if (child >= TARGET){ clearInterval(timer); ended = true; sfx('theft'); $('dChild').textContent = '3,6 M+'; $('dDao').textContent = '≈ 7,9 M';
        log('Ça s’arrête. Plus de 3,6 millions d’ETH sont partis.'); learn('hack'); $('dStop').textContent = 'Continuer'; }
      else draw();
    }, DEBUG && window.__fast ? 5 : 110);
    $('dStop').addEventListener('click', () => {
      if (ended){ closeModal(); res(); return; }
      sfx('fail'); log('Impossible. Personne ne peut arrêter un contrat : il fait ce que son code permet.');
    });
  });
}
async function chapter2(d){
  resetWorld(); if (d) loadSave(d); chap = 2; buildCache();
  Object.assign(ch2, { invested:false, spotted:null, chain:null, heard:0 });
  sky = 'day'; rig.on = true; cat.sleep = true;
  Object.assign(karim, { x:1070, y:792, face:1 }); Object.assign(lena, { x:430, y:800, face:1 });
  phase = 'c2-intro'; lock = true; busy = true; snapCam();
  setDate('Mardi 17 mai 2016 · 18:40'); track('Histoire lancée', { chapitre:2 });
  $('carnetBtn').hidden = false; renderPanel();
  await wait(250);
  await walkTo(player, 800, 820, 220); player.face = -1;
  await say(null, "Mai 2016. Au hackerspace, le canapé a changé de place. La machine à café, non. La machine de Karim tourne toujours.");
  learn('homestead');
  face(lena, player);
  await say('Lena', "Tu tombes bien ! Tu as entendu parler de The DAO ? Un fonds d'investissement sans patron, sans bureau, sans banque. Juste un contrat sur Ethereum.");
  await say('Lena', "Tu envoies des ethers au contrat, tu reçois des jetons DAO. Ensuite, les détenteurs votent pour financer des projets. Le code fait tout le reste.");
  learn('daosale');
  const c = await say('Lena', "Depuis le 30 avril, tout le monde y met ses ethers. Une part énorme de tous les ethers qui existent !", ['Qui vérifie le code ?', 'Et si ça tourne mal ?']);
  if (c === 0) await say('Lena', "Des gens très sérieux l'ont relu. Et puis tout est public : n'importe qui peut le lire. S'il y avait un problème, quelqu'un l'aurait vu, non ?");
  else await say('Lena', "Qu'est-ce qui pourrait mal tourner ? Pas d'humain pour partir avec la caisse. Juste des règles écrites, que tout le monde peut lire.");
  if (ch1.keep === 0) await say('Lena', "Au fait… ton post-it est toujours sous ton écran. Je dis ça, je dis rien.");
  await say('Lena', "Karim n'est pas convaincu, évidemment. Va le voir, il te montrera ce qui le chiffonne.");
  setObjective('Demande à Karim ce qui le chiffonne'); phase = 'c2-karim'; free();
}
async function c2Karim(){
  lock = true; busy = true; face(karim, player);
  await say('Karim', "Lena veut que j'y mette mes ethers. Moi, je lis le code avant de confier mes ethers à quelqu'un. Même quand ce quelqu'un est un contrat.");
  if (ch1.downloaded) await say('Karim', "Tu te souviens de ton faux bloc zéro ? Même idée : on vérifie avant de faire confiance. Regarde ce bout-là.");
  else await say('Karim', "Regarde ce bout-là. Je l'ai simplifié, mais l'idée est la même.");
  closeDialog();
  ch2.spotted = await showCode();
  await say('Karim', ch2.spotted ? "Voilà. Tu l'as vu en dix secondes. Des gens en parlent sur les forums depuis des jours, et l'argent continue d'affluer." : "C'est subtil, hein ? Des gens en parlent sur les forums depuis des jours, et l'argent continue d'affluer.");
  const c = await say('Karim', "Et toi ? Tu y mets ton ether ?", ["J'y mets mon ether", 'Je le garde']);
  ch2.invested = c === 0;
  if (ch2.invested){
    await say('Karim', ch2.spotted ? "Même après avoir vu ça ? Bon. C'est ton ether." : "C'est ton ether. Je te souhaite d'avoir raison.");
    closeDialog();
    term.open('Ton portable · terminal');
    await term.cmd('envoyer 1 ETH → The DAO');
    await wait(500); term.line('Transaction incluse.', 'ok'); term.line('Reçu : des jetons DAO, à ton adresse.', 'ok');
    await term.buttons([['Continuer', true]]); closeModal();
    face(lena, player); await say('Lena', "Bienvenue parmi les propriétaires de The DAO !");
  } else await say('Karim', "Sage. On verra bien qui avait raison.");
  renderPanel();
  closeDialog(); await c2June();
}
async function c2June(){
  await fadeTo('Un mois plus tard.');
  setDate('Vendredi 17 juin 2016 · 10:05');
  Object.assign(player, { x:640, y:820, face:1, target:null }); Object.assign(lena, { x:430, y:800, face:1 }); Object.assign(karim, { x:880, y:790, face:-1 });
  snapCam(); await fadeOut();
  karim.gesture = true;
  await say('Karim', "Tu as vu ?! Quelqu'un est en train de vider The DAO. En ce moment même ! Regarde sur ton portable !");
  setObjective('Regarde ce qui se passe (portable)'); phase = 'c2-drain'; free();
}
async function c2Drain(){
  lock = true; busy = true;
  await showDrain();
  face(lena, player);
  await say('Lena', ch2.invested ? "Nos ethers… Ton ether aussi. C'était censé être le code qui décide. Et le code a décidé." : "C'était censé être le code qui décide. Et le code a décidé.");
  await say('Karim', "Envoyer d'abord, remettre le solde à zéro ensuite. Exactement ce qu'on a vu.");
  await say('Karim', "Il y a quand même une bonne nouvelle : les ethers sont coincés dans une DAO enfant. Le voleur ne peut rien retirer avant environ 27 jours.");
  learn('delay');
  await say('Lena', "27 jours pour décider quoi faire.");
  closeDialog();
  await fadeTo('Le 20 juillet 2016.');
  sky = 'day'; setDate('Mercredi 20 juillet 2016 · 15:05');
  Object.assign(player, { x:800, y:840, face:-1, target:null }); Object.assign(lena, { x:520, y:810, face:1 }); Object.assign(karim, { x:1040, y:800, face:-1 }); cat.sleep = false; Object.assign(cat, { x:760, y:860, face:1 });
  snapCam(); await fadeOut();
  await say(null, "20 juillet 2016, en début d'après-midi. Le bloc 1 920 000 approche. Ce soir, il y aura peut-être deux Ethereum.");
  await say('Karim', "Le soft fork, celui qui devait juste geler les ethers volés, est tombé à l'eau fin juin : quelqu'un y a trouvé une faille. Il ne reste que le hard fork.");
  learn('softfork');
  await say('Lena', "Au bloc 1 920 000, les nœuds qui acceptent le fork déplaceront les ethers de The DAO vers un contrat de remboursement. Chacun pourra récupérer ce qu'il a mis.");
  await say('Karim', "Et ceux qui refusent resteront sur la chaîne d'origine. Celle où ce qui est écrit reste écrit.");
  phase = 'c2-debate'; closeDialog();
  await c2Debate();
}
async function c2Debate(){
  lock = true; busy = true;
  const said = new Set();
  for (;;){
    const opts = ['Lena, pourquoi forker ?', 'Karim, pourquoi refuser ?'];
    const c = await say(null, "Lena et Karim se regardent. Chacun attend que tu poses ta question.", said.size >= 2 ? [...opts, 'J’ai assez entendu'] : opts);
    if (c === 2) break;
    said.add(c);
    if (c === 0){ face(lena, player);
      await say('Lena', "Parce que c'est un vol, tout simplement. Si on peut le réparer, pourquoi le laisser faire ? Une communauté a le droit de corriger une erreur aussi grosse.");
      await say('Lena', "Et on ne touche qu'aux contrats de The DAO. Aucun autre solde ne bouge.");
    } else { face(karim, player);
      await say('Karim', "Parce que la promesse d'Ethereum, c'est que personne ne peut changer les règles après coup. Si on le fait une fois pour The DAO, qui décidera de la prochaine fois ?");
      await say('Karim', "Le contrat a fait ce que son code disait. C'est dur, mais c'est ça, « le code fait loi ».");
    }
  }
  ch2.heard = said.size;
  face(lena, player);
  await say('Lena', "Ton nœud, ton choix. Personne ne peut le faire à ta place. Ni Karim, ni moi.");
  setObjective('Choisis quelle chaîne suit ton nœud (portable)'); phase = 'c2-fork'; free();
}
async function c2Fork(){
  lock = true; busy = true;
  term.open('Ton portable · terminal');
  term.line('Geth 1.4.10 propose deux options. Ton nœud suivra la chaîne que tu choisis.', 'note');
  term.extra('<p class="chatmsg"><b>--support-dao-fork</b> : au bloc 1 920 000, déplacer les ethers de The DAO vers le contrat de remboursement.<br><b>--oppose-dao-fork</b> : ne rien changer, rester sur la chaîne d’origine.</p>');
  const c = await term.buttons([['geth --support-dao-fork', true], ['geth --oppose-dao-fork', true]]);
  term.extra('');
  ch2.chain = c === 0 ? 'eth' : 'etc';
  await term.cmd(c === 0 ? 'geth --support-dao-fork' : 'geth --oppose-dao-fork');
  const ctr = term.line('', 'big');
  for (let n = 1919994; n <= 1920000; n++){ ctr.textContent = `Bloc ${fmt(n)}`; sfx('blip'); await wait(reduce ? 80 : 520); }
  sfx('ledger'); setDate('Mercredi 20 juillet 2016 · 15:20');
  term.line('Bloc 1 920 000 · 20 juillet 2016, 13:20:40 UTC', 'ok');
  if (c === 0){ term.line("≈ 12 millions d'ETH déplacés des contrats de The DAO vers le contrat de récupération.", 'ok'); term.line('Ton nœud suit la chaîne modifiée : Ethereum.', 'dim'); }
  else { term.line('Aucun changement. Ton nœud suit la chaîne d’origine : Ethereum Classic.', 'ok'); term.line("Les ethers de The DAO restent là où le code les a mis.", 'dim'); }
  learn('fork');
  term.line('À cet instant, chaque solde existe sur les deux chaînes. Ton ether aussi.', 'note');
  learn('etc');
  renderPanel();
  await term.buttons([["Lever les yeux de l'écran", true]]);
  closeModal();
  await c2After();
}
async function c2After(){
  const eth = ch2.chain === 'eth';
  await say(null, "Le bloc 1 920 000 est passé. Dans la pièce, deux écrans ne montrent plus la même chaîne.");
  face(karim, player);
  if (eth) await say('Karim', "Tu es avec Lena, alors. Je ne t'en veux pas. Ma machine, elle, reste sur l'ancienne chaîne. On ne sera pas nombreux.");
  else await say('Karim', "Bienvenue sur la chaîne d'origine. On ne sera pas nombreux, mais on sera là.");
  face(lena, player);
  await say('Lena', "Presque tous les mineurs sont passés du côté du fork. Mais Karim a raison sur un point : la chaîne d'origine ne va pas disparaître.");
  if (ch2.invested) await say(eth ? 'Lena' : 'Karim', eth ? "Et tes jetons DAO : tu vas pouvoir récupérer ton ether dans le contrat de remboursement." : "Tes jetons DAO, sur cette chaîne… Rien n'a bougé. Ton ether reste dans The DAO, soumis à son code. Le code a parlé.");
  await say('Lena', "Karim… on reste amis ?");
  await say('Karim', "On a juste choisi deux histoires différentes. Toi et moi, on reste dans la même.");
  closeDialog();
  chapterDone = Math.max(chapterDone, 2); phase = 'free'; setObjective(null);
  const saved = writeSave();
  track('Histoire chapitre fini', { chapitre:2, investi:ch2.invested, faille:ch2.spotted, chaine:ch2.chain });
  showEnd2(saved);
}
function showEnd2(saved){
  const eth = ch2.chain === 'eth';
  const you = [
    ch2.spotted ? 'Tu as repéré la faille du code de The DAO avant qu’elle ne soit exploitée.' : 'La faille du code t’a échappé. Elle a échappé à beaucoup de monde.',
    ch2.invested ? (eth ? 'Tu avais mis ton ether dans The DAO. Avec le fork, tu as pu le récupérer.' : 'Tu avais mis ton ether dans The DAO. Sur la chaîne d’origine, il est resté soumis à son code.') : 'Tu as gardé ton ether hors de The DAO.',
    ch2.heard >= 2 ? 'Tu as écouté les deux camps avant de décider.' : 'Tu as décidé sans entendre les deux camps.',
    eth ? 'Ton nœud a suivi le fork : tu es sur Ethereum, comme la grande majorité.' : 'Ton nœud a refusé le fork : tu es sur Ethereum Classic, avec la minorité qui voulait que rien ne change.',
  ];
  const truth = FACT_ORDER2.map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  $('endCard').innerHTML = `<p class="eyebrow">Chapitre 2 terminé · The DAO</p><h2>L'été où la chaîne s'est séparée</h2>
    <p class="endsec">Ce que tu as fait</p><ul class="recap">${you.map(r => `<li>${r}</li>`).join('')}</ul>
    <p class="endsec">Ce qui s'est vraiment passé</p><ol class="truth">${truth}</ol>
    <p class="hint">Il n'y a pas de bonne réponse : les deux chaînes existent toujours, et le débat entre « corriger une injustice » et « ne jamais réécrire l'histoire » n'est pas clos. Lena, Karim et Wei sont inventés, les faits sont réels : <a href="https://ethereum.org/fr/history/" target="_blank" rel="noopener">ethereum.org/fr/history</a> · <a href="https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability" target="_blank" rel="noopener">alerte du 17 juin</a> · <a href="https://blog.ethereum.org/2016/07/20/hard-fork-completed" target="_blank" rel="noopener">fork du 20 juillet</a>.</p>
    <p class="teaser"><b>Chapitre 3 · 2017, la ruée des ICO.</b> Tout le monde lance son jeton, des chats numériques bloquent le réseau, et un portefeuille gèle des centaines de milliers d'ethers d'un seul clic.</p>
    <div class="row"></div>${saved ? '<p class="hint">Progression sauvegardée sur cet appareil.</p>' : ''}`;
  const row = $('endCard').querySelector('.row');
  endButtons(2).forEach(([label, fn, primary]) => {
    const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}
const TALK2 = {
  lena(){
    const L = { 'c2-karim':"Va voir Karim. Il va encore me dire que je suis trop confiante.", 'c2-drain':"Regarde sur ton portable. Je n'arrive pas à y croire.", 'c2-fork':"Ton nœud, ton choix. Personne ne peut le faire à ta place.",
      free:ch2.chain === 'etc' ? "Tu as choisi l'autre chaîne. Ça ne change rien entre nous. Enfin, presque rien." : "Tu sais ce qui me fait peur, maintenant ? La prochaine fois qu'on voudra corriger quelque chose, on se souviendra qu'on l'a déjà fait." };
    face(lena, player); return chat([['Lena', L[phase] || L.free]]);
  },
  karim(){
    if (phase === 'c2-karim') return c2Karim();
    const L = { 'c2-drain':"Ton portable ! Regarde !", 'c2-fork':"Moi, j'ai déjà choisi. Toi, c'est sur ton portable que ça se passe.",
      free:ch2.chain === 'etc' ? "Ma machine mine sur la chaîne d'origine. Il y a de la place, crois-moi." : "Ma machine reste sur la chaîne d'origine. Il faut bien que quelqu'un la fasse tourner." };
    face(karim, player); return chat([['Karim', L[phase] || L.free]]);
  },
  laptop(){
    if (phase === 'c2-drain') return c2Drain();
    if (phase === 'c2-fork') return c2Fork();
    if (phase === 'c2-intro' || phase === 'c2-karim') return chat([[null, "Ton portable. Sur l'écran, des dizaines d'onglets ouverts sur The DAO."]]);
    return chat([[null, ch2.chain === 'etc' ? "Ton portable. Ton nœud suit Ethereum Classic, la chaîne d'origine." : "Ton portable. Ton nœud suit Ethereum, la chaîne avec le fork."]]);
  },
  board(){ return chat([[null, "Au tableau, quelqu'un a écrit « retirer() : 1. envoyer, 2. solde = 0 » et ajouté « ?! » en rouge. En dessous : « #1 920 000 », et « ETH | ETC ? »."]]); },
  window(){ return chat([[null, "Plein été sur les toits. Dehors, personne ne sait qu'une chaîne est en train de se couper en deux."]]); },
  rig(){ return chat([[null, "La machine de Karim. Il a collé une étiquette dessus, écrite à la main : « code is law »."]]); },
  sofa(){ return chat([[null, "Le canapé a changé de place, mais c'est toujours le même. Quelqu'un y a oublié un t-shirt « The DAO »."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei ne sait pas ce qu'est un fork. Il a l'air parfaitement heureux."]]); },
};

/* ---------- outils communs aux chapitres 3 à 7 ---------- */
let goal = null; // qui porte le losange de l'objectif : 'lena', 'karim', 'laptop', 'sofa', 'newbie', 'rig'
function aim(txt, target, ph){ setObjective(txt); goal = target; phase = ph; free(); }
function place(list){ for (const [e, x, y, f] of list) Object.assign(e, { x, y, face:f == null ? e.face : f, target:null, moving:false }); }
async function skip(label, date, sk, pos){ closeDialog(); await fadeTo(label); setDate(date); if (sk) sky = sk; if (pos) place(pos); snapCam(); await fadeOut(); }
function decor(n){ sky = 'day'; rig.on = n < 6; rig.retired = n >= 7; cat.sleep = false; Object.assign(cat, { x:1372, y:800, face:-1 }); newbie.vis = false; }
async function startChapter(n, d){
  resetWorld(); if (d) loadSave(d); chap = n; buildCache(); decor(n);
  for (const k of Object.keys(CHS[n])) delete CHS[n][k];
  place([[lena, 430, 800, 1], [karim, 1070, 792, 1]]);
  $('carnetBtn').hidden = false; renderPanel();
  phase = `c${n}-intro`; lock = true; busy = true; goal = null; snapCam();
  track('Histoire lancée', { chapitre:n });
  await wait(250);
  await walkTo(player, 800, 820, 220); player.face = -1;
}
function modalCard(html, wide = true){ mcard.className = wide ? 'card wide' : 'card'; mcard.innerHTML = html; modal.hidden = false; const f = mcard.querySelector('button:not([disabled])'); if (f) f.focus({ preventScroll:true }); }
function doneBtn(label, res, val){ const row = $('mRow'); row.innerHTML = ''; const b = document.createElement('button'); b.className = 'btn primary'; b.id = 'mDone'; b.textContent = label; row.appendChild(b); b.focus({ preventScroll:true }); b.addEventListener('click', () => { closeModal(); res(val); }); }
const mlog = (id, txt, cls) => { const li = document.createElement('li'); li.textContent = txt; if (cls) li.className = cls; const ul = $(id); ul.appendChild(li); while (ul.children.length > 5) ul.firstChild.remove(); };
const tickMs = ms => DEBUG && window.__fast ? 5 : ms;

/* sélection multiple : repérer les signaux d'alerte */
function showFlags(o){
  return new Promise(res => {
    modalCard(`<p class="eyebrow">${o.eyebrow}</p><h2>${o.title}</h2><p>${o.intro}</p>
      <div class="rules">${o.items.map((it, i) => `<button class="rule" aria-pressed="false" data-i="${i}">${it[0]}</button>`).join('')}</div>
      <div id="fVerdict"></div><div class="row" id="mRow"><button class="btn primary" id="mGo">${o.go}</button></div>`);
    mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => { if (b.disabled) return; sfx('select'); b.setAttribute('aria-pressed', String(b.getAttribute('aria-pressed') !== 'true')); }));
    $('mGo').addEventListener('click', () => {
      let good = 0, wrong = 0;
      mcard.querySelectorAll('.rule').forEach(b => { const it = o.items[+b.dataset.i], on = b.getAttribute('aria-pressed') === 'true'; b.disabled = true;
        if (it[1] && on) good++; if (!it[1] && on) wrong++; if (it[1]) b.classList.add('shady'); });
      const total = o.items.filter(it => it[1]).length; sfx(good === total && !wrong ? 'gift' : 'select');
      $('fVerdict').innerHTML = `<div class="verdict ${good === total && !wrong ? 'ok' : 'ko'}"><span class="pill">${good} / ${total}</span>${o.explain}</div>`;
      doneBtn('Continuer', res, { good, wrong, total });
    });
  });
}

/* ---------- chapitre 3 : 2017, la ruée ---------- */
function showGasAuction(){
  return new Promise(res => {
    const PRICES = [1, 4, 20, 50];
    let mine = null, blocks = 0, included = false, bumps = 0, timer = null;
    modalCard(`<p class="eyebrow">Ton portable · mardi 5 décembre 2017</p><h2>Rembourser Lena : 0,1 ETH</h2>
      <p>Le réseau est saturé. Chaque bloc prend les transactions qui paient le plus cher le gaz : c'est une enchère. Choisis ton prix du gaz.</p>
      <div class="tips rules" style="grid-template-columns:repeat(4,1fr)">${PRICES.map(p => `<button class="rule radio act" aria-pressed="false" data-p="${p}">${p} gwei</button>`).join('')}</div>
      <p class="meter-legend"><span>Prix le plus bas accepté dans le dernier bloc : <b id="aMin">—</b></span><span id="aState">Pas encore envoyée</span></p>
      <ul class="tradelog" id="aLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration : les prix changeaient d'un bloc à l'autre. En décembre 2017, CryptoKitties représentait à lui seul environ un quart du trafic d'Ethereum.</p>`);
    const floor = () => 14 + Math.round(Math.abs(Math.sin(blocks * 1.7)) * 16);
    mcard.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      if (included) return; sfx('select'); const p = +b.dataset.p;
      if (mine != null && p <= mine) return; if (mine != null) bumps++;
      mine = p; mcard.querySelectorAll('[data-p]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('aState').textContent = `Envoyée à ${p} gwei · en attente`;
      mlog('aLog', mine > 4 && bumps ? `Tu remplaces ta transaction : même contenu, prix plus haut (${p} gwei).` : `Transaction envoyée à ${p} gwei.`);
      if (!timer) timer = setInterval(tick, tickMs(900));
    }));
    const tick = () => {
      blocks++; const f = floor(); $('aMin').textContent = f + ' gwei';
      if (mine >= f){ included = true; clearInterval(timer); sfx('ledger'); $('aState').textContent = 'Incluse ✓';
        mlog('aLog', `Bloc suivant : incluse. Tu as payé ${mine} gwei par unité de gaz${mine >= 50 ? ', bien plus que nécessaire.' : '.'}`, 'ok');
        CHS[3].gas = mine; CHS[3].bumps = bumps; mcard.querySelectorAll('[data-p]').forEach(x => { x.disabled = true; }); doneBtn('Continuer', res); }
      else mlog('aLog', `Nouveau bloc : les transactions à ${f} gwei et plus passent. La tienne (${mine}) attend.`);
    };
  });
}
async function chapter3(d){
  await startChapter(3, d);
  setDate('Jeudi 20 juillet 2017 · 19:10');
  await say(null, "Été 2017. Le hackerspace a une nouvelle machine à café, et une caisse commune : un portefeuille multisig Parity, qui demande deux signatures sur trois pour dépenser.");
  face(karim, player); karim.gesture = true;
  await say('Karim', "Tu as vu, hier ? Quelqu'un a vidé des portefeuilles multisig Parity. 153 037 ethers. Les mêmes portefeuilles que notre caisse commune.");
  learn('parityhack');
  await say('Karim', "Nous, on n'a rien perdu. Parity a corrigé le code et l'a redéployé dès le lendemain. Mais je n'aime pas ça.");
  face(lena, player);
  await say('Lena', "Pendant ce temps, tout le monde lance son jeton. Il suffit d'un contrat ERC-20, d'un site et d'un « white paper ». Regarde ce qu'on m'a envoyé.");
  learn('erc20');
  aim('Lis le white paper que Lena a reçu (Lena)', 'lena', 'c3-paper');
}
async function c3Paper(){
  lock = true; busy = true; closeDialog(); goal = null;
  const r = await showFlags({ eyebrow:'White paper · « NUAGE », le jeton du cloud décentralisé (inventé)', title:'Repère les signaux d’alerte', intro:'Sélectionne tout ce qui devrait te faire hésiter, puis vérifie.',
    items:[['Rendement annoncé : x10 en trois mois', true], ['Équipe anonyme, « pour des raisons de sécurité »', true], ['Le code du contrat de vente est publié', false], ['Le produit arrive « bientôt ». La vente, elle, c’est maintenant', true], ['Jeton au standard ERC-20', false], ['Bonus de 40 % si tu achètes dans l’heure', true]],
    go:'Vérifier', explain:'Un rendement promis, une équipe qu’on ne peut pas retrouver, un produit qui n’existe pas encore et une pression pour acheter vite : les quatre signaux classiques. Qu’un contrat soit publié ou au standard ERC-20 ne dit rien de l’honnêteté du projet.' });
  CHS[3].flags = r.good;
  const c = await say('Lena', r.good >= 3 ? "Tu as l'œil. Bon… et si c'était quand même le prochain grand projet ?" : "Tu as raté des signaux, mais franchement, moi aussi au début. Alors, on y va ?", ['J’y mets un peu d’ether', 'Je passe mon tour']);
  CHS[3].ico = c === 0;
  if (c === 0) await say('Lena', "Un peu seulement, hein. On verra bien ce que devient NUAGE.");
  else await say('Lena', "Tu as sans doute raison. Il y en a trois nouveaux par jour.");
  await skip('Trois mois plus tard.', 'Lundi 16 octobre 2017 · 09:30', 'day', [[player, 900, 830, 1], [karim, 1070, 792, -1]]);
  face(karim, player);
  await say('Karim', "Ce matin, bloc 4 370 000 : Byzantium. Ma machine touche 3 ethers par bloc au lieu de 5. Ça fait bizarre.");
  learn('byzantium');
  if (CHS[3].ico) await say('Karim', "Et ton NUAGE ? Le site ne répond plus depuis une semaine. L'équipe anonyme est… restée anonyme.");
  await skip('Trois semaines plus tard.', 'Mardi 7 novembre 2017 · 18:45', 'evening', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 700, 800, 1]]);
  karim.gesture = true;
  await say('Karim', "La caisse du hackerspace est bloquée. Pas volée : bloquée. Pour toujours, peut-être.");
  aim('Demande à Karim ce qui s’est passé', 'karim', 'c3-parity');
}
async function c3Parity(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "Hier, quelqu'un a trouvé la bibliothèque de code dont dépendent tous les multisigs Parity. Elle n'avait jamais été initialisée. Il l'a initialisée : il en est devenu le propriétaire.");
  await say('Karim', "Puis il a appelé sa fonction « kill ». La bibliothèque s'est autodétruite. Les portefeuilles qui s'en servaient ne savent plus rien faire. Ils ne peuvent plus envoyer un seul ether.");
  learn('parityfreeze');
  await say('Karim', "513 774 ethers, dans 587 portefeuilles. Et notre caisse. Il a écrit qu'il ne l'avait pas fait exprès.");
  const c = await say('Lena', "Il y a des gens qui parlent de faire un fork, comme pour The DAO.", ['Un fork réglerait le problème', 'On ne peut pas forker à chaque accident']);
  CHS[3].fork = c === 0;
  if (ch2.chain === 'etc') await say('Karim', "Toi qui avais choisi la chaîne d'origine… tu sais ce que ça fait, quand le code a parlé.");
  await say('Karim', c === 0 ? "Peut-être. Mais cette fois, il n'y a pas de voleur à rattraper, pas de délai de 27 jours. Juste une erreur. Je doute que la communauté accepte." : "C'est ce que je pense aussi. Même quand ça me coûte.");
  await say('Lena', "On fera une nouvelle caisse. Avec un contrat qu'on lira jusqu'au bout, cette fois.");
  await skip('Un mois plus tard.', 'Mardi 5 décembre 2017 · 21:00', 'evening', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Tout le réseau est bouché. Des gens élèvent des chats numériques sur Ethereum, CryptoKitties, et ça représente un quart du trafic !");
  learn('kitties');
  await say('Lena', "Et toi, tu me dois 0,1 ether pour les pizzas de la semaine dernière. Bon courage pour me rembourser ce soir.");
  aim('Rembourse Lena (portable)', 'laptop', 'c3-gas');
}
async function c3Gas(){
  lock = true; busy = true; goal = null;
  await showGasAuction();
  face(lena, player);
  await say('Lena', CHS[3].gas >= 50 ? "Reçu ! Tu as payé les frais au prix fort, mais au moins c'est passé." : "Reçu ! Tu as trouvé le bon prix. Un jour, il faudra une meilleure façon de fixer les frais qu'une enchère à l'aveugle.");
  await say('Karim', "Moi, je retiens une chose de cette année : le code qu'on ne lit pas finit toujours par coûter cher.");
  await say(null, "Wei s'étire sur la machine de Karim. Lui ne sera jamais un chat numérique.");
  endChapter(3, { eyebrow:'Chapitre 3 terminé · 2017', title:'L’année où tout le monde voulait son jeton',
    you:[
      CHS[3].flags >= 3 ? `Tu as repéré ${CHS[3].flags} signaux d’alerte sur 4 dans le white paper.` : `Tu n’as repéré que ${CHS[3].flags} signal(aux) d’alerte sur 4.`,
      CHS[3].ico ? 'Tu as quand même mis un peu d’ether dans NUAGE. Son site a disparu en trois mois.' : 'Tu es passé à côté de NUAGE. Tant mieux.',
      CHS[3].fork ? 'Pour la caisse bloquée, tu aurais voulu un fork. Il n’y en a pas eu.' : 'Pour la caisse bloquée, tu as accepté qu’on ne forke pas à chaque accident.',
      `Tu as remboursé Lena en pleine folie CryptoKitties, à ${CHS[3].gas} gwei.`,
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['post-mortem de Parity', 'https://medium.com/paritytech/a-postmortem-on-the-parity-multi-sig-library-self-destruct-63daca3a4cf7']],
    note:'NUAGE est inventé, comme Lena, Karim, Wei et la caisse du hackerspace. Les événements et les chiffres sont réels.',
    teaser:'<b>Chapitre 4 · 2020, l’été de la DeFi.</b> Un krach éclair, des coffres liquidés pour zéro, et un été où tout le monde « cultive » des jetons.',
    track:{ ico:CHS[3].ico, flags:CHS[3].flags } });
}
const TALK3 = {
  lena(){ if (phase === 'c3-paper') return c3Paper(); face(lena, player); return chat([['Lena', { 'c3-parity':"Karim est dans tous ses états. Va le voir.", 'c3-gas':"J'attends mes 0,1 ether ! Ton portable est sur la table." }[phase] || "Tout le monde parle de jetons. Presque personne ne parle de ce qu'ils servent à faire."]]); },
  karim(){ if (phase === 'c3-parity') return c3Parity(); face(karim, player); return chat([['Karim', { 'c3-paper':"Lena veut te montrer un white paper. Prépare-toi à rire. Ou à pleurer.", 'c3-gas':"Même moi, je n'arrive pas à faire passer mes transactions ce soir." }[phase] || "Trois ethers par bloc depuis Byzantium. Ma machine ne va pas m'enrichir, mais elle tient le réseau."]]); },
  laptop(){ if (phase === 'c3-gas') return c3Gas(); return chat([[null, "Ton portable. Des dizaines d'onglets : des sites de jetons, des forums, un tableau de prix du gaz."]]); },
  rig(){ return chat([[null, "La machine de Karim. Une étiquette « code is law » un peu décollée, et un post-it neuf : « lire le code jusqu'au bout »."]]); },
  board(){ return chat([[null, "Au tableau : « ICO = ? », « white paper ≠ code », et un calcul du prix du gaz barré trois fois."]]); },
  window(){ return chat([[null, sky === 'evening' ? "Les lumières de Paris s'allument. Quelque part, quelqu'un achète un chat numérique très cher." : "Les toits de Paris. Rien n'a changé dehors, tout a changé dedans."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei, génération zéro. Pas à vendre."]]); },
};

/* ---------- chapitre 4 : 2020, l'été de la DeFi ---------- */
function showVault(){
  return new Promise(res => {
    const COLL0 = 10, DEBT0 = 800, MIN = 1.5;
    const PATH = [197, 194, 190, 184, 178, 171, 165, 160, 152, 147, 141, 136, 131, 128, 124, 121, 118, 114, 112, 110, 108, 104, 101, 99, 97, 95, 94, 92, 91, 90, 89];
    let t = 0, coll = COLL0, debt = DEBT0, pending = null, liquidated = false, timer = null, acted = null;
    modalCard(`<p class="eyebrow">Coffre Maker de Lena · jeudi 12 mars 2020</p><h2>Le prix de l'ether s'effondre</h2>
      <p>Lena a déposé ${COLL0} ETH et emprunté ${DEBT0} DAI. Si la valeur de ses ethers passe sous 150 % de sa dette, le coffre est liquidé. Le réseau est saturé : une transaction « normale » peut mettre très longtemps.</p>
      <div class="counters"><div><span>Prix de l'ETH</span><b id="vP"></b><small>$</small></div><div id="vRc"><span>Ratio du coffre</span><b id="vR"></b><small>minimum 150 %</small></div><div><span>Liquidation si l'ETH passe sous</span><b id="vL"></b><small>$</small></div></div>
      <div class="row" id="vAct">
        <button class="btn act" data-a="add" data-g="fast">Ajouter 5 ETH · gaz rapide</button>
        <button class="btn act" data-a="add" data-g="slow">Ajouter 5 ETH · gaz normal</button>
        <button class="btn act" data-a="repay" data-g="fast">Rembourser 400 DAI · gaz rapide</button>
      </div>
      <ul class="tradelog" id="vLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration : le prix réel est passé d'environ 197 $ à 89 $ en moins de 36 heures. Le coffre de Lena est inventé.</p>`);
    const liqP = () => debt * MIN / coll;
    const draw = () => { const p = PATH[Math.min(t, PATH.length - 1)], r = coll * p / debt; $('vP').textContent = p; $('vR').textContent = liquidated ? '—' : Math.round(r * 100) + ' %'; $('vL').textContent = Math.round(liqP()); $('vRc').className = r < 1.75 ? 'pricey' : 'cheap'; };
    draw();
    mcard.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      if (pending || acted || liquidated) return; sfx('select');
      pending = { a:b.dataset.a, at:t + (b.dataset.g === 'fast' ? 3 : 16) }; acted = b.dataset.a + '-' + b.dataset.g;
      mcard.querySelectorAll('[data-a]').forEach(x => { x.disabled = true; });
      mlog('vLog', b.dataset.g === 'fast' ? 'Envoyée avec un prix du gaz élevé. Elle devrait passer vite.' : 'Envoyée au prix normal. Elle attend parmi des milliers d’autres…');
    }));
    const end = () => { clearInterval(timer); CHS[4].vault = liquidated ? 'liquidated' : 'saved'; CHS[4].action = acted || 'none'; doneBtn('Continuer', res); };
    timer = setInterval(() => {
      t++; const p = PATH[Math.min(t, PATH.length - 1)];
      if (pending && t >= pending.at){ if (pending.a === 'add') coll += 5; else debt -= 400; sfx('ledger'); mlog('vLog', pending.a === 'add' ? 'Incluse : 5 ETH ajoutés au coffre.' : 'Incluse : 400 DAI remboursés.', 'ok'); pending = null; }
      if (!liquidated && p < liqP()){ liquidated = true; sfx('theft'); mlog('vLog', `Liquidé à ${p} $. Les ethers de Lena partent aux enchères… et un robot les emporte pour 0 DAI.`, 'ko'); }
      draw();
      if (t >= PATH.length - 1){ if (!liquidated) mlog('vLog', 'Le prix touche 89 $. Le coffre tient.', 'ok'); end(); }
    }, tickMs(550));
  });
}
async function chapter4(d){
  await startChapter(4, d);
  setDate('Jeudi 12 mars 2020 · 17:40'); sky = 'evening';
  await say(null, "Mars 2020. On parle d'un virus, de confinement, de fermer le hackerspace. Et ce soir, tous les marchés tombent en même temps.");
  face(lena, player); lena.gesture = true;
  await say('Lena', "Mon coffre Maker ! J'ai mis 10 ethers en garantie pour emprunter 800 DAI. Si l'ether continue de tomber, il sera liquidé. Aide-moi, vite !");
  aim('Aide Lena à sauver son coffre (portable)', 'laptop', 'c4-vault');
}
async function c4Vault(){
  lock = true; busy = true; goal = null;
  await showVault();
  learn('blackthursday');
  face(lena, player);
  if (CHS[4].vault === 'saved') await say('Lena', "Il a tenu… Merci. D'autres n'ont pas eu cette chance : le réseau était si saturé que des robots ont remporté des enchères de liquidation pour zéro DAI.");
  else await say('Lena', "Liquidé. Et tu sais le pire ? Le réseau était si saturé que des robots ont remporté des enchères de liquidation pour zéro DAI. Mes ethers sont partis pour rien.");
  await say('Karim', "8,32 millions de dollars d'ethers, emportés pour zéro. Le code a fait exactement ce qu'on lui avait dit. Personne n'avait prévu un réseau bouché.");
  await skip('Trois mois plus tard. Le hackerspace rouvre.', 'Lundi 22 juin 2020 · 18:15', 'day', [[player, 800, 830, 1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(karim, player);
  await say('Karim', "Depuis une semaine, Compound distribue un jeton, COMP, à ceux qui prêtent et empruntent chez eux. Tout le monde s'y met. On appelle ça « cultiver » des rendements.");
  learn('comp');
  await say('Karim', "Et regarde celui-là : PATATE. 12 000 % de rendement annuel. Lancé hier. Pas d'audit. Je suis presque tenté.");
  aim('Décide quoi faire de tes ethers (Karim)', 'karim', 'c4-farm');
}
async function c4Farm(){
  lock = true; busy = true; goal = null; face(karim, player);
  const c = await say('Karim', "Alors ? PATATE, ou quelque chose de plus calme ?", ['Tenter PATATE', 'Échanger quelques DAI sur Uniswap, tranquille', 'Ne rien toucher']);
  CHS[4].farm = ['patate', 'uniswap', 'rien'][c];
  if (c === 0){ await say('Karim', "Ok. Moi aussi, un tout petit peu. Pour voir.");
    await say(null, "Deux jours plus tard, le contrat de PATATE a une fonction que personne n'avait lue : elle permettait au créateur de tout retirer. Il l'a fait.");
    await say('Karim', "Envolé. Tout. Je te l'avais dit, que j'étais « presque » tenté…"); }
  else if (c === 1){ await say('Karim', "Uniswap ? Pas de rendement magique, juste des échanges entre jetons, sans intermédiaire. Sage."); CHS[4].uni = true; }
  else await say('Karim', "Ne rien toucher, c'est aussi une stratégie. Souvent la meilleure.");
  await skip('Trois mois plus tard.', 'Jeudi 17 septembre 2020 · 11:20', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Uniswap vient de lancer son jeton, UNI. Et ils en offrent 400 à chaque adresse qui a déjà utilisé Uniswap !");
  learn('uni');
  if (CHS[4].uni) await say('Lena', "Tu l'as utilisé en juin, non ? Regarde ton adresse… 400 UNI. Pour avoir été là avant tout le monde.");
  else await say('Lena', "Toi, tu ne l'avais jamais utilisé… Tant pis. Ce genre de cadeau, personne ne le voit venir.");
  await skip('Le 1er décembre 2020.', 'Mardi 1er décembre 2020 · 12:55', 'day', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Ça y est. J'ai déposé 32 ethers dans le contrat de dépôt. À 13 h, heure de Paris, la Beacon Chain démarre, et je serai validatrice.");
  learn('deposit'); learn('beacon');
  await say('Lena', "Plus besoin de cartes graphiques pour sécuriser le réseau. Il suffit de mettre des ethers en jeu, et de bien se comporter.");
  aim('Parle à Karim', 'karim', 'c4-karim');
}
async function c4Karim(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "Tu sais ce que ça veut dire, pour moi ? Un jour, ma machine ne servira plus à rien.");
  const c = await say('Karim', "Pas tout de suite. La Beacon Chain tourne à côté, pour l'instant. Mais un jour, les deux vont fusionner.", ['Tu pourrais devenir validateur, toi aussi', 'Elle aura bien servi, ta machine', 'Ça fait peur, ce changement']);
  CHS[4].karim = c;
  await say('Karim', ['Peut-être. Mais je ne sais pas si j’ai envie d’avoir 32 ethers bloqués. Je vais y réfléchir.', 'Cinq ans. Elle a vu la genèse, The DAO, CryptoKitties. Oui. Elle aura bien servi.', 'Un peu. Mais si ça consomme moins et que c’est plus sûr… je ne vais pas me battre contre.'][c]);
  endChapter(4, { eyebrow:'Chapitre 4 terminé · 2020', title:'L’été de la DeFi',
    you:[
      CHS[4].vault === 'saved' ? 'Tu as sauvé le coffre de Lena pendant le Jeudi noir.' : 'Le coffre de Lena a été liquidé pendant le Jeudi noir, malgré toi.',
      { patate:'Tu as tenté PATATE. Son créateur est parti avec la caisse.', uniswap:'Tu as échangé quelques DAI sur Uniswap. En septembre, 400 UNI sont arrivés sur ton adresse.', rien:'Tu n’as rien touché pendant l’été des rendements fous.' }[CHS[4].farm],
      'Tu étais là quand Lena est devenue validatrice, le jour du démarrage de la Beacon Chain.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['Jeudi noir de MakerDAO', 'https://www.quadrigainitiative.com/casestudy/makerdaoabnormalliquidations.php'], ['lancement d’UNI', 'https://www.coindesk.com/business/2020/09/17/uniswaps-distribution-is-built-on-something-that-cant-be-forked-actual-users']],
    note:'PATATE et le coffre de Lena sont inventés. Maker, Compound, Uniswap, les dates et les chiffres sont réels.',
    teaser:'<b>Chapitre 5 · 2021, London.</b> La fin des enchères à l’aveugle pour les frais, et des ethers qu’on brûle à chaque bloc.',
    track:{ vault:CHS[4].vault, farm:CHS[4].farm } });
}
const TALK4 = {
  lena(){ face(lena, player); return chat([['Lena', { 'c4-vault':"Vite, ton portable ! Mon coffre !", 'c4-farm':"Karim te montre encore ses rendements miracles ?", 'c4-karim':"Va parler à Karim. Je crois que ça le travaille." }[phase] || "Je suis validatrice. Si mon nœud tombe en panne, je perds un peu. Si je triche, je perds beaucoup. C'est ça, la preuve d'enjeu."]]); },
  karim(){ if (phase === 'c4-farm') return c4Farm(); if (phase === 'c4-karim') return c4Karim(); face(karim, player); return chat([['Karim', { 'c4-vault':"Aide Lena ! Le prix dégringole !" }[phase] || "Ma machine tourne encore. Pour combien de temps, je ne sais pas."]]); },
  laptop(){ if (phase === 'c4-vault') return c4Vault(); return chat([[null, "Ton portable. Un onglet affiche la Beacon Chain : des milliers de validateurs, et Lena parmi eux."]]); },
  board(){ return chat([[null, "Au tableau : « coffre ≥ 150 % », « APY 12 000 % ?! → lire le code », et « 32 ETH » entouré."]]); },
  rig(){ return chat([[null, "La machine de Karim tourne toujours. Il la dépoussière plus souvent qu'avant."]]); },
  window(){ return chat([[null, "2020. Pendant des semaines, les rues sont restées vides. La chaîne, elle, n'a jamais arrêté de produire des blocs."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei a passé le confinement chez Lena. Il a l'air de trouver le hackerspace trop bruyant, maintenant."]]); },
};

/* ---------- chapitre 5 : 2021, London ---------- */
function showLondon(){
  return new Promise(res => {
    let burned = 0, tip = null, timer = null, base = 42;
    modalCard(`<p class="eyebrow">Ton portable · jeudi 5 août 2021</p><h2>Après London : frais de base + pourboire</h2>
      <p>Depuis le bloc 12 965 000, chaque bloc affiche des <b>frais de base</b>, les mêmes pour tout le monde, qui sont <b>brûlés</b>. Tu ajoutes seulement un <b>pourboire</b> pour le mineur. Plus besoin de deviner.</p>
      <div class="counters"><div><span>Frais de base du bloc</span><b id="lBase"></b><small>gwei · brûlés</small></div><div class="cheap"><span>ETH brûlés sous tes yeux</span><b id="lBurn">0</b><small>ETH</small></div><div><span>Ton pourboire</span><b id="lTip">—</b><small>gwei · au mineur</small></div></div>
      <div class="tips rules">${[1, 2, 5].map(p => `<button class="rule radio act" aria-pressed="false" data-t="${p}">Pourboire de ${p} gwei</button>`).join('')}</div>
      <ul class="tradelog" id="lLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration : les frais de base montent quand les blocs sont pleins et baissent quand ils sont vides. Chiffres du compteur fictifs.</p>`);
    const draw = () => { $('lBase').textContent = base; $('lBurn').textContent = burned.toFixed(2).replace('.', ','); };
    draw();
    timer = setInterval(() => { base = Math.max(20, Math.min(90, base + Math.round(Math.sin(burned * 7) * 4))); burned += base * 0.0035; draw(); }, tickMs(400));
    mcard.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
      if (tip) return; tip = +b.dataset.t; sfx('ledger'); $('lTip').textContent = tip;
      mcard.querySelectorAll('[data-t]').forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.disabled = true; });
      mlog('lLog', `Incluse au bloc suivant. Tu as payé ${base} gwei de frais de base (brûlés) + ${tip} gwei de pourboire.`, 'ok');
      mlog('lLog', tip >= 5 ? 'Ton pourboire était généreux : 1 ou 2 gwei auraient suffi, le réseau n’est pas saturé.' : 'Un petit pourboire suffit quand le réseau n’est pas saturé.');
      CHS[5].tip = tip; setTimeout(() => { clearInterval(timer); doneBtn('Continuer', res); }, tickMs(1200));
    }));
  });
}
async function chapter5(d){
  await startChapter(5, d);
  setDate('Mercredi 4 août 2021 · 20:30'); sky = 'evening';
  await say(null, "Été 2021. Cette année, l'ether a battu tous ses records. Au hackerspace, on ne parle plus de DeFi, on parle d'images : les NFT.");
  face(lena, player);
  await say('Lena', "Regarde ! « Les Pigeons de Paris », 10 000 pigeons dessinés, un par NFT. Le nôtre, celui de la fenêtre, est dedans. Enfin, un qui lui ressemble.");
  const c = await say('Lena', "La vente ouvre ce soir. Tout le monde va se battre pour les frais, comme en 2017. Tu en prends un ?", ['J’en prends un', 'Je regarde seulement']);
  CHS[5].nft = c === 0;
  if (c === 0){ await say('Lena', "Alors prépare-toi : ce soir, c'est encore l'enchère à l'aveugle sur le gaz.");
    await say(null, "Tu mets un prix du gaz très haut pour être sûr de passer. La transaction passe. Les frais coûtent presque autant que le pigeon."); }
  else await say('Lena', "Sage. Demain, de toute façon, les frais ne se paieront plus pareil.");
  face(karim, player);
  await say('Karim', "Demain, bloc 12 965 000 : London. Avec l'EIP-1559, une partie des frais ne va plus aux mineurs. Elle est brûlée. Détruite.");
  const k = await say('Karim', "Je devrais être contre, non ? C'est mon revenu qui baisse.", ['Tu es contre ?', 'Pourquoi brûler des ethers ?']);
  await say('Karim', k === 0 ? "Non. Des frais prévisibles, c'est mieux pour tout le monde. Et puis mes cartes n'en ont plus pour très longtemps, de toute façon." : "Pour que les frais servent tout le réseau plutôt qu'un seul mineur. Et pour qu'on ne puisse pas les gonfler en remplissant ses propres blocs.");
  await skip('Le lendemain.', 'Jeudi 5 août 2021 · 14:40', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  await say('Karim', "C'est passé à 14 h 33, heure de Paris. Bloc 12 965 000. Essaie d'envoyer quelque chose, tu vas voir la différence.");
  learn('london');
  aim('Envoie une transaction après London (portable)', 'laptop', 'c5-send');
}
async function c5Send(){
  lock = true; busy = true; goal = null;
  await showLondon();
  learn('burn');
  face(lena, player);
  await say('Lena', "Tu vois ? Plus besoin de deviner. Le portefeuille te propose les frais, et tu sais ce que tu paies.");
  if (CHS[5].nft) await say('Lena', "Ton pigeon, au fait, tu l'aimes toujours ? Il paraît que la moitié des collections de cet été ne vaudront plus rien dans un an.");
  await say('Karim', "Et le plus drôle : une partie de ce que tu viens de payer n'existe plus. Brûlée. Chaque bloc rend l'ether un peu plus rare.");
  endChapter(5, { eyebrow:'Chapitre 5 terminé · 2021', title:'Des frais qu’on comprend enfin',
    you:[
      CHS[5].nft ? 'Tu as acheté un pigeon NFT la veille de London, en payant le gaz au prix fort.' : 'Tu as regardé la folie des NFT sans y toucher.',
      `Après London, tu as envoyé ta transaction avec un pourboire de ${CHS[5].tip} gwei.`,
      'Tu as vu une partie des frais être brûlée, bloc après bloc.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['EIP-1559', 'https://eips.ethereum.org/EIPS/eip-1559']],
    note:'« Les Pigeons de Paris » sont inventés. London, l’EIP-1559 et la date sont réels.',
    teaser:'<b>Chapitre 6 · 2022, la Fusion.</b> Un matin de septembre, toutes les machines de minage s’arrêtent en même temps. Dont celle de Karim.',
    track:{ nft:CHS[5].nft, tip:CHS[5].tip } });
}
const TALK5 = {
  lena(){ face(lena, player); return chat([['Lena', phase === 'c5-send' ? "Essaie d'envoyer quelque chose, tu vas voir." : "Mon pigeon a une écharpe. C'est le plus beau des 10 000. Objectivement."]]); },
  karim(){ face(karim, player); return chat([['Karim', "Les frais de base sont brûlés, le pourboire est pour moi. Des petits pourboires, en général."]]); },
  laptop(){ if (phase === 'c5-send') return c5Send(); return chat([[null, "Ton portable. Un compteur en ligne affiche les ethers brûlés depuis London. Il ne s'arrête jamais."]]); },
  board(){ return chat([[null, "Au tableau : « base fee → brûlée », « + pourboire », « EIP-1559 ». Quelqu'un a dessiné un petit feu."]]); },
  rig(){ return chat([[null, "La machine de Karim. Ses revenus ont baissé avec London, mais il la fait tourner quand même."]]); },
  window(){ return chat([[null, "Un pigeon se pose sur la barre d'appui. Il ne sait pas qu'il a un sosie numérique."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei regarde le pigeon de la fenêtre. Le pigeon regarde Wei. Aucun des deux n'a de NFT."]]); },
};

/* ---------- chapitre 6 : 2022, la Fusion ---------- */
function showTTD(){
  return new Promise(res => {
    const TTD = 58750000000000000000000n;
    let td = TTD - 3000000000000000000n * 40n, timer = null, done = false;
    modalCard(`<p class="eyebrow">Ton portable · jeudi 15 septembre 2022</p><h2>La difficulté totale approche</h2>
      <p>La Fusion ne se déclenche pas à une heure ni à un numéro de bloc, mais quand la <b>difficulté totale</b> accumulée par tous les mineurs depuis 2015 atteint une valeur fixée à l'avance.</p>
      <p class="meter-legend"><span>Difficulté totale</span><span>Seuil : <b>58 750 000 000 000 000 000 000</b></span></p>
      <p class="gblock" id="tVal" style="font-size:18px"></p>
      <div class="meter big"><div class="fill" id="tFill"></div></div>
      <ul class="tradelog" id="tLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Montée accélérée pour le jeu. Le seuil et le bloc 15 537 394 sont réels.</p>`);
    const fmtBig = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    const draw = () => { $('tVal').textContent = fmtBig(td); const left = Number((TTD - td) / 1000000000000000000n); $('tFill').style.width = Math.max(0, 100 - left / 1.2) + '%'; };
    draw();
    timer = setInterval(() => {
      if (done) return;
      td += 3000000000000000000n + BigInt(Math.floor(Math.random() * 400)) * 1000000000000000n; sfx('blip');
      if (td >= TTD){ done = true; td = TTD; clearInterval(timer); draw(); rig.on = false; sfx('end');
        mlog('tLog', 'Seuil atteint. Le dernier bloc miné est derrière nous.');
        mlog('tLog', 'Bloc 15 537 394 · 06:42:42 UTC : proposé par un validateur, plus par un mineur.', 'ok');
        doneBtn('Lever les yeux de l’écran', res); }
      else draw();
    }, tickMs(260));
  });
}
async function chapter6(d){
  await startChapter(6, d);
  place([[karim, 1070, 792, 1], [lena, 560, 800, 1]]);
  setDate('Jeudi 15 septembre 2022 · 08:20'); sky = 'dawn';
  await say(null, "15 septembre 2022, tôt le matin. Karim est arrivé avant tout le monde. Il n'a pas dormi. Sa machine tourne, comme depuis sept ans.");
  face(karim, player);
  await say('Karim', "C'est ce matin. Bellatrix est passé le 6 septembre, la Beacon Chain est prête. Ce matin, ma machine va miner ses derniers blocs.");
  learn('bellatrix');
  aim('Regarde la difficulté totale monter (portable)', 'laptop', 'c6-ttd');
}
async function c6TTD(){
  lock = true; busy = true; goal = null;
  await showTTD();
  learn('merge');
  await say(null, "8 h 42 à Paris. Les ventilateurs de la machine de Karim ralentissent. Puis s'arrêtent. Pour la première fois depuis 2015, la pièce est silencieuse.");
  face(lena, player);
  await say('Lena', "Mon validateur vient de proposer un bloc. Ça fonctionne. Tout fonctionne. Les soldes n'ont pas bougé, les contrats non plus.");
  await say('Lena', "Et le réseau consomme à peu près 99,95 % d'électricité en moins. Toutes ces machines, partout dans le monde, éteintes d'un coup.");
  learn('energy');
  aim('Va voir Karim', 'karim', 'c6-karim');
}
async function c6Karim(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "Elle a vu le bloc zéro, tu te rends compte ? On l'a allumée ensemble, ce soir de juillet 2015.");
  const c = await say('Karim', "Je ne sais pas quoi en faire, maintenant.", ['Garde-la. Comme souvenir.', 'Revends les cartes, quelqu’un en fera bon usage', 'Deviens validateur, avec ce que tu as miné']);
  CHS[6].rig = ['keep', 'sell', 'validator'][c];
  await say('Karim', ["Comme souvenir… Oui. Je vais lui trouver une place. Elle l'a mérité.", "Tu as raison. Des étudiants en auront besoin pour leurs projets. C'est mieux qu'un tas de poussière.", "Avec ce que j'ai miné en sept ans ? … Oui. Oui, je crois que je peux. Continuer à sécuriser le réseau, autrement."][c]);
  const s = await say('Lena', "Et toi ? Tes ethers dorment dans ton coffre depuis des années. Tu pourrais les mettre en jeu, toi aussi.", ['Via un service de staking partagé', 'Je les garde dans mon coffre']);
  CHS[6].stake = s === 0;
  await say('Lena', s === 0 ? "Pas besoin d'avoir 32 ethers pour ça. Mais souviens-toi : tu confies tes ethers à un autre contrat. Lis-le." : "C'est ton choix. Rien ne t'oblige à rien.");
  await skip('Sept mois plus tard.', 'Jeudi 13 avril 2023 · 09:00', 'day', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Cette nuit, Shapella. Pour la première fois depuis 2020, je peux retirer mes ethers mis en jeu. Je ne vais pas le faire. Mais savoir que je peux, ça change tout.");
  learn('shapella');
  endChapter(6, { eyebrow:'Chapitre 6 terminé · 2022', title:'Le matin où les machines se sont tues',
    you:[
      'Tu as regardé la difficulté totale atteindre son seuil, et la machine de Karim s’arrêter.',
      { keep:'Tu as conseillé à Karim de garder sa machine en souvenir.', sell:'Tu as conseillé à Karim de revendre ses cartes à des étudiants.', validator:'Tu as poussé Karim à devenir validateur à son tour.' }[CHS[6].rig],
      CHS[6].stake ? 'Tu as mis tes ethers en jeu via un service partagé.' : 'Tu as gardé tes ethers dans ton coffre.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['annonce de la Fusion', 'https://blog.ethereum.org/2022/08/24/mainnet-merge-announcement'], ['99,95 % d’énergie en moins', 'https://blog.ethereum.org/2021/05/18/country-power-no-more']],
    note:'La machine de Karim est inventée, comme lui. La Fusion, son seuil, son bloc et Shapella sont réels.',
    teaser:'<b>Chapitre 7 · 2024 – 2025, dix ans.</b> Des blobs pour les L2, des comptes qui deviennent intelligents, une nouvelle venue au hackerspace… et un anniversaire.',
    track:{ rig:CHS[6].rig, stake:CHS[6].stake } });
}
const TALK6 = {
  lena(){ face(lena, player); return chat([['Lena', { 'c6-ttd':"Regarde sur ton portable. On y est presque.", 'c6-karim':"Va voir Karim. Je crois qu'il a besoin de quelqu'un." }[phase] || "Mon validateur tourne sur un petit ordinateur pas plus gros qu'un livre. Qui aurait cru ça, en 2015 ?"]]); },
  karim(){ if (phase === 'c6-karim') return c6Karim(); face(karim, player); return chat([['Karim', phase === 'c6-ttd' ? "Je ne peux pas regarder. Dis-moi quand c'est fini." : "C'est calme, sans le bruit des ventilateurs. Trop calme."]]); },
  laptop(){ if (phase === 'c6-ttd') return c6TTD(); return chat([[null, "Ton portable. Un bloc toutes les 12 secondes, réglé comme une horloge, proposé par des validateurs."]]); },
  rig(){ return chat([[null, rig.on ? "La machine de Karim tourne pour la dernière fois. Karim n'arrive pas à la regarder." : "La machine de Karim, silencieuse. Les ventilateurs ne tournent plus."]]); },
  board(){ return chat([[null, "Au tableau, un très long nombre : 58 750 000 000 000 000 000 000. Et en dessous : « PoW → PoS »."]]); },
  window(){ return chat([[null, "Le jour se lève. Quelque part, des milliers de machines de minage viennent de s'arrêter en même temps."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei cherche sa place chaude, contre la machine. Elle est froide. Il a l'air contrarié."]]); },
};

/* ---------- chapitre 7 : 2024 – 2025, dix ans ---------- */
function showBlobs(){
  return new Promise(res => {
    modalCard(`<p class="eyebrow">Portable d'Inès · mercredi 13 mars 2024</p><h2>Envoyer 5 € à une amie</h2>
      <p>Même transaction, trois endroits différents. Où l'envoyer ?</p>
      <div class="rules">
        <button class="rule radio act" data-n="l1">Ethereum directement <small>· cher quand le réseau est chargé</small></button>
        <button class="rule radio act" data-n="l2">Un L2, un « rollup » qui regroupe les transactions et les publie sur Ethereum</button>
      </div><div id="bOut"></div><div class="row" id="mRow"></div>
      <p class="small">Depuis Dencun, les L2 publient leurs données dans des « blobs », bien moins chers. Chez plusieurs L2, les frais ont baissé de plus de 90 % dans les jours qui ont suivi.</p>`);
    mcard.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
      mcard.querySelectorAll('[data-n]').forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', String(x === b)); }); sfx('ledger');
      CHS[7].net = b.dataset.n;
      $('bOut').innerHTML = b.dataset.n === 'l2' ? '<div class="verdict ok"><span class="pill">Envoyé</span>Quelques centimes de frais. La transaction est finalisée sur le L2, puis ses données partent dans un blob sur Ethereum.</div>'
        : '<div class="verdict ko"><span class="pill">Envoyé</span>Ça marche, mais les frais coûtent presque autant que les 5 €. Pour de petits montants, un L2 est fait pour ça.</div>';
      doneBtn('Continuer', res);
    }));
  });
}
function showGuardians(){
  return new Promise(res => {
    const G = [['Lena', true], ['Karim', true], ['Wei, le chat', false], ['Ton papier de 2015, rangé chez toi', true]];
    modalCard(`<p class="eyebrow">Ton portable · mercredi 7 mai 2025 · Pectra</p><h2>Rendre ton compte intelligent</h2>
      <p>Avec l'EIP-7702, ton compte de 2015 garde son adresse, mais peut déléguer son fonctionnement à un contrat. Par exemple : si tu perds ta clé, deux « gardiens » sur trois peuvent t'aider à en définir une nouvelle.</p>
      <p><b>Choisis tes trois gardiens.</b></p>
      <div class="rules">${G.map((g, i) => `<button class="rule" aria-pressed="false" data-g="${i}">${g[0]}</button>`).join('')}</div>
      <div id="gOut"></div><div class="row" id="mRow"><button class="btn primary" id="mGo" disabled>Signer la délégation</button></div>`);
    const picked = new Set();
    mcard.querySelectorAll('[data-g]').forEach(b => b.addEventListener('click', () => {
      const i = +b.dataset.g; sfx('select');
      if (picked.has(i)) picked.delete(i); else if (picked.size < 3) picked.add(i);
      mcard.querySelectorAll('[data-g]').forEach(x => x.setAttribute('aria-pressed', String(picked.has(+x.dataset.g))));
      $('mGo').disabled = picked.size !== 3;
    }));
    $('mGo').addEventListener('click', () => {
      const cat = picked.has(2); CHS[7].guardians = [...picked].map(i => G[i][0]); CHS[7].catGuard = cat; sfx(cat ? 'meow' : 'gift');
      mcard.querySelectorAll('[data-g]').forEach(x => { x.disabled = true; });
      $('gOut').innerHTML = cat ? '<div class="verdict ko"><span class="pill">Signé</span>Wei n’a pas de clé, ni de pouces. Il te reste deux vrais gardiens : il faudra qu’ils soient d’accord tous les deux.</div>'
        : '<div class="verdict ok"><span class="pill">Signé</span>Ton compte a maintenant un filet de sécurité. Si tu perds ta clé, deux gardiens sur trois pourront t’aider.</div>';
      doneBtn('Continuer', res);
    });
  });
}
async function chapter7(d){
  await startChapter(7, d);
  Object.assign(newbie, { x:1260, y:840, face:-1, walk:0, moving:false, target:null, vis:true, shirt:C.cyan, pants:C.peach, hair:C.ink2, style:'bun', skin:C.skin, gesture:false });
  setDate('Mercredi 13 mars 2024 · 16:10');
  await say(null, "Mars 2024. Sur la vieille machine de Karim, quelqu'un a posé un petit palmier en pot. Et ce soir, il y a une nouvelle au hackerspace.");
  learn('dencun');
  face(lena, player);
  await say('Lena', "Je te présente Inès. Elle vient d'arriver, elle veut comprendre Ethereum. Je me suis dit que tu étais la bonne personne. Tu as tout vu depuis le début, toi.");
  aim('Parle à Inès', 'newbie', 'c7-ines');
}
async function c7Ines(){
  lock = true; busy = true; goal = null; face(newbie, player); face(player, newbie);
  await say('Inès', "Salut ! J'ai essayé d'envoyer 5 € à une amie sur Ethereum, et les frais m'ont fait peur. C'est toujours aussi cher ?");
  const c = await say('Inès', "Tu peux m'expliquer ?", ['Je te montre, sur ton portable', 'En 2017, c’était bien pire']);
  if (c === 1) await say('Inès', "Pire que ça ? Raconte-moi plus tard. Montre-moi d'abord !");
  closeDialog();
  await showBlobs();
  await say('Inès', CHS[7].net === 'l2' ? "Quelques centimes ! Et c'est quand même sécurisé par Ethereum ?" : "Ah oui, les frais piquent. Et sur un L2, c'est quand même sécurisé par Ethereum ?");
  await say('Karim', "C'est tout l'idée. Aujourd'hui, Dencun a rendu ça beaucoup moins cher pour les L2. Le réseau principal devient la fondation, et on construit les étages au-dessus.");
  await skip('Un an plus tard.', 'Mercredi 7 mai 2025 · 12:10', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1], [newbie, 1260, 840, -1]]);
  face(lena, player);
  await say('Lena', "Pectra est passé ce matin. Tu te souviens de ton compte de 2015, celui que tu as créé le soir du lancement ?");
  if (ch1.keep === 0) await say('Lena', "Celui dont le mot de passe était sur un post-it… Aujourd'hui, tu peux enfin lui donner un filet de sécurité.");
  else if (ch1.keep === 1) await say('Lena', "Celui dont la clé traînait dans tes e-mails… Aujourd'hui, tu peux enfin lui donner un filet de sécurité.");
  else await say('Lena', "Ton papier et ta clé USB ont tenu dix ans. Aujourd'hui, tu peux ajouter un filet de sécurité en plus.");
  learn('pectra');
  aim('Rends ton compte intelligent (portable)', 'laptop', 'c7-7702');
}
async function c7Guard(){
  lock = true; busy = true; goal = null;
  await showGuardians();
  face(lena, player);
  await say('Lena', CHS[7].catGuard ? "Tu as mis Wei comme gardien ? … Bon. Karim et moi, on fera le travail." : "Gardienne de ton compte. Je suis touchée. Je te promets de ne jamais le perdre, ce rôle.");
  await skip('Le 30 juillet 2025.', 'Mercredi 30 juillet 2025 · 17:26', 'evening', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1040, 800, -1], [newbie, 1240, 840, -1]]);
  await say(null, "30 juillet 2025, 17 h 26. Dix ans, jour pour jour, heure pour heure, après le premier bloc. Le hackerspace a sorti des pizzas. Les mêmes.");
  learn('tenyears');
  aim('Porte un toast avec Karim', 'karim', 'c7-toast');
}
async function c7Toast(){
  lock = true; busy = true; goal = null; face(karim, player); face(lena, player);
  await say('Karim', "Dix ans. On a fabriqué un bloc zéro, perdu une caisse commune, vu un fork, éteint ma machine…");
  await say('Lena', "Et personne n'a jamais « appuyé sur le bouton ». Il n'y a toujours pas de bouton.");
  if (ch2.chain) await say('Karim', ch2.chain === 'etc' ? "Toi et moi, on avait choisi la chaîne d'origine, en 2016. Elle tourne toujours, d'ailleurs." : "En 2016, toi et Lena, vous aviez choisi le fork. Moi non. Et on est toujours là, tous les trois.");
  const c = await say('Inès', "Et vous, qu'est-ce que vous retenez de ces dix ans ?", ['Qu’il faut vérifier soi-même', 'Que des inconnus peuvent construire ensemble', 'Que rien n’est jamais fini']);
  CHS[7].lesson = c;
  await say('Lena', ["Vérifier soi-même. Le bloc zéro, le code de The DAO, le white paper, le contrat de PATATE… Tout revient à ça.", "Des milliers de gens qui ne se connaissent pas, et un réseau qui ne s'est jamais arrêté. Oui.", "Le prochain, Fusaka, est déjà en préparation. Il y a toujours une suite."][c]);
  await say('Karim', "À la prochaine décennie.");
  learn('fusaka');
  await say(null, "Wei monte sur la vieille machine, se couche à côté du palmier, et s'endort. Quelque part, un nouveau bloc arrive. Puis un autre.");
  endChapter(7, { eyebrow:'Chapitre 7 terminé · 2015 – 2025', title:'Dix ans, et pas de bouton',
    you:[
      CHS[7].net === 'l2' ? 'Tu as montré à Inès comment envoyer 5 € sur un L2, pour quelques centimes.' : 'Tu as montré à Inès pourquoi on envoie les petits montants sur un L2.',
      `Tu as rendu ton compte de 2015 intelligent, avec pour gardiens : ${CHS[7].guardians.join(', ')}.`,
      'Tu étais là le 30 juillet 2025, dix ans après le premier bloc.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['EIP-4844', 'https://eips.ethereum.org/EIPS/eip-4844'], ['EIP-7702', 'https://eips.ethereum.org/EIPS/eip-7702']],
    note:'Inès, Lena, Karim, Wei et le hackerspace sont inventés. Dencun, Pectra, Fusaka et leurs dates sont réels.',
    journey:true, track:{ net:CHS[7].net, lesson:CHS[7].lesson } });
}
const TALK7 = {
  newbie(){ if (phase === 'c7-ines') return c7Ines(); face(newbie, player); return chat([['Inès', phase === 'c7-toast' ? "Karim t'attend pour le toast !" : "Je lis tout ce que je peux. Lena m'a dit : « vérifie toujours toi-même ». C'est la règle numéro un, apparemment."]]); },
  lena(){ face(lena, player); return chat([['Lena', { 'c7-ines':"Va dire bonjour à Inès. Elle est près de la vieille machine.", 'c7-7702':"Ton portable. Choisis bien tes gardiens.", 'c7-toast':"Karim a préparé un discours. Il va pleurer, je te préviens." }[phase] || "Dix ans. J'ai toujours mon fichier de prévente, tu sais. Sur trois clés USB."]]); },
  karim(){ if (phase === 'c7-toast') return c7Toast(); face(karim, player); return chat([['Karim', "Je suis validateur, maintenant. Ou pas. Peu importe : je fais toujours tourner un nœud. Vieille habitude."]]); },
  laptop(){ if (phase === 'c7-7702') return c7Guard(); return chat([[null, "Ton portable. Ton compte de 2015 est toujours là, à la même adresse."]]); },
  rig(){ return chat([[null, "La vieille machine de Karim, éteinte depuis 2022. Un petit palmier pousse dessus. Wei dort souvent à côté."]]); },
  board(){ return chat([[null, "Au tableau : « blobs → L2 », « EIP-7702 », et en grand : « 30.07.2015 → 30.07.2025 »."]]); },
  window(){ return chat([[null, "Les toits de Paris, dix ans plus tard. Toujours des pigeons. Toujours aucun bouton."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei a dix ans de plus. Il dort toujours là où c'est chaud. Désormais, c'est à côté du palmier."]]); },
};
const TALKS = { 2:TALK2, 3:TALK3, 4:TALK4, 5:TALK5, 6:TALK6, 7:TALK7 };
const CHAPTERS = { 1:() => chapter1(), 2:d => chapter2(d), 3:d => chapter3(d), 4:d => chapter4(d), 5:d => chapter5(d), 6:d => chapter6(d), 7:d => chapter7(d) };

/* ---------- fin de chapitre (générique) ---------- */
function journeyLines(){
  const L = [];
  if (ch1.built) L.push(['2015', ch1.downloaded ? 'Bloc zéro fabriqué, après un faux fichier' : 'Bloc zéro fabriqué toi-même']);
  if (ch2.chain) L.push(['2016', `${ch2.invested ? 'Ether dans The DAO' : 'Pas dans The DAO'} · ${ch2.chain === 'eth' ? 'avec le fork' : 'chaîne d’origine'}`]);
  if (CHS[3].gas) L.push(['2017', `${CHS[3].flags}/4 signaux repérés · ${CHS[3].ico ? 'NUAGE acheté' : 'NUAGE évité'}`]);
  if (CHS[4].vault) L.push(['2020', `Coffre de Lena ${CHS[4].vault === 'saved' ? 'sauvé' : 'liquidé'} · ${{ patate:'PATATE', uniswap:'400 UNI', rien:'rien touché' }[CHS[4].farm]}`]);
  if (CHS[5].tip) L.push(['2021', `${CHS[5].nft ? 'Un pigeon NFT' : 'Pas de NFT'} · pourboire de ${CHS[5].tip} gwei`]);
  if (CHS[6].rig) L.push(['2022', `${CHS[6].stake ? 'Ethers mis en jeu' : 'Ethers au coffre'} · la machine de Karim ${{ keep:'gardée', sell:'revendue', validator:'remplacée par un validateur' }[CHS[6].rig]}`]);
  if (CHS[7].guardians) L.push(['2025', `Compte intelligent · gardiens : ${CHS[7].guardians.join(', ')}`]);
  return L;
}
function endButtons(n){
  const next = n < 7 ? [[`Chapitre ${n + 1} : ${ERAS[n][1]}`, () => CHAPTERS[n + 1](readSave()), true]] : [];
  return next.concat([['Rester au hackerspace', () => { lock = false; }, !next.length], ...(n >= 7 ? [["Retour à L'Atrium", () => { location.href = '/game/'; }]] : [])]);
}
function mountButtons(n){
  const row = $('endCard').querySelector('.row');
  endButtons(n).forEach(([label, fn, primary]) => { const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}
function endChapter(n, o){
  closeDialog(); goal = null;
  chapterDone = Math.max(chapterDone, n); phase = 'free'; setObjective(null);
  const saved = writeSave(); track('Histoire chapitre fini', { chapitre:n, ...(o.track || {}) });
  const truth = FACT_ORDERS[n].map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  const jr = o.journey ? `<p class="endsec">Tes dix ans</p><ol class="truth">${journeyLines().map(([y, t]) => `<li><b>${y}</b><span>${t}</span></li>`).join('')}</ol>` : '';
  $('endCard').innerHTML = `<p class="eyebrow">${o.eyebrow}</p><h2>${o.title}</h2>
    <p class="endsec">Ce que tu as fait</p><ul class="recap">${o.you.map(r => `<li>${r}</li>`).join('')}</ul>${jr}
    <p class="endsec">Ce qui s'est vraiment passé</p><ol class="truth">${truth}</ol>
    <p class="hint">${o.note} ${o.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(' · ')}</p>
    ${o.teaser ? `<p class="teaser">${o.teaser}</p>` : '<p class="teaser"><b>Fin de L’Atrium · histoire vraie.</b> L’histoire, elle, continue : le 3 décembre 2025, Fusaka. Et après, ce que les gens en feront.</p>'}
    <div class="row"></div>${saved ? '<p class="hint">Progression sauvegardée sur cet appareil.</p>' : ''}`;
  mountButtons(n);
}

/* ---------- sauvegarde ---------- */
const SAVE_KEY = 'atrium.histoire.v1';
function readSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
function writeSave(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v:1, chapterDone, addr, ch1:{ ...ch1 }, ch2:{ ...ch2 }, ch3:{ ...CHS[3] }, ch4:{ ...CHS[4] }, ch5:{ ...CHS[5] }, ch6:{ ...CHS[6] }, ch7:{ ...CHS[7] }, facts:facts.slice(), savedAt:Date.now() })); return true; } catch (e) { return false; } }
function loadSave(d){ addr = d.addr || addr; Object.assign(ch1, d.ch1 || {}); Object.assign(ch2, d.ch2 || {}); for (let n = 3; n <= 7; n++) Object.assign(CHS[n], d['ch' + n] || {}); facts.length = 0; facts.push(...(d.facts || [])); chapterDone = d.chapterDone || 0; }
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
function resumeFree(d){
  resetWorld();
  loadSave(d);
  if (chapterDone >= 3){ chap = Math.min(chapterDone, 7); buildCache(); decor(chap); if (chap === 7) Object.assign(newbie, { x:1240, y:840, face:-1, walk:0, moving:false, target:null, vis:true, shirt:C.cyan, pants:C.peach, hair:C.ink2, style:'bun', skin:C.skin, gesture:false }); setDate(ERAS[chap - 1][0] + ' · ' + ERAS[chap - 1][1]); $('carnetBtn').hidden = false; renderPanel(); phase = 'free'; lock = false; busy = false; player.y = 846; player.x = 620; snapCam(); return; }
  if (chapterDone >= 2){ chap = 2; buildCache(); sky = 'day'; rig.on = true; cat.sleep = false; Object.assign(cat, { x:980, y:850 }); setDate('Mercredi 20 juillet 2016'); $('carnetBtn').hidden = false; renderPanel(); phase = 'free'; lock = false; busy = false; player.y = 846; player.x = 620; snapCam(); return; }
  chap = 1; buildCache();
  sky = 'dawn'; rig.on = true; cat.sleep = false; Object.assign(cat, { x:980, y:850 }); Object.assign(lena, { x:880, y:800 }); karim.face = -1;
  player.y = 846; player.x = 520;
  setDate('Vendredi 7 août 2015'); $('carnetBtn').hidden = false; renderPanel();
  phase = 'free'; lock = false; busy = false; snapCam();
}

/* ---------- interactions ---------- */
const talk = {
  lena(){
    if (phase === 'thaw') return chat([['Lena', 'Karim t’appelle. Vas-y, je te suis.']]);
    const L = { karim:"Karim est près de sa machine, à droite. Tu ne peux pas la rater : c'est elle qui fait tout ce bruit.", genesis:"Le bloc 1 028 201 n'est pas encore là ? Surveille ton terminal.", node:"Crée ton compte, et réfléchis bien à l'endroit où tu ranges ton mot de passe. Crois-moi.", sleep:"Karim ne dormira pas de la nuit. Toi, tu devrais.", free:"Maintenant que les transactions passent, on va voir ce que les gens construisent. J'ai hâte. Et un peu peur." };
    face(lena, player); return chat([['Lena', L[phase] || L.free]]);
  },
  karim(){
    if (phase === 'karim') return karimIntro();
    if (phase === 'thaw') return thaw();
    const L = { genesis:"Ton portable, sur la grande table. Le bloc 1 028 201 ne va plus tarder.", node:"Lance ton nœud, vite ! Je ne veux pas que tu rates le premier bloc.", sleep:"Je surveille le plafond. Va dormir, je te réveille s'il se passe quelque chose.", free:"Ma machine continue de miner. Cinq ethers par bloc, quand j'en trouve un. Ce qui n'arrive pas si souvent." };
    face(karim, player); return chat([['Karim', L[phase] || "Tu entends ce bruit ? C'est le bruit d'une chaîne qui démarre."]]);
  },
  rig(){ if (phase === 'thaw') return thaw(); return chat([[null, rig.on ? "Trois cartes graphiques qui calculent à pleine vitesse. L'air au-dessus de la machine est tiède." : "Trois cartes graphiques, des ventilateurs, un tas de câbles. Pour l'instant, la machine tourne au ralenti."]]); },
  laptop(){
    if (phase === 'genesis') return genesisTerminal();
    if (phase === 'node') return nodeTerminal();
    if (phase === 'intro' || phase === 'karim') return chat([[null, "Ton portable. Rien à y faire pour l'instant : va d'abord voir Karim."]]);
    return chat([[null, ch1.eth ? "Ton portable. Ton solde : 1 ETH. Le premier." : "Ton portable. Le terminal affiche les blocs qui arrivent, un par un, tous vides."]]);
  },
  sofa(){ if (phase === 'sleep') return sleepWeek(); return chat([[null, "Un canapé qui a déjà servi de lit à la moitié des membres du hackerspace."]]); },
  cat(){ sfx('meow'); return chat([[null, cat.sleep ? "Wei, le chat du hackerspace, dort contre la machine de Karim. C'est l'endroit le plus chaud de la pièce." : "Wei s'étire. Il a passé la semaine contre les cartes graphiques, et il n'a pas l'air de le regretter."]]); },
  board(){ return chat([[null, "Au tableau, quelqu'un a écrit « 30 · 07 · 2015 », dessiné trois blocs reliés par des flèches, et entouré « #1 028 201 »."]]); },
  window(){ return chat([[null, sky === 'dawn' ? "Le jour se lève sur les toits. Dehors, rien n'indique qu'une chaîne tourne depuis une semaine sur des milliers de machines." : "Les toits de zinc, un pigeon, la fin d'après-midi. Dehors, rien n'indique qu'il se passe quoi que ce soit."]]); },
  coffee(){ return chat([[null, "Une machine à café qui a connu des jours meilleurs. Quelqu'un a scotché dessus : « Détartrée le 12/05. Peut-être. »"]]); },
  poster(){ return chat([[null, "Une affiche faite main : un losange, et en dessous, « FRONTIER ». Quelqu'un a ajouté au crayon : « pour développeurs. Vous êtes prévenus. »"]]); },
};
talk.newbie = () => {};
for (const k of Object.keys(talk)){ const f = talk[k]; talk[k] = () => (TALKS[chap] && TALKS[chap][k]) ? TALKS[chap][k]() : f(); }
const INTER = [
  { id:'lena', hit:() => [lena.x, lena.y - 85 * persp(lena.y), 60], appr:() => [lena.x + 92 * (player.x < lena.x ? -1 : 1), lena.y + 12] },
  { id:'karim', hit:() => [karim.x, karim.y - 85 * persp(karim.y), 60], appr:() => [karim.x - 92, karim.y + 14] },
  { id:'laptop', hit:() => [572, 640, 62], appr:() => [572, 800] },
  { id:'rig', hit:() => [1235, 660, 95], appr:() => [karim.x - 92, karim.y + 14] },
  { id:'cat', hit:() => [cat.x, cat.y - 24, 44], appr:() => [cat.x - 70, cat.y + 18] },
  { id:'sofa', hit:() => [222, 790, 120], appr:() => [380, 846] },
  { id:'newbie', hit:() => newbie.vis ? [newbie.x, newbie.y - 85 * persp(newbie.y), 58] : [-999, -999, 0], appr:() => [newbie.x - 92, newbie.y + 12] },
  { id:'coffee', hit:() => [1440, 600, 70], appr:() => [1410, 730] },
  { id:'board', hit:() => [305, 265, 150], appr:null },
  { id:'poster', hit:() => [543, 225, 60], appr:null },
  { id:'window', hit:() => [830, 255, 185], appr:null },
];
function hitTest(x, y){ for (const it of INTER){ const [hx, hy, r] = it.hit(); if (Math.hypot(x - hx, y - hy) < r) return it; } return null; }
function interact(it){
  if (!it.appr){ talk[it.id](); return; }
  const [ax, ay] = it.appr(); const pt = { x:ax, y:ay }; collide(pt);
  walkTo(player, pt.x, pt.y, 250, true).then(() => {
    const [hx] = it.hit(); if (Math.abs(hx - player.x) > 4) player.face = hx > player.x ? 1 : -1;
    if (!lock) talk[it.id]();
  });
}

/* ---------- entrées ---------- */
function toWorld(ev){ const r = cv.getBoundingClientRect(); return [cam.x + (ev.clientX - r.left) / scale, cam.y + (ev.clientY - r.top) / scale]; }
cv.addEventListener('pointerdown', ev => {
  if (advanceFn){ advanceFn(); return; }
  if (lock || busy) return;
  const [wx, wy] = toWorld(ev); const it = hitTest(wx, wy);
  if (it) return interact(it);
  if (wy > HOR + 10){ const pt = { x:wx, y:wy }; collide(pt); walkTo(player, pt.x, pt.y, 250, true); }
});
cv.addEventListener('pointermove', ev => { const [wx, wy] = toWorld(ev); cv.style.cursor = (!lock && hitTest(wx, wy)) ? 'pointer' : (!lock && wy > HOR + 10 ? 'crosshair' : 'default'); });
const keys = new Set();
const MOVE = { arrowup:[0,-1], z:[0,-1], w:[0,-1], arrowdown:[0,1], s:[0,1], arrowleft:[-1,0], q:[-1,0], a:[-1,0], arrowright:[1,0], d:[1,0] };
window.addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  if (k === 'escape' && !$('panel').hidden){ $('panel').hidden = true; return; }
  if (k === 'c' && !$('carnetBtn').hidden && phase !== 'title' && !advanceFn && modal.hidden){ ev.preventDefault(); togglePanel(); return; }
  if (ev.target.tagName === 'BUTTON' && ev.target.offsetParent && (k === 'enter' || k === ' ')) return;
  if (k === ' ' || k === 'enter' || k === 'e'){
    if (advanceFn){ ev.preventDefault(); advanceFn(); return; }
    if (!lock && !busy && phase !== 'title'){
      let best = null, bd = 170;
      for (const it of INTER){ if (!it.appr) continue; const [hx, hy] = it.hit(); const d = Math.hypot(hx - player.x, (hy - player.y) * .6); if (d < bd){ bd = d; best = it; } }
      if (best){ ev.preventDefault(); interact(best); }
    }
    return;
  }
  if (MOVE[k] && !lock){ keys.add(k); ev.preventDefault(); }
});
window.addEventListener('keyup', ev => keys.delete(ev.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

/* ---------- écran titre ---------- */
const READY = 7; // chapitres jouables
function setupTitle(){
  const d = readSave(), done = d ? d.chapterDone : 0;
  $('eras').innerHTML = ERAS.map(([y, n], i) => {
    const st = i < done ? 'done' : i === done && i < READY ? 'now' : '';
    const inner = `<b>${y}</b>${n}${i >= READY ? ' · bientôt' : i < done ? ' · rejouer' : ''}`;
    return i < done ? `<li class="${st}"><button type="button" data-era="${i + 1}">${inner}</button></li>` : `<li class="${st}">${inner}</li>`;
  }).join('');
  const LEDE = { 1:"Un an a passé. Au hackerspace, tout le monde ne parle plus que d'une chose : The DAO.", 2:"2017. Tout le monde lance son jeton, et la caisse du hackerspace dort dans un portefeuille multisig.", 3:"2020. Le monde s'arrête, les marchés s'effondrent, et Lena a un coffre Maker.", 4:"2021. Des pigeons en NFT, et demain, une nouvelle façon de payer les frais.", 5:"2022. Un matin de septembre, la machine de Karim va s'arrêter pour de bon.", 6:"2024. Une nouvelle venue au hackerspace, et bientôt, dix ans." };
  if (done >= 1 && done < 7){
    $('titleEyebrow').textContent = `Chapitre ${done + 1} · ${ERAS[done][0]}`;
    $('titleLede').textContent = LEDE[done];
    $('startBtn').textContent = `Continuer : chapitre ${done + 1}`;
    $('newBtn').hidden = false;
  } else if (done >= 7){
    $('titleEyebrow').textContent = 'Les sept chapitres sont terminés';
    $('titleLede').textContent = "Dix ans d'Ethereum, de la genèse à Pectra. Tu peux rejouer n'importe quel chapitre en le choisissant ci-dessus.";
    $('startBtn').textContent = 'Retourner au hackerspace';
    $('newBtn').hidden = false;
  }
}
$('eras').addEventListener('click', ev => {
  const b = ev.target.closest('[data-era]'); if (!b) return;
  window.Sound && window.Sound.start(); $('title').hidden = true;
  CHAPTERS[+b.dataset.era](readSave());
});
$('startBtn').addEventListener('click', () => {
  window.Sound && window.Sound.start(); $('title').hidden = true;
  const d = readSave();
  if (d && d.chapterDone >= 1 && d.chapterDone < 7) CHAPTERS[d.chapterDone + 1](d); else if (d && d.chapterDone >= 7) resumeFree(d); else chapter1();
});
$('newBtn').addEventListener('click', () => { window.Sound && window.Sound.start(); $('title').hidden = true; clearSave(); chapter1(); });
setupTitle();
const soundBtn = $('soundBtn');
function renderSound(m){ soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.setAttribute('aria-label', m ? 'Activer le son' : 'Couper le son'); soundBtn.classList.toggle('off', m); }
if (window.Sound){ renderSound(window.Sound.muted); window.Sound.onChange(renderSound); soundBtn.addEventListener('click', () => { window.Sound.start(); window.Sound.toggle(); soundBtn.blur(); }); } else soundBtn.hidden = true;

/* ---------- boucle ---------- */
function snapCam(){ const f = focusPoint(); cam.x = f[0]; cam.y = f[1]; }
function focusPoint(){
  const fx0 = phase === 'title' ? 800 : player.x, fy0 = phase === 'title' ? 700 : player.y;
  return [clamp(fx0 - viewW / 2, 0, Math.max(0, W - viewW)), clamp(fy0 - viewH * .62, 0, Math.max(0, H - viewH))];
}
let stepT = 0;
function update(dt){
  time += dt;
  if (!lock && keys.size && !busy){
    let vx = 0, vy = 0; keys.forEach(k => { vx += MOVE[k][0]; vy += MOVE[k][1]; });
    const l = Math.hypot(vx, vy);
    if (l){ player.target = null; const sp = 250 * persp(player.y) * dt; player.x += vx / l * sp; player.y += vy / l * sp * .8; collide(player); player.moving = true; player.walk += dt * 10; if (vx) player.face = vx > 0 ? 1 : -1; }
  } else if (!player.target) player.moving = false;
  moveEntity(player, dt); moveEntity(lena, dt); moveEntity(karim, dt);
  if (player.moving){ stepT -= dt; if (stepT <= 0){ sfx('step'); stepT = .34; } } else stepT = 0;
  rig.spin += dt * (rig.on ? 16 : 2.5);
  if (rig.flash > 0) rig.flash = Math.max(0, rig.flash - dt * .5);
  for (let i = tweens.length - 1; i >= 0; i--){ const tw = tweens[i]; tw.t += dt; const u = Math.min(1, tw.t / tw.dur); tw.fn(u); if (u >= 1){ tweens.splice(i, 1); tw.res(); } }
  for (let i = fx.length - 1; i >= 0; i--){ const f = fx[i]; f.t += dt; if (f.t >= f.dur){ fx.splice(i, 1); f.res(); } }
  const [tx, ty] = focusPoint(), k = Math.min(1, dt * 3);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
function render(){
  const g = ctx, k = scale * dpr;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  g.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.drawImage(cache, 0, 0, W, H);
  drawWindow(g, time); drawLamps(g, time);
  const list = [
    { y:682, d:() => drawCoffee(g) },
    { y:744, d:() => drawRig(g, time) },
    { y:770, d:() => drawDesk(g, time) },
    { y:852, d:() => drawSofa(g) },
    { y:lena.y, d:() => drawPerson(g, lena, time) },
    { y:karim.y, d:() => drawPerson(g, karim, time) },
    { y:cat.y, d:() => drawCat(g, cat, time) },
  ];
  if (newbie.vis) list.push({ y:newbie.y, d:() => drawPerson(g, newbie, time) });
  if (player.y < H + 60 && !sleeping) list.push({ y:player.y, d:() => drawPerson(g, player, time) });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  if (!busy && !lock){
    const head = p => [p.x, p.y - 215 * persp(p.y)];
    if (phase === 'karim' || phase === 'thaw') drawMarker(g, ...head(karim), time);
    if (phase === 'genesis' || phase === 'node') drawMarker(g, 572, 596, time);
    if (phase === 'sleep') drawMarker(g, 222, 712, time);
    if (phase === 'c2-karim' || phase === 'c2-karim2') drawMarker(g, ...head(karim), time);
    if (phase === 'c2-lena') drawMarker(g, ...head(lena), time);
    if (phase === 'c2-drain' || phase === 'c2-fork') drawMarker(g, 572, 596, time);
    if (goal === 'laptop') drawMarker(g, 572, 596, time);
    else if (goal === 'lena' || goal === 'karim' || goal === 'newbie') drawMarker(g, ...head({ lena, karim, newbie }[goal]), time);
  }
  fx.forEach(f => f.draw(g, Math.min(1, f.t / f.dur)));
}
let last = performance.now();
function frame(now){ const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
if (DEBUG) window.histoire = { interact:id => interact(INTER.find(i => i.id === id)), state:() => ({ phase, lock, busy, chapterDone, chap, goal, chs:JSON.parse(JSON.stringify(CHS)), ch2:{ ...ch2 }, ch1:{ ...ch1 }, facts:facts.slice(), player:[Math.round(player.x), Math.round(player.y)], sky }), fast:v => { window.__fast = v; } };
resetWorld();
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => buildCache());
requestAnimationFrame(frame);
})();
