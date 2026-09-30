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
const fmt = n => n.toLocaleString('en-US').replace(/ | /g, ' ');
const short = a => a.slice(0, 6) + '…' + a.slice(-4);
const wait = ms => new Promise(r => setTimeout(r, DEBUG && window.__fast ? 0 : ms));

/* ---------- faits réels (vérifiés) ---------- */
// Bloc 0 : empreinte et extraData lus sur etherscan.io/block/0 ; bloc 46147 : etherscan.io/block/46147 ;
// lancement, plafond de 5 000 : ethereum.org/fr/history ; prévente : blog.ethereum.org (« Launching the Ether Sale », 22/07/2014).
const GENESIS_EXTRA = '0x11bbe8db4e347b4e8c937c1c8370e4b5ed33adb3db69cbdb7a38e1e50b1b82fa';
const GENESIS_HASH = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3';
const FAKE_HASH = '0x5f3e9a27c41b86d0e2a7f95c318b4d6e0a9c72f1b5d83e46c0f2a19e7d5b38c4'; // inventé : le fichier piégé du jeu
const FACTS = {
  presale:{ date:'22 July 2014', title:"The ether presale", text:"The ether presale begins. It lasts 42 days and is paid in bitcoin: 2,000 ETH for 1 BTC during the first two weeks. The ether bought will be written straight into block zero." },
  genesis:{ date:'30 July 2015', title:"The hash of block 1,028,201", text:"Nobody hands out block zero: everyone builds it with a public script. Its extraData field is the hash of block 1,028,201 of the test network (0x11bb…82fa), impossible to know in advance." },
  launch:{ date:'30 July 2015 · 15:26 UTC', title:'Frontier starts', text:"Launch of Frontier, a “for developers” release of Ethereum. Hash of block zero: 0xd4e5…8fa3. Each block found pays its miner 5 ETH." },
  gas:{ date:'30 July 2015', title:'A limit of 5,000', text:"Frontier's gas limit is 5,000 per block. A simple ether transfer needs 21,000: at first, no transaction can fit in a block. The blocks are empty." },
  rule:{ date:'Protocol rule', title:'One 1,024th at a time', text:"With each block, the miner can move the gas limit by at most 1/1024 of its value. To go from 5,000 to 21,000 takes at least 1,470 blocks in a row, about six hours." },
  first:{ date:'7 August 2015 · 03:30 UTC', title:'The first transaction', text:"Block 46,147: the limit reaches 21,003. The network's first transaction fits in, using 21,000 units of gas." },
};
Object.assign(FACTS, {
  homestead:{ date:'14 March 2016 · block 1,150,000', title:'Homestead', text:"Ethereum's second major release: several protocol changes, and a networking change that makes future upgrades possible." },
  daosale:{ date:'30 April – 28 May 2016', title:'The DAO raises funds', text:"The DAO, a fund run by a contract, collects ether for 28 days. By May it has drawn nearly 14% of all ether issued, from more than 11,000 investors." },
  hack:{ date:'17 June 2016', title:'The DAO is drained', text:"A recursive call flaw is exploited: more than 3.6 million ETH, about a third of The DAO's 11.5 million, flows into a “child DAO”." },
  delay:{ date:'17 June 2016', title:'27 days of grace', text:"The diverted ether stays locked for about 27 days, the creation period of the child DAO. The thief can't withdraw anything before then." },
  softfork:{ date:'28 June 2016', title:'The soft fork falls through', text:"A denial-of-service flaw is found in the soft fork proposed to freeze the funds. The advice is not to activate it." },
  fork:{ date:'20 July 2016 · 13:20 UTC', title:'Block 1,920,000', text:"The hard fork moves about 12 million ETH from The DAO's contracts to a recovery contract. About 85% of miners follow it." },
  etc:{ date:'20 July 2016', title:'Ethereum Classic', text:"Part of the community stays on the original, unmodified chain: Ethereum Classic (ETC). At the moment of the split, every balance exists on both chains. Both still exist today." },
});
const FACT_ORDER1 = ['presale', 'genesis', 'launch', 'gas', 'rule', 'first'];
const FACT_ORDER2 = ['homestead', 'daosale', 'hack', 'delay', 'softfork', 'fork', 'etc'];
Object.assign(FACTS, {
  parityhack:{ date:'19 July 2017', title:'The first blow to Parity', text:"A flaw in Parity multisig wallets lets an attacker steal 153,037 ETH. The code library is fixed and redeployed on 20 July." },
  erc20:{ date:'19 November 2015', title:'The ERC-20 standard', text:"EIP-20 describes what a token must be able to do on Ethereum. In 2017, hundreds of projects use it to sell their tokens: the ICOs." },
  byzantium:{ date:'16 October 2017 · block 4,370,000', title:'Byzantium', text:"Byzantium cuts the miners' reward from 5 to 3 ETH per block." },
  parityfreeze:{ date:'6 November 2017', title:'513,774 ETH frozen', text:"A user initialises the library behind Parity multisigs, becomes its owner, then destroys it. 513,774 ETH stay locked in 587 wallets. No fork has ever unlocked them." },
  kitties:{ date:'28 November 2017', title:'CryptoKitties', text:"Launch of CryptoKitties, unique digital cats (ERC-721). The game accounts for about a quarter of Ethereum's traffic and sends pending transactions through the roof." },
  blackthursday:{ date:'12 March 2020', title:'Black Thursday', text:"Ether falls from about $197 to $89 in under 36 hours. With the network jammed, liquidators win Maker vaults for 0 DAI: about $8.32 million worth of ether." },
  comp:{ date:'15 June 2020', title:'COMP and yield farming', text:"Compound starts handing out its COMP token to those who lend and borrow: 2,880 a day. It's the start of “DeFi summer”." },
  uni:{ date:'17 September 2020', title:'400 UNI', text:"Uniswap launches its UNI token and gives 400 to every address that had already used the protocol." },
  deposit:{ date:'14 October 2020 · block 11,052,984', title:'The deposit contract', text:"The staking deposit contract is deployed. Each validator deposits 32 ETH into it." },
  beacon:{ date:'1 December 2020 · 12:00 UTC', title:'The Beacon Chain', text:"The Beacon Chain, the proof-of-stake chain, produces its first blocks. It runs alongside Ethereum, without replacing it yet." },
  london:{ date:'5 August 2021 · 12:33 UTC · block 12,965,000', title:'London', text:"London activates EIP-1559: every block has a base fee, the same for everyone, and the user adds a tip for whoever produces the block." },
  burn:{ date:'5 August 2021', title:'Burned ether', text:"Since London, the base fee of every transaction is destroyed instead of going to the miner." },
  bellatrix:{ date:'6 September 2022', title:'Bellatrix', text:"Bellatrix prepares the Beacon Chain for the Merge." },
  merge:{ date:'15 September 2022 · 06:42 UTC', title:'The Merge', text:"Total difficulty reaches 58,750,000,000,000,000,000,000. At block 15,537,394, proof of work stops and proof of stake takes over. Mining is no longer possible." },
  energy:{ date:'15 September 2022', title:'99.95% less energy', text:"The Ethereum Foundation estimated that proof of stake would cut the network's energy use by about 99.95%." },
  shapella:{ date:'12 April 2023 · 22:27 UTC', title:'Shapella', text:"Shapella finally makes it possible to withdraw ether staked since 2020." },
  dencun:{ date:'13 March 2024 · 13:55 UTC', title:'Dencun and blobs', text:"Dencun introduces “blobs” (EIP-4844), cheap data space for L2s. On several of them, fees drop by more than 90%." },
  pectra:{ date:'7 May 2025 · 10:05 UTC', title:'Pectra', text:"With EIP-7702, a regular account can delegate how it works to a smart contract. A validator can now have up to 2,048 ETH staked." },
  tenyears:{ date:'30 July 2025', title:'Ten years', text:"Ten years to the day after the launch of Frontier." },
  fusaka:{ date:'3 December 2025', title:'Fusaka', text:"The next upgrade, Fusaka, keeps expanding the space available to L2s (PeerDAS)." },
});
const FACT_ORDERS = { 1:FACT_ORDER1, 2:FACT_ORDER2, 3:['erc20', 'parityhack', 'byzantium', 'parityfreeze', 'kitties'], 4:['blackthursday', 'comp', 'uni', 'deposit', 'beacon'], 5:['london', 'burn'], 6:['bellatrix', 'merge', 'energy', 'shapella'], 7:['dencun', 'pectra', 'tenyears', 'fusaka'] };
const FACT_ORDER = [1, 2, 3, 4, 5, 6, 7].flatMap(n => FACT_ORDERS[n]);
const ERAS = [['2015', 'Frontier'], ['2016', 'The DAO'], ['2017', 'The ICO rush'], ['2020', "DeFi summer"], ['2021', 'London'], ['2022', 'The Merge'], ['2024 – 2025', 'Ten years']];
const KEEP = ["The password on a sticky note, under the screen", 'The file and the password in an email to myself', 'The password on paper at home, the file on a USB stick'];
const KEEP_SHORT = ['Sticky note under the screen', 'Email to yourself', 'Paper + USB stick, kept apart'];

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
  g.fillStyle = C.ink2; g.font = '600 19px "JetBrains Mono", monospace'; g.fillText('#1,028,201', 176, 305);
  g.beginPath(); g.ellipse(236, 298, 78, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace'; g.fillText('gas limit: 5,000 ?!', 176, 348); g.fillText('tx: 21,000', 348, 305);
}
function drawBoard2(g){
  g.fillStyle = C.ink; g.font = '400 34px Gloock, Georgia, serif'; g.fillText('The DAO', 170, 200);
  g.fillStyle = C.ink2; g.font = '600 16px "JetBrains Mono", monospace';
  g.fillText('withdraw():', 176, 236); g.fillText('1. send', 196, 260); g.fillText('2. balance = 0', 196, 284);
  g.fillStyle = hexA('#d9607e', 1); g.font = '600 22px "JetBrains Mono", monospace'; g.fillText('?!', 340, 284);
  g.beginPath(); g.moveTo(320, 250); g.quadraticCurveTo(352, 262, 322, 276); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 19px "JetBrains Mono", monospace'; g.fillText('#1,920,000', 176, 334);
  g.beginPath(); g.ellipse(236, 327, 78, 20, -.04, 0, TAU); g.strokeStyle = hexA(C.peach, 1); g.lineWidth = 3; g.stroke();
  g.fillStyle = C.ink2; g.font = '600 18px "JetBrains Mono", monospace'; g.fillText('ETH | ETC ?', 330, 334);
}
const BOARDS = {
  3:{ title:'2017', lines:['ICO = ?', 'white paper ≠ code', 'gas: auction ?!'], circle:'#4,370,000', side:'5 → 3 ETH' },
  4:{ title:'DeFi', lines:['vault ≥ 150%', 'APY 12,000% ?!', '→ read the code'], circle:'32 ETH', side:'Beacon' },
  5:{ title:'London', lines:['base fee → burned', '+ tip', 'EIP-1559'], circle:'#12,965,000', side:'burn' },
  6:{ title:'The Merge', lines:['TTD:', '58,750,000,000,', '000,000,000,000'], circle:'#15,537,394', side:'PoW → PoS' },
  7:{ title:'Ten years', lines:['blobs → L2', 'EIP-7702', '30.07.2015 → 2025'], circle:'#22,431,084', side:'thanks!' },
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
  rr(g, 1116, 262, 80, 50, 3); fs(g, C.parch); g.fillStyle = C.ink2; g.font = '600 12px "JetBrains Mono", monospace'; g.fillText('CABLES', 1128, 292);
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
  const f = FACTS[id]; $('toastHead').textContent = 'Real fact · ' + f.date; $('toastRow').textContent = f.title;
  const t = $('toast'); t.classList.add('show'); sfx('ledger'); clearTimeout(toastTm); toastTm = setTimeout(() => t.classList.remove('show'), 3400);
  renderPanel(); pulseCarnet();
}
function pulseCarnet(){ const b = $('carnetBtn'); b.classList.remove('pulse'); void b.offsetWidth; if (!reduce) b.classList.add('pulse'); }
function renderPanel(){
  const rows = [
    ['Address', ch1.account ? short(addr) : 'No account yet'],
    ['Balance', ch1.eth ? `${ch1.eth} ETH` : '0 ETH'],
    ['Key and password', ch1.keep != null ? KEEP_SHORT[ch1.keep] : '—'],
    ['Your block zero', ch1.built ? (ch1.downloaded ? 'Built yourself (after a fake file)' : 'Built yourself') : '—'],
  ];
  if (chap === 2 || ch2.chain){
    rows[1][1] = ch2.invested ? (ch2.chain === 'eth' ? '1 ETH (to reclaim from the refund contract)' : ch2.chain === 'etc' ? '1 ETH in The DAO, still bound by its code' : 'DAO tokens (for 1 ETH)') : (ch1.eth ? '1 ETH' : '0 ETH');
    rows.push(['The DAO', ch2.invested ? 'You put your ether in' : 'You didn\'t touch it']);
    rows.push(['Chain followed', ch2.chain === 'eth' ? 'Ethereum (with the fork)' : ch2.chain === 'etc' ? 'Ethereum Classic (without the fork)' : '—']);
  }
  if (typeof journeyLines === 'function') journeyLines().slice(2).forEach(([y, t]) => rows.push([y, t]));
  if (CHS[7].guardians) rows[2][1] += ' · + guardians (EIP-7702)';
  if (chap >= 3 || chapterDone >= 3) rows.splice(1, 1);
  $('acct').innerHTML = rows.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('');
  const got = FACT_ORDER.filter(id => facts.includes(id));
  $('frise').innerHTML = got.length ? got.map(id => `<li><b>${FACTS[id].date}</b><strong>${FACTS[id].title}</strong>${FACTS[id].text}</li>`).join('') : '<li class="empty">Nothing yet. Real facts are added here as the chapter goes on.</li>';
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
    mcard.innerHTML = `<p class="eyebrow">Your account</p><h2>Where do you keep your key?</h2><p>Your key file (the “keystore”) and your password. Without both, this account is lost forever. With both, anyone can empty it.</p><div class="rules">${KEEP.map((k, i) => `<button class="rule radio" aria-pressed="false" data-k="${i}">${k}</button>`).join('')}</div><div class="row"><button class="btn primary" id="kOk" disabled>Decided</button></div>`;
    modal.hidden = false; mcard.querySelector('.rule').focus({ preventScroll:true });
    mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => { sfx('select'); pick = +b.dataset.k; mcard.querySelectorAll('.rule').forEach(x => x.setAttribute('aria-pressed', String(x === b))); $('kOk').disabled = false; }));
    $('kOk').addEventListener('click', () => { closeModal(); res(pick); });
  });
}
function showSendFail(){
  return new Promise(res => {
    mcard.className = 'card';
    mcard.innerHTML = `<p class="eyebrow">Karim's laptop · 30 July 2015</p><h2>Send 1 ETH</h2><ul class="txs"><li><span>To</span><b>${short(addr)}</b></li><li><span>Amount</span><b>1 ETH</b></li><li><span>Gas needed</span><b>21,000</b></li><li><span>Gas limit of a block</span><b>5,000</b></li></ul><div class="verdict ko"><span class="pill">Rejected</span>This transaction doesn't fit in any block.</div><div class="row"><button class="btn primary" id="fOk">Huh?</button></div>`;
    modal.hidden = false; sfx('fail'); $('fOk').focus({ preventScroll:true });
    $('fOk').addEventListener('click', () => { closeModal(); res(); });
  });
}
function showGasLimit(){
  return new Promise(res => {
    const LO = 18000, HI = 22000, pct = v => clamp((v - LO) / (HI - LO) * 100, 0, 100);
    let L = 19850, crossed = false, sent = false, blocks = 0, timer = null;
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Karim's machine · Friday 7 August 2015</p><h2>The limit is rising</h2>
      <p>With each block, the miner raises the gas limit by at most 1/1024. A simple transfer needs 21,000.</p>
      <div class="meter big"><div class="fill" id="gFill"></div><i class="mark" style="left:${pct(21000)}%"><span>21,000</span></i></div>
      <p class="meter-legend"><span>Block gas limit: <b id="gVal"></b></span><span id="gBlocks"></span></p>
      <p class="gblock" id="gBlock"></p>
      <ul class="tradelog" id="gLog"></ul>
      <div class="row"><button class="btn primary" id="gSend">Send Karim's ether (21,000 gas)</button></div>
      <p class="small">Sped up for the game. The limit of 21,003 at block 46,147 is real.</p>`;
    modal.hidden = false; $('gSend').focus({ preventScroll:true });
    const log = (txt, cls) => { const li = document.createElement('li'); li.textContent = txt; if (cls) li.className = cls; const ul = $('gLog'); ul.appendChild(li); while (ul.children.length > 4) ul.firstChild.remove(); };
    const draw = () => { $('gFill').style.width = pct(L) + '%'; $('gFill').classList.toggle('over', L < 21000); $('gVal').textContent = fmt(L); $('gBlocks').textContent = crossed ? '' : `+${blocks} blocks`; };
    const tick = () => {
      if (crossed) return;
      blocks++; L = L + Math.floor(L / 1024);
      if (L >= 21000){ L = 21003; crossed = true; clearInterval(timer); sfx('ledger');
        $('gBlock').textContent = 'Block 46,147 · 7 August 2015, 03:30:33 UTC';
        log('Limit: 21,003. One transaction just fits: 21,000 gas. It isn\'t Karim\'s. It\'s the very first on the network.');
        learn('first');
        $('gSend').textContent = "Resend Karim's ether"; }
      draw();
    };
    draw(); timer = setInterval(tick, DEBUG && window.__fast ? 5 : 120);
    $('gSend').addEventListener('click', () => {
      if (sent){ closeModal(); res(); return; }
      if (!crossed){ sfx('fail'); log(`Rejected: 21,000 doesn't fit in ${fmt(L)}.`); return; }
      sent = true; sfx('gift'); log('A few blocks later: included. 1 ETH arrives at your address.', 'ok');
      $('gSend').textContent = 'Continue';
    });
  });
}
function fadeTo(txt){ const f = $('fade'); f.textContent = txt; f.classList.add('on'); return wait(reduce ? 200 : 1000); }
function fadeOut(){ $('fade').classList.remove('on'); return wait(reduce ? 100 : 900); }

/* ---------- chapitre 1 : Frontier ---------- */
async function chapter1(){
  resetWorld(); chap = 1; buildCache(); { const d = readSave(); chapterDone = d ? d.chapterDone : 0; } phase = 'intro'; lock = true; busy = true;
  setDate('Thursday 30 July 2015 · 17:02'); track('Histoire lancée', { chapitre:1 });
  await wait(250);
  await walkTo(player, 800, 820, 220);
  player.face = -1;
  await say(null, "Thursday 30 July 2015, late afternoon. A hackerspace in Paris, two floors above a print shop. It smells of cold coffee and solder.");
  face(lena, player);
  await say('Lena', "You came! Tonight, Ethereum starts for real. Not a test network: the real one, the one that will never stop.");
  await say('Lena', "Last summer, during the presale, I bought ether with bitcoin. Two thousand ether for one bitcoin, in the first two weeks.");
  $('carnetBtn').hidden = false; learn('presale');
  const c = await say('Lena', "For a year, all I've had is a small file and a password.", ['Just a file?', 'What if you lose the password?']);
  if (c === 0) await say('Lena', "An encrypted file, yes. My ether is already written into the chain's block zero. This file holds the key to claim it.");
  else await say('Lena', "Then nobody can help me. No support, no “forgot password”. I've copied it in three places, and I check almost every night.");
  await say('Lena', "Go and see Karim, by the purring machine. He'll explain what we're waiting for.");
  setObjective('Talk to Karim, by the purring machine'); phase = 'karim'; free();
}
async function karimIntro(){
  lock = true; busy = true; face(karim, player);
  await say('Karim', "Hi! Hear that noise? Three graphics cards. Tonight they'll compute non-stop to find blocks. Each block found pays its miner 5 ether.");
  await say('Karim', "But first we need a chain. And nobody is going to press a “launch” button. Everyone will build block zero, the genesis, themselves, on their own machine.");
  const c = await say('Karim', "If everyone gets exactly the same block zero, we're all on the same chain. If not, we're not.", ['How does everyone agree?', 'Why not just download it?']);
  const how = ["The genesis script is public. It takes one piece of data nobody knows yet: the hash of a future block on the test network, number 1,028,201.", "Until that block is mined, nobody can prepare their genesis in advance. Not even the people who wrote the code."];
  const why = ["Downloading it means trusting whoever gives it to you. If you build it yourself and get the same hash as everyone else, you don't need to believe anyone."];
  for (const l of (c === 0 ? [...how, ...why] : [...why, ...how])) await say('Karim', l);
  await say('Karim', "Block 1,028,201 is due in a few minutes. Go to your laptop, on the big table.");
  setObjective('Build block zero on your laptop'); phase = 'genesis'; free();
}
async function genesisTerminal(){
  lock = true; busy = true;
  term.open('Your laptop · terminal');
  await term.cmd('python mk_genesis_block.py --extradata ???');
  term.line("The hash of block 1,028,201 of the test network is missing. Nobody knows it yet.", 'dim');
  const ctr = term.line('', 'big');
  for (let n = 1028189; n <= 1028201; n++){ ctr.textContent = `Test network · block ${fmt(n)}`; sfx('blip'); await wait(reduce ? 60 : 360); }
  sfx('ledger');
  term.line('Block 1,028,201 mined. Its hash:');
  term.line(GENESIS_EXTRA, 'hash');
  learn('genesis');
  term.extra('<p class="chatmsg"><b>#ethereum</b> · a stranger: “No time to run the script? genesis_block.json ready-made here, verified, 100% official.”</p>');
  const c = await term.buttons([['Run the script myself', true], ['Download the ready-made file']]);
  term.extra('');
  if (c === 1){
    ch1.downloaded = true;
    await term.cmd('wget http://…/genesis_block.json');
    term.line('genesis_block.json saved. Hash of block zero:');
    term.line(FAKE_HASH, 'hash bad');
    await term.buttons([['Show Lena', true]]);
    closeModal(); face(lena, player); face(player, lena);
    await say('Lena', "Let me see… Your block zero starts with 0x5f3e. Mine starts with 0xd4e5. So does Karim's.");
    await say('Lena', "That file would put you on a different chain from ours, with different balances in it. A joke or a trap, we'll never know. Delete it and build your own: that's the whole point of the script.");
    closeDialog();
    term.open('Your laptop · terminal');
    await term.cmd('rm genesis_block.json');
  }
  await term.cmd(`python mk_genesis_block.py --extradata ${GENESIS_EXTRA} > genesis_block.json`);
  for (const s of ['Adding presale balances… ok', 'Computing block zero… ok', 'Writing genesis_block.json… ok']){ await wait(reduce ? 80 : 520); term.line(s, 'dim'); }
  term.line('Hash of your block zero:');
  term.line(GENESIS_HASH, 'hash good');
  ch1.built = true; renderPanel();
  await term.buttons([['Compare with Lena and Karim', true]]);
  const sh = GENESIS_HASH.slice(0, 10) + '…' + GENESIS_HASH.slice(-6);
  term.extra(`<ul class="cmp">${['You', 'Lena', 'Karim'].map(n => `<li><b>${n}</b><code>${sh}</code><i>✓</i></li>`).join('')}</ul>`);
  term.line('Three machines, the same block zero three times. Nobody gave it to anybody.', 'ok');
  sfx('gift');
  await term.buttons([['Continue', true]]);
  closeModal();
  face(karim, player);
  await say('Karim', "Same hash everywhere, perfect! Create your account and start your node. It's 17:20: the first block won't be long now.");
  setDate('Thursday 30 July 2015 · 17:20');
  setObjective('Create your account and start your node (laptop)'); phase = 'node'; free();
}
async function nodeTerminal(){
  lock = true; busy = true;
  term.open('Your laptop · terminal');
  await term.cmd('geth account new');
  term.line('Your new account is locked with a password. Please give a password. Do not forget this password.', 'dim');
  term.line('Passphrase: ••••••••••••', 'dim'); term.line('Repeat passphrase: ••••••••••••', 'dim');
  await wait(400);
  term.line(`Address: {${addr.slice(2)}}`, 'ok');
  ch1.account = true; renderPanel();
  term.line("Your key is saved in a file, encrypted with your password. Without both, this account is lost forever.", 'note');
  await term.buttons([['Choose where to keep them', true]]);
  closeModal();
  let k = await showKeep();
  face(lena, player);
  for (;;){
    if (k === 2){ await say('Lena', "The password on paper at home, the file on a USB stick: two separate things, far from the internet. That's what I did too."); break; }
    const txt = k === 0 ? "A sticky note under the screen? In a hackerspace with twenty people coming through every evening? The first person who copies your file and reads the note owns your account."
      : "An email to yourself… The day your mailbox gets hacked, the thief finds the file and the password in the same place.";
    const r = await say('Lena', txt, ['You\'re right, I\'ll change it', 'I\'ll keep it like this']);
    if (r === 1){ await say('Lena', "It's your account. Nobody can decide for you. Or help you afterwards."); break; }
    closeDialog(); ch1.keepChanged = true; k = await showKeep();
  }
  ch1.keep = k; renderPanel(); closeDialog();
  term.open('Your laptop · terminal');
  await term.cmd('geth --genesis genesis_block.json console');
  term.line('Node started. Looking for peers…', 'dim');
  const peers = term.line('', 'dim');
  for (let p = 1; p <= 9; p++){ peers.textContent = `Peers connected: ${p}`; await wait(reduce ? 40 : 220); }
  term.line('Waiting for the first block…', 'dim');
  await wait(1100);
  setDate('Thursday 30 July 2015 · 17:26');
  term.line('15:26 UTC · the chain starts', 'ok'); sfx('ledger');
  for (let b = 1; b <= 4; b++){ await wait(reduce ? 100 : 700); term.line(`Block #${b} imported · 0 transactions`, 'dim'); }
  learn('launch');
  term.line('The blocks arrive, one by one. They are all empty.', 'note');
  await term.buttons([["Look up from the screen", true]]);
  closeModal();
  await launchNight();
}
async function launchNight(){
  rig.on = true;
  await say(null, "17:26 in Paris, 15:26 in Greenwich. For a few seconds, nobody speaks. Then everyone talks at once.");
  face(lena, player);
  await say('Lena', "My turn. I'm finally going to open my presale file.");
  closeDialog();
  term.open('Lena\'s laptop');
  await term.cmd('geth wallet import presale.wallet');
  term.line('Passphrase: ••••••••••••••••', 'dim');
  await wait(900);
  term.line('Address: {…}', 'ok');
  term.line('Balance: her presale ether, there since block zero.', 'ok');
  ch1.lenaEth = true;
  await term.buttons([['Continue', true]]);
  closeModal();
  await say('Lena', "It's there. It was there from the start, in block zero. A year of staring at a file, and now it's… real.");
  closeDialog(); await wait(500);
  rig.flash = 1; sfx('grow'); floatText(1235, 560, '+5 ETH'); face(karim, player);
  await say('Karim', "I got one! My machine just found a block! Five ether, mine, written into the chain!");
  await say('Karim', "Hang on, I'll send you one. Your first ether, to celebrate. Give me your address.");
  closeDialog();
  await showSendFail();
  await say('Karim', "Oh, right. I forgot. That's on purpose.");
  learn('gas');
  await say('Lena', "Frontier starts with a limit of 5,000 units of gas per block. A simple transfer needs 21,000. So nobody can send anything to anyone.");
  const c = await say('Lena', "That's what the first days are for: letting miners settle in, and checking the chain holds up.", ['And then?', 'Will it take long?']);
  if (c === 1) await say('Lena', "Nobody really knows. It depends on the miners.");
  await say('Lena', "They're the ones who raise the limit. With each block, whoever found it can nudge it a tiny bit: one 1,024th at most. From 5,000 to 21,000 takes at least 1,470 blocks in a row.");
  learn('rule');
  await say('Karim', "I'm not moving from here. You, go and get some sleep. The sofa's free.");
  setDate('Thursday 30 July 2015 · 23:40');
  setObjective('Take a break on the sofa'); phase = 'sleep'; free();
}
async function sleepWeek(){
  lock = true; busy = true;
  await walkTo(player, 360, 836, 220, true);
  sleeping = true;
  await fadeTo('One week later.');
  sky = 'dawn'; sleeping = false;
  Object.assign(player, { x:380, y:846, face:1, target:null });
  Object.assign(lena, { x:880, y:800, face:1 });
  Object.assign(karim, { x:1070, y:792, face:-1 });
  cat.sleep = false; Object.assign(cat, { x:980, y:850, face:-1 });
  setDate('Friday 7 August 2015 · 05:28');
  snapCam();
  await fadeOut();
  await say(null, "A week has gone by. Tens of thousands of blocks, all empty. Friday 7 August 2015, 5:28 in the morning.");
  karim.gesture = true;
  await say('Karim', "Hey! Wake up! The limit is rising, we're nearly there. Come and see!");
  setObjective('Join Karim at his machine'); phase = 'thaw'; free();
}
async function thaw(){
  lock = true; busy = true; face(karim, player);
  await showGasLimit();
  ch1.eth = 1; renderPanel();
  await flyEth([karim.x, karim.y - 140 * persp(karim.y)], [player.x, player.y - 120 * persp(player.y)], 1.1);
  await say('Karim', "Your first ether. Not the world's first, but yours.");
  face(lena, player);
  await say('Lena', "And now that transactions go through, everyone can build. Contracts, tokens, whole organisations written in code…");
  await say('Karim', "You say that as if nothing could go wrong.");
  await say('Lena', "Nothing can go wrong. It's code.");
  closeDialog();
  chapterDone = Math.max(chapterDone, 1); phase = 'free'; setObjective(null);
  const saved = writeSave();
  track('Histoire chapitre fini', { chapitre:1, telecharge:ch1.downloaded, cle:ch1.keep });
  showEnd(saved);
}
function showEnd(saved){
  const keepTxt = ch1.keep === 2 ? 'You put your password on paper and your file on a USB stick, kept apart.' : `You kept your key like this: ${KEEP[ch1.keep].toLowerCase()}. ${ch1.keepChanged ? 'Even though you changed your mind once.' : 'Lena did not agree.'}`;
  const you = [
    ch1.downloaded ? 'You first downloaded a ready-made block zero. It matched nobody\'s: you ended up building your own.' : 'You built your block zero yourself, and it matched everyone else\'s.',
    keepTxt, 'You received your first ether, a week after the launch.',
  ];
  const truth = FACT_ORDER1.map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  $('endCard').innerHTML = `<p class="eyebrow">Chapter 1 complete · Frontier</p><h2>The week it all began</h2>
    <p class="endsec">What you did</p><ul class="recap">${you.map(r => `<li>${r}</li>`).join('')}</ul>
    <p class="endsec">What really happened</p><ol class="truth">${truth}</ol>
    <p class="hint">Lena, Karim, Wei and the hackerspace are made up. The dates, blocks, hashes and figures are real: <a href="https://ethereum.org/en/history/" target="_blank" rel="noopener">ethereum.org/history</a> · <a href="https://etherscan.io/block/0" target="_blank" rel="noopener">block 0</a> · <a href="https://etherscan.io/block/46147" target="_blank" rel="noopener">block 46,147</a>.</p>
    <p class="teaser"><b>Chapter 2 · 2016, The DAO.</b> An investment fund run entirely by code, more than 3.6 million ether siphoned off, and a question nobody had planned for: do we have the right to rewrite history?</p>
    <div class="row"></div>${saved ? '<p class="hint">Progress saved on this device.</p>' : ''}`;
  const row = $('endCard').querySelector('.row');
  endButtons(1).forEach(([label, fn, primary]) => {
    const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}

/* ---------- chapitre 2 : The DAO (mai – juillet 2016) ---------- */
function showCode(){
  return new Promise(res => {
    const OPTS = ['The balance is set to zero after the ether is sent', 'There is no password', 'The amount is miscalculated'];
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Karim's laptop · simplified version</p><h2>What bothers Karim</h2>
      <pre class="code">function withdraw(who):
  amount = balance[who]
  send(amount, who)
  balance[who] = 0</pre>
      <p>When a contract receives ether, it can run its own code… including calling <code>withdraw()</code> again before the next line runs.</p>
      <p><b>What's wrong?</b></p>
      <div class="rules">${OPTS.map((o, i) => `<button class="rule radio" aria-pressed="false" data-o="${i}">${o}</button>`).join('')}</div>
      <div id="cVerdict"></div><div class="row" id="cRow"></div>`;
    modal.hidden = false; mcard.querySelector('.rule').focus({ preventScroll:true });
    mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => {
      if ($('cRow').firstChild) return;
      const ok = b.dataset.o === '0'; sfx(ok ? 'gift' : 'fail');
      mcard.querySelectorAll('.rule').forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.disabled = true; });
      $('cVerdict').innerHTML = `<div class="verdict ${ok ? 'ok' : 'ko'}"><span class="pill">${ok ? 'Well spotted' : 'Not quite'}</span>The contract sends the ether <b>before</b> setting the balance to zero. A clever contract can call <code>withdraw()</code> again during the transfer, over and over: its balance hasn't changed yet. This is called a recursive call, or “reentrancy”.</div>`;
      const c = document.createElement('button'); c.className = 'btn primary'; c.textContent = 'Continue'; $('cRow').appendChild(c); c.focus({ preventScroll:true });
      c.addEventListener('click', () => { closeModal(); res(ok); });
    }));
  });
}
function showDrain(){
  return new Promise(res => {
    const TOTAL = 11500000, TARGET = 3640000;
    let child = 0, calls = 0, timer = null, ended = false;
    mcard.className = 'card wide';
    mcard.innerHTML = `<p class="eyebrow">Your laptop · Friday 17 June 2016</p><h2>Someone is draining The DAO</h2>
      <div class="counters" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div class="pricey"><span>The DAO</span><b id="dDao"></b><small>ETH</small></div><div><span>The attacker's “child DAO”</span><b id="dChild"></b><small>ETH</small></div></div>
      <ul class="tradelog" id="dLog"></ul>
      <div class="row"><button class="btn primary" id="dStop">Stop it</button></div>
      <p class="small">Animation. Real figures: more than 3.6 million ETH, about a third of The DAO's 11.5 million.</p>`;
    modal.hidden = false; $('dStop').focus({ preventScroll:true });
    const log = t => { const li = document.createElement('li'); li.textContent = t; const ul = $('dLog'); ul.appendChild(li); while (ul.children.length > 4) ul.firstChild.remove(); };
    const draw = () => { $('dDao').textContent = fmt(Math.round((TOTAL - child) / 1000) * 1000); $('dChild').textContent = fmt(Math.round(child / 1000) * 1000); };
    draw();
    timer = setInterval(() => {
      calls++; child = Math.min(TARGET, child + 52000 + (calls % 3) * 9000); sfx('pop');
      if (calls % 9 === 0) log(`withdraw() → withdraw() → withdraw()… call no. ${calls}`);
      if (child >= TARGET){ clearInterval(timer); ended = true; sfx('theft'); $('dChild').textContent = '3,6 M+'; $('dDao').textContent = '≈ 7,9 M';
        log('It stops. More than 3.6 million ETH are gone.'); learn('hack'); $('dStop').textContent = 'Continue'; }
      else draw();
    }, DEBUG && window.__fast ? 5 : 110);
    $('dStop').addEventListener('click', () => {
      if (ended){ closeModal(); res(); return; }
      sfx('fail'); log('Impossible. Nobody can stop a contract: it does what its code allows.');
    });
  });
}
async function chapter2(d){
  resetWorld(); if (d) loadSave(d); chap = 2; buildCache();
  Object.assign(ch2, { invested:false, spotted:null, chain:null, heard:0 });
  sky = 'day'; rig.on = true; cat.sleep = true;
  Object.assign(karim, { x:1070, y:792, face:1 }); Object.assign(lena, { x:430, y:800, face:1 });
  phase = 'c2-intro'; lock = true; busy = true; snapCam();
  setDate('Tuesday 17 May 2016 · 18:40'); track('Histoire lancée', { chapitre:2 });
  $('carnetBtn').hidden = false; renderPanel();
  await wait(250);
  await walkTo(player, 800, 820, 220); player.face = -1;
  await say(null, "May 2016. At the hackerspace, the sofa has moved. The coffee machine hasn't. Karim's machine is still running.");
  learn('homestead');
  face(lena, player);
  await say('Lena', "Perfect timing! Have you heard of The DAO? An investment fund with no boss, no office, no bank. Just a contract on Ethereum.");
  await say('Lena', "You send ether to the contract, you get DAO tokens. Then the holders vote to fund projects. The code does the rest.");
  learn('daosale');
  const c = await say('Lena', "Since 30 April, everyone's been putting their ether in. A huge share of all the ether in existence!", ['Who checks the code?', 'What if it goes wrong?']);
  if (c === 0) await say('Lena', "Very serious people have reviewed it. And everything is public: anyone can read it. If there were a problem, someone would have seen it, right?");
  else await say('Lena', "What could go wrong? No human to run off with the till. Just written rules that anyone can read.");
  if (ch1.keep === 0) await say('Lena', "By the way… your sticky note is still under your screen. Just saying.");
  await say('Lena', "Karim isn't convinced, of course. Go and see him, he'll show you what bothers him.");
  setObjective('Ask Karim what bothers him'); phase = 'c2-karim'; free();
}
async function c2Karim(){
  lock = true; busy = true; face(karim, player);
  await say('Karim', "Lena wants me to put my ether in. Me, I read the code before trusting anyone with my ether. Even when that anyone is a contract.");
  if (ch1.downloaded) await say('Karim', "Remember your fake block zero? Same idea: check before you trust. Look at this bit.");
  else await say('Karim', "Look at this bit. I've simplified it, but the idea is the same.");
  closeDialog();
  ch2.spotted = await showCode();
  await say('Karim', ch2.spotted ? "There. You saw it in ten seconds. People have been talking about it on the forums for days, and the money keeps pouring in." : "Subtle, huh? People have been talking about it on the forums for days, and the money keeps pouring in.");
  const c = await say('Karim', "And you? Are you putting your ether in?", ["I'm putting my ether in", 'I\'m keeping it']);
  ch2.invested = c === 0;
  if (ch2.invested){
    await say('Karim', ch2.spotted ? "Even after seeing that? Fine. It's your ether." : "It's your ether. I hope you're right.");
    closeDialog();
    term.open('Your laptop · terminal');
    await term.cmd('send 1 ETH → The DAO');
    await wait(500); term.line('Transaction included.', 'ok'); term.line('Received: DAO tokens, at your address.', 'ok');
    await term.buttons([['Continue', true]]); closeModal();
    face(lena, player); await say('Lena', "Welcome among the owners of The DAO!");
  } else await say('Karim', "Wise. We'll see who was right.");
  renderPanel();
  closeDialog(); await c2June();
}
async function c2June(){
  await fadeTo('One month later.');
  setDate('Friday 17 June 2016 · 10:05');
  Object.assign(player, { x:640, y:820, face:1, target:null }); Object.assign(lena, { x:430, y:800, face:1 }); Object.assign(karim, { x:880, y:790, face:-1 });
  snapCam(); await fadeOut();
  karim.gesture = true;
  await say('Karim', "Have you seen?! Someone is draining The DAO. Right now! Look on your laptop!");
  setObjective('See what\'s happening (laptop)'); phase = 'c2-drain'; free();
}
async function c2Drain(){
  lock = true; busy = true;
  await showDrain();
  face(lena, player);
  await say('Lena', ch2.invested ? "Our ether… Yours too. It was supposed to be the code that decides. And the code decided." : "It was supposed to be the code that decides. And the code decided.");
  await say('Karim', "Send first, reset the balance after. Exactly what we saw.");
  await say('Karim', "There's one piece of good news: the ether is stuck in a child DAO. The thief can't withdraw anything for about 27 days.");
  learn('delay');
  await say('Lena', "27 days to decide what to do.");
  closeDialog();
  await fadeTo('20 July 2016.');
  sky = 'day'; setDate('Wednesday 20 July 2016 · 15:05');
  Object.assign(player, { x:800, y:840, face:-1, target:null }); Object.assign(lena, { x:520, y:810, face:1 }); Object.assign(karim, { x:1040, y:800, face:-1 }); cat.sleep = false; Object.assign(cat, { x:760, y:860, face:1 });
  snapCam(); await fadeOut();
  await say(null, "20 July 2016, early afternoon. Block 1,920,000 is approaching. Tonight, there may be two Ethereums.");
  await say('Karim', "The soft fork, the one that was just meant to freeze the stolen ether, fell through at the end of June: someone found a flaw in it. Only the hard fork is left.");
  learn('softfork');
  await say('Lena', "At block 1,920,000, the nodes that accept the fork will move The DAO's ether to a refund contract. Everyone will be able to get back what they put in.");
  await say('Karim', "And those who refuse will stay on the original chain. The one where what's written stays written.");
  phase = 'c2-debate'; closeDialog();
  await c2Debate();
}
async function c2Debate(){
  lock = true; busy = true;
  const said = new Set();
  for (;;){
    const opts = ['Lena, why fork?', 'Karim, why refuse?'];
    const c = await say(null, "Lena and Karim look at each other. Each is waiting for your question.", said.size >= 2 ? [...opts, 'I\'ve heard enough'] : opts);
    if (c === 2) break;
    said.add(c);
    if (c === 0){ face(lena, player);
      await say('Lena', "Because it's theft, plain and simple. If we can fix it, why let it happen? A community has the right to correct a mistake that big.");
      await say('Lena', "And we only touch The DAO's contracts. No other balance moves.");
    } else { face(karim, player);
      await say('Karim', "Because Ethereum's promise is that nobody can change the rules after the fact. If we do it once for The DAO, who decides next time?");
      await say('Karim', "The contract did what its code said. It's harsh, but that's what “code is law” means.");
    }
  }
  ch2.heard = said.size;
  face(lena, player);
  await say('Lena', "Your node, your choice. Nobody can make it for you. Not Karim, not me.");
  setObjective('Choose which chain your node follows (laptop)'); phase = 'c2-fork'; free();
}
async function c2Fork(){
  lock = true; busy = true;
  term.open('Your laptop · terminal');
  term.line('Geth 1.4.10 offers two options. Your node will follow the chain you choose.', 'note');
  term.extra('<p class="chatmsg"><b>--support-dao-fork</b>: at block 1,920,000, move The DAO\'s ether to the refund contract.<br><b>--oppose-dao-fork</b>: change nothing, stay on the original chain.</p>');
  const c = await term.buttons([['geth --support-dao-fork', true], ['geth --oppose-dao-fork', true]]);
  term.extra('');
  ch2.chain = c === 0 ? 'eth' : 'etc';
  await term.cmd(c === 0 ? 'geth --support-dao-fork' : 'geth --oppose-dao-fork');
  const ctr = term.line('', 'big');
  for (let n = 1919994; n <= 1920000; n++){ ctr.textContent = `Block ${fmt(n)}`; sfx('blip'); await wait(reduce ? 80 : 520); }
  sfx('ledger'); setDate('Wednesday 20 July 2016 · 15:20');
  term.line('Block 1,920,000 · 20 July 2016, 13:20:40 UTC', 'ok');
  if (c === 0){ term.line("≈ 12 million ETH moved from The DAO's contracts to the recovery contract.", 'ok'); term.line('Your node follows the modified chain: Ethereum.', 'dim'); }
  else { term.line('No change. Your node follows the original chain: Ethereum Classic.', 'ok'); term.line("The DAO's ether stays where the code put it.", 'dim'); }
  learn('fork');
  term.line('At this moment, every balance exists on both chains. Your ether too.', 'note');
  learn('etc');
  renderPanel();
  await term.buttons([["Look up from the screen", true]]);
  closeModal();
  await c2After();
}
async function c2After(){
  const eth = ch2.chain === 'eth';
  await say(null, "Block 1,920,000 has passed. In the room, two screens no longer show the same chain.");
  face(karim, player);
  if (eth) await say('Karim', "So you're with Lena. No hard feelings. My machine is staying on the old chain. There won't be many of us.");
  else await say('Karim', "Welcome to the original chain. There won't be many of us, but we'll be here.");
  face(lena, player);
  await say('Lena', "Almost all the miners have gone over to the fork. But Karim is right about one thing: the original chain isn't going to disappear.");
  if (ch2.invested) await say(eth ? 'Lena' : 'Karim', eth ? "And your DAO tokens: you'll be able to get your ether back from the refund contract." : "Your DAO tokens, on this chain… Nothing has moved. Your ether stays in The DAO, bound by its code. The code has spoken.");
  await say('Lena', "Karim… are we still friends?");
  await say('Karim', "We just chose two different stories. You and I are still in the same one.");
  closeDialog();
  chapterDone = Math.max(chapterDone, 2); phase = 'free'; setObjective(null);
  const saved = writeSave();
  track('Histoire chapitre fini', { chapitre:2, investi:ch2.invested, faille:ch2.spotted, chaine:ch2.chain });
  showEnd2(saved);
}
function showEnd2(saved){
  const eth = ch2.chain === 'eth';
  const you = [
    ch2.spotted ? 'You spotted the flaw in The DAO\'s code before it was exploited.' : 'The flaw in the code slipped past you. It slipped past a lot of people.',
    ch2.invested ? (eth ? 'You had put your ether in The DAO. With the fork, you got it back.' : 'You had put your ether in The DAO. On the original chain, it stayed bound by its code.') : 'You kept your ether out of The DAO.',
    ch2.heard >= 2 ? 'You listened to both sides before deciding.' : 'You decided without hearing both sides.',
    eth ? 'Your node followed the fork: you\'re on Ethereum, like the vast majority.' : 'Your node refused the fork: you\'re on Ethereum Classic, with the minority who wanted nothing to change.',
  ];
  const truth = FACT_ORDER2.map(id => `<li><b>${FACTS[id].date}</b><span>${FACTS[id].text}</span></li>`).join('');
  $('endCard').innerHTML = `<p class="eyebrow">Chapter 2 complete · The DAO</p><h2>The summer the chain split</h2>
    <p class="endsec">What you did</p><ul class="recap">${you.map(r => `<li>${r}</li>`).join('')}</ul>
    <p class="endsec">What really happened</p><ol class="truth">${truth}</ol>
    <p class="hint">There is no right answer: both chains still exist, and the debate between “righting a wrong” and “never rewriting history” isn't over. Lena, Karim and Wei are made up, the facts are real: <a href="https://ethereum.org/en/history/" target="_blank" rel="noopener">ethereum.org/history</a> · <a href="https://blog.ethereum.org/2016/06/17/critical-update-re-dao-vulnerability" target="_blank" rel="noopener">17 June alert</a> · <a href="https://blog.ethereum.org/2016/07/20/hard-fork-completed" target="_blank" rel="noopener">20 July fork</a>.</p>
    <p class="teaser"><b>Chapter 3 · 2017, the ICO rush.</b> Everyone launches a token, digital cats clog the network, and a wallet freezes hundreds of thousands of ether in one click.</p>
    <div class="row"></div>${saved ? '<p class="hint">Progress saved on this device.</p>' : ''}`;
  const row = $('endCard').querySelector('.row');
  endButtons(2).forEach(([label, fn, primary]) => {
    const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; busy = false; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}
const TALK2 = {
  lena(){
    const L = { 'c2-karim':"Go and see Karim. He'll tell me I'm too trusting again.", 'c2-drain':"Look on your laptop. I can't believe it.", 'c2-fork':"Your node, your choice. Nobody can make it for you.",
      free:ch2.chain === 'etc' ? "You chose the other chain. It changes nothing between us. Well, almost nothing." : "You know what scares me now? Next time someone wants to fix something, they'll remember we've done it before." };
    face(lena, player); return chat([['Lena', L[phase] || L.free]]);
  },
  karim(){
    if (phase === 'c2-karim') return c2Karim();
    const L = { 'c2-drain':"Your laptop! Look!", 'c2-fork':"I've already chosen. For you, it happens on your laptop.",
      free:ch2.chain === 'etc' ? "My machine mines on the original chain. There's plenty of room, trust me." : "My machine stays on the original chain. Someone has to keep it running." };
    face(karim, player); return chat([['Karim', L[phase] || L.free]]);
  },
  laptop(){
    if (phase === 'c2-drain') return c2Drain();
    if (phase === 'c2-fork') return c2Fork();
    if (phase === 'c2-intro' || phase === 'c2-karim') return chat([[null, "Your laptop. On the screen, dozens of tabs open about The DAO."]]);
    return chat([[null, ch2.chain === 'etc' ? "Your laptop. Your node follows Ethereum Classic, the original chain." : "Your laptop. Your node follows Ethereum, the chain with the fork."]]);
  },
  board(){ return chat([[null, "On the whiteboard, someone has written “withdraw(): 1. send, 2. balance = 0” and added “?!” in red. Below: “#1,920,000” and “ETH | ETC ?”."]]); },
  window(){ return chat([[null, "High summer on the rooftops. Outside, nobody knows a chain is splitting in two."]]); },
  rig(){ return chat([[null, "Karim's machine. He's stuck a handwritten label on it: “code is law”."]]); },
  sofa(){ return chat([[null, "The sofa has moved, but it's the same sofa. Someone left a “The DAO” T-shirt on it."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei doesn't know what a fork is. He looks perfectly happy."]]); },
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
      doneBtn('Continue', res, { good, wrong, total });
    });
  });
}

/* ---------- chapitre 3 : 2017, la ruée ---------- */
function showGasAuction(){
  return new Promise(res => {
    const PRICES = [1, 4, 20, 50];
    let mine = null, blocks = 0, included = false, bumps = 0, timer = null;
    modalCard(`<p class="eyebrow">Your laptop · Tuesday 5 December 2017</p><h2>Pay Lena back: 0.1 ETH</h2>
      <p>The network is jammed. Each block takes the transactions paying the most for gas: it's an auction. Choose your gas price.</p>
      <div class="tips rules" style="grid-template-columns:repeat(4,1fr)">${PRICES.map(p => `<button class="rule radio act" aria-pressed="false" data-p="${p}">${p} gwei</button>`).join('')}</div>
      <p class="meter-legend"><span>Lowest price accepted in the last block: <b id="aMin">—</b></span><span id="aState">Not sent yet</span></p>
      <ul class="tradelog" id="aLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration: prices changed from one block to the next. In December 2017, CryptoKitties alone accounted for about a quarter of Ethereum's traffic.</p>`);
    const floor = () => 14 + Math.round(Math.abs(Math.sin(blocks * 1.7)) * 16);
    mcard.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      if (included) return; sfx('select'); const p = +b.dataset.p;
      if (mine != null && p <= mine) return; if (mine != null) bumps++;
      mine = p; mcard.querySelectorAll('[data-p]').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
      $('aState').textContent = `Sent at ${p} gwei · pending`;
      mlog('aLog', mine > 4 && bumps ? `You replace your transaction: same content, higher price (${p} gwei).` : `Transaction sent at ${p} gwei.`);
      if (!timer) timer = setInterval(tick, tickMs(900));
    }));
    const tick = () => {
      blocks++; const f = floor(); $('aMin').textContent = f + ' gwei';
      if (mine >= f){ included = true; clearInterval(timer); sfx('ledger'); $('aState').textContent = 'Included ✓';
        mlog('aLog', `Next block: included. You paid ${mine} gwei per unit of gas${mine >= 50 ? ', far more than needed.' : '.'}`, 'ok');
        CHS[3].gas = mine; CHS[3].bumps = bumps; mcard.querySelectorAll('[data-p]').forEach(x => { x.disabled = true; }); doneBtn('Continue', res); }
      else mlog('aLog', `New block: transactions at ${f} gwei and above get in. Yours (${mine}) is waiting.`);
    };
  });
}
async function chapter3(d){
  await startChapter(3, d);
  setDate('Thursday 20 July 2017 · 19:10');
  await say(null, "Summer 2017. The hackerspace has a new coffee machine, and a shared kitty: a Parity multisig wallet that needs two signatures out of three to spend.");
  face(karim, player); karim.gesture = true;
  await say('Karim', "Did you see yesterday? Someone drained Parity multisig wallets. 153,037 ether. The same wallets as our shared kitty.");
  learn('parityhack');
  await say('Karim', "We didn't lose anything. Parity fixed the code and redeployed it the very next day. But I don't like it.");
  face(lena, player);
  await say('Lena', "Meanwhile, everyone is launching a token. All it takes is an ERC-20 contract, a website and a “white paper”. Look what someone sent me.");
  learn('erc20');
  aim('Read the white paper Lena received (Lena)', 'lena', 'c3-paper');
}
async function c3Paper(){
  lock = true; busy = true; closeDialog(); goal = null;
  const r = await showFlags({ eyebrow:'White paper · “NIMBUS”, the decentralised cloud token (made up)', title:'Spot the red flags', intro:'Select everything that should make you hesitate, then check.',
    items:[['Advertised return: x10 in three months', true], ['Anonymous team, “for security reasons”', true], ['The sale contract\'s code is published', false], ['The product is coming “soon”. The sale, though, is now', true], ['ERC-20 standard token', false], ['40% bonus if you buy within the hour', true]],
    go:'Check', explain:'A promised return, a team nobody can trace, a product that doesn\'t exist yet and pressure to buy fast: the four classic signs. A published contract or the ERC-20 standard says nothing about a project\'s honesty.' });
  CHS[3].flags = r.good;
  const c = await say('Lena', r.good >= 3 ? "You've got a good eye. Still… what if it really is the next big thing?" : "You missed some signs, but honestly, so did I at first. So, shall we?", ['I\'ll put in a little ether', 'I\'ll pass']);
  CHS[3].ico = c === 0;
  if (c === 0) await say('Lena', "Just a little, eh. We'll see what becomes of NIMBUS.");
  else await say('Lena', "You're probably right. There are three new ones a day.");
  await skip('Three months later.', 'Monday 16 October 2017 · 09:30', 'day', [[player, 900, 830, 1], [karim, 1070, 792, -1]]);
  face(karim, player);
  await say('Karim', "This morning, block 4,370,000: Byzantium. My machine gets 3 ether per block instead of 5. Feels strange.");
  learn('byzantium');
  if (CHS[3].ico) await say('Karim', "And your NIMBUS? The website hasn't responded for a week. The anonymous team has… stayed anonymous.");
  await skip('Three weeks later.', 'Tuesday 7 November 2017 · 18:45', 'evening', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 700, 800, 1]]);
  karim.gesture = true;
  await say('Karim', "The hackerspace kitty is locked. Not stolen: locked. Forever, maybe.");
  aim('Ask Karim what happened', 'karim', 'c3-parity');
}
async function c3Parity(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "Yesterday, someone found the code library that every Parity multisig depends on. It had never been initialised. He initialised it: he became its owner.");
  await say('Karim', "Then he called its “kill” function. The library self-destructed. The wallets that relied on it can't do anything any more. They can't send a single ether.");
  learn('parityfreeze');
  await say('Karim', "513,774 ether, in 587 wallets. And our kitty. He wrote that he didn't do it on purpose.");
  const c = await say('Lena', "Some people are talking about a fork, like for The DAO.", ['A fork would fix it', 'We can\'t fork after every accident']);
  CHS[3].fork = c === 0;
  if (ch2.chain === 'etc') await say('Karim', "You who chose the original chain… you know what it feels like when the code has spoken.");
  await say('Karim', c === 0 ? "Maybe. But this time there's no thief to catch, no 27-day delay. Just a mistake. I doubt the community will agree." : "That's what I think too. Even when it costs me.");
  await say('Lena', "We'll set up a new kitty. With a contract we read to the very end, this time.");
  await skip('One month later.', 'Tuesday 5 December 2017 · 21:00', 'evening', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "The whole network is clogged. People are breeding digital cats on Ethereum, CryptoKitties, and it's a quarter of the traffic!");
  learn('kitties');
  await say('Lena', "And you owe me 0.1 ether for last week's pizzas. Good luck paying me back tonight.");
  aim('Pay Lena back (laptop)', 'laptop', 'c3-gas');
}
async function c3Gas(){
  lock = true; busy = true; goal = null;
  await showGasAuction();
  face(lena, player);
  await say('Lena', CHS[3].gas >= 50 ? "Got it! You paid top price for the fees, but at least it went through." : "Got it! You found the right price. One day we'll need a better way to set fees than a blind auction.");
  await say('Karim', "What I take away from this year: code nobody reads always ends up costing a lot.");
  await say(null, "Wei stretches out on Karim's machine. He'll never be a digital cat.");
  endChapter(3, { eyebrow:'Chapter 3 complete · 2017', title:'The year everyone wanted their own token',
    you:[
      CHS[3].flags >= 3 ? `You spotted ${CHS[3].flags} red flags out of 4 in the white paper.` : `You only spotted ${CHS[3].flags} red flag(s) out of 4.`,
      CHS[3].ico ? 'You still put a little ether into NIMBUS. Its website vanished within three months.' : 'You steered clear of NIMBUS. Good.',
      CHS[3].fork ? 'For the locked kitty, you would have wanted a fork. There wasn\'t one.' : 'For the locked kitty, you accepted that we don\'t fork after every accident.',
      `You paid Lena back at the height of the CryptoKitties craze, at ${CHS[3].gas} gwei.`,
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['Parity post-mortem', 'https://medium.com/paritytech/a-postmortem-on-the-parity-multi-sig-library-self-destruct-63daca3a4cf7']],
    note:'NIMBUS is made up, like Lena, Karim, Wei and the hackerspace kitty. The events and figures are real.',
    teaser:'<b>Chapter 4 · 2020, DeFi summer.</b> A flash crash, vaults liquidated for nothing, and a summer when everyone is “farming” tokens.',
    track:{ ico:CHS[3].ico, flags:CHS[3].flags } });
}
const TALK3 = {
  lena(){ if (phase === 'c3-paper') return c3Paper(); face(lena, player); return chat([['Lena', { 'c3-parity':"Karim is beside himself. Go and see him.", 'c3-gas':"I'm waiting for my 0.1 ether! Your laptop is on the table." }[phase] || "Everyone talks about tokens. Hardly anyone talks about what they're for."]]); },
  karim(){ if (phase === 'c3-parity') return c3Parity(); face(karim, player); return chat([['Karim', { 'c3-paper':"Lena wants to show you a white paper. Get ready to laugh. Or cry.", 'c3-gas':"Even I can't get my transactions through tonight." }[phase] || "Three ether per block since Byzantium. My machine won't make me rich, but it keeps the network going."]]); },
  laptop(){ if (phase === 'c3-gas') return c3Gas(); return chat([[null, "Your laptop. Dozens of tabs: token websites, forums, a gas price chart."]]); },
  rig(){ return chat([[null, "Karim's machine. A slightly peeling “code is law” label, and a new sticky note: “read the code to the end”."]]); },
  board(){ return chat([[null, "On the whiteboard: “ICO = ?”, “white paper ≠ code”, and a gas price calculation crossed out three times."]]); },
  window(){ return chat([[null, sky === 'evening' ? "The lights of Paris come on. Somewhere, someone is buying a very expensive digital cat." : "The rooftops of Paris. Nothing has changed outside, everything has changed inside."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei, generation zero. Not for sale."]]); },
};

/* ---------- chapitre 4 : 2020, l'été de la DeFi ---------- */
function showVault(){
  return new Promise(res => {
    const COLL0 = 10, DEBT0 = 800, MIN = 1.5;
    const PATH = [197, 194, 190, 184, 178, 171, 165, 160, 152, 147, 141, 136, 131, 128, 124, 121, 118, 114, 112, 110, 108, 104, 101, 99, 97, 95, 94, 92, 91, 90, 89];
    let t = 0, coll = COLL0, debt = DEBT0, pending = null, liquidated = false, timer = null, acted = null;
    modalCard(`<p class="eyebrow">Lena's Maker vault · Thursday 12 March 2020</p><h2>The price of ether is collapsing</h2>
      <p>Lena deposited ${COLL0} ETH and borrowed ${DEBT0} DAI. If the value of her ether falls below 150% of her debt, the vault is liquidated. The network is jammed: a “normal” transaction can take a very long time.</p>
      <div class="counters"><div><span>ETH price</span><b id="vP"></b><small>$</small></div><div id="vRc"><span>Vault ratio</span><b id="vR"></b><small>minimum 150%</small></div><div><span>Liquidated if ETH falls below</span><b id="vL"></b><small>$</small></div></div>
      <div class="row" id="vAct">
        <button class="btn act" data-a="add" data-g="fast">Add 5 ETH · fast gas</button>
        <button class="btn act" data-a="add" data-g="slow">Add 5 ETH · normal gas</button>
        <button class="btn act" data-a="repay" data-g="fast">Repay 400 DAI · fast gas</button>
      </div>
      <ul class="tradelog" id="vLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration: the real price went from about $197 to $89 in under 36 hours. Lena's vault is made up.</p>`);
    const liqP = () => debt * MIN / coll;
    const draw = () => { const p = PATH[Math.min(t, PATH.length - 1)], r = coll * p / debt; $('vP').textContent = p; $('vR').textContent = liquidated ? '—' : Math.round(r * 100) + ' %'; $('vL').textContent = Math.round(liqP()); $('vRc').className = r < 1.75 ? 'pricey' : 'cheap'; };
    draw();
    mcard.querySelectorAll('[data-a]').forEach(b => b.addEventListener('click', () => {
      if (pending || acted || liquidated) return; sfx('select');
      pending = { a:b.dataset.a, at:t + (b.dataset.g === 'fast' ? 3 : 16) }; acted = b.dataset.a + '-' + b.dataset.g;
      mcard.querySelectorAll('[data-a]').forEach(x => { x.disabled = true; });
      mlog('vLog', b.dataset.g === 'fast' ? 'Sent with a high gas price. It should get through quickly.' : 'Sent at the normal price. It\'s waiting among thousands of others…');
    }));
    const end = () => { clearInterval(timer); CHS[4].vault = liquidated ? 'liquidated' : 'saved'; CHS[4].action = acted || 'none'; doneBtn('Continue', res); };
    timer = setInterval(() => {
      t++; const p = PATH[Math.min(t, PATH.length - 1)];
      if (pending && t >= pending.at){ if (pending.a === 'add') coll += 5; else debt -= 400; sfx('ledger'); mlog('vLog', pending.a === 'add' ? 'Included: 5 ETH added to the vault.' : 'Included: 400 DAI repaid.', 'ok'); pending = null; }
      if (!liquidated && p < liqP()){ liquidated = true; sfx('theft'); mlog('vLog', `Liquidated at $${p}. Lena's ether goes to auction… and a bot takes it for 0 DAI.`, 'ko'); }
      draw();
      if (t >= PATH.length - 1){ if (!liquidated) mlog('vLog', 'The price hits $89. The vault holds.', 'ok'); end(); }
    }, tickMs(550));
  });
}
async function chapter4(d){
  await startChapter(4, d);
  setDate('Thursday 12 March 2020 · 17:40'); sky = 'evening';
  await say(null, "March 2020. There's talk of a virus, of lockdown, of closing the hackerspace. And tonight, every market is falling at once.");
  face(lena, player); lena.gesture = true;
  await say('Lena', "My Maker vault! I put up 10 ether as collateral to borrow 800 DAI. If ether keeps falling, it'll be liquidated. Help me, quick!");
  aim('Help Lena save her vault (laptop)', 'laptop', 'c4-vault');
}
async function c4Vault(){
  lock = true; busy = true; goal = null;
  await showVault();
  learn('blackthursday');
  face(lena, player);
  if (CHS[4].vault === 'saved') await say('Lena', "It held… Thank you. Others weren't so lucky: the network was so jammed that bots won liquidation auctions for zero DAI.");
  else await say('Lena', "Liquidated. And you know the worst part? The network was so jammed that bots won liquidation auctions for zero DAI. My ether went for nothing.");
  await say('Karim', "$8.32 million of ether, taken for nothing. The code did exactly what it was told. Nobody had planned for a clogged network.");
  await skip('Three months later. The hackerspace reopens.', 'Monday 22 June 2020 · 18:15', 'day', [[player, 800, 830, 1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(karim, player);
  await say('Karim', "For a week now, Compound has been handing out a token, COMP, to those who lend and borrow with them. Everyone's piling in. It's called “yield farming”.");
  learn('comp');
  await say('Karim', "And look at this one: POTATO. 12,000% annual yield. Launched yesterday. No audit. I'm almost tempted.");
  aim('Decide what to do with your ether (Karim)', 'karim', 'c4-farm');
}
async function c4Farm(){
  lock = true; busy = true; goal = null; face(karim, player);
  const c = await say('Karim', "So? POTATO, or something calmer?", ['Try POTATO', 'Swap a few DAI on Uniswap, nice and easy', 'Don\'t touch anything']);
  CHS[4].farm = ['patate', 'uniswap', 'rien'][c];
  if (c === 0){ await say('Karim', "OK. Me too, just a tiny bit. To see.");
    await say(null, "Two days later, POTATO's contract has a function nobody had read: it let the creator withdraw everything. He did.");
    await say('Karim', "Gone. All of it. I told you I was only “almost” tempted…"); }
  else if (c === 1){ await say('Karim', "Uniswap? No magic yield, just swaps between tokens, with no middleman. Wise."); CHS[4].uni = true; }
  else await say('Karim', "Not touching anything is a strategy too. Often the best one.");
  await skip('Three months later.', 'Thursday 17 September 2020 · 11:20', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Uniswap just launched its token, UNI. And they're giving 400 to every address that has ever used Uniswap!");
  learn('uni');
  if (CHS[4].uni) await say('Lena', "You used it in June, didn't you? Look at your address… 400 UNI. For being there before everyone else.");
  else await say('Lena', "You'd never used it… Too bad. Nobody sees that kind of gift coming.");
  await skip('1 December 2020.', 'Tuesday 1 December 2020 · 12:55', 'day', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "That's it. I've deposited 32 ether in the deposit contract. At 13:00 Paris time, the Beacon Chain starts, and I'll be a validator.");
  learn('deposit'); learn('beacon');
  await say('Lena', "No more graphics cards needed to secure the network. You just put ether at stake, and behave.");
  aim('Talk to Karim', 'karim', 'c4-karim');
}
async function c4Karim(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "You know what that means for me? One day, my machine will be useless.");
  const c = await say('Karim', "Not right away. The Beacon Chain runs alongside, for now. But one day, the two will merge.", ['You could become a validator too', 'Your machine will have served well', 'This change is scary']);
  CHS[4].karim = c;
  await say('Karim', ['Maybe. But I\'m not sure I want 32 ether locked up. I\'ll think about it.', 'Five years. It saw the genesis, The DAO, CryptoKitties. Yes. It will have served well.', 'A little. But if it uses less energy and it\'s safer… I\'m not going to fight it.'][c]);
  endChapter(4, { eyebrow:'Chapter 4 complete · 2020', title:'DeFi summer',
    you:[
      CHS[4].vault === 'saved' ? 'You saved Lena\'s vault on Black Thursday.' : 'Lena\'s vault was liquidated on Black Thursday, despite your efforts.',
      { patate:'You tried POTATO. Its creator ran off with the money.', uniswap:'You swapped a few DAI on Uniswap. In September, 400 UNI arrived at your address.', rien:'You didn\'t touch anything during the summer of crazy yields.' }[CHS[4].farm],
      'You were there when Lena became a validator, the day the Beacon Chain started.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['MakerDAO\'s Black Thursday', 'https://www.quadrigainitiative.com/casestudy/makerdaoabnormalliquidations.php'], ['UNI launch', 'https://www.coindesk.com/business/2020/09/17/uniswaps-distribution-is-built-on-something-that-cant-be-forked-actual-users']],
    note:'POTATO and Lena\'s vault are made up. Maker, Compound, Uniswap, the dates and the figures are real.',
    teaser:'<b>Chapter 5 · 2021, London.</b> The end of blind fee auctions, and ether burned with every block.',
    track:{ vault:CHS[4].vault, farm:CHS[4].farm } });
}
const TALK4 = {
  lena(){ face(lena, player); return chat([['Lena', { 'c4-vault':"Quick, your laptop! My vault!", 'c4-farm':"Is Karim showing you his miracle yields again?", 'c4-karim':"Go and talk to Karim. I think it's weighing on him." }[phase] || "I'm a validator. If my node goes down, I lose a little. If I cheat, I lose a lot. That's proof of stake."]]); },
  karim(){ if (phase === 'c4-farm') return c4Farm(); if (phase === 'c4-karim') return c4Karim(); face(karim, player); return chat([['Karim', { 'c4-vault':"Help Lena! The price is plunging!" }[phase] || "My machine is still running. For how long, I don't know."]]); },
  laptop(){ if (phase === 'c4-vault') return c4Vault(); return chat([[null, "Your laptop. One tab shows the Beacon Chain: thousands of validators, and Lena among them."]]); },
  board(){ return chat([[null, "On the whiteboard: “vault ≥ 150%”, “APY 12,000% ?! → read the code”, and “32 ETH” circled."]]); },
  rig(){ return chat([[null, "Karim's machine is still running. He dusts it more often than he used to."]]); },
  window(){ return chat([[null, "2020. For weeks, the streets stayed empty. The chain never stopped producing blocks."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei spent lockdown at Lena's. He seems to find the hackerspace too noisy now."]]); },
};

/* ---------- chapitre 5 : 2021, London ---------- */
function showLondon(){
  return new Promise(res => {
    let burned = 0, tip = null, timer = null, base = 42;
    modalCard(`<p class="eyebrow">Your laptop · Thursday 5 August 2021</p><h2>After London: base fee + tip</h2>
      <p>Since block 12,965,000, every block shows a <b>base fee</b>, the same for everyone, which is <b>burned</b>. You only add a <b>tip</b> for the miner. No more guessing.</p>
      <div class="counters"><div><span>Block base fee</span><b id="lBase"></b><small>gwei · burned</small></div><div class="cheap"><span>ETH burned before your eyes</span><b id="lBurn">0</b><small>ETH</small></div><div><span>Your tip</span><b id="lTip">—</b><small>gwei · to the miner</small></div></div>
      <div class="tips rules">${[1, 2, 5].map(p => `<button class="rule radio act" aria-pressed="false" data-t="${p}">Tip of ${p} gwei</button>`).join('')}</div>
      <ul class="tradelog" id="lLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Illustration: the base fee rises when blocks are full and falls when they're empty. Counter figures are made up.</p>`);
    const draw = () => { $('lBase').textContent = base; $('lBurn').textContent = burned.toFixed(2).replace('.', ','); };
    draw();
    timer = setInterval(() => { base = Math.max(20, Math.min(90, base + Math.round(Math.sin(burned * 7) * 4))); burned += base * 0.0035; draw(); }, tickMs(400));
    mcard.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => {
      if (tip) return; tip = +b.dataset.t; sfx('ledger'); $('lTip').textContent = tip;
      mcard.querySelectorAll('[data-t]').forEach(x => { x.setAttribute('aria-pressed', String(x === b)); x.disabled = true; });
      mlog('lLog', `Included in the next block. You paid ${base} gwei of base fee (burned) + ${tip} gwei of tip.`, 'ok');
      mlog('lLog', tip >= 5 ? 'Your tip was generous: 1 or 2 gwei would have done, the network isn\'t jammed.' : 'A small tip is enough when the network isn\'t jammed.');
      CHS[5].tip = tip; setTimeout(() => { clearInterval(timer); doneBtn('Continue', res); }, tickMs(1200));
    }));
  });
}
async function chapter5(d){
  await startChapter(5, d);
  setDate('Wednesday 4 August 2021 · 20:30'); sky = 'evening';
  await say(null, "Summer 2021. This year, ether broke all its records. At the hackerspace, nobody talks about DeFi any more, they talk about pictures: NFTs.");
  face(lena, player);
  await say('Lena', "Look! “The Pigeons of Paris”, 10,000 drawn pigeons, one per NFT. Ours, the one at the window, is in there. Well, one that looks like him.");
  const c = await say('Lena', "The sale opens tonight. Everyone will be fighting over fees, like in 2017. Are you getting one?", ['I\'ll take one', 'Just looking']);
  CHS[5].nft = c === 0;
  if (c === 0){ await say('Lena', "Then get ready: tonight it's the blind gas auction again.");
    await say(null, "You set a very high gas price to be sure of getting in. The transaction goes through. The fees cost almost as much as the pigeon."); }
  else await say('Lena', "Wise. Tomorrow, anyway, fees won't be paid the same way.");
  face(karim, player);
  await say('Karim', "Tomorrow, block 12,965,000: London. With EIP-1559, part of the fees no longer goes to miners. It's burned. Destroyed.");
  const k = await say('Karim', "I should be against it, right? It's my income going down.", ['Are you against it?', 'Why burn ether?']);
  await say('Karim', k === 0 ? "No. Predictable fees are better for everyone. And my cards don't have long left anyway." : "So the fees serve the whole network rather than a single miner. And so nobody can inflate them by filling their own blocks.");
  await skip('The next day.', 'Thursday 5 August 2021 · 14:40', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1]]);
  await say('Karim', "It went live at 14:33 Paris time. Block 12,965,000. Try sending something, you'll see the difference.");
  learn('london');
  aim('Send a transaction after London (laptop)', 'laptop', 'c5-send');
}
async function c5Send(){
  lock = true; busy = true; goal = null;
  await showLondon();
  learn('burn');
  face(lena, player);
  await say('Lena', "See? No more guessing. The wallet suggests the fees, and you know what you're paying.");
  if (CHS[5].nft) await say('Lena', "Your pigeon, by the way, do you still love it? Apparently half of this summer's collections will be worth nothing in a year.");
  await say('Karim', "And the funniest part: some of what you just paid no longer exists. Burned. Every block makes ether a little scarcer.");
  endChapter(5, { eyebrow:'Chapter 5 complete · 2021', title:'Fees you can finally understand',
    you:[
      CHS[5].nft ? 'You bought a pigeon NFT the day before London, paying top price for gas.' : 'You watched the NFT craze without touching it.',
      `After London, you sent your transaction with a tip of ${CHS[5].tip} gwei.`,
      'You saw part of the fees burned, block after block.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['EIP-1559', 'https://eips.ethereum.org/EIPS/eip-1559']],
    note:'“The Pigeons of Paris” are made up. London, EIP-1559 and the date are real.',
    teaser:'<b>Chapter 6 · 2022, the Merge.</b> One September morning, every mining machine stops at once. Including Karim\'s.',
    track:{ nft:CHS[5].nft, tip:CHS[5].tip } });
}
const TALK5 = {
  lena(){ face(lena, player); return chat([['Lena', phase === 'c5-send' ? "Try sending something, you'll see." : "My pigeon has a scarf. It's the finest of the 10,000. Objectively."]]); },
  karim(){ face(karim, player); return chat([['Karim', "The base fee is burned, the tip is mine. Small tips, usually."]]); },
  laptop(){ if (phase === 'c5-send') return c5Send(); return chat([[null, "Your laptop. An online counter shows the ether burned since London. It never stops."]]); },
  board(){ return chat([[null, "On the whiteboard: “base fee → burned”, “+ tip”, “EIP-1559”. Someone has drawn a little fire."]]); },
  rig(){ return chat([[null, "Karim's machine. His income dropped with London, but he keeps it running anyway."]]); },
  window(){ return chat([[null, "A pigeon lands on the windowsill. It doesn't know it has a digital lookalike."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei looks at the pigeon in the window. The pigeon looks at Wei. Neither has an NFT."]]); },
};

/* ---------- chapitre 6 : 2022, la Fusion ---------- */
function showTTD(){
  return new Promise(res => {
    const TTD = 58750000000000000000000n;
    let td = TTD - 3000000000000000000n * 40n, timer = null, done = false;
    modalCard(`<p class="eyebrow">Your laptop · Thursday 15 September 2022</p><h2>Total difficulty is getting close</h2>
      <p>The Merge isn't triggered at a set time or block number, but when the <b>total difficulty</b> accumulated by all miners since 2015 reaches a value fixed in advance.</p>
      <p class="meter-legend"><span>Total difficulty</span><span>Threshold: <b>58,750,000,000,000,000,000,000</b></span></p>
      <p class="gblock" id="tVal" style="font-size:18px"></p>
      <div class="meter big"><div class="fill" id="tFill"></div></div>
      <ul class="tradelog" id="tLog"></ul><div class="row" id="mRow"></div>
      <p class="small">Sped up for the game. The threshold and block 15,537,394 are real.</p>`);
    const fmtBig = n => n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    const draw = () => { $('tVal').textContent = fmtBig(td); const left = Number((TTD - td) / 1000000000000000000n); $('tFill').style.width = Math.max(0, 100 - left / 1.2) + '%'; };
    draw();
    timer = setInterval(() => {
      if (done) return;
      td += 3000000000000000000n + BigInt(Math.floor(Math.random() * 400)) * 1000000000000000n; sfx('blip');
      if (td >= TTD){ done = true; td = TTD; clearInterval(timer); draw(); rig.on = false; sfx('end');
        mlog('tLog', 'Threshold reached. The last mined block is behind us.');
        mlog('tLog', 'Block 15,537,394 · 06:42:42 UTC: proposed by a validator, no longer by a miner.', 'ok');
        doneBtn('Look up from the screen', res); }
      else draw();
    }, tickMs(260));
  });
}
async function chapter6(d){
  await startChapter(6, d);
  place([[karim, 1070, 792, 1], [lena, 560, 800, 1]]);
  setDate('Thursday 15 September 2022 · 08:20'); sky = 'dawn';
  await say(null, "15 September 2022, early morning. Karim got here before everyone. He hasn't slept. His machine is running, as it has for seven years.");
  face(karim, player);
  await say('Karim', "It's this morning. Bellatrix went through on 6 September, the Beacon Chain is ready. This morning, my machine mines its last blocks.");
  learn('bellatrix');
  aim('Watch the total difficulty climb (laptop)', 'laptop', 'c6-ttd');
}
async function c6TTD(){
  lock = true; busy = true; goal = null;
  await showTTD();
  learn('merge');
  await say(null, "8:42 in Paris. The fans on Karim's machine slow down. Then stop. For the first time since 2015, the room is silent.");
  face(lena, player);
  await say('Lena', "My validator just proposed a block. It works. Everything works. Balances haven't moved, nor have contracts.");
  await say('Lena', "And the network uses about 99.95% less electricity. All those machines, all over the world, switched off at once.");
  learn('energy');
  aim('Go and see Karim', 'karim', 'c6-karim');
}
async function c6Karim(){
  lock = true; busy = true; goal = null; face(karim, player);
  await say('Karim', "It saw block zero, can you believe it? We switched it on together, that July evening in 2015.");
  const c = await say('Karim', "I don't know what to do with it now.", ['Keep it. As a memento.', 'Sell the cards, someone will put them to good use', 'Become a validator, with what you\'ve mined']);
  CHS[6].rig = ['keep', 'sell', 'validator'][c];
  await say('Karim', ["As a memento… Yes. I'll find it a place. It's earned it.", "You're right. Students will need them for their projects. Better than a pile of dust.", "With what I've mined in seven years? … Yes. Yes, I think I can. Keep securing the network, differently."][c]);
  const s = await say('Lena', "And you? Your ether has been sleeping in your wallet for years. You could stake it too.", ['Through a shared staking service', 'I\'ll keep it in my wallet']);
  CHS[6].stake = s === 0;
  await say('Lena', s === 0 ? "You don't need 32 ether for that. But remember: you're entrusting your ether to another contract. Read it." : "It's your choice. Nothing forces you to do anything.");
  await skip('Seven months later.', 'Thursday 13 April 2023 · 09:00', 'day', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1070, 792, -1]]);
  face(lena, player);
  await say('Lena', "Last night, Shapella. For the first time since 2020, I can withdraw my staked ether. I'm not going to. But knowing I can changes everything.");
  learn('shapella');
  endChapter(6, { eyebrow:'Chapter 6 complete · 2022', title:'The morning the machines fell silent',
    you:[
      'You watched the total difficulty reach its threshold, and Karim\'s machine stop.',
      { keep:'You advised Karim to keep his machine as a memento.', sell:'You advised Karim to sell his cards to students.', validator:'You encouraged Karim to become a validator himself.' }[CHS[6].rig],
      CHS[6].stake ? 'You staked your ether through a shared service.' : 'You kept your ether in your wallet.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['Merge announcement', 'https://blog.ethereum.org/2022/08/24/mainnet-merge-announcement'], ['99.95% less energy', 'https://blog.ethereum.org/2021/05/18/country-power-no-more']],
    note:'Karim\'s machine is made up, like him. The Merge, its threshold, its block and Shapella are real.',
    teaser:'<b>Chapter 7 · 2024 – 2025, ten years.</b> Blobs for L2s, accounts that become smart, a newcomer at the hackerspace… and an anniversary.',
    track:{ rig:CHS[6].rig, stake:CHS[6].stake } });
}
const TALK6 = {
  lena(){ face(lena, player); return chat([['Lena', { 'c6-ttd':"Look on your laptop. We're nearly there.", 'c6-karim':"Go and see Karim. I think he needs someone." }[phase] || "My validator runs on a little computer no bigger than a book. Who'd have thought, in 2015?"]]); },
  karim(){ if (phase === 'c6-karim') return c6Karim(); face(karim, player); return chat([['Karim', phase === 'c6-ttd' ? "I can't watch. Tell me when it's over." : "It's quiet without the noise of the fans. Too quiet."]]); },
  laptop(){ if (phase === 'c6-ttd') return c6TTD(); return chat([[null, "Your laptop. A block every 12 seconds, like clockwork, proposed by validators."]]); },
  rig(){ return chat([[null, rig.on ? "Karim's machine is running for the last time. Karim can't bear to look at it." : "Karim's machine, silent. The fans have stopped."]]); },
  board(){ return chat([[null, "On the whiteboard, a very long number: 58,750,000,000,000,000,000,000. And below it: “PoW → PoS”."]]); },
  window(){ return chat([[null, "Day is breaking. Somewhere, thousands of mining machines have just stopped at the same moment."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei looks for his warm spot against the machine. It's cold. He looks annoyed."]]); },
};

/* ---------- chapitre 7 : 2024 – 2025, dix ans ---------- */
function showBlobs(){
  return new Promise(res => {
    modalCard(`<p class="eyebrow">Inès's laptop · Wednesday 13 March 2024</p><h2>Send €5 to a friend</h2>
      <p>Same transaction, different places. Where should it go?</p>
      <div class="rules">
        <button class="rule radio act" data-n="l1">Straight on Ethereum <small>· expensive when the network is busy</small></button>
        <button class="rule radio act" data-n="l2">An L2, a “rollup” that bundles transactions and publishes them on Ethereum</button>
      </div><div id="bOut"></div><div class="row" id="mRow"></div>
      <p class="small">Since Dencun, L2s publish their data in “blobs”, which are much cheaper. On several L2s, fees fell by more than 90% in the following days.</p>`);
    mcard.querySelectorAll('[data-n]').forEach(b => b.addEventListener('click', () => {
      mcard.querySelectorAll('[data-n]').forEach(x => { x.disabled = true; x.setAttribute('aria-pressed', String(x === b)); }); sfx('ledger');
      CHS[7].net = b.dataset.n;
      $('bOut').innerHTML = b.dataset.n === 'l2' ? '<div class="verdict ok"><span class="pill">Sent</span>A few cents in fees. The transaction is settled on the L2, then its data goes into a blob on Ethereum.</div>'
        : '<div class="verdict ko"><span class="pill">Sent</span>It works, but the fees cost almost as much as the €5. For small amounts, that\'s what an L2 is for.</div>';
      doneBtn('Continue', res);
    }));
  });
}
function showGuardians(){
  return new Promise(res => {
    const G = [['Lena', true], ['Karim', true], ['Wei the cat', false], ['Your 2015 paper, kept at home', true]];
    modalCard(`<p class="eyebrow">Your laptop · Wednesday 7 May 2025 · Pectra</p><h2>Make your account smart</h2>
      <p>With EIP-7702, your 2015 account keeps its address, but can delegate how it works to a contract. For example: if you lose your key, two “guardians” out of three can help you set a new one.</p>
      <p><b>Choose your three guardians.</b></p>
      <div class="rules">${G.map((g, i) => `<button class="rule" aria-pressed="false" data-g="${i}">${g[0]}</button>`).join('')}</div>
      <div id="gOut"></div><div class="row" id="mRow"><button class="btn primary" id="mGo" disabled>Sign the delegation</button></div>`);
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
      $('gOut').innerHTML = cat ? '<div class="verdict ko"><span class="pill">Signed</span>Wei has no key, and no thumbs. You\'re left with two real guardians: they\'ll both have to agree.</div>'
        : '<div class="verdict ok"><span class="pill">Signed</span>Your account now has a safety net. If you lose your key, two guardians out of three can help you.</div>';
      doneBtn('Continue', res);
    });
  });
}
async function chapter7(d){
  await startChapter(7, d);
  Object.assign(newbie, { x:1260, y:840, face:-1, walk:0, moving:false, target:null, vis:true, shirt:C.cyan, pants:C.peach, hair:C.ink2, style:'bun', skin:C.skin, gesture:false });
  setDate('Wednesday 13 March 2024 · 16:10');
  await say(null, "March 2024. Someone has put a little potted palm on Karim's old machine. And tonight, there's a newcomer at the hackerspace.");
  learn('dencun');
  face(lena, player);
  await say('Lena', "This is Inès. She's just arrived and wants to understand Ethereum. I thought you'd be the right person. You've seen it all from the start.");
  aim('Talk to Inès', 'newbie', 'c7-ines');
}
async function c7Ines(){
  lock = true; busy = true; goal = null; face(newbie, player); face(player, newbie);
  await say('Inès', "Hi! I tried to send €5 to a friend on Ethereum, and the fees scared me. Is it always this expensive?");
  const c = await say('Inès', "Can you explain?", ['I\'ll show you, on your laptop', 'In 2017, it was much worse']);
  if (c === 1) await say('Inès', "Worse than this? Tell me later. Show me first!");
  closeDialog();
  await showBlobs();
  await say('Inès', CHS[7].net === 'l2' ? "A few cents! And it's still secured by Ethereum?" : "Ouch, the fees sting. And on an L2, it's still secured by Ethereum?");
  await say('Karim', "That's the whole idea. Today, Dencun made it much cheaper for L2s. The main network becomes the foundation, and we build the floors on top.");
  await skip('One year later.', 'Wednesday 7 May 2025 · 12:10', 'day', [[player, 800, 830, -1], [lena, 430, 800, 1], [karim, 1070, 792, -1], [newbie, 1260, 840, -1]]);
  face(lena, player);
  await say('Lena', "Pectra went live this morning. Remember your 2015 account, the one you created on launch night?");
  if (ch1.keep === 0) await say('Lena', "The one whose password was on a sticky note… Today, you can finally give it a safety net.");
  else if (ch1.keep === 1) await say('Lena', "The one whose key was lying around in your emails… Today, you can finally give it a safety net.");
  else await say('Lena', "Your paper and USB stick have lasted ten years. Today, you can add a safety net on top.");
  learn('pectra');
  aim('Make your account smart (laptop)', 'laptop', 'c7-7702');
}
async function c7Guard(){
  lock = true; busy = true; goal = null;
  await showGuardians();
  face(lena, player);
  await say('Lena', CHS[7].catGuard ? "You made Wei a guardian? … Fine. Karim and I will do the work." : "Guardian of your account. I'm touched. I promise never to lose this role.");
  await skip('30 July 2025.', 'Wednesday 30 July 2025 · 17:26', 'evening', [[player, 800, 830, -1], [lena, 560, 800, 1], [karim, 1040, 800, -1], [newbie, 1240, 840, -1]]);
  await say(null, "30 July 2025, 17:26. Ten years to the day, to the hour, after the first block. The hackerspace has brought out pizzas. The same ones.");
  learn('tenyears');
  aim('Raise a toast with Karim', 'karim', 'c7-toast');
}
async function c7Toast(){
  lock = true; busy = true; goal = null; face(karim, player); face(lena, player);
  await say('Karim', "Ten years. We built a block zero, lost a shared kitty, saw a fork, switched off my machine…");
  await say('Lena', "And nobody ever “pressed the button”. There still isn't a button.");
  if (ch2.chain) await say('Karim', ch2.chain === 'etc' ? "You and I chose the original chain, in 2016. It's still running, by the way." : "In 2016, you and Lena chose the fork. I didn't. And we're all still here, the three of us.");
  const c = await say('Inès', "And you, what do you take away from these ten years?", ['That you have to check for yourself', 'That strangers can build together', 'That nothing is ever finished']);
  CHS[7].lesson = c;
  await say('Lena', ["Check for yourself. Block zero, The DAO's code, the white paper, POTATO's contract… It all comes back to that.", "Thousands of people who don't know each other, and a network that has never stopped. Yes.", "The next one, Fusaka, is already in the works. There's always a sequel."][c]);
  await say('Karim', "To the next decade.");
  learn('fusaka');
  await say(null, "Wei climbs onto the old machine, curls up next to the palm and falls asleep. Somewhere, a new block arrives. Then another.");
  endChapter(7, { eyebrow:'Chapter 7 complete · 2015 – 2025', title:'Ten years, and no button',
    you:[
      CHS[7].net === 'l2' ? 'You showed Inès how to send €5 on an L2, for a few cents.' : 'You showed Inès why small amounts go on an L2.',
      `You made your 2015 account smart, with these guardians: ${CHS[7].guardians.join(', ')}.`,
      'You were there on 30 July 2025, ten years after the first block.',
    ],
    links:[['ethereum.org/fr/history', 'https://ethereum.org/fr/history/'], ['EIP-4844', 'https://eips.ethereum.org/EIPS/eip-4844'], ['EIP-7702', 'https://eips.ethereum.org/EIPS/eip-7702']],
    note:'Inès, Lena, Karim, Wei and the hackerspace are made up. Dencun, Pectra, Fusaka and their dates are real.',
    journey:true, track:{ net:CHS[7].net, lesson:CHS[7].lesson } });
}
const TALK7 = {
  newbie(){ if (phase === 'c7-ines') return c7Ines(); face(newbie, player); return chat([['Inès', phase === 'c7-toast' ? "Karim is waiting for you for the toast!" : "I'm reading everything I can. Lena told me: “always check for yourself”. Rule number one, apparently."]]); },
  lena(){ face(lena, player); return chat([['Lena', { 'c7-ines':"Go and say hello to Inès. She's by the old machine.", 'c7-7702':"Your laptop. Choose your guardians carefully.", 'c7-toast':"Karim has prepared a speech. He's going to cry, I'm warning you." }[phase] || "Ten years. I still have my presale file, you know. On three USB sticks."]]); },
  karim(){ if (phase === 'c7-toast') return c7Toast(); face(karim, player); return chat([['Karim', "I'm a validator now. Or not. Doesn't matter: I still run a node. Old habits."]]); },
  laptop(){ if (phase === 'c7-7702') return c7Guard(); return chat([[null, "Your laptop. Your 2015 account is still there, at the same address."]]); },
  rig(){ return chat([[null, "Karim's old machine, switched off since 2022. A little palm grows on top. Wei often sleeps beside it."]]); },
  board(){ return chat([[null, "On the whiteboard: “blobs → L2”, “EIP-7702”, and in big letters: “30.07.2015 → 30.07.2025”."]]); },
  window(){ return chat([[null, "The rooftops of Paris, ten years on. Still pigeons. Still no button."]]); },
  cat(){ sfx('meow'); return chat([[null, "Wei is ten years older. He still sleeps wherever it's warm. These days, that's next to the palm."]]); },
};
const TALKS = { 2:TALK2, 3:TALK3, 4:TALK4, 5:TALK5, 6:TALK6, 7:TALK7 };
const CHAPTERS = { 1:() => chapter1(), 2:d => chapter2(d), 3:d => chapter3(d), 4:d => chapter4(d), 5:d => chapter5(d), 6:d => chapter6(d), 7:d => chapter7(d) };

/* ---------- fin de chapitre (générique) ---------- */
function journeyLines(){
  const L = [];
  if (ch1.built) L.push(['2015', ch1.downloaded ? 'Block zero built, after a fake file' : 'Block zero built yourself']);
  if (ch2.chain) L.push(['2016', `${ch2.invested ? 'Ether in The DAO' : 'Not in The DAO'} · ${ch2.chain === 'eth' ? 'with the fork' : 'original chain'}`]);
  if (CHS[3].gas) L.push(['2017', `${CHS[3].flags}/4 red flags spotted · ${CHS[3].ico ? 'NIMBUS bought' : 'NIMBUS avoided'}`]);
  if (CHS[4].vault) L.push(['2020', `Lena's vault ${CHS[4].vault === 'saved' ? 'saved' : 'liquidated'} · ${{ patate:'POTATO', uniswap:'400 UNI', rien:'nothing touched' }[CHS[4].farm]}`]);
  if (CHS[5].tip) L.push(['2021', `${CHS[5].nft ? 'A pigeon NFT' : 'No NFT'} · tip of ${CHS[5].tip} gwei`]);
  if (CHS[6].rig) L.push(['2022', `${CHS[6].stake ? 'Ether staked' : 'Ether in the wallet'} · Karim's machine ${{ keep:'kept', sell:'sold', validator:'replaced by a validator' }[CHS[6].rig]}`]);
  if (CHS[7].guardians) L.push(['2025', `Smart account · guardians: ${CHS[7].guardians.join(', ')}`]);
  return L;
}
function endButtons(n){
  const next = n < 7 ? [[`Chapter ${n + 1}: ${ERAS[n][1]}`, () => CHAPTERS[n + 1](readSave()), true]] : [];
  return next.concat([['Stay at the hackerspace', () => { lock = false; }, !next.length], ...(n >= 7 ? [["Back to L'Atrium", () => { location.href = '/'; }]] : [])]);
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
  const jr = o.journey ? `<p class="endsec">Your ten years</p><ol class="truth">${journeyLines().map(([y, t]) => `<li><b>${y}</b><span>${t}</span></li>`).join('')}</ol>` : '';
  $('endCard').innerHTML = `<p class="eyebrow">${o.eyebrow}</p><h2>${o.title}</h2>
    <p class="endsec">What you did</p><ul class="recap">${o.you.map(r => `<li>${r}</li>`).join('')}</ul>${jr}
    <p class="endsec">What really happened</p><ol class="truth">${truth}</ol>
    <p class="hint">${o.note} ${o.links.map(([t, u]) => `<a href="${u}" target="_blank" rel="noopener">${t}</a>`).join(' · ')}</p>
    ${o.teaser ? `<p class="teaser">${o.teaser}</p>` : '<p class="teaser"><b>The end of L’Atrium · the true story.</b> The story itself goes on: on 3 December 2025, Fusaka. And after that, whatever people make of it.</p>'}
    <div class="row"></div>${saved ? '<p class="hint">Progress saved on this device.</p>' : ''}`;
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
  if (chapterDone >= 2){ chap = 2; buildCache(); sky = 'day'; rig.on = true; cat.sleep = false; Object.assign(cat, { x:980, y:850 }); setDate('Wednesday 20 July 2016'); $('carnetBtn').hidden = false; renderPanel(); phase = 'free'; lock = false; busy = false; player.y = 846; player.x = 620; snapCam(); return; }
  chap = 1; buildCache();
  sky = 'dawn'; rig.on = true; cat.sleep = false; Object.assign(cat, { x:980, y:850 }); Object.assign(lena, { x:880, y:800 }); karim.face = -1;
  player.y = 846; player.x = 520;
  setDate('Friday 7 August 2015'); $('carnetBtn').hidden = false; renderPanel();
  phase = 'free'; lock = false; busy = false; snapCam();
}

/* ---------- interactions ---------- */
const talk = {
  lena(){
    if (phase === 'thaw') return chat([['Lena', 'Karim is calling you. Go on, I\'ll follow.']]);
    const L = { karim:"Karim is by his machine, on the right. You can't miss it: it's the one making all that noise.", genesis:"Block 1,028,201 isn't here yet? Keep an eye on your terminal.", node:"Create your account, and think carefully about where you keep your password. Trust me.", sleep:"Karim won't sleep tonight. You should, though.", free:"Now that transactions go through, we'll see what people build. I can't wait. And I'm a little scared." };
    face(lena, player); return chat([['Lena', L[phase] || L.free]]);
  },
  karim(){
    if (phase === 'karim') return karimIntro();
    if (phase === 'thaw') return thaw();
    const L = { genesis:"Your laptop, on the big table. Block 1,028,201 won't be long now.", node:"Start your node, quick! I don't want you to miss the first block.", sleep:"I'm watching the limit. Go to sleep, I'll wake you if anything happens.", free:"My machine keeps mining. Five ether per block, when I find one. Which isn't that often." };
    face(karim, player); return chat([['Karim', L[phase] || "Hear that noise? That's the sound of a chain starting up."]]);
  },
  rig(){ if (phase === 'thaw') return thaw(); return chat([[null, rig.on ? "Three graphics cards computing at full speed. The air above the machine is warm." : "Three graphics cards, fans, a pile of cables. For now, the machine is idling."]]); },
  laptop(){
    if (phase === 'genesis') return genesisTerminal();
    if (phase === 'node') return nodeTerminal();
    if (phase === 'intro' || phase === 'karim') return chat([[null, "Your laptop. Nothing to do on it yet: go and see Karim first."]]);
    return chat([[null, ch1.eth ? "Your laptop. Your balance: 1 ETH. The first." : "Your laptop. The terminal shows the blocks arriving, one by one, all empty."]]);
  },
  sofa(){ if (phase === 'sleep') return sleepWeek(); return chat([[null, "A sofa that has already served as a bed for half the hackerspace's members."]]); },
  cat(){ sfx('meow'); return chat([[null, cat.sleep ? "Wei, the hackerspace cat, sleeps against Karim's machine. It's the warmest spot in the room." : "Wei stretches. He spent the week against the graphics cards, and he doesn't seem to regret it."]]); },
  board(){ return chat([[null, "On the whiteboard, someone has written “30 · 07 · 2015”, drawn three blocks joined by arrows, and circled “#1,028,201”."]]); },
  window(){ return chat([[null, sky === 'dawn' ? "Day breaks over the rooftops. Outside, nothing suggests a chain has been running for a week on thousands of machines." : "Zinc rooftops, a pigeon, late afternoon. Outside, nothing suggests anything is happening at all."]]); },
  coffee(){ return chat([[null, "A coffee machine that has seen better days. Someone has taped a note on it: “Descaled 12/05. Maybe.”"]]); },
  poster(){ return chat([[null, "A handmade poster: a diamond, and below it, “FRONTIER”. Someone has added in pencil: “for developers. You've been warned.”"]]); },
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
    const inner = `<b>${y}</b>${n}${i >= READY ? ' · soon' : i < done ? ' · replay' : ''}`;
    return i < done ? `<li class="${st}"><button type="button" data-era="${i + 1}">${inner}</button></li>` : `<li class="${st}">${inner}</li>`;
  }).join('');
  const LEDE = { 1:"A year has gone by. At the hackerspace, everyone talks about just one thing: The DAO.", 2:"2017. Everyone is launching a token, and the hackerspace kitty sits in a multisig wallet.", 3:"2020. The world stops, markets collapse, and Lena has a Maker vault.", 4:"2021. NFT pigeons, and tomorrow, a new way to pay fees.", 5:"2022. One September morning, Karim's machine will stop for good.", 6:"2024. A newcomer at the hackerspace, and soon, ten years." };
  if (done >= 1 && done < 7){
    $('titleEyebrow').textContent = `Chapter ${done + 1} · ${ERAS[done][0]}`;
    $('titleLede').textContent = LEDE[done];
    $('startBtn').textContent = `Continue: chapter ${done + 1}`;
    $('newBtn').hidden = false;
  } else if (done >= 7){
    $('titleEyebrow').textContent = 'All seven chapters complete';
    $('titleLede').textContent = "Ten years of Ethereum, from genesis to Pectra. You can replay any chapter by choosing it above.";
    $('startBtn').textContent = 'Back to the hackerspace';
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
function renderSound(m){ soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.setAttribute('aria-label', m ? 'Unmute' : 'Mute'); soundBtn.classList.toggle('off', m); }
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
