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
const FACT_ORDER = ['presale', 'genesis', 'launch', 'gas', 'rule', 'first'];
const ERAS = [['2015', 'Frontier'], ['2016', 'The DAO'], ['2017', 'La ruée des ICO'], ['2020', "L'été de la DeFi"], ['2021', 'London'], ['2022', 'La Fusion'], ['2024', 'Dencun, Pectra']];
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
  g.fillStyle = C.ink; g.font = '400 34px Gloock, Georgia, serif'; g.fillText('30 · 07 · 2015', 170, 200);
  // trois blocs reliés
  for (let i = 0; i < 3; i++){ const x = 176 + i * 92; g.strokeStyle = C.ink2; g.lineWidth = 2.2; g.strokeRect(x, 222, 54, 40); g.fillStyle = C.ink2; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText(String(i), x + 21, 249);
    if (i < 2){ g.beginPath(); g.moveTo(x + 58, 242); g.lineTo(x + 86, 242); g.moveTo(x + 80, 236); g.lineTo(x + 86, 242); g.lineTo(x + 80, 248); g.stroke(); } }
  g.fillStyle = C.ink2; g.font = '600 19px "JetBrains Mono", monospace'; g.fillText('#1 028 201', 176, 305);
  g.beginPath(); g.ellipse(236, 298, 78, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace'; g.fillText('gas limit : 5 000 ?!', 176, 348); g.fillText('tx : 21 000', 348, 305);
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
  else { grd.addColorStop(0, '#aab6f3'); grd.addColorStop(.6, '#d9cff6'); grd.addColorStop(1, '#f7c8a6'); }
  g.fillStyle = grd; g.fillRect(x, y, w, h);
  // soleil bas
  g.fillStyle = hexA(sky === 'dawn' ? '#fff3e2' : '#fde3c9', .95); g.beginPath(); g.arc(sky === 'dawn' ? x + 90 : x + w - 90, y + h - 70, 28, 0, TAU); g.fill();
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
    if (sky !== 'dawn'){ const r = 90 + (reduce ? 0 : Math.sin(t * 1.3 + x) * 3); const gr = g.createRadialGradient(x, 110, 5, x, 110, r); gr.addColorStop(0, hexA('#fff1dc', .8)); gr.addColorStop(1, hexA('#fff1dc', 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, 110, r, 0, TAU); g.fill(); }
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
  if (mine && (phase === 'genesis' || phase === 'node') && !busy){ const a = reduce ? .8 : .45 + Math.sin(t * 4) * .35; g.strokeStyle = hexA(C.peach, a); g.lineWidth = 5; g.strokeRect(x - 49, y - 65, 98, 70); }
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
const ch1 = {}; const facts = [];
const fx = [], tweens = [];

function newAddr(){ let s = '0x'; for (let i = 0; i < 40; i++) s += '0123456789abcdef'[Math.floor(Math.random() * 16)]; return s; }
function resetWorld(){
  Object.assign(player, { x:800, y:960, face:-1, walk:0, moving:false, target:null, shirt:C.peach, pants:C.lav, hair:C.violet, style:'short', skin:C.skin, gesture:false });
  Object.assign(lena, { x:430, y:800, face:1, walk:0, moving:false, target:null, shirt:C.lav, pants:C.peri, hair:C.peach, style:'long', skin:C.skin, glasses:true, gesture:false });
  Object.assign(karim, { x:1070, y:792, face:1, walk:0, moving:false, target:null, shirt:C.teal, pants:C.ink2, hair:C.ink, cap:C.violet, skin:C.skin, logo:true, gesture:false });
  Object.assign(cat, { x:1372, y:792, face:-1, sleep:true });
  Object.assign(rig, { on:false, spin:0, flash:0 });
  Object.assign(ch1, { downloaded:false, built:false, keep:null, keepChanged:false, eth:0, lenaEth:false, account:false });
  facts.length = 0; fx.length = 0; tweens.length = 0;
  sky = 'evening'; sleeping = false; addr = newAddr();
  setObjective(null); $('carnetBtn').hidden = true; $('panel').hidden = true; renderPanel();
}

/* ---------- déplacements ---------- */
function obstacles(){ return [[530, 708, 300, 62], [1238, 726, 116, 26], [222, 812, 150, 44], [1445, 664, 72, 22], [lena.x, lena.y, 32, 12], [karim.x, karim.y, 32, 12]]; }
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
  resetWorld(); phase = 'intro'; lock = true; busy = true;
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
  chapterDone = 1; phase = 'free'; setObjective(null);
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
  const truth = FACT_ORDER.map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  $('endCard').innerHTML = `<p class="eyebrow">Chapitre 1 terminé · Frontier</p><h2>La semaine où tout a démarré</h2>
    <p class="endsec">Ce que tu as fait</p><ul class="recap">${you.map(r => `<li>${r}</li>`).join('')}</ul>
    <p class="endsec">Ce qui s'est vraiment passé</p><ol class="truth">${truth}</ol>
    <p class="hint">Lena, Karim, Wei et le hackerspace sont inventés. Les dates, les blocs, les empreintes et les chiffres sont réels : <a href="https://ethereum.org/fr/history/" target="_blank" rel="noopener">ethereum.org/fr/history</a> · <a href="https://etherscan.io/block/0" target="_blank" rel="noopener">bloc 0</a> · <a href="https://etherscan.io/block/46147" target="_blank" rel="noopener">bloc 46 147</a>.</p>
    <p class="teaser"><b>Bientôt · Chapitre 2 · 2016, The DAO.</b> Un fonds d'investissement géré uniquement par du code, plus de 3,6 millions d'ethers siphonnés, et une question que personne n'avait prévue : a-t-on le droit de réécrire l'histoire ?</p>
    <div class="row"></div>${saved ? '<p class="hint">Progression sauvegardée sur cet appareil.</p>' : ''}`;
  const row = $('endCard').querySelector('.row');
  [['Rester au hackerspace', () => { lock = false; }, true], ["Retour à L'Atrium", () => { location.href = '/'; }]].forEach(([label, fn, primary]) => {
    const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}

/* ---------- sauvegarde ---------- */
const SAVE_KEY = 'atrium.histoire.v1';
function readSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return d && d.v === 1 ? d : null; } catch (e) { return null; } }
function writeSave(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v:1, chapterDone, addr, ch1:{ ...ch1 }, facts:facts.slice(), savedAt:Date.now() })); return true; } catch (e) { return false; } }
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
function resumeFree(d){
  resetWorld();
  addr = d.addr || addr; Object.assign(ch1, d.ch1 || {}); facts.push(...(d.facts || [])); chapterDone = d.chapterDone;
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
const INTER = [
  { id:'lena', hit:() => [lena.x, lena.y - 85 * persp(lena.y), 60], appr:() => [lena.x + 92 * (player.x < lena.x ? -1 : 1), lena.y + 12] },
  { id:'karim', hit:() => [karim.x, karim.y - 85 * persp(karim.y), 60], appr:() => [karim.x - 92, karim.y + 14] },
  { id:'laptop', hit:() => [572, 640, 62], appr:() => [572, 800] },
  { id:'rig', hit:() => [1235, 660, 95], appr:() => [karim.x - 92, karim.y + 14] },
  { id:'cat', hit:() => [cat.x, cat.y - 24, 44], appr:() => [cat.x - 70, cat.y + 18] },
  { id:'sofa', hit:() => [222, 790, 120], appr:() => [380, 846] },
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
function setupTitle(){
  const d = readSave(), done = d && d.chapterDone >= 1;
  $('eras').innerHTML = ERAS.map(([y, n], i) => `<li class="${i === 0 ? (done ? 'done' : 'now') : ''}"><b>${y}</b>${n}${i > 0 ? ' · bientôt' : ''}</li>`).join('');
  if (done){
    $('titleEyebrow').textContent = 'Chapitre 1 terminé';
    $('titleLede').textContent = "Le chapitre 2, 2016 et The DAO, arrive bientôt. En attendant, le hackerspace est toujours là, et ton premier ether aussi.";
    $('startBtn').textContent = 'Retourner au hackerspace';
    $('newBtn').hidden = false;
  }
}
$('startBtn').addEventListener('click', () => {
  window.Sound && window.Sound.start(); $('title').hidden = true;
  const d = readSave();
  if (d && d.chapterDone >= 1) resumeFree(d); else chapter1();
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
  if (player.y < H + 60 && !sleeping) list.push({ y:player.y, d:() => drawPerson(g, player, time) });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  if (!busy && !lock){
    const head = p => [p.x, p.y - 215 * persp(p.y)];
    if (phase === 'karim' || phase === 'thaw') drawMarker(g, ...head(karim), time);
    if (phase === 'genesis' || phase === 'node') drawMarker(g, 572, 596, time);
    if (phase === 'sleep') drawMarker(g, 222, 712, time);
  }
  fx.forEach(f => f.draw(g, Math.min(1, f.t / f.dur)));
}
let last = performance.now();
function frame(now){ const dt = Math.min(.05, (now - last) / 1000); last = now; update(dt); render(); requestAnimationFrame(frame); }
if (DEBUG) window.histoire = { interact:id => interact(INTER.find(i => i.id === id)), state:() => ({ phase, lock, busy, chapterDone, ch1:{ ...ch1 }, facts:facts.slice(), player:[Math.round(player.x), Math.round(player.y)], sky }), fast:v => { window.__fast = v; } };
resetWorld();
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => buildCache());
requestAnimationFrame(frame);
})();
