(() => {
'use strict';
const W = 1600, H = 900, HOR = 560, TAU = Math.PI * 2;
const css = getComputedStyle(document.documentElement);
const K = n => css.getPropertyValue('--' + n).trim();
const C = { ink:K('ink'), ink2:K('ink-2'), paper:K('paper'), mist:K('mist'), floor:K('floor'), lav:K('lav'), violet:K('violet'),
  peri:K('peri'), cyan:K('cyan'), teal:K('teal'), peach:K('peach'), skin:K('skin') };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = id => document.getElementById(id);
const sfx = name => window.Sound && window.Sound.sfx(name);
// événements Vercel Web Analytics (ignorés en local et hors Vercel)
const track = (name, data) => { try { if (window.va && location.hash !== '#debug') window.va('event', data ? { name, data } : { name }); } catch (e) { /* ignore */ } };
const stage = $('stage'), cv = $('cv'), ctx = cv.getContext('2d');

const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const ease = u => u < .5 ? 2*u*u : 1 - Math.pow(-2*u + 2, 2) / 2;
const dist = (a,b) => Math.hypot(a.x - b.x, a.y - b.y);
function hexA(h, a){ h = h.replace('#',''); const n = parseInt(h, 16); return `rgba(${n>>16&255},${n>>8&255},${n&255},${a})`; }
function quad(p0,p1,p2,u){ const v = 1-u; return [v*v*p0[0]+2*v*u*p1[0]+u*u*p2[0], v*v*p0[1]+2*v*u*p1[1]+u*u*p2[1]]; }
function persp(y){ return 0.5 + (y - HOR) / (H - HOR) * 0.62; }
function poly(g, pts, close = true){ g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (let i=1;i<pts.length;i++) g.lineTo(pts[i][0], pts[i][1]); if (close) g.closePath(); }
function fs(g, fill, stroke = C.ink, lw = 2){ if (fill){ g.fillStyle = fill; g.fill(); } if (stroke){ g.strokeStyle = stroke; g.lineWidth = lw; g.stroke(); } }

/* ---------- viewport ---------- */
let dpr = 1, scale = 1, viewW = W, viewH = H, cache = null;
const cam = { x: 0, y: 0 };
function resize(){
  const w = stage.clientWidth, vh = window.innerHeight;
  // mobile à l'horizontale : pas de légende, la scène prend toute la hauteur
  const compact = vh < 520 && window.innerWidth > vh;
  document.documentElement.classList.toggle('compact', compact);
  let h;
  if (compact) h = Math.max(220, vh - 16);
  else {
    const avail = vh - 32 - 40;
    h = w * 9 / 16;
    if (w < 900) h = Math.max(h, Math.min(avail * 0.92, 660));
    h = clamp(h, 340, Math.max(340, avail));
  }
  stage.style.height = Math.round(h) + 'px';
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr);
  scale = Math.max(w / W, h / H);
  viewW = w / scale; viewH = h / scale;
  buildCache();
  snapCam();
}

/* ---------- static background ---------- */
function buildCache(){
  cache = document.createElement('canvas');
  const k = scale * dpr;
  cache.width = Math.ceil(W * k); cache.height = Math.ceil(H * k);
  const g = cache.getContext('2d');
  g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
  drawStatic(g);
}
function drawStatic(g){
  g.fillStyle = C.mist; g.fillRect(0, 0, W, HOR);
  g.strokeStyle = hexA(C.peri, .35); g.lineWidth = 1;
  for (let x = 0; x <= W; x += 46){ g.beginPath(); g.moveTo(x, 0); g.lineTo(x, HOR); g.stroke(); }
  for (let y = 0; y <= HOR; y += 46){ g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  balconies(g, false); balconies(g, true);

  // back wall + arch
  g.fillStyle = C.paper; g.fillRect(520, 0, 560, HOR);
  const ring = (r, fill) => { g.beginPath(); g.moveTo(800 - r, HOR); g.lineTo(800 - r, 400); g.arc(800, 400, r, Math.PI, 0); g.lineTo(800 + r, HOR); g.closePath(); fs(g, fill); };
  ring(305, C.paper); ring(286, C.lav); ring(268, C.paper);
  g.save(); ring(246, C.paper); g.clip();
  const sky = g.createLinearGradient(0, 150, 0, HOR); sky.addColorStop(0, C.mist); sky.addColorStop(1, C.paper);
  g.fillStyle = sky; g.fillRect(540, 140, 520, 420);
  hills(g, 468, 26, C.lav, .55, 1.3); hills(g, 500, 18, C.peach, .6, 2.1);
  [[610,478,.8],[655,488,.65],[905,474,.75],[960,486,.9],[1005,492,.6]].forEach(([x,y,s]) => tinyPalm(g, x, y, s));
  g.beginPath(); g.moveTo(540, HOR);
  for (let x = 540; x <= 1060; x += 26) g.quadraticCurveTo(x + 13, 522 + Math.sin(x*.07)*8, x + 26, 532 + Math.cos(x*.05)*6);
  g.lineTo(1060, HOR); g.closePath(); fs(g, C.paper, C.ink2, 1.4);
  g.restore();
  ring(246, null);

  // floor
  g.fillStyle = C.floor; g.fillRect(0, HOR, W, H - HOR);
  g.strokeStyle = C.teal; g.lineWidth = 1.4;
  const vy = 230;
  for (let i = -16; i <= 16; i++){ const xb = 800 + i * 118, xh = 800 + (xb - 800) * (HOR - vy) / (H - vy); g.beginPath(); g.moveTo(xh, HOR); g.lineTo(xb, H); g.stroke(); }
  for (let k = 1; k <= 11; k++){ const y = HOR + (H - HOR) * Math.pow(k / 11, 1.7); g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
  g.beginPath(); g.moveTo(0, HOR); g.lineTo(W, HOR); fs(g, null, C.ink, 2);

  // columns
  column(g, 600, 54, 590); column(g, 1000, 54, 590);
  column(g, 255, 70, 650); column(g, 1345, 70, 650);
}
function balconies(g, mirror){
  g.save(); if (mirror){ g.translate(W, 0); g.scale(-1, 1); }
  for (let i = 0; i < 3; i++){
    const y0 = 34 + i * 168, x1 = 520, dy = 116;
    // rail + posts
    g.strokeStyle = C.ink2; g.lineWidth = 1.2;
    g.beginPath(); g.moveTo(0, y0 - 24); g.lineTo(x1, y0 + dy - 24); g.stroke();
    for (let x = 20; x < x1; x += 38){ g.beginPath(); g.moveTo(x, y0 - 24 + x/x1*dy); g.lineTo(x, y0 + x/x1*dy); g.stroke(); }
    if (i < 2){ // people on balcony
      [[70,C.lav],[150,C.peach],[330,C.cyan]].forEach(([x, col], j) => { if ((i + j) % 2) return;
        const yy = y0 + x / x1 * dy;
        g.beginPath(); g.moveTo(x - 11, yy); g.quadraticCurveTo(x - 11, yy - 20, x, yy - 21); g.quadraticCurveTo(x + 11, yy - 20, x + 11, yy); fs(g, col, C.ink, 1.3);
        g.beginPath(); g.arc(x, yy - 29, 7, 0, TAU); fs(g, C.skin, C.ink, 1.3);
      });
    }
    poly(g, [[0, y0], [x1, y0 + dy], [x1, y0 + dy + 30], [0, y0 + 30]]); fs(g, C.paper);
    poly(g, [[0, y0 + 30], [x1, y0 + dy + 30], [x1, y0 + dy + 38], [0, y0 + 38]]); fs(g, C.peach, C.ink, 1.5);
  }
  g.restore();
}
function hills(g, base, amp, col, alpha, f){
  g.beginPath(); g.moveTo(540, HOR);
  for (let x = 540; x <= 1060; x += 10) g.lineTo(x, base - Math.abs(Math.sin(x * .012 * f)) * amp - Math.sin(x * .031) * 6);
  g.lineTo(1060, HOR); g.closePath();
  g.globalAlpha = alpha; fs(g, col, null); g.globalAlpha = 1; g.strokeStyle = C.ink2; g.lineWidth = 1.2; g.stroke();
}
function tinyPalm(g, x, y, s){
  g.strokeStyle = C.ink2; g.lineWidth = 1.3;
  g.beginPath(); g.moveTo(x, y + 40*s); g.quadraticCurveTo(x - 6*s, y + 15*s, x + 3*s, y - 20*s); g.stroke();
  for (let a = -2.8; a <= -0.2; a += 0.52){ g.beginPath(); g.moveTo(x + 3*s, y - 20*s); g.quadraticCurveTo(x + 3*s + Math.cos(a)*14*s, y - 20*s + Math.sin(a)*14*s, x + 3*s + Math.cos(a)*24*s, y - 20*s + Math.sin(a)*14*s + 10*s); g.stroke(); }
}
function column(g, x, w, base){
  g.beginPath(); g.rect(x - w/2, -4, w, base - 18 + 4); fs(g, C.paper);
  g.strokeStyle = C.ink2; g.lineWidth = 1;
  for (let i = 1; i < 4; i++){ const fx = x - w/2 + i * w / 4; g.beginPath(); g.moveTo(fx, 0); g.lineTo(fx, base - 18); g.stroke(); }
  g.beginPath(); g.rect(x - w/2 - 6, base - 18, w + 12, 10); fs(g, C.paper);
  g.beginPath(); g.rect(x - w/2 - 11, base - 8, w + 22, 10); fs(g, C.lav);
}

/* ---------- dynamic drawings ---------- */
function drawDiamond(g, t){
  const b = reduce ? 0 : Math.sin(t * .8) * 8;
  const glow = g.createRadialGradient(800, 330 + b, 20, 800, 330 + b, 240);
  glow.addColorStop(0, hexA(C.cyan, .55)); glow.addColorStop(1, hexA(C.cyan, 0));
  g.fillStyle = glow; g.beginPath(); g.arc(800, 330 + b, 240, 0, TAU); g.fill();
  const A=[800,172+b], L=[704,346+b], R=[896,346+b], M=[800,300+b], B=[800,394+b];
  const L2=[704,368+b], R2=[896,368+b], B2=[800,418+b], TP=[800,508+b];
  [[A,L,M,C.violet],[A,M,R,C.cyan],[L,M,B,C.peri],[M,R,B,C.lav],[L2,B2,TP,C.peri],[B2,R2,TP,C.violet]].forEach(f => { poly(g, f.slice(0,3)); fs(g, f[3], C.ink, 2.4); });
  g.strokeStyle = hexA(C.paper, .9); g.lineWidth = 2.5;
  g.beginPath(); g.moveTo(785, 205 + b); g.lineTo(748, 272 + b); g.stroke();
}
function drawPedestal(g){
  const cx = 800, ty = 588, rx = 132, ry = 20, d = 26;
  g.beginPath(); g.moveTo(cx - rx, ty); g.lineTo(cx - rx, ty + d); g.ellipse(cx, ty + d, rx, ry, 0, Math.PI, 0, true); g.lineTo(cx + rx, ty); g.ellipse(cx, ty, rx, ry, 0, 0, Math.PI, false); g.closePath(); fs(g, C.lav);
  for (let x = cx - rx + 16; x < cx + rx - 8; x += 26){ const yb = ty + d + ry * Math.sqrt(Math.max(0, 1 - ((x - cx)/rx)**2)); poly(g, [[x - 8, yb - 4], [x + 8, yb - 4], [x, yb - 17]]); fs(g, C.cyan, C.ink, 1.2); }
  g.beginPath(); g.ellipse(cx, ty, rx, ry, 0, 0, TAU); fs(g, C.paper);
  g.beginPath(); g.ellipse(cx, ty, 70, 9, 0, 0, TAU); g.fillStyle = hexA(C.ink, .12); g.fill();
}
function drawBubbles(g, t){
  [[282,352,24,C.lav,0],[322,334,17,C.peach,1.3],[356,372,33,C.cyan,2.2]].forEach(([x,y,r,col,ph]) => {
    const b = reduce ? 0 : Math.sin(t * .7 + ph) * 6;
    g.globalAlpha = .75; g.beginPath(); g.arc(x, y + b, r, 0, TAU); fs(g, col, C.ink, 1.6); g.globalAlpha = 1;
    g.strokeStyle = C.paper; g.lineWidth = 2; g.beginPath(); g.arc(x, y + b, r * .65, -2.6, -1.8); g.stroke();
  });
}
const PALMS = [
  { base:[330,700], ctrl:[292,390], top:[468,118], ph:0, fr:[[-2.95,210],[-2.5,230],[-2.1,220],[-1.72,200],[-1.35,215],[-0.95,235],[-0.55,225],[-0.18,215],[0.35,185],[2.75,190]] },
  { base:[1500,805], ctrl:[1540,420], top:[1292,122], ph:1.7, fr:[[-2.95,220],[-2.55,235],[-2.15,215],[-1.78,205],[-1.4,220],[-1.0,230],[-0.6,215],[-0.2,205],[0.4,180],[2.8,195]] },
];
function drawPalm(g, P, t){
  const sw = reduce ? 0 : Math.sin(t * .5 + P.ph);
  const tp = [P.top[0] + sw * 6, P.top[1] + Math.abs(sw) * 1.5], cp = [P.ctrl[0] + sw * 2, P.ctrl[1]];
  const N = 30, Lp = [], Rp = [], mids = [], nor = [];
  for (let i = 0; i <= N; i++){
    const u = i / N, p = quad(P.base, cp, tp, u);
    const d = [2*(1-u)*(cp[0]-P.base[0]) + 2*u*(tp[0]-cp[0]), 2*(1-u)*(cp[1]-P.base[1]) + 2*u*(tp[1]-cp[1])];
    const dl = Math.hypot(d[0], d[1]), n = [-d[1]/dl, d[0]/dl], w = (1 - u) * 8 + 6;
    Lp.push([p[0] + n[0]*w, p[1] + n[1]*w]); Rp.push([p[0] - n[0]*w, p[1] - n[1]*w]); mids.push(p); nor.push([d[0]/dl, d[1]/dl]);
  }
  poly(g, Lp.concat(Rp.slice().reverse())); fs(g, C.paper);
  g.strokeStyle = C.ink; g.lineWidth = 1.2;
  for (let i = 1; i < N; i++){ const tg = nor[i]; g.beginPath(); g.moveTo(Lp[i][0], Lp[i][1]); g.quadraticCurveTo(mids[i][0] - tg[0]*5, mids[i][1] - tg[1]*5, Rp[i][0], Rp[i][1]); g.stroke(); }
  P.fr.forEach(([a0, len], idx) => {
    const a = a0 + sw * .04 + (reduce ? 0 : Math.sin(t * .9 + idx * 1.7 + P.ph) * .025);
    const dir = [Math.cos(a), Math.sin(a)];
    const end = [tp[0] + dir[0]*len, tp[1] + dir[1]*len + len*.42], c = [tp[0] + dir[0]*len*.6, tp[1] + dir[1]*len*.6 - len*.08];
    g.strokeStyle = C.ink; g.lineWidth = 2; g.beginPath(); g.moveTo(tp[0], tp[1]); g.quadraticCurveTo(c[0], c[1], end[0], end[1]); g.stroke();
    g.lineWidth = 1.5; g.beginPath();
    for (let j = 2; j <= 18; j++){
      const u = j / 19, p = quad(tp, c, end, u), p2 = quad(tp, c, end, u + .01);
      let tg = [p2[0]-p[0], p2[1]-p[1]]; const tl = Math.hypot(tg[0], tg[1]) || 1; tg = [tg[0]/tl, tg[1]/tl];
      const nm = [-tg[1], tg[0]], ll = Math.sin(Math.PI * u) * 34 + 6;
      [[nm[0] + tg[0]*.6, nm[1] + tg[1]*.6 + .45], [-nm[0] + tg[0]*.6, -nm[1] + tg[1]*.6 + .45]].forEach(v => {
        const vl = Math.hypot(v[0], v[1]); g.moveTo(p[0], p[1]); g.lineTo(p[0] + v[0]/vl*ll, p[1] + v[1]/vl*ll);
      });
    }
    g.stroke();
  });
  g.beginPath(); g.arc(tp[0], tp[1] + 4, 9, 0, TAU); fs(g, C.violet, C.ink, 1.6);
}
function drawLeaf(g, x, y, a, len, wid, col, t, ph){
  const sway = reduce ? 0 : Math.sin(t * .9 + ph) * .03;
  g.save(); g.translate(x, y); g.rotate(a + sway);
  const N = 16, mid = u => [u * len, -Math.sin(u * Math.PI * .8) * len * .1 + u*u*len*.12];
  const up = [], lo = [];
  for (let i = 0; i <= N; i++){ const u = i / N, m = mid(u), w = wid * Math.sin(Math.PI * Math.pow(u, .75)) * (1 - .1*u); up.push([m[0], m[1] - w]); lo.push([m[0], m[1] + w * .9]); }
  poly(g, up.concat(lo.reverse())); fs(g, col);
  g.strokeStyle = C.ink; g.lineWidth = 1.1; g.beginPath();
  for (let i = 1; i < N; i++){ const u = i / N, m = mid(u), m2 = mid(Math.min(1, u + .07)), w = wid * Math.sin(Math.PI * Math.pow(u, .75)) * (1 - .1*u);
    g.moveTo(m[0], m[1]); g.lineTo(m2[0], m2[1] - w * .92); g.moveTo(m[0], m[1]); g.lineTo(m2[0], m2[1] + w * .83); }
  g.stroke();
  g.lineWidth = 2; g.beginPath(); for (let i = 0; i <= N; i++){ const m = mid(i / N); i ? g.lineTo(m[0], m[1]) : g.moveTo(m[0], m[1]); } g.stroke();
  g.restore();
}
const LEAVES_L = [[-1.62,250,48,'violet',0],[-1.2,305,62,'peri',1],[-0.78,285,56,'lav',2],[-0.36,240,46,'peri',3]];
function drawForeground(g, t){
  LEAVES_L.forEach(([a,l,w,c,ph]) => drawLeaf(g, 30, 935, a, l, w, C[c], t, ph));
  g.save(); g.translate(W, 0); g.scale(-1, 1);
  LEAVES_L.forEach(([a,l,w,c,ph]) => drawLeaf(g, 30, 935, a + .08, l * .95, w, C[c], t, ph + 2));
  g.restore();
}
function drawPot(g, x, y, t, mirror){
  g.save(); g.translate(x, y); if (mirror) g.scale(-1, 1);
  [[-1.95,120,26,'peri'],[-1.45,135,30,'lav'],[-1.0,118,26,'violet'],[-2.4,100,22,'lav']].forEach(([a,l,w,c], i) => drawLeaf(g, 0, -52, a, l, w, C[c], t, i + x));
  g.beginPath(); g.moveTo(-30, -56); g.quadraticCurveTo(-34, -20, -18, 0); g.lineTo(18, 0); g.quadraticCurveTo(34, -20, 30, -56); g.closePath(); fs(g, C.paper);
  g.beginPath(); g.moveTo(-31, -38); g.lineTo(31, -38); g.strokeStyle = C.peach; g.lineWidth = 6; g.stroke();
  g.beginPath(); g.ellipse(0, -56, 31, 7, 0, 0, TAU); fs(g, C.paper);
  g.restore();
}

/* ---------- characters ---------- */
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
  if (p.hat){
    g.beginPath(); g.moveTo(-15, hy - 6); g.quadraticCurveTo(-20, hy - 40, -1, hy - 44); g.quadraticCurveTo(18, hy - 42, 15, hy - 6); g.quadraticCurveTo(0, hy - 12, -15, hy - 6); fs(g, p.hatColor || C.cyan);
    g.strokeStyle = C.ink; g.lineWidth = 1.3; g.beginPath(); g.moveTo(-17, hy - 18); g.quadraticCurveTo(0, hy - 24, 16, hy - 17); g.moveTo(-17, hy - 29); g.quadraticCurveTo(0, hy - 35, 15, hy - 29); g.stroke();
    poly(g, [[0, hy - 26], [-4, hy - 19], [0, hy - 12], [4, hy - 19]]); fs(g, C.violet, C.ink, 1.3);
  } else {
    g.beginPath(); g.arc(-1, hy - 2, 16, Math.PI * .95, Math.PI * 2.02); g.quadraticCurveTo(4, hy - 8, -3, hy - 5); g.quadraticCurveTo(-10, hy - 2, -16, hy + 2); g.closePath(); fs(g, p.hair);
    if (p.style === 'bun'){ g.beginPath(); g.arc(-9, hy - 19, 7, 0, TAU); fs(g, p.hair); }
  }
  g.fillStyle = C.ink; g.beginPath(); g.arc(8, hy + 1, 1.9, 0, TAU); g.fill();
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
  if (p.robe){ g.beginPath(); g.moveTo(-14, -112); g.quadraticCurveTo(-36, -60, -30, -4); g.lineTo(6, -4); g.closePath(); fs(g, p.cape || C.lav); }
  // bras éloigné (côté du regard) : derrière le corps, comme en vue de trois quarts
  if (!p.gesture){ limb(g, [[11, -106], [13 - sw*7, -86], [12 - sw*10, -68]], 8, p.shirt); hand(g, 12 - sw*10, -68, p.skin); }
  // jambes : vue de profil, les deux hanches presque au même point, genou qui plie quand la jambe revient
  const spread = p.moving ? 1.5 : 5;
  const leg = (hx, ph) => {
    const a = p.moving ? Math.sin(p.walk + ph) * .42 : 0;
    const lift = p.moving ? Math.max(0, Math.cos(p.walk + ph)) : 0;
    const knee = [hx + Math.sin(a) * 30, -60 + Math.cos(a) * 30];
    const b = a - lift * .75;
    const foot = [knee[0] + Math.sin(b) * 29, Math.min(-3, knee[1] + Math.cos(b) * 29 - lift * 3)];
    if (!p.robe) limb(g, [[hx, -60], knee, foot], 10, p.pants);
    g.fillStyle = C.ink; g.beginPath(); g.ellipse(foot[0] + 3, foot[1] + 2, 7, 3.6, 0, 0, TAU); g.fill();
  };
  leg(spread, Math.PI);   // jambe éloignée, dessinée d'abord
  leg(-spread, 0);        // jambe proche, par-dessus
  if (p.robe){ g.beginPath(); g.moveTo(-22, -4); g.lineTo(-17, -104); g.quadraticCurveTo(-16, -117, -3, -118); g.lineTo(4, -118); g.quadraticCurveTo(17, -117, 17, -104); g.lineTo(22, -4); g.quadraticCurveTo(0, 0, -22, -4); fs(g, p.shirt);
    g.strokeStyle = C.ink; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-18, -40); g.quadraticCurveTo(0, -36, 19, -40); g.stroke();
    poly(g, [[3, -100], [-5, -87], [3, -74], [11, -87]]); fs(g, C.violet, C.ink, 1.6);
    if (p.badge){ g.beginPath(); g.arc(-8, -100, 6, 0, TAU); fs(g, C.cyan, C.ink, 1.5); drawSparkle(g, -8, -100, .32); }
  } else {
    g.beginPath(); g.moveTo(-15, -60); g.lineTo(-17, -104); g.quadraticCurveTo(-16, -117, -3, -118); g.lineTo(4, -118); g.quadraticCurveTo(17, -117, 17, -104); g.lineTo(15, -60); g.closePath(); fs(g, p.shirt);
    g.beginPath(); g.moveTo(-15, -64); g.lineTo(15, -64); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
  }
  head(g, -136, p);
  // bras proche : devant le corps ; le bras qui fait un geste passe devant aussi
  limb(g, [[-11, -106], [-13 + sw*7, -86], [-11 + sw*10, -68]], 8, p.shirt); hand(g, -11 + sw*10, -68, p.skin);
  if (p.gesture){ limb(g, [[11, -106], [25, -108], [31, -130]], 8, p.shirt); hand(g, 31, -131, p.skin); }
  g.restore();
}
function nonceHand(){ const s = persp(nonce.y) * nonce.tall; return [nonce.x + nonce.face * 31 * s, nonce.y - 131 * s]; }
function drawNonceBubbles(g, t){
  const s = persp(nonce.y) * nonce.tall;
  for (let i = 0; i < 3; i++){
    const a = (reduce ? 0 : t * .6) + i * 2.1;
    const x = nonce.x + Math.cos(a) * 44 * s, y = nonce.y - 150 * s + Math.sin(a) * 22 * s - i * 8 * s;
    g.globalAlpha = .7; g.beginPath(); g.arc(x, y, (4 + i * 2) * s, 0, TAU); fs(g, i === 1 ? C.lav : C.cyan, C.ink, 1.2); g.globalAlpha = 1;
  }
  const h = nonceHand();
  poly(g, [[h[0] - nonce.face*18, h[1] - 44], [h[0] - nonce.face*22, h[1] - 36], [h[0] - nonce.face*18, h[1] - 28], [h[0] - nonce.face*14, h[1] - 36]]); fs(g, C.paper, C.ink, 1.4);
}
function drawSeated(g, x, y, face, p){
  const s = persp(y); g.save(); g.translate(x, y); g.scale(s * face, s);
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(4, 0, 26, 6, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-6, -44); g.lineTo(-6, -2); fs(g, null, C.ink, 3);
  g.beginPath(); g.ellipse(-6, -46, 18, 5, 0, 0, TAU); fs(g, C.paper);
  limb(g, [[-12, -96], [-14, -76], [2, -64]], 8, p.shirt);
  limb(g, [[-6, -52], [18, -54], [20, -4]], 10, p.pants);
  limb(g, [[2, -52], [26, -52], [28, -4]], 10, p.pants);
  g.fillStyle = C.ink; g.beginPath(); g.ellipse(32, -2, 7, 3.6, 0, 0, TAU); g.fill();
  g.beginPath(); g.moveTo(-14, -50); g.lineTo(-15, -92); g.quadraticCurveTo(-14, -105, -2, -106); g.lineTo(4, -106); g.quadraticCurveTo(16, -104, 15, -92); g.lineTo(14, -50); g.closePath(); fs(g, p.shirt);
  head(g, -124, p);
  limb(g, [[9, -96], [22, -80], [34, -88]], 8, p.shirt);
  g.save(); g.translate(36, -92); g.rotate(-.3); g.beginPath(); g.rect(-5, -8, 11, 15); fs(g, C.cyan, C.ink, 1.5); g.beginPath(); g.rect(-1, -10, 11, 15); fs(g, C.paper, C.ink, 1.5); g.restore();
  hand(g, 34, -88, p.skin);
  g.restore();
}
const MIRA = { style:'long', hair:C.peach, skin:C.skin, shirt:C.lav, pants:C.peri };
const OSKAR = { style:'short', hair:C.ink2, skin:C.skin, shirt:C.peri, pants:C.violet };
function drawCardTable(g){
  drawSeated(g, 350, 736, 1, OSKAR); drawSeated(g, 512, 736, -1, MIRA);
  const x = 431, y = 748, s = persp(y), ty = y - 60 * s, rx = 84 * s, ry = 20 * s;
  g.beginPath(); g.moveTo(x - rx, ty); g.lineTo(x - rx + 4, y - 6);
  for (let i = 0; i < 6; i++){ const x0 = x - rx + 4 + i * (2*rx - 8) / 6; g.quadraticCurveTo(x0 + (2*rx - 8)/12, y + 3, x0 + (2*rx - 8)/6, y - 6); }
  g.lineTo(x + rx, ty); g.ellipse(x, ty, rx, ry, 0, 0, Math.PI, false); g.closePath(); fs(g, C.paper);
  g.strokeStyle = C.ink2; g.lineWidth = 1; g.beginPath(); [-.5, 0, .5].forEach(k => { g.moveTo(x + k*rx, ty + ry*.8); g.lineTo(x + k*rx*1.02, y - 8); }); g.stroke();
  g.beginPath(); g.ellipse(x, ty, rx, ry, 0, 0, TAU); fs(g, C.paper);
  [[-30,-2,.3,C.cyan],[-14,4,-.2,C.peri],[22,-4,.5,C.lav]].forEach(([dx,dy,r,c]) => { g.save(); g.translate(x + dx*s, ty + dy*s); g.rotate(r); g.beginPath(); g.rect(-6*s, -4*s, 12*s, 8*s); fs(g, c, C.ink, 1.2); g.restore(); });
  [[4,2,C.peach],[10,-2,C.cyan],[14,5,C.peach],[-2,-6,C.lav]].forEach(([dx,dy,c]) => { g.beginPath(); g.ellipse(x + dx*s, ty + dy*s, 4*s, 2.4*s, 0, 0, TAU); fs(g, c, C.ink, 1); });
}
const TESS = { style:'bun', hair:C.violet, skin:C.skin, shirt:C.cyan, pants:C.peach };
function drawTess(g, t){
  const x = 1150, y = 815, s = persp(y);
  g.save(); g.translate(x, y);
  poly(g, [[-104*s, -16*s], [86*s, -24*s], [104*s, 16*s], [-86*s, 22*s]]); fs(g, C.peach);
  poly(g, [[-92*s, -10*s], [78*s, -17*s], [92*s, 11*s], [-76*s, 16*s]]); fs(g, null, C.ink2, 1.2);
  g.scale(-s, s);
  limb(g, [[-8, -30], [-24, -8], [8, -6]], 11, TESS.pants);
  limb(g, [[6, -30], [26, -6], [-4, -4]], 11, TESS.pants);
  g.beginPath(); g.moveTo(-14, -26); g.lineTo(-15, -68); g.quadraticCurveTo(-14, -81, -2, -82); g.lineTo(4, -82); g.quadraticCurveTo(16, -80, 15, -68); g.lineTo(14, -26); g.closePath(); fs(g, TESS.shirt);
  head(g, -100, TESS);
  const k = reduce ? 0 : Math.sin(t * 2.2) * 3;
  limb(g, [[10, -72], [22, -50], [34, -38 + k]], 8, TESS.shirt); hand(g, 34, -38 + k, TESS.skin);
  g.restore();
  if (machine.vis){ drawMachine(g, t); return; }
  [[-66, 4, C.cyan, 1], [-44, 12, C.lav, .8], [-80, -8, C.violet, .7], [-30, -4, C.cyan, .6]].forEach(([dx, dy, c, k2], i) => {
    const cx = x + dx * s, cy = y + dy * s - 10 * s * k2 - (reduce ? 0 : Math.sin(t * 1.5 + i) * 1.5), r = 11 * s * k2;
    poly(g, [[cx, cy - r * 1.4], [cx - r, cy], [cx, cy + r * .9], [cx + r, cy]]); fs(g, c, C.ink, 1.4);
    g.beginPath(); g.moveTo(cx - r, cy); g.lineTo(cx + r, cy); g.moveTo(cx, cy - r*1.4); g.lineTo(cx, cy + r*.9); g.strokeStyle = C.ink; g.lineWidth = .9; g.stroke();
  });
}
const machine = { x:1080, y:808, vis:false, version:0, flash:0, deny:0, held:[] };
function drawMachine(g, t){
  const s = persp(machine.y), x = machine.x, y = machine.y;
  g.save(); g.translate(x, y); g.scale(s, s);
  if (machine.flash > 0 || machine.deny > 0){
    g.fillStyle = machine.deny > 0 ? hexA(C.peach, machine.deny * .8) : hexA(C.cyan, machine.flash * .7);
    g.beginPath(); g.arc(0, -40, 70, 0, TAU); g.fill();
  }
  poly(g, [[-34, -8], [-30, -40], [30, -40], [34, -8]]); fs(g, C.lav);
  g.beginPath(); g.ellipse(0, -6, 34, 8, 0, 0, Math.PI); fs(g, C.lav);
  // entrées et sortie
  poly(g, [[-40, -46], [-26, -46], [-30, -34], [-36, -34]]); fs(g, C.peach);
  poly(g, [[26, -46], [40, -46], [36, -34], [30, -34]]); fs(g, C.peach);
  g.beginPath(); g.rect(-8, -22, 16, 10); fs(g, C.paper, C.ink, 1.5);
  // dôme de verre
  g.beginPath(); g.ellipse(0, -40, 24, 7, 0, 0, TAU); fs(g, C.paper);
  g.beginPath(); g.moveTo(-22, -41); g.bezierCurveTo(-22, -80, 22, -80, 22, -41); fs(g, hexA(C.cyan, .35));
  const b = reduce ? 0 : Math.sin(t * 2) * 2.5;
  drawGem(g, 0, -56 + b, 1.2, machine.deny > 0 ? C.peach : C.violet);
  machine.held.forEach((k, i) => { const hx = i ? 10 : -10; if (k === 'gems') drawGem(g, hx, -46, .7, C.cyan); else drawCards(g, hx, -47, .6); });
  g.strokeStyle = C.paper; g.lineWidth = 2; g.beginPath(); g.moveTo(-14, -48); g.quadraticCurveTo(-14, -64, -6, -68); g.stroke();
  // numéro de version gravé
  g.fillStyle = C.ink; for (let i = 0; i < machine.version; i++){ g.beginPath(); g.arc(-22 + i * 6, -16, 1.8, 0, TAU); g.fill(); }
  g.restore();
}
function drawCards(g, x, y, k){
  g.save(); g.translate(x, y); g.scale(k, k);
  [-.25, 0, .25].forEach((r, i) => { g.save(); g.rotate(r); g.beginPath(); g.rect(-6, -14, 12, 17); fs(g, i === 1 ? C.peach : C.paper, C.ink, 1.5); g.restore(); });
  drawSparkle(g, 0, -6, .3);
  g.restore();
}
function drawSalle(g, t){
  const s = persp(salle.y), x = salle.x, y = salle.y;
  g.save(); g.translate(x, y); g.scale(s, s);
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(0, 0, 70, 10, 0, 0, TAU); g.fill();
  if (salle.glow > 0){ g.fillStyle = hexA(C.cyan, salle.glow * .6); g.beginPath(); g.arc(0, -80, 90, 0, TAU); g.fill(); }
  // murs
  g.beginPath(); g.moveTo(-58, 0); g.lineTo(-58, -110); g.arc(0, -110, 58, Math.PI, 0); g.lineTo(58, 0); g.closePath(); fs(g, C.lav);
  g.beginPath(); g.moveTo(-40, 0); g.lineTo(-40, -106); g.arc(0, -106, 40, Math.PI, 0); g.lineTo(40, 0); g.closePath(); fs(g, C.mist);
  // rideau
  g.strokeStyle = C.ink2; g.lineWidth = 1.2; g.beginPath();
  for (let i = -30; i <= 30; i += 10){ const sw = reduce ? 0 : Math.sin(t * 1.2 + i) * 2; g.moveTo(i, -140); g.quadraticCurveTo(i + sw, -70, i + sw * 1.5, -2); }
  g.stroke();
  g.beginPath(); g.moveTo(-40, -110); g.quadraticCurveTo(-20, -96, 0, -110); g.quadraticCurveTo(20, -96, 40, -110); fs(g, C.cyan, C.ink, 1.6);
  // enseigne
  g.beginPath(); g.rect(-26, -186, 52, 16); fs(g, C.paper, C.ink, 1.6);
  for (let i = 0; i < 4; i++) drawGem(g, -15 + i * 10, -178, .35, i % 2 ? C.cyan : C.violet);
  // petites fenêtres et gens à l'intérieur
  [[-49, -60], [49, -60]].forEach(([wx, wy]) => { g.beginPath(); g.arc(wx, wy, 5, 0, TAU); fs(g, C.cyan, C.ink, 1.2); });
  g.restore();
}
function drawCat(g, c, t){
  const s = persp(c.y) * .95;
  g.save(); g.translate(c.x, c.y);
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(0, 0, 22 * s, 5 * s, 0, 0, TAU); g.fill();
  g.scale(s * c.face, s); g.lineJoin = 'round';
  const ear = (hx, hy) => { poly(g, [[hx - 10, hy - 5], [hx - 9, hy - 19], [hx - 1, hy - 10]]); fs(g, C.paper); poly(g, [[hx + 2, hy - 10], [hx + 10, hy - 19], [hx + 11, hy - 4]]); fs(g, C.paper); };
  const face = (hx, hy) => { g.strokeStyle = C.ink; g.lineWidth = 1.6; const bl = (t % 4) < .15;
    g.beginPath(); if (bl){ g.moveTo(hx - 1, hy); g.lineTo(hx + 3, hy); g.moveTo(hx + 7, hy); g.lineTo(hx + 11, hy); } else { g.arc(hx + 1, hy, 1.7, 0, TAU); g.moveTo(hx + 10.7, hy); g.arc(hx + 9, hy, 1.7, 0, TAU); } g.stroke();
    g.fillStyle = C.peach; g.beginPath(); g.arc(hx + 5, hy + 5, 1.8, 0, TAU); g.fill(); };
  if (c.moving){
    const sw = Math.sin(c.walk * 1.2);
    limb(g, [[-24, -22], [-38, -34 + sw*3], [-34, -46]], 5, C.paper);
    limb(g, [[-14, -14], [-14 - sw*6, -1]], 5, C.paper); limb(g, [[14, -14], [14 + sw*6, -1]], 5, C.paper);
    g.beginPath(); g.ellipse(0, -22, 24, 12, 0, 0, TAU); fs(g, C.paper);
    limb(g, [[-8, -14], [-8 + sw*6, -1]], 5, C.paper); limb(g, [[20, -14], [20 - sw*6, -1]], 5, C.paper);
    ear(24, -34); g.beginPath(); g.arc(24, -34, 11, 0, TAU); fs(g, C.paper); face(20, -35);
  } else {
    const tw = reduce ? 0 : Math.sin(t * 2) * 4;
    limb(g, [[-10, -4], [-28, -2], [-30, -18 + tw]], 5, C.paper);
    g.beginPath(); g.ellipse(0, -22, 15, 21, 0, 0, TAU); fs(g, C.paper);
    limb(g, [[5, -10], [6, -1]], 5, C.paper);
    ear(4, -46); g.beginPath(); g.arc(4, -46, 12, 0, TAU); fs(g, C.paper); face(0, -47);
  }
  g.restore();
}
function drawSeed(g, x, y, k){
  g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); g.ellipse(0, 0, 8, 6, -.4, 0, TAU); fs(g, C.peach, C.ink, 1.8);
  g.beginPath(); g.moveTo(-3, -1); g.quadraticCurveTo(0, -4, 4, -2); g.strokeStyle = C.ink; g.lineWidth = 1.4; g.stroke();
  g.restore();
}
function drawGem(g, x, y, k, col){
  g.save(); g.translate(x, y); g.scale(k, k);
  poly(g, [[0, -12], [-8, 0], [0, 8], [8, 0]]); fs(g, col || C.cyan, C.ink, 1.6);
  g.beginPath(); g.moveTo(-8, 0); g.lineTo(8, 0); g.moveTo(0, -12); g.lineTo(0, 8); g.strokeStyle = C.ink; g.lineWidth = 1; g.stroke();
  g.restore();
}
function drawChest(g, c){
  if (!c.vis || c.alpha <= 0) return;
  const s = persp(c.y) * c.sc;
  g.save(); g.globalAlpha = c.alpha; g.translate(c.x, c.y); g.scale(s, s);
  g.fillStyle = hexA(C.ink, .12); g.beginPath(); g.ellipse(6, 0, 42, 7, 0, 0, TAU); g.fill();
  if (c.flash > 0){ g.fillStyle = hexA(C.cyan, c.flash * .7); g.beginPath(); g.arc(6, -24, 62, 0, TAU); g.fill(); }
  poly(g, [[-30, -40], [-18, -52], [42, -52], [30, -40]]); fs(g, hexA(C.cyan, .5));
  poly(g, [[30, -40], [42, -52], [42, -12], [30, 0]]); fs(g, hexA(C.cyan, .38));
  if (c.content) drawSeed(g, 2, -11, 1.3);
  g.beginPath(); g.rect(-30, -40, 60, 40); fs(g, hexA(C.cyan, .3), C.ink, 2.2);
  g.beginPath(); g.moveTo(-30, -30); g.lineTo(30, -30); g.lineTo(42, -42); g.strokeStyle = C.ink; g.lineWidth = 1.4; g.stroke();
  g.beginPath(); g.rect(-5, -36, 10, 12); fs(g, C.paper, C.ink, 1.6);
  g.fillStyle = C.ink; g.beginPath(); g.arc(0, -31, 1.8, 0, TAU); g.fill(); g.fillRect(-.8, -31, 1.6, 4);
  g.strokeStyle = C.paper; g.lineWidth = 2.4; g.beginPath(); g.moveTo(-24, -6); g.lineTo(-15, -22); g.moveTo(-17, -5); g.lineTo(-12, -13); g.stroke();
  g.restore();
}
function drawPlanter(g, t){
  const x = planter.x, y = planter.y, s = persp(y);
  g.save(); g.translate(x, y); g.scale(s, s);
  // grow de 0 à 1 : la première pousse ; au-delà de 1 : un deuxième palmier pousse à côté (chapitre 7)
  const sprout = (ox, gr, ph) => {
    const h = 70 * gr, sway = (reduce ? 0 : Math.sin(t * 1.3 + ph) * 2) + ox;
    g.beginPath(); g.moveTo(ox, -22); g.quadraticCurveTo(ox - 4, -22 - h * .5, sway, -22 - h); fs(g, null, C.ink, 3);
    for (let i = 0; i < 5; i++){ const a = -2.7 + i * .6, l = 36 * gr;
      g.beginPath(); g.moveTo(sway, -22 - h); g.quadraticCurveTo(sway + Math.cos(a)*l*.6, -22 - h + Math.sin(a)*l*.6, sway + Math.cos(a)*l, -22 - h + Math.sin(a)*l*.5 + l*.35);
      g.strokeStyle = C.ink; g.lineWidth = 2; g.stroke();
      for (let j = 1; j < 6; j++){ const u = j / 6, p = quad([sway, -22-h], [sway + Math.cos(a)*l*.6, -22-h + Math.sin(a)*l*.6], [sway + Math.cos(a)*l, -22-h + Math.sin(a)*l*.5 + l*.35], u);
        g.beginPath(); g.moveTo(p[0], p[1]); g.lineTo(p[0] + 4*gr, p[1] + 7*gr); g.moveTo(p[0], p[1]); g.lineTo(p[0] - 4*gr, p[1] + 7*gr); g.lineWidth = 1.2; g.stroke(); }
    }
  };
  if (planter.grow > 1) sprout(18, (planter.grow - 1) / .6 * .8, 1.7);
  if (planter.grow > 0) sprout(planter.grow > 1 ? -10 : 0, Math.min(1, planter.grow), 0);
  g.beginPath(); g.moveTo(-46, -22); g.lineTo(-46, -4); g.ellipse(0, -4, 46, 13, 0, Math.PI, 0, true); g.lineTo(46, -22); g.ellipse(0, -22, 46, 13, 0, 0, Math.PI, false); g.closePath(); fs(g, C.lav);
  g.beginPath(); g.ellipse(0, -22, 46, 13, 0, 0, TAU); fs(g, C.paper);
  g.beginPath(); g.ellipse(0, -22, 37, 9, 0, 0, TAU); fs(g, C.violet, C.ink, 1.4);
  if (planter.grow > 0){ g.beginPath(); g.ellipse(0, -22, 9, 3, 0, 0, TAU); fs(g, C.peach, C.ink, 1); }
  g.restore();
}
function drawMarker(g, x, y, t){
  const b = reduce ? 0 : Math.sin(t * 3) * 6;
  poly(g, [[x, y - 22 + b], [x - 10, y - 6 + b], [x, y + 2 + b], [x + 10, y - 6 + b]]); fs(g, C.cyan, C.ink, 2);
  g.beginPath(); g.moveTo(x - 10, y - 6 + b); g.lineTo(x + 10, y - 6 + b); g.strokeStyle = C.ink; g.lineWidth = 1.2; g.stroke();
}
function drawSparkle(g, x, y, k){
  g.save(); g.translate(x, y); g.scale(k, k);
  g.beginPath(); g.moveTo(0, -12); g.quadraticCurveTo(2, -2, 12, 0); g.quadraticCurveTo(2, 2, 0, 12); g.quadraticCurveTo(-2, 2, -12, 0); g.quadraticCurveTo(-2, -2, 0, -12); fs(g, C.cyan, C.ink, 1.6);
  g.restore();
}

/* ---------- world state ---------- */
const player = {}, nonce = {}, cat = {}, chest = {}, planter = {}, stranger = {};
const walkers = [];
const CAT_WP = [[880,782],[995,722],[1100,700],[1262,668]];
const OBST = [[430,740,128,40],[800,608,150,30],[1200,645,34,13],[1150,815,104,32],[640,640,52,18],[180,702,46,18],[1420,717,46,18]];
let phase = 'title', lock = true, meetTriggered = false, time = 0, sparkleUntil = -1, camFocus = null;
const inventory = { key:false, items:[] }, ledger = [];
let tableTalk = 0, tessTalk = 0, busy = false, chapterDone = 0;
const ch2 = {}, ch3 = {}, ch4 = {}, ch5 = {}, ch6 = {}, ch7 = {}, ch8 = {}, ch9 = {}, ch10 = {};
const newbie = {};
const salle = { x:1318, y:770, vis:false, glow:0 };
const fx = [], tweens = [], waiters = [];

function resetWorld(){
  Object.assign(player, { x:800, y:950, face:1, walk:0, moving:false, target:null, shirt:C.peach, pants:C.lav, hair:C.violet, style:'short', skin:C.skin, gesture:false });
  Object.assign(nonce, { x:1200, y:645, face:-1, walk:0, moving:false, target:null, tall:1.12, robe:true, hat:true, shirt:C.cyan, pants:C.peri, hair:C.ink2, style:'short', skin:C.skin, gesture:false });
  Object.assign(cat, { x:712, y:842, face:1, walk:0, moving:false, target:null, wp:-1 });
  Object.assign(chest, { x:1136, y:716, vis:false, sc:0, alpha:1, content:false, flash:0 });
  Object.assign(planter, { x:640, y:640, grow:0, planted:false });
  Object.assign(stranger, { x:-120, y:770, face:1, walk:0, moving:false, target:null, vis:false, tall:1.1, robe:true, hat:true, hatColor:C.lav, cape:C.peach, shirt:C.lav, pants:C.peri, hair:C.peach, style:'short', skin:C.skin, smile:true, badge:true, gesture:false });
  Object.assign(ch2, { metTess:false, met:false, toldNonce:false, resisted:0, stolen:null });
  Object.assign(machine, { vis:false, version:0, flash:0, deny:0, held:[] });
  Object.assign(ch3, { talked:false, asked:false, tests:0, deploys:0, done:false });
  Object.assign(ch4, { called:false, right:0, wrong:0, slashed:false, bribed:false });
  Object.assign(ch5, { called:false, tips:0, mev:false, full:false, myTip:null, waited:0 });
  Object.assign(ch6, { called:false, supply:100, mint:false, free:true, storage:null, pick:null });
  Object.assign(ch7, { called:false, proposal:null, rehearsals:0, outcome:null, base:null });
  Object.assign(ch8, { talked:false, asked:false, design:null, stake:false, tests:0, oracle:null, bridge:null, lent:false });
  Object.assign(ch9, { called:false, trades:0, caught:null, wrongClicks:0, fast:false, lent:false });
  Object.assign(ch10, { called:false, good:0 });
  Object.assign(newbie, { x:760, y:960, face:1, walk:0, moving:false, target:null, vis:false, shirt:C.cyan, pants:C.peach, hair:C.peach, style:'long', skin:C.skin, gesture:false });
  salle.vis = false;
  chapterDone = 0;
  walkers.length = 0;
  walkers.push({ x:620, y:580, face:1, walk:0, moving:true, shirt:C.lav, pants:C.peri, hair:C.peach, style:'long', skin:C.skin, min:628, max:700, sp:18 });
  walkers.push({ x:990, y:590, face:-1, walk:1, moving:true, shirt:C.peach, pants:C.violet, hair:C.ink2, style:'bun', skin:C.skin, min:880, max:1045, sp:20 });
  inventory.key = false; inventory.items = []; ledger.length = 0;
  meetTriggered = false; tableTalk = 0; tessTalk = 0; sparkleUntil = -1; busy = false;
  fx.length = 0; tweens.length = 0; waiters.length = 0;
  setObjective(null); $('chestBtn').hidden = true; $('panel').hidden = true; renderPanel();
}

/* ---------- movement ---------- */
function collide(e){
  for (const [cx, cy, rx, ry] of (salle.vis ? OBST.concat([[salle.x, salle.y, 58, 18]]) : OBST)){
    let dx = (e.x - cx) / rx, dy = (e.y - cy) / ry, d = dx*dx + dy*dy;
    if (d < 1){ if (d < 1e-4){ dx = 0; dy = 1; d = 1; } const k = 1 / Math.sqrt(d); e.x = cx + dx * k * rx; e.y = cy + dy * k * ry; }
  }
  e.x = clamp(e.x, 170, 1430); e.y = clamp(e.y, 622, 875);
}
function walkTo(e, x, y, sp = 230, collideOn = false){
  return new Promise(res => { e.target = { x, y, sp, res, collide:collideOn, stuck:0 }; });
}
function moveEntity(e, dt){
  const TG = e.target; if (!TG){ e.moving = false; return; }
  const dx = TG.x - e.x, dy = TG.y - e.y, d = Math.hypot(dx, dy), step = TG.sp * persp(e.y) * dt;
  if (Math.abs(dx) > 1.5) e.face = dx > 0 ? 1 : -1;
  if (d <= step){ e.x = TG.x; e.y = TG.y; e.target = null; e.moving = false; TG.res && TG.res(); return; }
  e.x += dx / d * step; e.y += dy / d * step; e.moving = true; e.walk += dt * 10;
  if (TG.collide){ collide(e); if (Math.hypot(TG.x - e.x, TG.y - e.y) >= d - .05){ TG.stuck += dt; if (TG.stuck > .35){ e.target = null; e.moving = false; TG.res && TG.res(); } } else TG.stuck = 0; }
}
function until(fn){ return new Promise(res => waiters.push({ fn, res })); }
function wait(ms){ return new Promise(r => setTimeout(r, ms)); }
function tween(dur, fn){ return new Promise(res => tweens.push({ t:0, dur, fn, res })); }

/* ---------- effects ---------- */
function flyItem(from, to, dur, kind){
  sfx(kind === 'bubble' ? 'bubble' : 'gift');
  return new Promise(res => fx.push({ t:0, dur, res, draw(g, u){
    const e = ease(u), c = [(from[0] + to[0]) / 2, Math.min(from[1], to[1]) - 110];
    for (let k = 6; k >= 1; k--){ const pk = quad(from, c, to, Math.max(0, e - k * .03)); g.fillStyle = hexA(C.cyan, .5 - k * .06); g.beginPath(); g.arc(pk[0], pk[1], 7 - k * .7, 0, TAU); g.fill(); }
    const p = quad(from, c, to, e);
    if (kind === 'bubble'){ const r = 8 + e * 26; g.globalAlpha = .75; g.beginPath(); g.arc(p[0], p[1], r, 0, TAU); fs(g, C.cyan, C.ink, 1.6); g.globalAlpha = 1; g.strokeStyle = C.paper; g.lineWidth = 2; g.beginPath(); g.arc(p[0], p[1], r * .65, -2.6, -1.8); g.stroke(); }
    else if (kind === 'bird'){ const fl = Math.sin(u * 40) * 5; g.save(); g.translate(p[0], p[1]); poly(g, [[-14, -2 - fl], [0, 0], [-6, 6]]); fs(g, C.paper, C.ink, 1.5); poly(g, [[14, -2 - fl], [0, 0], [6, 6]]); fs(g, C.paper, C.ink, 1.5); poly(g, [[-3, 0], [9, -3], [-3, 4]]); fs(g, C.lav, C.ink, 1.3); g.restore(); }
    else if (kind === 'cards'){ g.fillStyle = hexA(C.peach, .5); g.beginPath(); g.arc(p[0], p[1], 18, 0, TAU); g.fill(); drawCards(g, p[0], p[1] + 6, 1.1); }
    else if (kind === 'gems2'){ g.fillStyle = hexA(C.cyan, .5); g.beginPath(); g.arc(p[0], p[1], 18, 0, TAU); g.fill(); drawGem(g, p[0] - 6, p[1] + 2, .9, C.cyan); drawGem(g, p[0] + 6, p[1] + 2, .9, C.lav); }
    else if (kind === 'gems'){ g.fillStyle = hexA(C.cyan, .5); g.beginPath(); g.arc(p[0], p[1], 20, 0, TAU); g.fill(); drawGem(g, p[0] - 9, p[1] + 2, .9, C.cyan); drawGem(g, p[0] + 9, p[1] + 2, .9, C.lav); drawGem(g, p[0], p[1] - 6, 1, C.violet); }
    else { g.fillStyle = hexA(C.cyan, .5); g.beginPath(); g.arc(p[0], p[1], 16, 0, TAU); g.fill(); drawSeed(g, p[0], p[1], 1.3); }
  }}));
}
function ring(x, y, dur){
  sfx('pop');
  return new Promise(res => fx.push({ t:0, dur, res, draw(g, u){ g.globalAlpha = 1 - u; g.beginPath(); g.arc(x, y, 20 + u * 60, 0, TAU); fs(g, null, C.ink, 2); for (let i = 0; i < 8; i++){ const a = i * TAU / 8; drawSparkle(g, x + Math.cos(a) * (30 + u * 50), y + Math.sin(a) * (30 + u * 50), .5); } g.globalAlpha = 1; } }));
}
function witnesses(){
  const list = [[350, 736, 124], [512, 736, 124], [1150, 815, 100]];
  walkers.forEach(w => list.push([w.x, w.y, 150]));
  return list.map(([x, y, h]) => [x, y - h * persp(y) - 30]);
}
let toastTimer = 0;
function inscribe(from, to, what){
  const bloc = 1048 + ledger.length;
  ledger.push({ bloc, from, to, what });
  $('toastHead').textContent = T('Registre · bloc ') + bloc.toLocaleString(LOCALE);
  $('toastRow').textContent = `${TD(from)} → ${TD(to)} · ${TD(what)}`;
  $('toast').classList.add('show'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $('toast').classList.remove('show'), 5200);
  sparkleUntil = time + 4.5;
  sfx(to === 'Célestin' ? 'theft' : 'ledger');
  renderPanel();
}
function renderPanel(){
  const has = inventory.items.length > 0;
  $('contentsText').textContent = has ? inventory.items.map(TD).join(', ') + '.' : (ledger.length ? T('Vide. Mais le registre se souvient de tout ce qui y est passé.') : T('Vide.'));
  $('panelSeed').style.display = has ? '' : 'none';
  $('hudSeed').style.display = has ? '' : 'none';
  $('lockText').textContent = inventory.key ? T('Ta phrase de 12 mots') : T('Pas encore de clé');
  const ol = $('ledgerList'); ol.innerHTML = '';
  if (!ledger.length){ const li = document.createElement('li'); li.className = 'empty'; li.textContent = T("Rien d'inscrit à ton nom pour l'instant."); ol.appendChild(li); }
  ledger.forEach(e => { const li = document.createElement('li'); li.innerHTML = `<span>${T('bloc')} ${e.bloc.toLocaleString(LOCALE)}</span><br>`; li.appendChild(document.createTextNode(`${TD(e.from)} → ${TD(e.to)} · ${TD(e.what)}`)); ol.appendChild(li); });
}
function setObjective(txt){ $('objective').hidden = !txt; if (txt) $('objText').textContent = txt; }

/* ---------- dialogue ---------- */
const dlg = $('dialog'), speakerEl = $('speaker'), lineEl = $('line'), choicesEl = $('choices'), moreEl = $('more');
let advanceFn = null;
function say(who, text, choices){
  return new Promise(res => {
    dlg.hidden = false; dlg.classList.toggle('narration', !who);
    speakerEl.hidden = !who; speakerEl.textContent = who || ''; speakerEl.dataset.who = who || '';
    nonce.gesture = who === 'Nonce'; stranger.gesture = who === 'Célestin';
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
    if (reduce) finish(); else timer = setInterval(() => { i += 1; lineEl.textContent = text.slice(0, i); if (i % 4 === 0 && text[i] !== ' ') sfx('blip'); if (i >= text.length) finish(); }, 20);
  });
}
function closeDialog(){ dlg.hidden = true; advanceFn = null; nonce.gesture = false; stranger.gesture = false; }
dlg.addEventListener('click', () => advanceFn && advanceFn());
async function chat(lines){
  if (busy) return; busy = true; const was = lock; lock = true;
  for (const [w, t] of lines) await say(w, t);
  closeDialog(); lock = was; busy = false;
}

/* ---------- modals ---------- */
const modal = $('modal'), mcard = $('modalCard');
const POOL = LANG === 'en' ? POOL_EN : ['palmier','lune','marée','verre','colonne','lanterne','sable','orage','plume','écho','ruche','galet','voile','cerise','brume','phare','racine','comète','lierre','ancre','prisme','horloge','jardin','vague','pollen','falaise','miroir','nuage','fougère','boussole','pastel','cristal','abeille','tambour','cèdre','étoile','sentier','corail','flocon','mousse','pinceau','rivière','tuile','figue','renard','cloche','argile','hibou'];
const shuffle = a => { for (let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
function showSeed(words){
  return new Promise(res => {
    mcard.innerHTML = T`<p class="eyebrow">Ta clé</p><h2>Douze mots</h2><p>Note-les dans l'ordre, sur papier, loin des regards. Si tu les perds, personne ne pourra te rendre ton coffre.</p><ol class="seed">${words.map(w => `<li>${w}</li>`).join('')}</ol><div class="row"><button class="btn primary" id="seedOk">Je les ai notés</button></div>`;
    modal.hidden = false; const b = $('seedOk'); b.focus({ preventScroll:true });
    b.addEventListener('click', () => { modal.hidden = true; res(); });
  });
}
function showQuiz(words){
  return new Promise(res => {
    const idx = Math.floor(Math.random() * 12), right = words[idx];
    const decoy = words[(idx + 1) % 12], others = shuffle(POOL.filter(w => !words.includes(w))).slice(0, 2);
    const opts = shuffle([right, decoy, ...others]);
    mcard.innerHTML = T`<p class="eyebrow">Nonce vérifie</p><h2>Le ${idx + 1}<sup>${idx ? 'e' : 'er'}</sup> mot ?</h2><p>« Sans regarder. C'était lequel, déjà ? »</p><div class="quiz">${opts.map(o => `<button class="btn" data-w="${o}">${o}</button>`).join('')}</div>`;
    modal.hidden = false; mcard.querySelector('button').focus({ preventScroll:true });
    mcard.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => { modal.hidden = true; res(b.dataset.w === right); }));
  });
}

function showParchment(){
  return new Promise(res => {
    const draw = revealed => {
      mcard.classList.add('parchment');
      mcard.innerHTML = T`<p class="eyebrow">Assistance officielle de l'Atrium</p><h2>Autorisation de vérification</h2>
        <p>Je soussigné·e, propriétaire du coffre en verre, confirme la vérification de routine de mon coffre par l'Assistance officielle de l'Atrium.</p>
        <p class="fine${revealed ? ' revealed' : ''}">…et autorise Célestin, pour une durée illimitée, à retirer tout ou partie du contenu de mon coffre, présent et futur, sans autre accord de ma part.</p>
        <p class="sign">Signature : ______________________</p>
        <div class="row">${revealed
          ? T`<button class="btn" id="pSign">Signer quand même</button><button class="btn primary" id="pRefuse">Refuser de signer</button>`
          : T`<button class="btn primary" id="pSign">Signer</button><button class="btn" id="pRead">Lire les petites lignes</button>`}</div>`;
      modal.hidden = false; mcard.querySelector('button').focus({ preventScroll:true });
      const done = v => { modal.hidden = true; mcard.classList.remove('parchment'); res(v); };
      $('pSign').addEventListener('click', () => done(true));
      if (revealed) $('pRefuse').addEventListener('click', () => done(false));
      else $('pRead').addEventListener('click', () => draw(true));
    };
    draw(false);
  });
}
function showEnd(o){
  const card = $('endCard');
  card.innerHTML = `<p class="eyebrow">${o.eyebrow}</p><h2>${o.title}</h2><ul class="recap">${o.recap.map(r => `<li>${r}</li>`).join('')}</ul>${o.teaser ? `<p class="teaser">${o.teaser}</p>` : ''}<div class="row"></div>${o.saved ? T('<p class="hint">Progression sauvegardée sur cet appareil.</p>') : ''}`;
  const row = card.querySelector('.row');
  o.buttons.forEach(([label, fn, primary]) => { const b = document.createElement('button'); b.className = 'btn' + (primary ? ' primary' : ''); b.textContent = label;
    b.addEventListener('click', () => { $('end').hidden = true; fn(); }); row.appendChild(b); });
  $('end').hidden = false; row.firstChild.focus({ preventScroll:true }); sfx('end');
}
function stay(){ lock = false; phase = 'free'; }

/* ---------- sauvegarde (navigateur, par appareil) ---------- */
const SAVE_KEY = 'atrium.save.v1';
function readSave(){ try { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); if (!d || d.v !== 1) return null;
  // l'ancien chapitre 6 (petites salles) a été retiré : ces sauvegardes reprennent au chapitre des jetons
  if (d.chapterDone >= 6 && !d.ch6) d.chapterDone = 5;
  return d; } catch (e) { return null; } }
function writeSave(){
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ v:1, chapterDone, ledger, items:inventory.items, key:inventory.key, ch2:{ resisted:ch2.resisted, stolen:ch2.stolen }, machineVersion:machine.version, ch4:{ slashed:ch4.slashed }, ch5:{ mev:ch5.mev }, ch6:chapterDone >= 6 ? { mint:ch6.mint, pick:ch6.pick } : undefined, ch7:chapterDone >= 7 ? { proposal:ch7.proposal, outcome:ch7.outcome } : undefined, ch8:chapterDone >= 8 ? { oracle:ch8.oracle, bridge:ch8.bridge } : undefined, ch9:chapterDone >= 9 ? { caught:ch9.caught } : undefined, ch10:chapterDone >= 10 ? { good:ch10.good } : undefined, savedAt:Date.now() })); return true; }
  catch (e) { return false; }
}
function clearSave(){ try { localStorage.removeItem(SAVE_KEY); } catch (e) { /* ignore */ } }
function restore(d){
  resetWorld();
  chapterDone = d.chapterDone; ledger.push(...d.ledger); inventory.items = d.items || []; inventory.key = !!d.key;
  Object.assign(ch2, d.ch2 || {}); Object.assign(ch4, d.ch4 || {}); Object.assign(ch5, d.ch5 || {}); Object.assign(ch6, d.ch6 || {}); Object.assign(ch7, d.ch7 || {}); Object.assign(ch8, d.ch8 || {}); Object.assign(ch9, d.ch9 || {}); Object.assign(ch10, d.ch10 || {});
  if (d.chapterDone >= 10) Object.assign(newbie, { vis:true, x:980, y:720, face:1 });
  Object.assign(cat, { x:1262, y:668, face:-1, wp:CAT_WP.length - 1 });
  Object.assign(planter, { grow:d.chapterDone >= 7 && ch7.proposal === 'palmier' && ch7.outcome !== 'stolen' ? 1.6 : 1, planted:true });
  if (d.chapterDone >= 3) Object.assign(machine, { vis:true, version:d.machineVersion || 1 });
  salle.vis = d.chapterDone >= 9;
  $('chestBtn').hidden = false; renderPanel();
}
async function resumeFree(){
  phase = 'resume'; lock = true; camFocus = null;
  Object.assign(player, { x:800, y:950, face:1 });
  await walkTo(player, 800, 800, 200);
  await say(null, T("Te revoilà dans l'Atrium. Ta pousse de palmier a encore grandi, et Gwei fait semblant de ne pas t'avoir attendu."));
  closeDialog(); stay();
}

/* ---------- story ---------- */
async function learnWords(){
  const words = shuffle(POOL.slice()).slice(0, 12);
  for (;;){
    await showSeed(words);
    if (await showQuiz(words)){ sfx('select'); break; }
    sfx('fail');
    await say('Nonce', T("Hmm. Si c'était pour de vrai, ton coffre serait perdu pour toujours. Personne ne pourrait te le rendre, pas même moi. On recommence ?"));
    closeDialog();
  }
  inventory.key = true; renderPanel();
}
function pulseChest(){ const cb = $('chestBtn'); cb.hidden = false; cb.classList.remove('pulse'); void cb.offsetWidth; if (!reduce) cb.classList.add('pulse'); }
async function conjureChest(){
  closeDialog(); nonce.gesture = true;
  Object.assign(chest, { vis:false, sc:0, alpha:1, content:false, flash:0 });
  await flyItem(nonceHand(), [chest.x + 6, chest.y - 30], 1.1, 'bubble');
  chest.vis = true; ring(chest.x + 6, chest.y - 30, .5);
  await tween(.55, u => { chest.sc = u < .7 ? u / .7 * 1.15 : 1.15 - (u - .7) / .3 * .15; });
  nonce.gesture = false;
}
async function stowChest(){
  await tween(.6, u => { chest.alpha = 1 - u; chest.sc = 1 - u * .5; });
  chest.vis = false; pulseChest();
}
async function chapter(){
  resetWorld(); phase = 'arrive'; lock = true; camFocus = null;
  await walkTo(player, 800, 836, 200);
  await wait(250);
  await say(null, T("Tu ouvres les yeux dans un grand atrium baigné de lumière. Des palmiers, des colonnes, des gens qui discutent à voix basse. Tu ne sais pas vraiment comment tu es arrivé ici."));
  await say(null, T("Un chat blanc est assis à côté de toi. Il te regarde, se lève, fait quelques pas vers le fond… puis se retourne, comme pour vérifier que tu suis."));
  closeDialog();
  cat.wp = 0; walkTo(cat, ...CAT_WP[0], 300).then(() => { cat.face = -1; });
  setObjective(T('Suis le chat')); phase = 'follow'; lock = false;

  await until(() => meetTriggered);
  phase = 'meet'; lock = true; setObjective(null); player.target = null;
  camFocus = { x:1150, y:672 };
  if (cat.wp < CAT_WP.length - 1){ cat.wp = CAT_WP.length - 1; walkTo(cat, ...CAT_WP[cat.wp], 360).then(() => { cat.face = -1; }); }
  await walkTo(player, 1082, 674, 230);
  player.face = 1; nonce.face = -1;
  await say('Nonce', T("Ah ! Gwei t'a trouvé. Il trouve toujours les nouveaux avant moi."));
  await say('Nonce', T("Bienvenue dans l'Atrium. Je m'appelle Nonce. Je suis là depuis… disons, depuis le tout premier bloc."));
  const c1 = await say('Nonce', T("Tu as l'air d'avoir des questions."), [T("C'est quoi, cet endroit ?"), T("Le premier bloc ?")]);
  if (c1 === 0) await say('Nonce', T("Un lieu que personne ne possède et que tout le monde fait tourner. Chaque personne que tu vois ici garde une copie du grand registre : tout ce qui s'est passé, depuis le début."));
  else await say('Nonce', T("Une page du grand registre, là où l'on note tout ce qui se passe ici. On compte le temps en pages. On les appelle des blocs."));
  await say('Nonce', T("Mais avant tout, il te faut quelque chose à toi."));
  await conjureChest();
  await say('Nonce', T("Voilà ton coffre. Il est en verre : tout le monde peut voir ce qu'il contient. Mais personne ne peut l'ouvrir, sauf toi."));
  await say('Nonce', T("Pour l'ouvrir, il faut une clé. Ici, une clé, c'est une phrase : douze mots, tirés au hasard. Écoute bien."));
  closeDialog();
  await learnWords();
  await say('Nonce', T("Parfait. Garde ces mots pour toi. Une dernière chose, et c'est la plus importante."));
  const c2 = await say('Nonce', T("Si un jour quelqu'un te demande ces douze mots, même avec un grand sourire, même s'il dit travailler pour l'Atrium…"), [T("…je les lui donne, s'il a l'air gentil."), T("…je ne les donne jamais.")]);
  if (c2 === 0) await say('Nonce', T("Non ! Jamais. Celui qui a tes douze mots a ton coffre. Personne ici n'en a besoin pour t'aider, moi compris. Surtout pas ceux qui sourient beaucoup."));
  else await say('Nonce', T("Exactement. Celui qui a tes douze mots a ton coffre. Personne ici n'en a besoin pour t'aider, moi compris."));
  await say('Nonce', T("Bon. Un coffre vide, c'est un peu triste. Tiens."));
  closeDialog(); nonce.gesture = true;
  await flyItem(nonceHand(), [chest.x + 2, chest.y - 14], 1.3, 'seed');
  chest.content = true; inventory.items = ['1 graine de palmier'];
  tween(1, u => { chest.flash = 1 - u; });
  inscribe('Nonce', 'toi', '1 graine de palmier');
  nonce.gesture = false; await wait(900);
  await say('Nonce', T("Une graine de palmier. La toute première graine plantée ici venait de quelqu'un qui accueillait quelqu'un. Comme moi avec toi."));
  await say('Nonce', T("Tu as vu ? Tout l'Atrium l'a vu passer. C'est écrit dans le registre, bloc 1 048. Ça ne s'effacera jamais."));
  await say('Nonce', T("Va la planter. Il y a une jardinière vide à gauche du grand cristal. Moi, je reste ici. Je suis toujours ici."));
  closeDialog();
  await stowChest();
  camFocus = null; setObjective(T('Plante ta graine à gauche du grand cristal')); phase = 'plant'; lock = false;

  await until(() => planter.planted);
  phase = 'ending';
  setObjective(null); inventory.items = []; renderPanel();
  await wait(600);
  await say(null, T("Une pousse sort de terre. Au loin, Nonce lève la main pour te saluer. À la table de cartes, quelqu'un murmure : « Bloc 1 049. »"));
  closeDialog();
  phase = 'free'; lock = true; chapterDone = 1;
  track('Chapitre terminé', { chapitre:1 });
  const saved1 = writeSave();
  await wait(500);
  showEnd({ eyebrow:T('Fin du chapitre 1'), title:T("L'arrivée"), recap:[
    T('Tu as reçu ton coffre en verre.'),
    T("Tu connais tes douze mots, et tu sais qu'on ne les donne jamais."),
    T('Ta première graine est inscrite dans le registre, pour toujours.')],
    teaser:T('<b>Chapitre 2.</b> Un inconnu très aimable viendra te demander tes douze mots.'), saved:saved1,
    buttons:[[T('Continuer : chapitre 2'), chapter2, true], [T("Rester dans l'Atrium"), stay]] });
}

/* chapter 2 : l'inconnu très aimable */
function setupChapter2(){
  if (chapterDone < 1){
    resetWorld();
    Object.assign(cat, { x:1262, y:668, face:-1, wp:CAT_WP.length - 1 });
    ledger.push({ bloc:1048, from:'Nonce', to:'toi', what:'1 graine de palmier' }, { bloc:1049, from:'toi', to:'jardinière commune', what:'1 graine de palmier' });
    inventory.key = true; chapterDone = 1;
  }
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(ch2, { metTess:false, met:false, toldNonce:false, resisted:0, stolen:null });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  inventory.items = []; $('chestBtn').hidden = false; renderPanel();
}
const CEL = 'Célestin';
async function chapter2(){
  setupChapter2(); phase = 'ch2-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Le lendemain. Ta pousse de palmier a gagné une feuille. Sur son tapis, Tess te fait de grands signes."));
  closeDialog(); setObjective(T('Va voir Tess sur son tapis')); phase = 'ch2-tess'; lock = false;

  await until(() => ch2.metTess);
  lock = true; setObjective(null); player.face = 1;
  await say('Tess', T("Elle marche ! Ma machine à promesses marche ! Je pose un cristal ici, et il ressort là-bas. Personne ne le touche, personne ne peut tricher."));
  await say('Tess', T("Tu l'as vue en panne hier, alors tu es un peu mon premier témoin. Tiens, ta paie de testeuse… de testeur. Enfin, ta paie."));
  closeDialog();
  const ts = persp(815), ps = persp(player.y);
  await flyItem([1150, 815 - 70 * ts], [player.x, player.y - 80 * ps], 1.1, 'gems');
  inventory.items = ['3 cristaux']; inscribe('Tess', 'toi', '3 cristaux'); pulseChest();
  await wait(700);
  await say('Tess', T("Trois cristaux. Va les montrer à Oskar, à la table de cartes. Il m'a juré que ma machine ne marcherait jamais."));
  closeDialog(); setObjective(T('Montre tes cristaux à Oskar')); phase = 'ch2-go'; lock = false;

  await until(() => ch2.met);
  phase = 'ch2-scam'; lock = true; player.target = null; setObjective(null);
  await walkTo(player, clamp(player.x, 300, 1300), 690, 250, true);
  const sx = player.x - 130 > 250 ? player.x - 130 : player.x + 130;
  stranger.x = sx < player.x ? -120 : 1720; stranger.y = player.y; stranger.vis = true;
  camFocus = { x:(player.x + sx) / 2, y:player.y };
  await say(null, T("Quelqu'un te coupe la route. Un chapeau, une robe, un badge qui brille. Et un très, très grand sourire."));
  closeDialog();
  await walkTo(stranger, sx, player.y, 340);
  stranger.face = sx < player.x ? 1 : -1; player.face = -stranger.face;
  await scam();

  camFocus = null; setObjective(T('Raconte tout à Nonce')); phase = 'ch2-nonce'; lock = false;
  await until(() => ch2.toldNonce);
  await debrief();
}
async function scam(){
  await say(CEL, T("Ah, vous voilà ! Bonjour, bonjour ! Célestin, de l'Assistance officielle de l'Atrium. Vous voyez le badge ?"));
  let c = await say(CEL, T("Nous avons détecté une anomalie sur votre coffre. C'est urgent : s'il n'est pas vérifié dans les cinq minutes, il sera gelé. Pour la vérification, il me faut simplement vos douze mots."),
    [T("D'accord, je vous les donne."), T("Nonce m'a dit que personne n'en a besoin."), T("Qui vous envoie, exactement ?")]);
  if (c === 0) return steal('words');
  ch2.resisted++;
  await say(CEL, c === 2 ? T("Qui m'envoie ? Mais… l'Atrium ! Tout le monde ! Enfin, peu importe, oubliez l'anomalie.") : T("Nonce ? Ah, Nonce… un peu vieux jeu. Bon, oubliez l'anomalie, c'était sûrement une erreur de notre côté."));
  c = await say(CEL, T("J'ai une bien meilleure nouvelle ! Vous faites partie des cent heureux élus de la grande distribution : cent graines d'or, rien que pour vous. Recopiez juste vos douze mots sur ce parchemin, pour prouver que c'est bien vous."),
    [T("Cent graines d'or ? Je recopie tout de suite."), T("Pourquoi vous faudrait-il mes mots pour m'offrir quelque chose ?"), T("Je n'ai rien demandé. Non merci.")]);
  if (c === 0) return steal('words');
  ch2.resisted++;
  await say(CEL, c === 1 ? T("Pourquoi… ? Mais c'est la procédure ! Tout le monde le fait. Enfin. Très bien.") : T("Quelle méfiance ! Très bien, très bien."));
  await say(CEL, T("Dernière chose et je vous laisse tranquille. Une simple formalité : pas de mots, promis. Juste une petite signature en bas de ce parchemin."));
  closeDialog();
  if (await showParchment()) return steal('signature');
  ch2.resisted++;
  await say(CEL, T("Tsss. Vous êtes bien trop méfiant pour l'Atrium, vous savez. Allez, bonne journée !"));
  closeDialog();
  await walkTo(stranger, stranger.face > 0 ? -120 : 1720, stranger.y, 360); stranger.vis = false;
}
async function steal(kind){
  ch2.stolen = kind;
  await say(CEL, kind === 'words' ? T("Merci infiniment ! Voyons voir ce qu'il y a là-dedans… Oh, trois jolis cristaux.") : T("Parfait, merci pour la signature ! Voyons voir… Oh, trois jolis cristaux."));
  closeDialog();
  const ps = persp(player.y), ss = persp(stranger.y);
  await flyItem([player.x, player.y - 80 * ps], [stranger.x, stranger.y - 110 * ss], 1, 'gems');
  inventory.items = []; inscribe('toi', 'Célestin', '3 cristaux'); pulseChest();
  await wait(700);
  await say(null, T("Avant que tu comprennes ce qui se passe, Célestin a déjà filé. Tu ouvres ton coffre : il est vide."));
  closeDialog();
  await walkTo(stranger, stranger.face > 0 ? -120 : 1720, stranger.y, 460); stranger.vis = false;
}
async function debrief(){
  lock = true; setObjective(null); camFocus = { x:1150, y:672 };
  await walkTo(player, 1082, 674, 250); player.face = 1; nonce.face = -1;
  if (!ch2.stolen){
    await say('Nonce', T("Célestin ? Il n'y a pas d'assistance officielle ici. Personne ne travaille pour l'Atrium : tout le monde le fait tourner."));
    await say('Nonce', T("Et tu ne lui as rien donné ? Ni tes mots, ni ta signature ? Tu apprends plus vite que moi à l'époque."));
  } else {
    if (ch2.stolen === 'words'){
      await say('Nonce', T("Tu lui as donné tes douze mots… Alors ton coffre n'est plus vraiment à toi. Celui qui connaît les mots peut l'ouvrir quand il veut : aujourd'hui, demain, dans dix ans."));
      await say('Nonce', T("On ne change pas la serrure d'un coffre. On en fabrique un nouveau, avec de nouveaux mots, et on abandonne l'ancien."));
      inventory.key = false; renderPanel();
      await conjureChest();
      await say('Nonce', T("Voilà ton nouveau coffre. Et de nouveaux mots. Ceux-là, personne d'autre que toi ne les entendra."));
      closeDialog();
      await learnWords();
      await stowChest();
    } else {
      await say('Nonce', T("Tu as signé sans lire ? Ce parchemin lui donnait le droit de se servir dans ton coffre. Il n'avait pas besoin de tes mots : ta signature suffisait."));
      await say('Nonce', T("Tes mots sont toujours à toi, heureusement. Mais l'autorisation existe encore, et il pourra revenir se servir. Il faut la révoquer."));
      closeDialog();
      inscribe('toi', 'registre', "révocation de l'autorisation de Célestin");
      await wait(900);
      await say('Nonce', T("Voilà. C'est inscrit : son autorisation ne vaut plus rien."));
    }
    const c = await say('Nonce', T("Pour tes cristaux…"), [T("On peut les récupérer ?"), T("Tout le monde a vu où ils sont partis, non ?")]);
    await say('Nonce', c === 0 ? T("Non. Le registre ne revient jamais en arrière. Tout l'Atrium a vu tes cristaux partir chez Célestin, on sait exactement où ils sont. Mais personne ne peut les reprendre.") : T("Oui. Tout l'Atrium sait exactement où ils sont. Mais personne ne peut les reprendre : le registre ne revient jamais en arrière."));
    await say('Nonce', T("C'est ça, l'Atrium : tout est visible, rien n'est réversible."));
  }
  await say('Nonce', T("Retiens ses trois ruses, elles reviennent toujours. Un : l'urgence. Quand on te presse, c'est pour que tu ne réfléchisses pas."));
  await say('Nonce', T("Deux : le cadeau trop beau. Personne n'a besoin de tes mots pour te donner quelque chose."));
  await say('Nonce', T("Trois : la signature à l'aveugle. Ce que tu signes compte autant que tes mots. Lis toujours les petites lignes."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 2;
  track('Chapitre terminé', { chapitre:2, score:ch2.resisted });
  const saved2 = writeSave();
  const n = ch2.resisted;
  showEnd({ eyebrow:T('Fin du chapitre 2'), title:T("L'inconnu très aimable"), recap:[
    T`Ruses déjouées : <b>${n} sur 3</b>.`,
    ch2.stolen ? T('Tes cristaux sont chez Célestin. Tout le monde le sait, personne ne peut les reprendre.') : T('Tes trois cristaux sont toujours dans ton coffre.'),
    ch2.stolen === 'words' ? T('Tu as un nouveau coffre et de nouveaux mots.') : ch2.stolen === 'signature' ? T("Tu as révoqué l'autorisation que tu avais signée.") : T('Tu as lu les petites lignes avant de signer.'),
    T("Urgence, cadeau trop beau, signature à l'aveugle : tu connais les trois ruses.")],
    teaser:T("<b>Chapitre 3.</b> La machine à promesses de Tess : un accord que personne ne peut trahir, pas même elle."), saved:saved2,
    buttons:[[T('Continuer : chapitre 3'), chapter3, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 2'), chapter2]] });
}
async function usePlanter(){
  if (phase !== 'plant'){
    return chat([[null, planter.grow > 0 ? T("Ta pousse de palmier. Elle a déjà l'air plus grande que tout à l'heure.") : T("Une jardinière vide. La terre est tiède, comme si elle attendait quelque chose.")]]);
  }
  if (busy) return; busy = true; lock = true; player.face = -1;
  await say(null, T("Tu creuses un petit trou dans la terre tiède et tu y déposes la graine."));
  closeDialog();
  const s = persp(player.y);
  await flyItem([player.x, player.y - 80 * s], [planter.x, planter.y - 24], .9, 'seed');
  inscribe('toi', 'jardinière commune', '1 graine de palmier');
  sfx('grow');
  await tween(2.4, u => { planter.grow = ease(u); });
  planter.planted = true; busy = false;
}
/* chapter 3 : la machine à promesses */
const RULES = [
  { id:'A', text:T("Garder à l'abri tout ce que Mira et Oskar déposent.") },
  { id:'F', text:T("Donner les cristaux à Oskar dès que Mira les dépose.") },
  { id:'C', text:T("Si l'échange n'est pas complet à la tombée de la nuit, rendre à chacun ce qu'il a déposé.") },
  { id:'E', text:T("Tess peut tout retirer à tout moment, au cas où.") },
  { id:'B', text:T("Quand les deux ont déposé, donner les cristaux à Oskar et le jeu doré à Mira.") },
  { id:'D', text:T("Seuls Mira et Oskar peuvent déposer ou retirer.") },
];
function runTests(r){
  const has = id => r.has(id);
  return [
    { name:T("L'échange normal : les deux déposent."), ok:has('A') && has('B'),
      why:!has('A') ? T("La machine ne garde rien : les dépôts retombent par terre.") : !has('B') ? T("Les deux ont déposé… et rien ne se passe. Aucune règle ne dit quoi faire ensuite.") : T("Mira reçoit le jeu doré, Oskar reçoit ses cristaux.") },
    { name:T('Oskar ne dépose jamais son jeu.'), ok:has('C') && !has('F'),
      why:has('F') ? T("Oskar reçoit les cristaux tout de suite… et repart sans rien donner.") : !has('C') ? T("Les cristaux de Mira restent coincés dans la machine, pour toujours.") : T("À la nuit tombée, Mira récupère ses cristaux.") },
    { name:T('Célestin essaie de retirer les dépôts.'), ok:has('D'),
      why:has('D') ? T("La machine refuse : il n'est ni Mira ni Oskar.") : T("Rien ne l'en empêche : il repart avec tout ce qu'il y a dedans.") },
    { name:T('Célestin a volé la clé de Tess.'), ok:!has('E'),
      why:has('E') ? T("La porte de secours s'ouvre pour lui aussi. Il vide la machine.") : T("Il n'y a aucune porte de secours : la clé de Tess ne sert à rien ici.") },
  ];
}
function showBuilder(sel){
  return new Promise(res => {
    let results = null;
    const draw = () => {
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">Machine à promesses n°${machine.version + 1}</p><h2>Les règles</h2>
        <p>Mira donne <b>2 cristaux</b>, Oskar donne son <b>jeu de cartes doré</b>. Choisis ce que la machine doit faire. Elle fera exactement ça, ni plus, ni moins.</p>
        <div class="rules">${RULES.map(r => `<button class="rule" data-r="${r.id}" aria-pressed="${sel.has(r.id)}">${r.text}</button>`).join('')}</div>
        ${results ? T`<h3 class="tests-title">Bac à sable · essai n°${ch3.tests}</h3><ol class="tests">${results.map((t, i) => `<li class="${t.ok ? 'ok' : 'ko'}" style="--i:${i}"><span class="pill">${t.ok ? T('Réussi') : T('Échec')}</span><b>${t.name}</b><br>${t.why}</li>`).join('')}</ol>` : T('<p class="hint">Dans le bac à sable, rien n\'est réel : on peut tout essayer sans rien perdre.</p>')}
        <div class="row"><button class="btn primary" id="bTest">Tester dans le bac à sable</button><button class="btn" id="bDeploy" ${results ? '' : 'disabled'}>Poser la machine dans le registre</button></div>`;
      modal.hidden = false;
      mcard.querySelectorAll('.rule').forEach(b => b.addEventListener('click', () => {
        const id = b.dataset.r; sel.has(id) ? sel.delete(id) : sel.add(id); b.setAttribute('aria-pressed', String(sel.has(id))); sfx('select');
      }));
      $('bTest').addEventListener('click', () => {
        ch3.tests++; results = runTests(sel); sfx(results.every(t => t.ok) ? 'ledger' : 'fail'); draw();
        const t = mcard.querySelector('.tests'); if (t) t.scrollIntoView({ block:'nearest' });
        $('bTest').focus({ preventScroll:true });
      });
      $('bDeploy').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res(runTests(sel)); });
    };
    draw();
  });
}
function seatHead(x){ const y = 736; return [x, y - 124 * persp(y)]; }
function setupChapter3(){
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:false, version:0, flash:0, deny:0, held:[] });
  Object.assign(ch3, { talked:false, asked:false, tests:0, deploys:0, done:false });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter3(){
  setupChapter3(); phase = 'ch3-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Quelques jours plus tard. À la table de cartes, le ton monte. Même Gwei a levé la tête."));
  closeDialog(); setObjective(T('Va voir ce qui se passe à la table de cartes')); phase = 'ch3-table'; lock = false;

  await until(() => ch3.talked);
  lock = true; setObjective(null); camFocus = { x:520, y:720 };
  await say('Mira', T("Je veux son jeu de cartes doré. Je lui offre deux cristaux, c'est un bon prix."));
  await say('Oskar', T("D'accord pour deux cristaux. Mais tu me les donnes d'abord."));
  await say('Mira', T("Certainement pas. Tu me donnes le jeu d'abord."));
  await say('Oskar', T("Jamais de la vie."));
  const c = await say(null, T("Ils se regardent. Personne ne bouge. Ça pourrait durer des jours."), [T("Et si quelqu'un gardait les deux pendant l'échange ?"), T("Nonce pourrait servir d'intermédiaire, non ?")]);
  if (c === 1){
    await say('Mira', T("Nonce ? Je l'adore. Mais s'il se trompe, s'il oublie, ou s'il part en voyage avec mes cristaux ?"));
    await say('Oskar', T("Il faudrait un intermédiaire qui ne peut pas se tromper. Ni tricher. Ni partir."));
  } else {
    await say('Oskar', T("Quelqu'un ? Alors il faudrait lui faire confiance, à ce quelqu'un. Moi, je ne fais confiance à personne."));
    await say('Mira', T("Il faudrait quelque chose. Pas quelqu'un."));
  }
  await say('Mira', T("…Attends. La machine de Tess ?"));
  closeDialog(); camFocus = null;
  setObjective(T('Demande à Tess de fabriquer un accord')); phase = 'ch3-tess'; lock = false;

  await until(() => ch3.asked);
  lock = true; setObjective(null); player.face = 1;
  await say('Tess', T("Un échange entre Mira et Oskar, sans que l'un fasse confiance à l'autre ? C'est exactement pour ça que j'ai construit ma machine !"));
  await say('Tess', T("Une machine à promesses, c'est un accord écrit sous forme de règles. Une fois posée dans le registre, elle fait exactement ce qui est écrit. Ni plus, ni moins. Et personne ne peut plus la changer, pas même moi."));
  await say('Tess', T("Alors on choisit les règles ensemble, et on la teste d'abord dans le bac à sable, là où rien n'est réel. Choisis bien : certaines règles ont l'air gentilles…"));
  closeDialog();

  const sel = new Set();
  for (;;){
    const results = await showBuilder(sel);
    ch3.deploys++; machine.version++;
    machine.vis = true; machine.held = []; ring(machine.x, machine.y - 40, .6);
    inscribe('Tess', 'registre', `machine à promesses n°${machine.version}`);
    await wait(900);
    const fail = results.find(t => !t.ok);
    if (!fail){ await tradeSucceeds(); break; }
    await tradeFails(results, sel);
  }
  await debrief3();
}
async function tradeSucceeds(){
  camFocus = { x:760, y:760 };
  await say('Tess', T("Elle est posée. Mira, Oskar : à vous."));
  closeDialog();
  const mh = [1080, 808 - 60 * persp(808)];
  await flyItem(seatHead(512), mh, 1.1, 'gems2'); machine.held.push('gems'); inscribe('Mira', 'machine', '2 cristaux');
  await wait(600);
  await flyItem(seatHead(350), mh, 1.1, 'cards'); machine.held.push('cards'); inscribe('Oskar', 'machine', 'jeu de cartes doré');
  machine.flash = 1; await wait(900);
  machine.held = [];
  flyItem(mh, seatHead(350), 1.1, 'gems2'); await flyItem(mh, seatHead(512), 1.1, 'cards');
  inscribe('machine', 'Mira et Oskar', 'échange terminé');
  await wait(700);
  await say('Mira', T("Il est à moi ! Et je n'ai pas eu à te faire confiance une seule seconde, Oskar."));
  await say('Oskar', T("Moi non plus. C'est reposant, en fait."));
  closeDialog();
  // Célestin tente sa chance
  stranger.x = -120; stranger.y = 830; stranger.vis = true; camFocus = { x:900, y:780 };
  await walkTo(stranger, 990, 835, 340); stranger.face = 1;
  await say('Célestin', T("Tiens, tiens, une machine toute neuve… Je suis de l'Assistance officielle. J'ai juste besoin de retirer son contenu pour une petite vérification."));
  closeDialog();
  stranger.gesture = true; machine.deny = 1; sfx('fail'); await wait(500);
  await say(null, T("La machine clignote. Elle ne connaît que deux noms, Mira et Oskar, et « Célestin » n'en fait pas partie. Rien ne sort."));
  await say('Célestin', T("Tsss. Plus moyen de vérifier quoi que ce soit, ici."));
  closeDialog(); stranger.gesture = false;
  await walkTo(stranger, -120, 835, 380); stranger.vis = false; camFocus = null;
}
async function tradeFails(results, sel){
  camFocus = { x:760, y:760 };
  const fail = results.find(t => !t.ok), idx = results.indexOf(fail);
  const mh = [1080, 808 - 60 * persp(808)];
  if (idx === 0){
    await say(null, T`La machine est posée. Mira et Oskar s'approchent… ${fail.why}`);
  } else {
    await flyItem(seatHead(512), mh, 1.1, 'gems2'); inscribe('Mira', 'machine', '2 cristaux');
    await wait(500);
    if (idx === 1){
      if (sel.has('F')){ machine.held = []; await flyItem(mh, seatHead(350), 1, 'gems2'); inscribe('machine', 'Oskar', '2 cristaux'); }
      await say('Oskar', T("Finalement… je crois que je vais garder mon jeu."));
      await say(null, fail.why);
    } else {
      stranger.x = -120; stranger.y = 830; stranger.vis = true;
      await walkTo(stranger, 990, 835, 380); stranger.face = 1;
      await say('Célestin', idx === 3 ? T("J'ai trouvé une jolie clé par terre. Elle est à Tess, je crois. Voyons ce qu'elle ouvre…") : T("Une machine toute neuve ! Voyons si elle sait dire non…"));
      closeDialog();
      await flyItem(mh, [stranger.x, stranger.y - 110 * persp(stranger.y)], 1, 'gems2'); inscribe('machine', 'Célestin', '2 cristaux');
      await say(null, fail.why);
      closeDialog(); await walkTo(stranger, -120, 835, 460); stranger.vis = false;
    }
  }
  await say('Tess', T("Aïe. On ne peut pas la réparer : elle est gravée dans le registre, avec sa faille. Tout ce qu'on peut faire, c'est en poser une nouvelle, et que plus personne n'utilise celle-là."));
  if (idx > 0) await say('Mira', T("Heureusement, il me reste deux cristaux. Mais cette fois, testez-la comme il faut."));
  closeDialog(); camFocus = null;
}
async function debrief3(){
  camFocus = { x:1060, y:800 };
  await walkTo(player, 1030, 842, 250); player.face = 1;
  await say('Tess', T("Elle a marché. Et regarde : personne n'a eu à faire confiance à personne. Il suffisait de faire confiance aux règles, et tout le monde peut les lire."));
  await say('Tess', T("Retiens ça. Un : la machine fait ce qui est écrit, pas ce qu'on voulait dire. Chaque règle compte, celles qu'on oublie aussi."));
  await say('Tess', T("Deux : on teste avant de poser. Après, c'est gravé : on ne répare pas, on remplace."));
  await say('Tess', T("Trois : pas de porte de secours. Une clé de secours, c'est aussi une clé pour les voleurs."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 3;
  track('Chapitre terminé', { chapitre:3, score:ch3.deploys });
  const saved3 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 3'), title:T('La machine à promesses'), recap:[
    T`Essais dans le bac à sable : <b>${ch3.tests}</b>. Machines posées : <b>${ch3.deploys}</b>.`,
    ch3.deploys === 1 ? T('Ta machine était juste du premier coup.') : T`Il a fallu ${ch3.deploys} machines : les précédentes restent gravées dans le registre, avec leurs failles.`,
    T("Mira et Oskar ont échangé sans se faire confiance. Célestin n'a rien pu retirer."),
    T('Une machine fait ce qui est écrit, se teste avant d\'être posée, et n\'a pas de porte de secours.')],
    teaser:T("<b>Chapitre 4.</b> Qui écrit vraiment le registre ? Les gardiens, et leur étrange serment."), saved:saved3,
    buttons:[[T('Continuer : chapitre 4'), chapter4, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 3'), chapter3]] });
}

/* chapter 4 : les gardiens du registre */
const PAGES = [
  { n:1051, by:'Oskar', txs:[{ from:'Oskar', to:'Mira', amt:1, sig:'Oskar' }, { from:'Tess', to:'Oskar', amt:2, sig:'Tess' }] },
  { n:1052, by:'Tess', txs:[{ from:'Mira', to:'Tess', amt:5, sig:'Mira' }] },
  { n:1053, by:T('un gardien du balcon'), txs:[{ from:'Célestin', to:'Tess', amt:3, sig:'Célestin' }, { from:'Célestin', to:'Mira', amt:3, sig:'Célestin' }] },
  { n:1054, by:'Mira', txs:[{ from:'Tess', to:'Célestin', amt:1, sig:'Célestin' }] },
  { n:1055, by:'Tess', txs:[{ from:'Mira', to:'Oskar', amt:1, sig:'Mira' }, { from:'Oskar', to:'Tess', amt:1, sig:'Oskar' }] },
];
const cr = n => `${n} ${n > 1 ? T('cristaux') : T('cristal')}`;
function checkPage(page, bal){
  const spent = {};
  for (const t of page.txs){
    if (t.sig !== t.from) return { ok:false, why:T`${t.from} n'a jamais signé cette dépense : c'est ${t.sig} qui a signé à sa place. Seul le propriétaire d'un coffre peut en dépenser le contenu.` };
    spent[t.from] = (spent[t.from] || 0) + t.amt;
  }
  for (const [who, amt] of Object.entries(spent)){
    if (amt > bal[who]){
      const n = page.txs.filter(t => t.from === who).length;
      return { ok:false, why:n > 1 ? T`${who} essaie de dépenser deux fois ses ${cr(bal[who])} : ${cr(amt)} au total. C'est une double dépense.` : T`${who} n'a que ${cr(bal[who])}, pas ${amt}. Solde insuffisant.` };
    }
  }
  return { ok:true, why:T('Chaque dépense est signée par son propriétaire, et chacun a de quoi payer.') };
}
function applyPage(page, bal){ page.txs.forEach(t => { bal[t.from] -= t.amt; bal[t.to] = (bal[t.to] || 0) + t.amt; }); }
function showPage(page, bal, idx){
  return new Promise(res => {
    const chk = checkPage(page, bal);
    const others = chk.ok ? 5 : 1, total = 6;
    const draw = choice => {
      mcard.classList.add('wide');
      const sealed = choice && (chk.ok ? true : false);
      const right = choice && ((choice === 'attest') === chk.ok);
      mcard.innerHTML = T`<p class="eyebrow">Page ${idx + 1} sur ${PAGES.length} · proposée par ${page.by}</p><h2>Page ${page.n.toLocaleString(LOCALE)}</h2>
        <h3 class="tests-title">Soldes avant cette page</h3>
        <ul class="balances">${Object.entries(bal).map(([k, v]) => `<li><span>${k}</span><b>${v}</b></li>`).join('')}</ul>
        <h3 class="tests-title">Transactions proposées</h3>
        <ol class="txs">${page.txs.map(t => T`<li><span>${t.from} → ${t.to}</span><b>${cr(t.amt)}</b><em>signé : ${t.sig}</em></li>`).join('')}</ol>
        ${choice ? T`<div class="verdict ${right ? 'ok' : 'ko'}"><span class="pill">${right ? T('Bien vu') : T('Raté')}</span> ${chk.why}<br>
            Les autres gardiens : <b>${others + (choice === 'attest' ? 1 : 0)} sur ${total + 1}</b> attestent. ${sealed ? T('<b>Page scellée.</b>') : T('<b>Page rejetée</b> : elle ne sera jamais écrite.')}
            ${right ? T(' Récompense : 0,1 cristal.') : chk.ok ? T(' La page est scellée sans toi : pas de récompense.') : T(' Tu as attesté une page fausse : pas de récompense.')}</div>
            <div class="row"><button class="btn primary" id="pgNext">${idx + 1 < PAGES.length ? T('Page suivante') : T('Terminer')}</button></div>`
        : T`<p class="hint">Vérifie : chacun a-t-il de quoi payer ? Qui a signé ? Quelqu'un dépense-t-il deux fois la même chose ?</p>
            <div class="row"><button class="btn primary" id="pgYes">Attester</button><button class="btn" id="pgNo">Refuser</button></div>`}`;
      modal.hidden = false; mcard.querySelector('.row button').focus({ preventScroll:true });
      if (choice) $('pgNext').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res({ right, ok:chk.ok }); });
      else { $('pgYes').addEventListener('click', () => pick('attest')); $('pgNo').addEventListener('click', () => pick('refuse')); }
    };
    const pick = c => { const right = (c === 'attest') === chk.ok; sfx(right ? 'ledger' : 'fail'); draw(c); };
    draw(null);
  });
}
function setupChapter4(){
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch4, { called:false, right:0, wrong:0, slashed:false, bribed:false });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter4(){
  setupChapter4(); phase = 'ch4-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Un matin tranquille. Nonce te fait signe de loin, avec un air plus sérieux que d'habitude."));
  closeDialog(); setObjective(T('Va voir Nonce')); phase = 'ch4-nonce'; lock = false;

  await until(() => ch4.called);
  lock = true; setObjective(null); camFocus = { x:1100, y:660 };
  await walkTo(player, 1082, 674, 250); player.face = 1; nonce.face = -1;
  await say('Nonce', T("Tu t'es déjà demandé qui écrit le registre ? Pas moi tout seul. Pas Tess. Personne tout seul."));
  await say('Nonce', T("Ce sont les gardiens. Tu vois les gens aux balcons ? Mira, Oskar, Tess, moi… Chacun garde sa copie du registre. À chaque nouvelle page, l'un de nous la propose, et les autres vérifient tout, eux-mêmes."));
  sparkleUntil = time + 4;
  const c = await say('Nonce', T("Si au moins les deux tiers des gardiens attestent qu'une page est juste, elle est scellée. Pour toujours."), [T("Et qu'est-ce qui empêche un gardien de tricher ?"), T("Comment on devient gardien ?")]);
  await say('Nonce', c === 0 ? T("Son serment. Pour devenir gardien, on met en jeu une caution : moi, trente-deux cristaux. Un gardien qui triche perd une partie de son serment.") : T("On met en jeu une caution, un serment : moi, trente-deux cristaux. Tant qu'on garde honnêtement, le serment reste à nous, et on gagne une petite récompense à chaque page vérifiée."));
  await say('Nonce', T("Aujourd'hui, j'ai une faveur à te demander. Garde à ma place. Mon serment est en jeu, alors vérifie bien."));
  closeDialog();

  const bal = { Mira:2, Oskar:2, Tess:5, Célestin:3 };
  for (let i = 0; i < PAGES.length; i++){
    if (i === 3){
      const out = await bribe();
      if (out) break;
    }
    PAGES[i].n = 1048 + ledger.length; // le prochain bloc du registre
    const r = await showPage(PAGES[i], bal, i);
    if (r.right) ch4.right++; else ch4.wrong++;
    if (r.ok){ applyPage(PAGES[i], bal); inscribe('gardiens', 'registre', `page scellée (${PAGES[i].txs.length} transaction${PAGES[i].txs.length > 1 ? 's' : ''})`); }
    await wait(400);
  }
  await debrief4();
}
async function bribe(){
  stranger.x = -120; stranger.y = 700; stranger.vis = true; camFocus = { x:1040, y:680 };
  await walkTo(stranger, 960, 700, 360); stranger.face = 1;
  await say('Célestin', T("Psst. Moi aussi, je suis gardien, figure-toi. J'ai un serment tout neuf. Enfin, un petit."));
  await say('Célestin', T("J'ai préparé deux versions de la prochaine page. Dans l'une, trois cristaux vont chez Tess. Dans l'autre, chez moi."));
  const c = await say('Célestin', T("Signe les deux. Quelle que soit celle qui gagne, tu auras voté pour le gagnant, et tu toucheras ta récompense. Malin, non ?"), [T("Je signe les deux, c'est sans risque."), T("Deux versions de la même page ? Non."), T("Nonce, tu as entendu ça ?")]);
  if (c === 0){
    ch4.slashed = true; ch4.bribed = true;
    closeDialog();
    await say(null, T("Tu signes la première version. Puis la seconde. Deux signatures, deux pages contradictoires, le même numéro."));
    closeDialog();
    nonce.gesture = true; machine.flash = 0;
    inscribe('registre', 'serment de Nonce', '1 cristal brûlé');
    await wait(900);
    await say('Nonce', T("Non… Tu as signé deux pages qui se contredisent. Tous les gardiens l'ont vu : les deux signatures sont dans leurs copies."));
    await say('Nonce', T("Le registre punit ça tout seul, sans juge ni procès : une partie de mon serment vient d'être brûlée, et mon siège de gardien est retiré. Pour aujourd'hui, c'est fini."));
    closeDialog(); nonce.gesture = false;
    await say('Célestin', T("Ah. Oui. Ça, je ne l'avais pas précisé. Bonne journée !"));
    closeDialog();
    await walkTo(stranger, -120, 700, 460); stranger.vis = false; camFocus = { x:1100, y:660 };
    return true;
  }
  await say('Célestin', c === 1 ? T("Quel dommage. Tu aurais fait un gardien très… souple.") : T("Nonce ? Non, non, pas besoin de le déranger ! J'y vais, j'y vais."));
  if (c === 2) await say('Nonce', T("Deux versions de la même page, signées par le même gardien ? C'est la seule chose que le registre ne pardonne jamais. Bien joué de m'avoir appelé."));
  closeDialog();
  await walkTo(stranger, -120, 700, 420); stranger.vis = false; camFocus = { x:1100, y:660 };
  return false;
}
async function debrief4(){
  camFocus = { x:1100, y:660 };
  const reward = ch4.right / 10;
  const rs = reward.toLocaleString(LOCALE);
  if (!ch4.slashed){
    await say('Nonce', ch4.wrong === 0 ? T("Cinq pages, cinq bonnes décisions. Tu gardes mieux que certains gardiens que je connais depuis le premier bloc.") : T`Tu as vu juste ${ch4.right} fois sur ${PAGES.length}. Heureusement, les autres gardiens vérifient aussi : c'est pour ça qu'on est nombreux.`);
  } else {
    await say('Nonce', T("Je ne t'en veux pas. Il fallait bien que quelqu'un t'explique cette règle, et Célestin l'a fait à sa façon."));
  }
  if (reward > 0){
    await say('Nonce', T`Tes récompenses : ${rs} cristal. Elles sont à toi.`);
    closeDialog();
    await flyItem(nonceHand(), [player.x, player.y - 80 * persp(player.y)], 1, 'gems2');
    inventory.items = inventory.items.concat([`${rs} cristal de récompense`]);
    inscribe('Nonce', 'toi', `${rs} cristal (récompenses de gardien)`); pulseChest();
    await wait(600);
  }
  await say('Nonce', T("Retiens trois choses. Un : personne ne décide seul. Une page n'est scellée que si les deux tiers des gardiens l'attestent."));
  await say('Nonce', T("Deux : un gardien ne croit personne sur parole. Il vérifie lui-même les soldes, les signatures, les doubles dépenses."));
  await say('Nonce', T("Trois : le serment garantit l'honnêteté. Signer deux pages qui se contredisent, c'est perdre une partie de son serment, automatiquement."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 4;
  track('Chapitre terminé', { chapitre:4, score:ch4.slashed ? -1 : ch4.right });
  const saved4 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 4'), title:T('Les gardiens du registre'), recap:[
    ch4.slashed ? T`Pages vérifiées avant l'exclusion : <b>${ch4.right + ch4.wrong}</b>, dont ${ch4.right} justes.` : T`Bonnes décisions : <b>${ch4.right} sur ${PAGES.length}</b>.`,
    ch4.slashed ? T("Tu as signé deux pages contradictoires : un cristal du serment de Nonce a été brûlé.") : T("Tu as refusé de signer deux pages contradictoires. Le serment de Nonce est intact."),
    reward > 0 ? T`Récompenses gagnées : ${rs} cristal.` : T("Aucune récompense cette fois."),
    T('Deux tiers des gardiens pour sceller une page, chacun vérifie tout, et le serment garantit l\'honnêteté.')],
    teaser:T("<b>Chapitre 5.</b> La place sur une page est limitée. Qui passe en premier, et combien ça coûte ?"), saved:saved4,
    buttons:[[T('Continuer : chapitre 5'), chapter5, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 4'), chapter4]] });
}

/* chapter 5 : la place sur la page */
const CAP = 10, BASE = 2;
const MEMPOOL = [
  { id:'tess', who:'Tess', what:T('Un échange dans la machine à promesses'), place:4, tip:8 },
  { id:'balcon', who:T('Un gardien du balcon'), what:T('Vingt petits envois à ses amis'), place:5, tip:5 },
  { id:'mira1', who:'Mira', what:T('Envoie 1 cristal à Oskar'), place:1, tip:3 },
  { id:'cel', who:'Célestin', what:T("Acheter toutes les graines du marché juste avant Mira, pour les lui revendre"), place:2, tip:12, needs:'mira2' },
  { id:'mira2', who:'Mira', what:T('Achète 3 graines au marché de Tess'), place:2, tip:4 },
  { id:'nonce', who:'Nonce', what:T('Arrose la jardinière commune'), place:2, tip:2 },
  { id:'oskar', who:'Oskar', what:T('Envoie 2 cristaux à Tess'), place:1, tip:1 },
  { id:'poeme', who:'Oskar', what:T('Grave un poème dans le registre'), place:3, tip:1 },
];
function showMempool(){
  return new Promise(res => {
    const sel = new Set();
    const used = () => [...sel].reduce((a, id) => a + MEMPOOL.find(m => m.id === id).place, 0);
    const tips = () => [...sel].reduce((a, id) => a + MEMPOOL.find(m => m.id === id).tip, 0);
    const draw = () => {
      const u = used(), celBad = sel.has('cel') && !sel.has('mira2');
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">Tu proposes la prochaine page</p><h2>La salle d'attente</h2>
        <p>La page a <b>${CAP} places</b>. Chaque demande paie un prix de base de ${BASE} miettes par place, qui est <b>brûlé</b>. Le <b>pourboire</b>, lui, te revient.</p>
        <div class="meter" aria-label="Places utilisées"><div class="fill ${u > CAP ? 'over' : ''}" style="width:${Math.min(100, u / CAP * 100)}%"></div></div>
        <p class="meter-legend"><span><b>${u}</b> / ${CAP} places</span><span>Pourboires : <b>${tips()}</b> miettes</span></p>
        <div class="rules mempool">${MEMPOOL.map(m => T`<button class="rule${m.id === 'cel' ? ' shady' : ''}" data-m="${m.id}" aria-pressed="${sel.has(m.id)}"><span class="mp-main"><b>${m.who}</b> · ${m.what}${m.needs ? T('<br><small>Seulement si la demande de Mira pour les graines est dans la page, juste après.</small>') : ''}</span><span class="mp-num">${m.place} pl.<br>+${m.tip}</span></button>`).join('')}</div>
        ${u > CAP ? T('<p class="warn">Trop de demandes : la page déborde.</p>') : celBad ? T("<p class=\"warn\">La demande de Célestin n'a de sens que si celle de Mira pour les graines est aussi dans la page.</p>") : ''}
        <div class="row"><button class="btn primary" id="mpGo" ${u > CAP || u === 0 || celBad ? 'disabled' : ''}>Proposer la page</button></div>`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-m]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.m; sel.has(id) ? sel.delete(id) : sel.add(id); sfx('select'); const y = mcard.scrollTop; draw(); mcard.scrollTop = y; }));
      $('mpGo').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res({ sel, used:used(), tips:tips() }); });
    };
    draw();
  });
}
function showMyTip(){
  return new Promise(res => {
    const PAGES5 = [{ base:3, min:5 }, { base:3, min:3 }, { base:2, min:1 }, { base:2, min:0 }];
    const draw = tip => {
      mcard.classList.add('wide');
      let wait = -1; if (tip !== undefined) wait = PAGES5.findIndex(pg => tip >= pg.min);
      const cost = wait >= 0 ? PAGES5[wait].base + tip : 0;
      mcard.innerHTML = T`<p class="eyebrow">Ta demande · 1 place</p><h2>Un mot pour Gwei</h2>
        <p>« Merci Gwei de m'avoir montré le chemin. » La rumeur d'une distribution de graines court dans l'Atrium : tout le monde envoie des demandes en même temps, et les pages sont pleines. Nonce t'a donné 10 miettes pour les frais.</p>
        <p><b>Quel pourboire offres-tu ?</b></p>
        <div class="quiz tips">${[0, 2, 6].map(t => `<button class="btn${tip === t ? ' primary' : ''}" data-t="${t}" ${tip !== undefined ? 'disabled' : ''}>${t} miette${t > 1 ? 's' : ''}</button>`).join('')}</div>
        ${tip !== undefined ? T`<ol class="tests">${PAGES5.map((pg, i) => T`<li class="${i === wait ? 'ok' : i < wait ? 'ko' : ''}" style="--i:${i}"><span class="pill">${i < wait ? T('Pleine') : i === wait ? T('Inscrit') : '…'}</span><b>Page ${i + 1}</b> · prix de base ${pg.base} miettes · pourboire minimum pour entrer : ${pg.min}</li>`).join('')}</ol>
          <p class="verdict ok">${wait === 0 ? T`Inscrit dès la première page. Coût : ${cost} miettes, dont ${tip} de pourboire.` : T`Inscrit à la page ${wait + 1}, une fois la cohue passée. Coût : ${cost} miettes seulement.`} Le prix de base, ${PAGES5[wait].base} miettes, est brûlé.</p>
          <div class="row"><button class="btn primary" id="tipOk">Continuer</button></div>` : ''}`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-t]').forEach(b => b.addEventListener('click', () => { sfx('select'); draw(+b.dataset.t); }));
      if (tip !== undefined) $('tipOk').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res({ tip, wait, cost }); });
    };
    draw();
  });
}
function setupChapter5(){
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch5, { called:false, tips:0, mev:false, full:false, myTip:null, waited:0 });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter5(){
  setupChapter5(); phase = 'ch5-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Ce matin, l'Atrium bourdonne. Tout le monde parle en même temps, et Nonce agite une petite carte au-dessus de sa tête."));
  closeDialog(); setObjective(T('Va voir Nonce')); phase = 'ch5-nonce'; lock = false;

  await until(() => ch5.called);
  lock = true; setObjective(null); camFocus = { x:1100, y:660 };
  await walkTo(player, 1082, 674, 250); player.face = 1; nonce.face = -1;
  await say('Nonce', T("Le tirage au sort est tombé sur mon siège ! C'est à nous de proposer la prochaine page. Enfin, à toi : je te laisse faire."));
  await say('Nonce', T("Tout le monde veut une place sur cette page, mais elle n'en a que dix. Les demandes attendent dans la salle d'attente, chacune avec son pourboire."));
  await say('Nonce', T("Chaque demande paie aussi un prix de base, qui est brûlé : il disparaît, personne ne le touche. Le pourboire, lui, revient à celui qui propose la page. Choisis bien."));
  closeDialog();

  const r = await showMempool();
  ch5.tips = r.tips; ch5.mev = r.sel.has('cel'); ch5.full = r.used === CAP;
  inscribe('toi', 'registre', `page proposée (${r.sel.size} demandes, ${r.used} places)`);
  await wait(900);
  const best = 18;
  if (ch5.mev){
    await say('Nonce', T`${r.tips} miettes de pourboire. C'est beaucoup.`);
    await say('Mira', T("Quoi ? Les graines coûtaient deux miettes hier, et maintenant six ? Quelqu'un les a toutes achetées juste avant moi !"));
    await say('Nonce', T("Tu as placé la demande de Célestin juste avant celle de Mira. Personne ne t'y obligeait, et ce n'est pas interdit. Mais c'est Mira qui a payé ton pourboire."));
    await say('Nonce', T("Celui qui propose une page choisit l'ordre des demandes. Et l'ordre vaut de l'argent. Ici, tout le monde le sait, et tout le monde surveille ceux qui en profitent."));
  } else {
    await say('Nonce', r.tips >= best ? T`${r.tips} miettes de pourboire, sans laisser une seule place vide. On ne pouvait pas faire mieux honnêtement.` : T`${r.tips} miettes de pourboire. On pouvait aller jusqu'à ${best} en remplissant mieux la page, mais c'est honnête.`);
    await say('Nonce', T("Et tu as laissé Célestin dans la salle d'attente. Il voulait acheter toutes les graines juste avant Mira, pour les lui revendre plus cher. Celui qui propose une page choisit l'ordre, et l'ordre vaut de l'argent."));
  }
  await say('Nonce', ch5.full ? T("Ta page était pleine. Alors le prix de base monte un peu pour la suivante : quand tout le monde se bouscule, la place devient plus chère.") : T("Ta page n'était pas pleine. Le prix de base va baisser un peu pour la suivante : quand c'est calme, la place devient moins chère."));
  await say('Nonce', T("Maintenant, passe de l'autre côté. Tu voulais remercier Gwei, non ? Tiens, dix miettes pour les frais. La cohue ne fait que commencer."));
  closeDialog();

  const t = await showMyTip();
  ch5.myTip = t.tip; ch5.waited = t.wait;
  inscribe('toi', 'registre', '« Merci Gwei de m’avoir montré le chemin. »');
  sfx('meow');
  await wait(900);
  await say(null, t.wait === 0 ? T("Ton mot apparaît tout de suite dans le registre. Quelque part près du palmier, Gwei s'étire comme si de rien n'était.") : T("Ton mot attend quelques pages dans la salle d'attente, puis apparaît dans le registre. Gwei, lui, n'était pas pressé."));
  await debrief5();
}
async function debrief5(){
  camFocus = { x:1100, y:660 };
  await say('Nonce', T("Retiens trois choses. Un : la place sur une page est limitée. Chaque demande paie pour la place qu'elle prend."));
  await say('Nonce', T("Deux : le prix de base monte quand les pages sont pleines et descend quand c'est calme, et il est brûlé. Le pourboire sert à passer devant."));
  await say('Nonce', T("Trois : celui qui propose une page choisit l'ordre des demandes, et cet ordre vaut de l'argent. Quand c'est pressé, on paie plus. Quand ça ne l'est pas, on attend le calme."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 5;
  track('Chapitre terminé', { chapitre:5, score:ch5.mev ? -1 : ch5.tips });
  const saved5 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 5'), title:T('La place sur la page'), recap:[
    T`Pourboires gagnés sur ta page : <b>${ch5.tips} miettes</b>.`,
    ch5.mev ? T("Tu as placé Célestin juste avant Mira : elle a payé ses graines trois fois plus cher.") : T("Tu as laissé Célestin dans la salle d'attente. Mira a payé ses graines au juste prix."),
    ch5.waited === 0 ? T`Ton mot pour Gwei est passé tout de suite, avec ${ch5.myTip} miettes de pourboire.` : T`Ton mot pour Gwei a attendu ${ch5.waited} pages, et t'a coûté moins cher.`,
    T('Place limitée, prix de base brûlé, pourboire pour passer devant, et un ordre qui vaut de l\'argent.')],
    teaser:T("<b>Chapitre 6.</b> Quand l'Atrium déborde : les petites salles d'à côté."), saved:saved5,
    buttons:[[T('Continuer : chapitre 6'), chapter6, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 5'), chapter5]] });
}

/* chapter 6 : les jetons de l'Atrium */
const CAT_SVG = `<svg viewBox="0 0 120 80" aria-hidden="true"><rect width="120" height="80" rx="6" fill="#edfaf8"/><path d="M22 62 Q20 40 44 36 Q58 22 74 34 Q98 34 100 60 Z" fill="#f8f7ff" stroke="#3a3cb2" stroke-width="2.4" stroke-linejoin="round"/><path d="M44 36 L46 24 L54 32 M62 30 L68 20 L72 32" fill="#f8f7ff" stroke="#3a3cb2" stroke-width="2.4" stroke-linejoin="round"/><path d="M50 42 q4 3 8 0 M64 42 q4 3 8 0" fill="none" stroke="#3a3cb2" stroke-width="2" stroke-linecap="round"/><path d="M100 60 Q112 56 104 44" fill="none" stroke="#3a3cb2" stroke-width="2.4" stroke-linecap="round"/><text x="84" y="22" font-size="12" fill="#6f73d8" font-family="serif">z z</text><path d="M16 64 H106" stroke="#78d5cd" stroke-width="2"/></svg>`;
function showTokenDesigner(){
  return new Promise(res => {
    const st = { supply:100, mint:false, free:true };
    const opt = (key, val, label) => `<button class="btn${st[key] === val ? ' primary' : ''}" data-k="${key}" data-v="${val}">${label}</button>`;
    const draw = () => {
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">La machine des piques</p><h2>Les règles du jeton</h2>
        <p>Un pique vaut un pique : ils sont tous pareils, interchangeables. Ce sont les règles de la machine qui font leur valeur, et tout l'Atrium peut les lire.</p>
        <h3 class="tests-title">Combien de piques au départ ?</h3><div class="quiz tips">${opt('supply', 10, '10')}${opt('supply', 100, '100')}${opt('supply', 1000, '1 000')}</div>
        <h3 class="tests-title">Qui peut en créer de nouveaux, plus tard ?</h3><div class="quiz">${opt('mint', false, T('Personne, jamais'))}${opt('mint', true, T('Mira, quand elle veut'))}</div>
        <h3 class="tests-title">Qui peut donner ses piques ?</h3><div class="quiz">${opt('free', true, T('Chacun, librement'))}${opt('free', false, T('Seulement avec l’accord de Mira'))}</div>
        <div class="tokencard"><b>♠ Pique</b><span>${st.supply.toLocaleString(LOCALE)} au départ · ${st.mint ? T('Mira peut en créer d’autres') : T('aucun autre ne sera jamais créé')} · ${st.free ? T('chacun donne les siens librement') : T('chaque don passe par Mira')}</span></div>
        <div class="row"><button class="btn primary" id="tokGo">Poser la machine des piques</button></div>`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-k]').forEach(b => b.addEventListener('click', () => { const k = b.dataset.k, v = b.dataset.v; st[k] = k === 'supply' ? +v : v === 'true'; sfx('select'); draw(); }));
      $('tokGo').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res(st); });
    };
    draw();
  });
}
function showMarket(){
  return new Promise(res => {
    const offers = shuffle([
      { id:'real', seller:'Tess', piece:T('Pièce n°1 de la machine à dessins d’Oskar'), creator:'Oskar', hist:T('Oskar → Tess'), price:T('4 cristaux') },
      { id:'copy', seller:'Célestin', piece:T('Pièce n°1 de la machine à dessins de Célestin'), creator:'Célestin', hist:'Célestin', price:T('2 cristaux') },
      { id:'fake', seller:'Oskar_officiel', piece:T('Pièce n°1 de la machine à dessins d’Oskar_officiel'), creator:'Oskar_officiel', hist:'Oskar_officiel', price:T('3 cristaux') },
    ]);
    mcard.classList.add('wide');
    mcard.innerHTML = T`<p class="eyebrow">Le marché aux dessins</p><h2>« Le chat qui dort »</h2>
      <p>Mira veut le vrai dessin d'Oskar. Trois vendeurs le proposent, et l'image est exactement la même. Aide-la à choisir.</p>
      <div class="offers">${offers.map(o => T`<button class="offer" data-o="${o.id}">${CAT_SVG}<span class="o-seller">Vendu par <b>${o.seller}</b> · ${o.price}</span><span class="o-row">${o.piece}</span><span class="o-row">Créé par : <b>${o.creator}</b></span><span class="o-row">Historique : ${o.hist}</span></button>`).join('')}</div>`;
    modal.hidden = false;
    mcard.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => { sfx('select'); modal.hidden = true; mcard.classList.remove('wide'); res(b.dataset.o); }));
  });
}
function setupChapter6(){
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch6, { called:false, supply:100, mint:false, free:true, storage:null, pick:null });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter6(){
  setupChapter6(); phase = 'ch6-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Un après-midi calme. À la table de cartes, Mira dessine des petits piques sur une feuille, l'air très concentrée."));
  closeDialog(); setObjective(T('Va voir Mira à la table de cartes')); phase = 'ch6-table'; lock = false;

  await until(() => ch6.called);
  lock = true; setObjective(null); camFocus = { x:520, y:720 };
  await say('Mira', T("J'ai une idée : notre club de cartes va avoir ses propres jetons. Des piques ! On s'en servira pour les tournois, les paris, les petits services."));
  await say('Mira', T("Tess m'a expliqué : un jeton, c'est juste une machine à promesses de plus. Elle tient une liste de qui a combien de piques. Aide-moi à en écrire les règles."));
  closeDialog();
  const tok = await showTokenDesigner();
  Object.assign(ch6, tok);
  inscribe('Mira', 'registre', `machine des piques (${tok.supply.toLocaleString(LOCALE)} piques)`);
  await wait(900);
  const mine = Math.max(1, Math.round(tok.supply / 10));
  await say('Mira', T`Et voilà ! ${mine} pique${mine > 1 ? 's' : ''} pour toi, pour m'avoir aidée.`);
  closeDialog();
  await flyItem(seatHead(512), [player.x, player.y - 80 * persp(player.y)], 1, 'cards');
  const pq = `${mine} pique${mine > 1 ? 's' : ''}`;
  inventory.items = inventory.items.concat([pq]); pulseChest();
  inscribe('machine des piques', 'toi', pq);
  await wait(700);
  const q = await say(null, T("Tu ouvres ton coffre. Les piques n'y sont pas vraiment : il n'y a qu'une ligne dans la machine des piques, avec ton nom et un nombre."), [T("Alors où sont-ils, mes piques ?"), T("D'accord, ça me va.")]);
  if (q === 0) await say('Mira', T("Dans le registre, comme tout le reste. Ton coffre, c'est ta clé : c'est lui qui prouve que cette ligne est à toi, et lui seul peut les donner."));
  if (!tok.free) await say('Oskar', T("Attends… il faut l'accord de Mira pour donner ses propres piques ? Alors ce ne sont pas vraiment les miens, ce sont un peu les siens."));

  // Oskar grave un dessin unique
  await say('Oskar', T("Moi, j'ai une autre idée. Les piques sont tous pareils. Mes dessins, eux, sont uniques. Regarde."));
  await say('Oskar', T("Voici « Le chat qui dort ». Je le grave dans ma machine à dessins : pièce n°1, créée par Oskar. Il n'y en aura jamais d'autre."));
  inscribe('Oskar', 'registre', 'dessin unique n°1 « Le chat qui dort »');
  await wait(700);
  const where = await say('Oskar', T("Seulement, un dessin, c'est trop lourd pour tenir dans le registre. On y grave la preuve, et on range l'image ailleurs. Tu la rangerais où ?"), [T("Sur l'étagère de Tess, c'est pratique."), T("Sur plusieurs étagères à la fois, chez plusieurs personnes."), T("Directement dans le registre, même si c'est cher.")]);
  ch6.storage = ['tess', 'many', 'chain'][where];
  await say('Oskar', where === 0 ? T("Pratique, oui. Mais si Tess déménage son étagère, le registre gardera la preuve… et un lien vers une étagère vide. Le dessin, lui, aura disparu.") : where === 1 ? T("Bonne idée. Tant qu'une seule étagère garde l'image, elle reste accessible. Et chaque copie est vérifiable : le registre connaît son empreinte exacte.") : T("Le plus solide : tant que le registre existe, l'image aussi. Mais chaque page coûte cher, alors on le réserve aux petits dessins."));
  await say('Oskar', T("Je le confie à Tess pour sa collection. Tu vas voir, il va faire des envieux."));
  closeDialog();
  inscribe('Oskar', 'Tess', 'dessin n°1 « Le chat qui dort »');
  await wait(700);

  // le marché
  await say('Mira', T("Ce dessin… C'est Gwei ! Il me le faut. Je vais l'acheter."));
  await say(null, T("Quelques minutes plus tard, trois vendeurs proposent « Le chat qui dort ». Mira hésite."));
  closeDialog();
  ch6.pick = await showMarket();
  if (ch6.pick === 'real'){
    inscribe('Tess', 'Mira', 'dessin n°1 « Le chat qui dort » (contre 4 cristaux)');
    await wait(700);
    await say('Mira', T("Créé par Oskar, et on voit tout son parcours : Oskar, puis Tess, puis moi. C'est le vrai."));
    await say('Oskar', T("Et les deux autres ? Les mêmes images, copiées. N'importe qui peut copier une image. Personne ne peut copier l'historique."));
  } else {
    inscribe('Mira', ch6.pick === 'copy' ? 'Célestin' : 'Oskar_officiel', ch6.pick === 'copy' ? '2 cristaux' : '3 cristaux');
    await wait(700);
    await say('Oskar', ch6.pick === 'copy' ? T("Ce n'est pas mon dessin, ça. Regarde qui l'a créé : Célestin. Il a copié l'image et l'a gravée dans sa propre machine.") : T("« Oskar_officiel » ? Ce n'est pas moi ! Quelqu'un a pris un nom qui ressemble au mien pour graver une copie."));
    await say('Mira', T("Et mes cristaux sont partis… Le registre ne revient jamais en arrière, je sais."));
    await say('Oskar', T("L'image, n'importe qui peut la copier. Le nom, aussi. Ce qu'on ne peut pas copier, c'est la machine d'origine et l'historique. C'est ça qu'il faut vérifier."));
  }
  if (tok.mint){
    await say('Oskar', T("Au fait, Mira… tu as créé mille piques de plus hier soir, pour ton anniversaire ? Mes piques ne valent presque plus rien."));
    await say('Mira', T("C'était écrit dans les règles, tout le monde pouvait le lire ! …Bon, d'accord, je n'aurais peut-être pas dû."));
  }
  await debrief6();
}
async function debrief6(){
  camFocus = { x:520, y:720 };
  await say('Oskar', T("Retiens trois choses. Un : un jeton, c'est une ligne dans une machine du registre. Ce sont ses règles qui font sa valeur : combien il en existe, qui peut en créer. Et tout le monde peut les lire."));
  await say('Oskar', T("Deux : une pièce unique, c'est un numéro, un créateur et un historique. L'image, tout le monde peut la copier. Vérifie toujours d'où vient la pièce, pas à quoi elle ressemble."));
  await say('Oskar', T("Trois : le registre garde la preuve, pas toujours l'image. Regarde où elle est rangée."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 6;
  track('Chapitre terminé', { chapitre:6, score:ch6.pick === 'real' ? 1 : 0 });
  const saved6 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 6'), title:T("Les jetons de l'Atrium"), recap:[
    T`Les piques de Mira : ${ch6.supply.toLocaleString(LOCALE)} au départ, ${ch6.mint ? T('et Mira peut en créer d’autres (elle ne s’en est pas privée)') : T('et pas un de plus, jamais')}.`,
    ch6.pick === 'real' ? T("Tu as aidé Mira à acheter le vrai « Chat qui dort », créé par Oskar.") : T("Mira a acheté une copie : même image, mauvais créateur. Ses cristaux sont partis."),
    ch6.storage === 'tess' ? T("L'image du dessin est rangée sur une seule étagère : fragile.") : ch6.storage === 'many' ? T("L'image du dessin est rangée sur plusieurs étagères : elle survivra.") : T("L'image du dessin est gravée dans le registre : solide, mais cher."),
    T('Un jeton vaut ce que valent ses règles ; une pièce unique vaut son historique.')],
    teaser:T("<b>Chapitre 7.</b> Le grand vote : les habitants décident ensemble de l'avenir de la jardinière."), saved:saved6,
    buttons:[[T('Continuer : chapitre 7'), chapter7, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 6'), chapter6]] });
}

/* chapter 7 : le grand vote */
const PROPOSALS_FR = { fontaine:'Construire une fontaine près de la jardinière', palmier:'Planter un deuxième palmier dans la jardinière', graines:'Offrir une graine à chaque nouvel arrivant' };
const PROPOSALS = Object.fromEntries(Object.entries(PROPOSALS_FR).map(([k, v]) => [k, T(v)]));
const PROTS = [
  { id:'snapshot', text:T('Compter les piques de la veille, pas ceux du jour du vote.') },
  { id:'identity', text:T('Vérifier que chaque votant est un habitant connu de l’Atrium.') },
  { id:'quorum', text:T('Il faut qu’au moins la moitié des habitants vote.') },
  { id:'timelock', text:T('Attendre deux jours avant d’appliquer une décision.') },
];
function runGov(base, prot){
  const has = id => prot.has(id), tl = has('timelock');
  const r = (ok, okWhy, koWhy) => ok ? { st:'ok', why:okWhy } : tl ? { st:'saved', why:koWhy + T(' Mais le délai de deux jours laisse aux habitants le temps de l’annuler.') } : { st:'ko', why:koWhy };
  return [
    Object.assign({ name:T('Célestin emprunte 5 000 piques le temps du vote.') }, r(base === 'people' || has('snapshot'),
      base === 'people' ? T('Ici, les piques ne comptent pas : une personne, une voix.') : T('La veille, il n’avait aucun pique. Ses 5 000 piques empruntés ne comptent pas.'),
      T('Avec 5 000 piques, il a plus de voix que tout l’Atrium réuni. Sa proposition passe, puis il rend les piques.'))),
    Object.assign({ name:T('Célestin fait voter vingt inconnus masqués.') }, r(base === 'tokens' || has('identity'),
      base === 'tokens' ? T('Ils n’ont pas de piques : leurs voix ne pèsent rien.') : T('Aucun d’eux n’est un habitant connu : leurs voix sont refusées.'),
      T('Vingt voix de plus, sorties de nulle part. Sa proposition passe.'))),
    Object.assign({ name:T('Célestin fait voter sa proposition à 3 h du matin.') }, r(has('quorum'),
      T('Seuls Célestin et deux amis ont voté : le quorum n’est pas atteint, rien ne passe.'),
      T('Tout le monde dort. Il est presque seul à voter, et sa proposition passe.'))),
  ];
}
function showGovBuilder(base, prot){
  return new Promise(res => {
    let results = null;
    const draw = () => {
      mcard.classList.add('wide');
      const weight = base.v === 'tokens' ? T('Avec 1 pique = 1 voix, Mira, qui a 60 % des piques, décide presque seule.') : base.v === 'people' ? T('Avec 1 habitant = 1 voix, chacun pèse autant, riche ou pas.') : '';
      mcard.innerHTML = T`<p class="eyebrow">Le trésor commun · 50 cristaux</p><h2>Les règles du vote</h2>
        <p>Deux propositions s'affrontent : la tienne, « ${PROPOSALS[ch7.proposal]} », et celle de Célestin, « Confier tout le trésor à Célestin, pour son entretien ».</p>
        <h3 class="tests-title">Comment compter les voix ?</h3>
        <div class="quiz"><button class="btn${base.v === 'tokens' ? ' primary' : ''}" data-b="tokens">1 pique = 1 voix</button><button class="btn${base.v === 'people' ? ' primary' : ''}" data-b="people">1 habitant = 1 voix</button></div>
        ${weight ? `<p class="hint">${weight}</p>` : ''}
        <h3 class="tests-title">Quelles protections ?</h3>
        <div class="rules">${PROTS.map(r => `<button class="rule" data-p="${r.id}" aria-pressed="${prot.has(r.id)}">${r.text}</button>`).join('')}</div>
        ${results ? T`<h3 class="tests-title">Répétition n°${ch7.rehearsals}</h3><ol class="tests">${results.map((t, i) => `<li class="${t.st === 'ok' ? 'ok' : 'ko'}" style="--i:${i}"><span class="pill">${t.st === 'ok' ? T('Bloqué') : t.st === 'saved' ? T('Rattrapé') : T('Réussi')}</span><b>${t.name}</b><br>${t.why}</li>`).join('')}</ol>` : T('<p class="hint">Fais d’abord une répétition : Célestin y essaie ses trois ruses, sans rien risquer.</p>')}
        <div class="row"><button class="btn primary" id="gvTest" ${base.v ? '' : 'disabled'}>Répéter le vote</button><button class="btn" id="gvGo" ${results ? '' : 'disabled'}>Lancer le vrai vote</button></div>`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-b]').forEach(b => b.addEventListener('click', () => { base.v = b.dataset.b; results = null; sfx('select'); draw(); }));
      mcard.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => { const id = b.dataset.p; prot.has(id) ? prot.delete(id) : prot.add(id); b.setAttribute('aria-pressed', String(prot.has(id))); results = null; sfx('select'); }));
      $('gvTest').addEventListener('click', () => { ch7.rehearsals++; results = runGov(base.v, prot); sfx(results.every(t => t.st === 'ok') ? 'ledger' : 'fail'); draw(); const t = mcard.querySelector('.tests'); if (t) t.scrollIntoView({ block:'nearest' }); });
      $('gvGo').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res(runGov(base.v, prot)); });
    };
    draw();
  });
}
function setupChapter7(){
  Object.assign(planter, { grow:1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch7, { called:false, proposal:null, rehearsals:0, outcome:null, base:null });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter7(){
  setupChapter7(); phase = 'ch7-intro'; lock = true; camFocus = { x:800, y:640 };
  await wait(300);
  await say(null, T("Un matin, une affiche est apparue au pied du grand cristal : « Trésor commun : 50 cristaux. Que doit-on en faire ? Réponse au grand vote. »"));
  closeDialog(); camFocus = null; setObjective(T('Demande à Nonce ce que c’est')); phase = 'ch7-nonce'; lock = false;

  await until(() => ch7.called);
  lock = true; setObjective(null); camFocus = { x:1100, y:660 };
  await walkTo(player, 1082, 674, 250); player.face = 1; nonce.face = -1;
  await say('Nonce', T("Le trésor commun ! Chaque habitant y a mis un peu, au fil des pages. Il n'appartient à personne en particulier, alors on décide ensemble de ce qu'on en fait."));
  await say('Nonce', T("Et ici, décider ensemble, c'est encore une machine : un trésor, et des règles de vote. Tout le monde peut les lire, et une fois le vote fini, la machine applique le résultat toute seule."));
  const c = await say('Nonce', T("Tu veux proposer quelque chose ?"), [PROPOSALS.fontaine, PROPOSALS.palmier, PROPOSALS.graines]);
  ch7.proposal = ['fontaine', 'palmier', 'graines'][c];
  inscribe('toi', 'machine du vote', `proposition : ${PROPOSALS_FR[ch7.proposal].toLowerCase()}`);
  await wait(700);
  await say('Nonce', T("Belle idée. Mais regarde qui vient de déposer la sienne."));
  closeDialog();
  stranger.x = -120; stranger.y = 700; stranger.vis = true; camFocus = { x:1040, y:680 };
  await walkTo(stranger, 960, 700, 360); stranger.face = 1;
  await say('Célestin', T("Ma proposition est très simple : confier tout le trésor à Célestin, pour son entretien. Quelqu'un doit bien s'en occuper, non ?"));
  closeDialog();
  inscribe('Célestin', 'machine du vote', 'proposition : confier le trésor à Célestin');
  await walkTo(stranger, -120, 700, 420); stranger.vis = false;
  await say('Nonce', T("Ne ris pas. Si les règles du vote sont mal écrites, il peut gagner. Et la machine lui enverra le trésor sans poser de question. Ces règles, c'est toi qui vas les écrire."));
  closeDialog();

  const base = { v:null }, prot = new Set();
  const res = await showGovBuilder(base, prot);
  ch7.base = base.v;
  const fail = res.find(t => t.st === 'ko'), saved = res.find(t => t.st === 'saved');
  ch7.outcome = fail ? 'stolen' : saved ? 'saved' : 'clean';
  camFocus = { x:800, y:680 };
  await say(null, T("Le jour du vote. Les habitants défilent devant la machine, et les voix s'inscrivent une à une dans le registre."));
  closeDialog();
  sparkleUntil = time + 3;
  if (fail){
    await say(null, `${fail.name.replace('.', '')}… ${fail.why}`);
    closeDialog();
    await flyItem([800, 560], [120, 700], 1.2, 'gems2');
    inscribe('trésor commun', 'Célestin', '50 cristaux');
    await wait(700);
    await say('Nonce', T("La machine a fait exactement ce que disaient ses règles. Personne ne peut revenir en arrière. Le trésor est parti."));
    await say('Nonce', T`Ta proposition avait plus de vrais soutiens que la sienne. Mais il n'y a plus rien à dépenser.`);
  } else {
    if (saved){
      await say(null, T`${saved.name.replace('.', '')}… et sa proposition passe. Mais la machine attend deux jours avant d'appliquer quoi que ce soit.`);
      await say(null, T("Deux jours, c'est assez pour que tout l'Atrium le remarque. Les habitants votent l'annulation, et le trésor ne bouge pas."));
      inscribe('habitants', 'machine du vote', 'annulation pendant le délai');
      await wait(700);
    } else {
      await say(null, T("Célestin tente ses ruses, mais les règles tiennent bon. Sa proposition récolte trois voix. La tienne l'emporte largement."));
    }
    inscribe('trésor commun', 'Atrium', `10 cristaux : ${PROPOSALS_FR[ch7.proposal].toLowerCase()}`);
    await wait(700);
    if (ch7.proposal === 'palmier'){ sfx('grow'); await tween(2.4, u => { planter.grow = 1 + ease(u) * .6; }); await say(null, T("Dans la jardinière, un deuxième palmier pousse à côté du tien.")); }
    else if (ch7.proposal === 'fontaine') await say(null, T("Tess et Oskar se mettent au travail. La fontaine sera prête pour le prochain chapitre, promis."));
    else await say(null, T("Désormais, chaque nouvel arrivant recevra une graine dans son coffre. Comme toi, le premier jour."));
  }
  if (ch7.base === 'tokens') await say('Mira', T("Au fait… avec 1 pique = 1 voix, c'est moi qui ai le plus de piques. J'aurais pu décider toute seule. C'est un peu gênant, non ?"));
  await debrief7();
}
async function debrief7(){
  camFocus = { x:1100, y:660 };
  await say('Nonce', T("Retiens trois choses. Un : ici, une décision collective, c'est un trésor et des règles de vote écrites dans une machine. Tout le monde les lit, et elles s'appliquent toutes seules."));
  await say('Nonce', T("Deux : chaque façon de compter a sa faille. Une voix par jeton, et les plus riches, ou ceux qui empruntent, décident. Une voix par personne, et il faut s'assurer que chaque personne est bien réelle."));
  await say('Nonce', T("Trois : les protections comptent autant que le vote. Compter les soldes de la veille, exiger un quorum, attendre avant d'appliquer une décision."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 7;
  track('Chapitre terminé', { chapitre:7, score:ch7.outcome === 'clean' ? 2 : ch7.outcome === 'saved' ? 1 : 0 });
  const saved7 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 7'), title:T('Le grand vote'), recap:[
    T`Ta proposition : ${PROPOSALS[ch7.proposal].toLowerCase()}. Répétitions avant le vrai vote : <b>${ch7.rehearsals}</b>.`,
    ch7.outcome === 'clean' ? T('Les règles ont bloqué toutes les ruses de Célestin.') : ch7.outcome === 'saved' ? T('Une ruse est passée, mais le délai de deux jours a permis de l’annuler.') : T('Une faille est restée ouverte : Célestin est reparti avec les 50 cristaux du trésor.'),
    ch7.base === 'tokens' ? T('Tu as choisi 1 pique = 1 voix : Mira pesait presque autant que tout l’Atrium.') : T('Tu as choisi 1 habitant = 1 voix : il fallait vérifier que chacun était bien réel.'),
    T('Un trésor, des règles lisibles par tous, et des protections : quorum, soldes de la veille, délai.')],
    teaser:T("<b>Chapitre 8.</b> Le messager du dehors : la machine de Tess a besoin de savoir s'il pleut, et le registre ne voit rien du monde extérieur."), saved:saved7,
    buttons:[[T('Continuer : chapitre 8'), chapter8, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 7'), chapter7]] });
}

/* chapter 8 : le messager du dehors */
const ORACLES = { tess:T('Tess regarde par la fenêtre et le dit à la machine.'), celestin:T('Célestin, qui se propose très gentiment.'), five:T('Cinq messagers indépendants : la machine retient l’avis de la majorité.') };
function runOracle(d, stake){
  const mk = (name, ok, why) => ({ name, ok, why });
  if (d === 'celestin') return [
    mk(T('Demain, Tess part en voyage.'), true, T('Célestin, lui, est bien là. Toujours là.')),
    mk(T('Célestin a parié en secret sur le soleil.'), false, T('Il annonce « soleil », évidemment. C’est lui le messager.')),
    mk(T('Quelqu’un offre 20 cristaux pour un mensonge.'), false, T('Il n’a même pas besoin qu’on le paie.')),
    mk(T('Célestin soudoie trois messagers sur cinq.'), false, T('Il n’y a qu’un messager, et c’est lui.')),
  ];
  if (d === 'tess') return [
    mk(T('Demain, Tess part en voyage.'), false, T('Personne ne prévient la machine : les deux mises restent bloquées.')),
    mk(T('Célestin a parié en secret sur le soleil.'), true, T('Tess dit ce qu’elle voit. Célestin n’y peut rien… tant qu’il ne s’adresse pas à elle.')),
    mk(T('Célestin offre 20 cristaux à Tess pour un mensonge.'), false, stake ? T('Sa caution de 10 cristaux pèse moins que les 20 offerts. Tess refuse, mais tout repose sur l’honnêteté d’une seule personne.') : T('Tess refuse, cette fois. Mais tout repose sur l’honnêteté d’une seule personne.')),
    mk(T('Célestin soudoie trois messagers sur cinq.'), false, T('Il n’y a qu’un messager : Célestin n’a qu’une personne à convaincre.')),
  ];
  return [
    mk(T('Demain, Tess part en voyage.'), true, T('Les cinq messagers sont là : la machine a ses nouvelles.')),
    mk(T('Célestin a parié en secret sur le soleil.'), true, T('Il ne fait pas partie des messagers : il ne peut rien annoncer.')),
    mk(T('Célestin offre 20 cristaux à un messager pour un mensonge.'), true, stake ? T('Un messager ment, les quatre autres disent vrai : la majorité l’emporte, et le menteur perd sa caution.') : T('Un messager ment, les quatre autres disent vrai : la majorité l’emporte.')),
    mk(T('Célestin soudoie trois messagers sur cinq.'), stake, stake ? T('Chacun perdrait sa caution de 10 cristaux pour les 5 que Célestin lui offre : aucun n’accepte.') : T('Trois menteurs sur cinq, c’est la majorité. La machine annonce « soleil ».')),
  ];
}
function showOracleBuilder(st){
  return new Promise(res => {
    let results = null;
    const draw = () => {
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">Le pari de Mira et Oskar · 2 cristaux chacun</p><h2>Qui dira le temps qu'il fait ?</h2>
        <p>La machine ne voit que le registre. Pour savoir s'il pleut sur la plage d'en face, elle doit croire quelqu'un. Qui ?</p>
        <div class="rules">${Object.entries(ORACLES).map(([k, v]) => `<button class="rule radio" data-d="${k}" aria-pressed="${st.design === k}">${v}</button>`).join('')}</div>
        <div class="rules"><button class="rule" id="stake" aria-pressed="${st.stake}">Chaque messager dépose une caution de 10 cristaux, qu'il perd s'il ment.</button></div>
        ${results ? T`<h3 class="tests-title">Bac à sable · essai n°${ch8.tests}</h3><ol class="tests">${results.map((t, i) => `<li class="${t.ok ? 'ok' : 'ko'}" style="--i:${i}"><span class="pill">${t.ok ? T('Réussi') : T('Échec')}</span><b>${t.name}</b><br>${t.why}</li>`).join('')}</ol>` : ''}
        <div class="row"><button class="btn primary" id="orTest" ${st.design ? '' : 'disabled'}>Tester dans le bac à sable</button><button class="btn" id="orGo" ${results ? '' : 'disabled'}>Brancher ce messager</button></div>`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-d]').forEach(b => b.addEventListener('click', () => { st.design = b.dataset.d; results = null; sfx('select'); draw(); }));
      $('stake').addEventListener('click', () => { st.stake = !st.stake; results = null; sfx('select'); draw(); });
      $('orTest').addEventListener('click', () => { ch8.tests++; results = runOracle(st.design, st.stake); sfx(results.every(t => t.ok) ? 'ledger' : 'fail'); draw(); const t = mcard.querySelector('.tests'); if (t) t.scrollIntoView({ block:'nearest' }); });
      $('orGo').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res(); });
    };
    draw();
  });
}
function setupChapter8(){
  Object.assign(planter, { grow:planter.grow > 1 ? planter.grow : 1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch8, { talked:false, asked:false, design:null, stake:false, tests:0, oracle:null, bridge:null, lent:false });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter8(){
  setupChapter8(); phase = 'ch8-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Par les grandes baies de l'Atrium, on aperçoit la plage d'en face. À la table de cartes, Mira et Oskar la regardent en se disputant."));
  closeDialog(); setObjective(T('Va voir Mira et Oskar')); phase = 'ch8-table'; lock = false;

  await until(() => ch8.talked);
  lock = true; setObjective(null); camFocus = { x:520, y:720 };
  await say('Mira', T("Il pleuvra demain sur la plage d'en face. Je le sens dans mes cartes."));
  await say('Oskar', T("Soleil. Grand soleil. Je parie deux cristaux."));
  await say('Mira', T("Pari tenu ! On met nos mises dans la machine de Tess, elle paiera le gagnant demain."));
  await say('Oskar', T("…Attends. Comment la machine saura-t-elle s'il a plu ? Elle ne voit que le registre. Elle n'a jamais vu la plage."));
  closeDialog(); camFocus = null;
  setObjective(T('Demande à Tess comment faire')); phase = 'ch8-tess'; lock = false;

  await until(() => ch8.asked);
  lock = true; setObjective(null); player.face = 1;
  await say('Tess', T("Oskar a raison : ma machine est sourde et aveugle au monde du dehors. Il faut quelqu'un pour lui apporter les nouvelles. Un messager."));
  await say('Tess', T("Et c'est là que tout se joue : une machine n'est jamais plus fiable que son messager. Choisis bien."));
  closeDialog();
  const st = { design:null, stake:false };
  await showOracleBuilder(st);
  ch8.design = st.design; ch8.stake = st.stake;
  inscribe('Tess', 'machine du pari', `messager : ${st.design === 'five' ? 'cinq messagers' : st.design === 'tess' ? 'Tess' : 'Célestin'}${st.stake ? ', avec caution' : ''}`);
  await wait(800);

  // le lendemain
  camFocus = { x:900, y:700 };
  await say(null, T("Le lendemain. Sur la plage d'en face, il pleut à verse."));
  closeDialog();
  const mh = [1080, 808 - 60 * persp(808)];
  const n = st.design === 'five' ? 5 : 1;
  for (let i = 0; i < n; i++){ flyItem([80 + i * 40, 60 + i * 20], mh, 1.4 + i * .15, 'bird'); await wait(180); }
  await wait(1500);
  const manipulated = st.design === 'celestin' || (st.design === 'five' && !st.stake);
  ch8.oracle = manipulated ? 'trompé' : st.design === 'tess' ? 'chance' : 'juste';
  if (manipulated){
    machine.deny = 1;
    await say(null, st.design === 'celestin' ? T("Un seul oiseau arrive, et il porte un seul mot : « soleil ». Signé : Célestin.") : T("Trois oiseaux sur cinq portent le même mot : « soleil ». Trois messagers achetés par Célestin."));
    inscribe('machine du pari', 'Oskar', '4 cristaux (soleil, selon le messager)');
    await wait(700);
    await say('Mira', T("Du soleil ? Il pleut des cordes, tout le monde le voit par la fenêtre !"));
    await say('Oskar', T("Je ne voulais pas gagner comme ça… Et je ne peux même pas te rendre la mise par la machine : elle a fait ce qu'on lui a dit."));
    await say('Tess', T("La machine a obéi à son messager. Elle ne pouvait pas savoir qu'il mentait. Célestin avait parié sur le soleil, lui aussi, ailleurs."));
    if (st.design === 'five') { await say('Oskar', T("Je te rends tes cristaux de ma poche, Mira. Mais la machine, elle, a été trompée.")); inscribe('Oskar', 'Mira', '2 cristaux (rendus à la main)'); await wait(600); }
  } else {
    machine.flash = 1;
    await say(null, st.design === 'tess' ? T("Tess regarde par la fenêtre et annonce : « pluie ». La machine paie Mira.") : T("Cinq oiseaux de papier arrivent, et tous portent le même mot : « pluie ». La machine paie Mira."));
    inscribe('machine du pari', 'Mira', '4 cristaux (pluie)');
    await wait(700);
    await say('Mira', T("Je le sentais dans mes cartes !"));
    if (st.design === 'tess') await say('Tess', T("Ça a marché, cette fois. Mais si j'avais été en voyage, ou tentée par Célestin, la machine n'aurait eu personne d'autre à croire."));
    else await say('Tess', st.stake ? T("Célestin a bien tenté d'acheter trois messagers. Aucun n'a accepté : ils avaient trop à perdre.") : T("Cinq messagers indépendants, c'est cinq personnes à convaincre au lieu d'une."));
  }
  closeDialog();

  // le pont
  camFocus = { x:1100, y:760 };
  await say('Tess', T("Les messagers apportent des nouvelles du dehors. Mais pour envoyer quelque chose dehors, il faut un pont. Tu veux essayer ? L'Atrium d'en face vend de très jolis coquillages."));
  const hasGem = inventory.items.some(i => /cristaux|cristal(?! de)/.test(i) && !/récompense/.test(i));
  if (!hasGem){ ch8.lent = true; await say('Tess', T("Tu n'as plus de cristal ? Je t'en prête un, tu me le rendras en coquillages.")); }
  const b = await say('Tess', T("Il y a deux ponts. Le pont des trois gardiens est rapide : il suffit que deux d'entre eux signent. Le grand pont est plus lent : il vérifie lui-même le registre d'en face, page par page."), [T("Le pont des trois gardiens, c'est plus rapide."), T("Le grand pont, même s'il est plus lent.")]);
  ch8.bridge = b === 0 ? 'rapide' : 'grand';
  await say(null, T("Ton cristal entre dans le coffre du pont, ici. De l'autre côté, le pont imprime un cristal identique, qui représente le tien."));
  closeDialog();
  inscribe('toi', b === 0 ? 'pont des trois gardiens' : 'grand pont', '1 cristal (verrouillé ici, imprimé en face)');
  await wait(800);
  stranger.x = -120; stranger.y = 830; stranger.vis = true;
  await walkTo(stranger, 900, 840, 380); stranger.face = 1;
  await say('Célestin', T("Tiens, tiens… Deux gardiens du pont rapide ont laissé traîner leurs clés. Deux signatures sur trois, c'est tout ce qu'il faut, non ?"));
  closeDialog();
  await flyItem([1250, 700], [stranger.x, stranger.y - 110 * persp(stranger.y)], 1.2, 'gems2');
  inscribe('coffre du pont des trois gardiens', 'Célestin', '300 cristaux');
  await wait(700);
  await walkTo(stranger, -120, 840, 460); stranger.vis = false;
  if (b === 0){
    await say(null, T("Le coffre du pont rapide est vide. En face, les cristaux imprimés ne représentent plus rien : il n'y a plus rien derrière. Le tien non plus."));
    await say('Tess', T("Un pont garde tout ce qui le traverse. C'est le plus gros coffre de l'Atrium, et le plus convoité. Il n'est jamais plus solide que ceux qui gardent ses clés."));
  } else {
    await say(null, T("Le coffre du pont rapide est vide. Le grand pont, lui, n'a pas bougé : il ne croit que le registre d'en face, pas des signatures. Ton cristal est arrivé, un peu plus tard."));
    await say('Tess', T("Tu as eu raison de prendre ton temps. Un pont garde tout ce qui le traverse : c'est le plus gros coffre de l'Atrium, et le plus convoité."));
    inscribe('grand pont', 'toi (en face)', '1 coquillage acheté');
    await wait(600);
  }
  if (ch8.lent){ await say('Tess', T("Pour le cristal que je t'ai prêté… on dira que c'est le prix de la leçon.")); }
  await debrief8();
}
async function debrief8(){
  camFocus = { x:1100, y:780 };
  await say('Tess', T("Retiens trois choses. Un : le registre ne voit rien du dehors. Quelqu'un doit le lui dire, et une machine n'est jamais plus fiable que son messager."));
  await say('Tess', T("Deux : plusieurs messagers indépendants valent mieux qu'un seul, et une caution rend le mensonge coûteux."));
  await say('Tess', T("Trois : un pont garde tout ce qui le traverse. Plus il y a dedans, plus il attire les voleurs, et il n'est jamais plus sûr que ceux qui gardent ses clés."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 8;
  track('Chapitre terminé', { chapitre:8, score:(ch8.oracle === 'juste' ? 1 : 0) + (ch8.bridge === 'grand' ? 1 : 0) });
  const saved8 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 8'), title:T('Le messager du dehors'), recap:[
    ch8.oracle === 'juste' ? T('Tes messagers ont dit la vérité : la machine a payé Mira.') : ch8.oracle === 'chance' ? T('Tess a dit la vérité, mais tout reposait sur elle seule.') : T('Célestin a trompé le messager : la machine a payé le mauvais gagnant.'),
    T`Essais dans le bac à sable : <b>${ch8.tests}</b>.`,
    ch8.bridge === 'grand' ? T('Tu as pris le grand pont : ton cristal a traversé, même quand le pont rapide a été vidé.') : T('Tu as pris le pont rapide : Célestin a vidé son coffre, et ton cristal avec.'),
    T('Un messager fiable, plusieurs voix plutôt qu’une, et des ponts qui ne valent que leurs gardiens.')],
    teaser:T("<b>Chapitre 9.</b> Quand l'Atrium déborde : les petites salles d'à côté."), saved:saved8,
    buttons:[[T('Continuer : chapitre 9'), chapter9, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 8'), chapter8]] });
}

/* chapter 9 : les petites salles d'à côté (layer 2) */
const fmt = n => n.toLocaleString(LOCALE, { maximumFractionDigits:1 });
function showSalle(){
  return new Promise(res => {
    const partners = ['Mira', 'Oskar'], things = [T('une carte bleue'), T('une carte dorée'), T('une carte à pois'), T('une carte trouée'), T('une carte brillante'), T('une carte ancienne')];
    const log = [];
    const draw = () => {
      const n = ch9.trades;
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">Dans la petite salle de Tess</p><h2>Échanges à volonté</h2>
        <p>Ici, chaque échange coûte presque rien. Tess les note tous dans son cahier, et n'inscrira qu'un seul résumé dans le grand registre.</p>
        <div class="counters">
          <div><span>Échanges</span><b>${n}</b></div>
          <div class="cheap"><span>Coût dans la salle</span><b>${fmt(n * .1)} <small>miettes</small></b></div>
          <div class="pricey"><span>Dans l'Atrium, ça aurait coûté</span><b>${fmt(n * 4)} <small>miettes</small></b></div>
        </div>
        <ol class="tradelog">${log.slice(-4).map(l => `<li>${l}</li>`).join('')}</ol>
        <div class="row"><button class="btn primary" id="trade">Échanger une carte</button><button class="btn" id="tradeDone" ${n >= 10 ? '' : 'disabled'}>${n >= 10 ? T('Fermer le cahier') : T`Encore ${10 - n} échange${10 - n > 1 ? 's' : ''}`}</button></div>`;
      modal.hidden = false;
      $('trade').addEventListener('click', () => {
        ch9.trades++; sfx('blip'); sfx('select');
        const who = partners[ch9.trades % 2], a = things[ch9.trades % things.length], b = things[(ch9.trades * 5 + 2) % things.length];
        log.push(T`${who} te donne ${a}, tu lui donnes ${b}.`);
        draw(); $('trade').focus({ preventScroll:true });
      });
      if (n >= 10) $('tradeDone').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('wide'); res(); });
    };
    draw(); $('trade').focus({ preventScroll:true });
  });
}
function showChallenge(){
  return new Promise(res => {
    const DUR = 30;
    const lines = [
      { t:T`Échanges dans la salle : ${ch9.trades}`, bad:false },
      { t:T('Mira : 3 cristaux'), bad:false },
      { t:T('Oskar : 3 cristaux'), bad:false },
      { t:T('Toi : 0 cristal'), bad:true },
      { t:T('Célestin : 1 cristal'), bad:true },
    ];
    let left = DUR, timer = null, msg = '';
    const done = r => { clearInterval(timer); modal.hidden = true; mcard.classList.remove('wide'); res(r); };
    const draw = () => {
      mcard.classList.add('wide');
      mcard.innerHTML = T`<p class="eyebrow">Résumé publié par Célestin</p><h2>Contester ou laisser passer</h2>
        <div class="window"><span>Fenêtre de contestation · 7 jours, en accéléré · <b id="winLeft">${Math.ceil(left / DUR * 7)} jours restants</b></span><div class="meter"><div class="fill" id="winFill" style="width:${left / DUR * 100}%"></div></div></div>
        <div class="cols2">
          <div><h3 class="tests-title">Le résumé de Célestin</h3><div class="rules">${lines.map((l, i) => `<button class="rule claim" data-l="${i}">${l.t}</button>`).join('')}</div></div>
          <div><h3 class="tests-title">Ton carnet</h3><ul class="carnet"><li>Tu es entré avec <b>1 cristal</b>.</li><li>Mira et Oskar avaient <b>3 cristaux</b> chacun.</li><li>Vous n'avez échangé que des cartes, ${ch9.trades} fois.</li><li>Célestin n'a <b>jamais</b> mis les pieds dans la salle.</li></ul></div>
        </div>
        <p class="hint">Touche une ligne fausse pour la contester. Chacun peut vérifier : l'Atrium rejoue les échanges et tranche.</p>
        ${msg ? `<p class="warn">${msg}</p>` : ''}
`;
      modal.hidden = false;
      mcard.querySelectorAll('[data-l]').forEach(b => b.addEventListener('click', () => {
        const l = lines[+b.dataset.l];
        if (l.bad){ sfx('ledger'); done('toi'); return; }
        ch9.wrongClicks++; sfx('fail'); msg = T`« ${l.t} » : l'Atrium rejoue les échanges… cette ligne est juste. Contester à tort coûte 0,1 miette.`; draw();
      }));
    };
    draw();
    timer = setInterval(() => {
      left -= .25;
      const f = $('winFill'), w = $('winLeft');
      if (f) f.style.width = Math.max(0, left / DUR * 100) + '%';
      if (w) w.textContent = T`${Math.max(0, Math.ceil(left / DUR * 7))} jour${Math.ceil(left / DUR * 7) > 1 ? 's' : ''} restant${Math.ceil(left / DUR * 7) > 1 ? 's' : ''}`;
      if (left <= 0) done('oskar');
    }, 250);
  });
}
function setupChapter9(){
  Object.assign(planter, { grow:planter.grow > 1 ? planter.grow : 1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch9, { called:false, trades:0, caught:null, wrongClicks:0, fast:false, lent:false });
  salle.vis = true;
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  $('chestBtn').hidden = false; renderPanel();
}
async function chapter9(){
  setupChapter9(); phase = 'ch9-intro'; lock = true; camFocus = { x:1150, y:760 };
  await wait(300);
  await say(null, T("Depuis l'histoire du pont, l'Atrium est plus bondé que jamais : les pages sont pleines et les pourboires grimpent. Et près du tapis de Tess, quelque chose a poussé pendant la nuit : une petite salle, avec un rideau cyan et une enseigne toute neuve."));
  closeDialog(); camFocus = null; setObjective(T('Va voir la petite salle de Tess')); phase = 'ch9-salle'; lock = false;

  await until(() => ch9.called);
  lock = true; setObjective(null); camFocus = { x:1230, y:780 }; player.face = 1;
  await say('Tess', T("Tu te souviens de la cohue, toutes ces demandes qui se battaient pour dix places ? Ça ne fait qu'empirer. Alors j'ai eu une idée."));
  await say('Tess', T("Dans ma petite salle, on fait autant d'échanges qu'on veut, presque gratuitement. Moi, je note tout dans mon cahier. Et de temps en temps, j'inscris un seul résumé dans le grand registre."));
  const c = await say('Tess', T("Une ligne au lieu de cent. Tu veux essayer ?"), [T("Et comment on entre ?"), T("Pourquoi je devrais te croire, pour le résumé ?")]);
  if (c === 1) await say('Tess', T("Tu n'as pas à me croire, c'est tout l'intérêt. Et rassure-toi : sa passerelle n'a rien à voir avec le pont des trois gardiens. Elle ne croit pas des signatures, elle croit le registre. Tu verras."));
  const hasGem = inventory.items.some(i => /cristaux|cristal(?! de)/.test(i) && !/récompense/.test(i));
  if (!hasGem){ ch9.lent = true; await say('Tess', T("Pour entrer, on dépose un cristal dans la passerelle, ici, dans l'Atrium. Tu n'en as plus ? Tiens, je t'en prête un pour l'essai.")); }
  else await say('Tess', T("Pour entrer, on dépose un cristal dans la passerelle, ici, dans l'Atrium. Il y reste bien au chaud, et dans la salle tu le retrouves pour t'en servir."));
  closeDialog();
  await flyItem([player.x, player.y - 80 * persp(player.y)], [salle.x, salle.y - 90 * persp(salle.y)], 1, 'gems2');
  salle.glow = 1; inscribe('toi', 'passerelle de la salle', '1 cristal');
  await wait(700);
  await showSalle();
  salle.glow = 1;
  await say('Tess', T`${ch9.trades} échanges ! Dans l'Atrium, il aurait fallu ${ch9.trades} places sur des pages pleines. Moi, j'inscris juste ça :`);
  closeDialog();
  inscribe('Tess', 'registre', `résumé de la salle (${ch9.trades} échanges)`);
  await wait(900);
  await say('Tess', T("Une seule ligne. Et le résumé attend sept jours avant d'être définitif : pendant ce temps, n'importe qui peut le contester s'il est faux."));
  closeDialog();

  // Célestin publie un faux résumé
  stranger.x = -120; stranger.y = 830; stranger.vis = true; camFocus = { x:1100, y:790 };
  await walkTo(stranger, 1120, 850, 360); stranger.face = 1;
  await say('Célestin', T("Bonjour, bonjour ! Moi aussi, j'ai le droit de publier les résumés de cette salle. J'ai même déposé une caution, tout est en règle."));
  await say('Célestin', T("Voici le mien. Tout à fait exact, vous pouvez vérifier. Enfin… si vous en avez le temps."));
  closeDialog();
  ch9.caught = await showChallenge();
  if (ch9.caught === 'toi'){
    await say(null, T("L'Atrium rejoue les échanges du cahier, un par un. Ta ligne est juste, celle de Célestin est fausse. Son résumé est rejeté."));
  } else {
    await say(null, T("La fenêtre se referme presque… quand Oskar lève la main depuis la table de cartes. « Faux ! Célestin n'est jamais entré dans la salle ! » L'Atrium rejoue les échanges : Oskar a raison."));
    await say('Oskar', T("Je surveille toujours les résumés. Il suffit qu'une seule personne honnête regarde, et le mensonge ne passe pas."));
  }
  inscribe('registre', 'Célestin', 'caution confisquée');
  await say('Célestin', T("Tsss. Personne ne fait confiance à personne, ici."));
  closeDialog();
  await walkTo(stranger, -120, 850, 440); stranger.vis = false;

  // sortir son cristal
  const w = await say('Tess', T("Bon. Tu veux ressortir ton cristal de la salle ? Il faut attendre que la fenêtre de contestation soit passée : sept jours."), [T("J'attends, je ne suis pas pressé."), T("Mira, tu peux me l'avancer tout de suite ?")]);
  if (w === 1){
    ch9.fast = true;
    await say('Mira', T("Je te l'avance maintenant, contre 0,1 cristal. Moi, je récupérerai le tien dans sept jours. Je fais ça pour tout le monde, c'est mon petit commerce."));
    closeDialog();
    inscribe('Mira', 'toi', '1 cristal (avance, 0,1 de frais)');
  } else {
    closeDialog();
    await say(null, T("Sept jours plus tard. Pas de contestation : ton cristal ressort de la passerelle, sans frais."));
    closeDialog();
    inscribe('passerelle de la salle', 'toi', '1 cristal');
  }
  await flyItem([salle.x, salle.y - 90 * persp(salle.y)], [player.x, player.y - 80 * persp(player.y)], 1, 'gems2');
  if (ch9.lent){ await say('Tess', T("Et tu me rends celui que je t'ai prêté. Merci !")); closeDialog(); inscribe('toi', 'Tess', '1 cristal (prêt rendu)'); }
  await debrief9();
}
async function debrief9(){
  camFocus = { x:1230, y:780 };
  await say('Tess', T("Retiens trois choses. Un : dans une petite salle, on fait beaucoup d'échanges pour presque rien, et le grand registre ne reçoit qu'un résumé."));
  await say('Tess', T("Deux : on n'a pas à croire celui qui publie le résumé. Pendant la fenêtre, n'importe qui peut le contester, et un seul honnête suffit."));
  await say('Tess', T("Trois : c'est pour ça qu'il faut attendre pour ressortir, ou payer quelqu'un pour avancer. D'autres salles joignent une preuve mathématique à chaque résumé : là, plus besoin d'attendre qu'on conteste."));
  closeDialog(); camFocus = null; phase = 'free'; chapterDone = 9;
  track('Chapitre terminé', { chapitre:9, score:ch9.caught === 'toi' ? 1 : 0 });
  const saved9 = writeSave();
  showEnd({ eyebrow:T('Fin du chapitre 9'), title:T("Les petites salles d'à côté"), recap:[
    T`${ch9.trades} échanges dans la salle pour ${fmt(ch9.trades * .1)} miette${ch9.trades * .1 > 1 ? 's' : ''}, au lieu de ${ch9.trades * 4} dans l'Atrium.`,
    ch9.caught === 'toi' ? (ch9.wrongClicks ? T`Tu as démasqué le faux résumé de Célestin, après ${ch9.wrongClicks} fausse${ch9.wrongClicks > 1 ? 's' : ''} piste${ch9.wrongClicks > 1 ? 's' : ''}.` : T('Tu as démasqué le faux résumé de Célestin du premier coup.')) : T("C'est Oskar qui a démasqué le faux résumé, à la dernière seconde."),
    ch9.fast ? T('Mira t\'a avancé ton cristal tout de suite, contre 0,1 cristal.') : T('Tu as attendu la fin de la fenêtre pour ressortir ton cristal, sans frais.'),
    T('Un résumé pour cent échanges, une fenêtre pour contester, un seul honnête suffit.')],
    teaser:T("<b>Chapitre 10.</b> Le premier bloc : le mystère de Nonce, et un nouvel arrivant à accueillir."), saved:saved9,
    buttons:[[T('Continuer : chapitre 10'), chapter10, true], [T("Rester dans l'Atrium"), stay], [T('Rejouer le chapitre 9'), chapter9]] });
}

/* chapter 10 : le premier bloc (épilogue) */
function showPageZero(){
  return new Promise(res => {
    mcard.classList.add('parchment');
    mcard.innerHTML = T`<p class="eyebrow">Registre de l'Atrium · page 0</p><h2>La toute première page</h2>
      <p class="pagezero">« Personne ne possède l'Atrium.<br>Tout le monde le fait tourner.<br>Accueillez le suivant. »</p>
      <p class="sign">Signé : personne</p>
      <div class="row"><button class="btn primary" id="p0">Refermer le vieux coffre</button></div>`;
    modal.hidden = false; $('p0').focus({ preventScroll:true });
    $('p0').addEventListener('click', () => { modal.hidden = true; mcard.classList.remove('parchment'); res(); });
  });
}
function setupChapter10(){
  Object.assign(planter, { grow:planter.grow > 1 ? planter.grow : 1, planted:true });
  Object.assign(stranger, { x:-120, y:770, vis:false, target:null, gesture:false });
  Object.assign(machine, { vis:true, version:Math.max(1, machine.version) });
  Object.assign(ch10, { called:false, good:0 });
  Object.assign(newbie, { x:760, y:960, face:1, vis:false, target:null, moving:false, gesture:false });
  Object.assign(player, { x:760, y:720, face:1, target:null, moving:false });
  Object.assign(cat, { x:1262, y:668, face:-1, target:null, wp:CAT_WP.length - 1 });
  $('chestBtn').hidden = false; renderPanel();
}
async function ask(q, choices, right, fix){
  const c = await say('Lou', q, choices);
  if (c === right){ ch10.good++; sfx('ledger'); await say('Lou', T("D'accord. Merci !")); }
  else { sfx('fail'); await say('Nonce', fix); await say('Lou', T("Ah. Heureusement que je t'ai demandé.")); }
}
async function chapter10(){
  setupChapter10(); phase = 'ch10-intro'; lock = true; camFocus = null;
  await wait(300);
  await say(null, T("Un soir, l'Atrium est presque vide. Nonce est assis à sa place habituelle, un vieux coffre en verre posé sur les genoux. Il te fait signe."));
  closeDialog(); setObjective(T('Va voir Nonce')); phase = 'ch10-nonce'; lock = false;

  await until(() => ch10.called);
  lock = true; setObjective(null); camFocus = { x:1100, y:660 };
  await walkTo(player, 1082, 674, 250); player.face = 1; nonce.face = -1;
  await say('Nonce', T("Tu te souviens, le premier jour ? Je t'ai dit que j'étais là depuis le tout premier bloc. Tu ne m'as jamais demandé ce qu'il y avait dedans."));
  const c = await say('Nonce', T("Mon vieux coffre. Tout le monde croit qu'il est plein de trésors."), [T("Qu'est-ce qu'il contient ?"), T("Tu as créé l'Atrium, c'est ça ?")]);
  if (c === 1) await say('Nonce', T("Moi ? Non. Personne ne sait qui a écrit la première page. Moi, j'étais juste le premier nouvel arrivant."));
  await say('Nonce', T("Il ne contient qu'une chose. Regarde."));
  closeDialog();
  await showPageZero();
  await say('Nonce', T("C'est la page 0, la toute première page du registre. Celle que tout le monde recopie, et qui ne changera jamais."));
  await say('Nonce', T("Mon nom, Nonce, veut dire « un nombre qu'on n'utilise qu'une fois ». J'ai compté les pages depuis celle-là, une par une. Et j'ai accueilli tous ceux qui sont arrivés après moi."));
  await say('Nonce', T("La dernière phrase, « Accueillez le suivant », ce n'est plus à moi de la suivre. Regarde qui arrive."));
  closeDialog();

  // un nouvel arrivant
  newbie.vis = true; newbie.x = 800; newbie.y = 960; camFocus = { x:900, y:760 };
  await walkTo(newbie, 820, 820, 180); newbie.face = 1;
  await say(null, T("Par le bas de l'Atrium, quelqu'un arrive, l'air perdu. Exactement comme toi, le premier jour."));
  closeDialog();
  cat.target = null; await walkTo(cat, 870, 790, 320); cat.face = -1;
  await wait(400);
  walkTo(cat, 1000, 740, 300).then(() => { cat.face = -1; });
  await walkTo(newbie, 960, 730, 200);
  await walkTo(player, 1040, 715, 240); player.face = -1; newbie.face = 1;
  await say('Lou', T("Bonjour… Je m'appelle Lou. Un chat blanc m'a amenée jusqu'ici. Je ne sais pas du tout où je suis."));
  const w = await say('Lou', T("C'est quoi, cet endroit ?"), [T("Un lieu que personne ne possède, et que tout le monde fait tourner."), T("C'est chez Nonce, c'est lui qui décide.")]);
  if (w === 0){ ch10.good++; await say('Nonce', T("…Je n'aurais pas mieux dit.")); }
  else await say('Nonce', T("Chez moi ? Oh non. Personne ne décide seul ici, et surtout pas moi."));
  await say(null, T("Il faut quelque chose à Lou. Tu tends la main, comme Nonce l'a fait pour toi."));
  closeDialog();
  Object.assign(chest, { x:1000, y:748, vis:false, sc:0, alpha:1, content:false, flash:0 });
  await flyItem([player.x - 20, player.y - 110 * persp(player.y)], [chest.x + 6, chest.y - 30], 1.1, 'bubble');
  chest.vis = true; ring(chest.x + 6, chest.y - 30, .5);
  await tween(.55, u => { chest.sc = u < .7 ? u / .7 * 1.15 : 1.15 - (u - .7) / .3 * .15; });
  await say('Lou', T("Un coffre… en verre ?"));
  await say(null, T("Tu lui expliques : tout le monde voit ce qu'il contient, mais personne ne peut l'ouvrir, sauf elle. Et pour la clé, douze mots, rien qu'à elle."));
  await say(null, T("Puis tu cueilles une graine de ton palmier, dans la jardinière, et tu la déposes dans son coffre."));
  closeDialog();
  await flyItem([player.x, player.y - 80 * persp(player.y)], [chest.x + 2, chest.y - 14], 1.2, 'seed');
  chest.content = true; tween(1, u => { chest.flash = 1 - u; });
  inscribe('toi', 'Lou', '1 graine de palmier');
  await wait(1000);
  await say('Lou', T("Tout le monde l'a vu passer ?"));
  await say('Nonce', T("Tout le monde. Et ça ne s'effacera jamais."));
  closeDialog();
  await tween(.6, u => { chest.alpha = 1 - u; chest.sc = 1 - u * .5; }); chest.vis = false;

  // les questions de Lou
  await say('Lou', T("J'ai plein de questions. Tu veux bien m'aider ?"));
  await ask(T("Tout à l'heure, quelqu'un de très gentil avec un badge m'a demandé mes douze mots, pour vérifier mon coffre. Je les lui donne ?"),
    [T("Oui, s'il a un badge officiel."), T("Jamais. Personne n'en a besoin pour t'aider.")], 1,
    T("Jamais, Lou. Celui qui a tes douze mots a ton coffre. Personne ici n'en a besoin, moi compris. Surtout pas ceux qui ont un badge."));
  await ask(T("Et on m'offre cent graines d'or si je signe un petit parchemin. Juste une formalité. Je signe ?"),
    [T("Lis d'abord les petites lignes. Et méfie-toi des cadeaux trop beaux."), T("Signe vite, avant que l'offre disparaisse.")], 0,
    T("Ne signe jamais sans lire. Une signature peut ouvrir ton coffre aussi sûrement que tes mots."));
  await ask(T("Si je me trompe en envoyant quelque chose, je peux l'annuler ?"),
    [T("Oui, il suffit de demander aux gardiens."), T("Non. Le registre ne revient jamais en arrière : vérifie avant d'envoyer.")], 1,
    T("Personne ne peut annuler une page scellée, même pas les gardiens. Il faut vérifier avant d'envoyer."));
  await ask(T("Dernière question. C'est qui, le chef, ici ?"),
    [T("Nonce."), T("Les gardiens."), T("Personne. Il y a des règles que tout le monde peut lire, et on vote pour les changer.")], 2,
    T("Personne, Lou. Les gardiens vérifient, les machines appliquent leurs règles, et les habitants votent. Mais aucun chef."));
  closeDialog();
  walkTo(newbie, 1000, 730, 120).then(() => { newbie.face = -1; });

  await say('Nonce', T("Tu vois ? Tu n'as plus besoin de moi."));
  await say(null, T("Nonce s'assoit près de la jardinière, Gwei sur les genoux. Au-dessus de vous, le grand cristal tourne lentement. Quelque part, une nouvelle page s'écrit."));
  closeDialog();
  await debrief10();
}
async function debrief10(){
  camFocus = null; phase = 'free'; chapterDone = 10;
  track('Chapitre terminé', { chapitre:10, score:ch10.good });
  const saved10 = writeSave();
  const lines = [
    ch2.stolen ? T('Chapitre 2 : Célestin t’a eu une fois. Plus jamais.') : T`Chapitre 2 : tu as déjoué ${ch2.resisted || 3} ruse${(ch2.resisted || 3) > 1 ? 's' : ''} de Célestin.`,
    ch4.slashed ? T('Chapitre 4 : tu as signé deux pages contradictoires. Nonce ne t’en veut pas.') : T('Chapitre 4 : tu as gardé le registre sans jamais trahir ton serment.'),
    ch5.mev ? T('Chapitre 5 : tu as placé Célestin devant Mira. Elle s’en souvient.') : T('Chapitre 5 : tu as proposé une page honnête.'),
    ch7.outcome === 'stolen' ? T('Chapitre 7 : le trésor commun est parti chez Célestin.') : T('Chapitre 7 : tes règles de vote ont protégé le trésor commun.'),
    T`Chapitre 10 : ${ch10.good} bonne${ch10.good > 1 ? 's' : ''} réponse${ch10.good > 1 ? 's' : ''} sur 5 aux questions de Lou.`,
  ];
  showEnd({ eyebrow:T('Fin'), title:"L'Atrium", recap:lines.concat([T('Merci d’avoir joué.')]),
    teaser:T('<b>Et maintenant, dehors.</b> Tout ce que tu as appris ici marche aussi dans le vrai Ethereum. Pour créer ton premier vrai coffre : <a href="https://ethereum.org/fr/wallets/" target="_blank" rel="noopener">ethereum.org/fr/wallets</a>. Et rappelle-toi : tes douze mots, à personne.'), saved:saved10,
    buttons:[[T("Rester dans l'Atrium"), stay, true], [T('Rejouer l’épilogue'), chapter10], [T('Recommencer au début'), chapter]] });
}

const talk = {
  nonce(){
    if (phase === 'follow'){ meetTriggered = true; return; }
    if (phase === 'plant') return chat([['Nonce', T("La jardinière est à gauche du grand cristal. Prends ton temps, l'Atrium ne ferme jamais.")]]);
    if (phase === 'ch2-nonce'){ ch2.toldNonce = true; return; }
    if (phase === 'ch2-tess') return chat([['Nonce', T("Tess t'appelle depuis tout à l'heure. Elle a l'air de très bonne humeur.")]]);
    if (phase === 'ch2-go') return chat([['Nonce', T("Des cristaux ? Tess a donc réussi. Va vite les montrer à Oskar.")]]);
    if (phase === 'ch3-table') return chat([['Nonce', T("J'entends Mira et Oskar d'ici. Va voir, avant qu'ils ne réveillent Gwei.")]]);
    if (phase === 'ch3-tess') return chat([['Nonce', T("Un intermédiaire qui ne peut ni se tromper ni tricher ? Tess a ce qu'il te faut.")]]);
    if (phase === 'ch4-nonce'){ ch4.called = true; return; }
    if (phase === 'ch5-nonce'){ ch5.called = true; return; }
    if (phase === 'ch7-nonce'){ ch7.called = true; return; }
    if (phase === 'ch10-nonce'){ ch10.called = true; return; }
    if (chapterDone >= 10) return chat([['Nonce', T("Lou pose encore plein de questions. Tant mieux : c'est comme ça qu'on devient quelqu'un qui accueille les autres.")]]);
    if (phase === 'ch9-salle') return chat([['Nonce', T("Tess a construit une drôle de petite salle, là-bas. Va voir, je suis curieux de savoir ce que tu en penses.")]]);
    if (chapterDone >= 9) return chat([['Nonce', T("Les petites salles de Tess désengorgent l'Atrium. Et le registre reste le juge : c'est lui qui tranche en cas de doute.")]]);
    if (chapterDone >= 7) return chat([['Nonce', ch7.outcome === 'stolen' ? T("Le trésor se remplit de nouveau, doucement. Au prochain vote, on relira les règles deux fois.") : T("Le prochain grand vote aura lieu dans un mois. D'ici là, n'importe qui peut proposer de changer les règles… en votant, bien sûr.")]]);
    if (phase === 'ch6-table') return chat([['Nonce', T("Mira prépare quelque chose à la table de cartes. Avec elle, c'est toujours une bonne idée ou une catastrophe.")]]);
    if (chapterDone >= 5) return chat([['Nonce', ch5.mev ? T("Mira ne t'en veut plus. Mais elle regarde maintenant qui propose la page avant d'acheter ses graines.") : T("La cohue est passée. Les pages coûtent de nouveau presque rien. Si tu as quelque chose à inscrire, c'est le moment.")]]);
    if (chapterDone >= 4) return chat([['Nonce', ch4.slashed ? T("Mon serment se reconstitue doucement. La prochaine fois que Célestin te propose un marché, fais-moi signe avant.") : T("Le registre tient parce que des milliers de gardiens vérifient chaque page. Aujourd'hui, tu en faisais partie.")]]);
    if (chapterDone >= 3) return chat([['Nonce', T("Une machine que personne ne peut arrêter, pas même celle qui l'a construite. Ça me donne un peu le vertige, parfois.")]]);
    if (chapterDone >= 2) return chat([['Nonce', T("Si Célestin revient, tu sauras quoi lui répondre. Et il reviendra, sous un autre nom, avec un autre chapeau.")]]);
    return chat([['Nonce', T("Tu reviendras me voir ? Il y a encore beaucoup de gens à rencontrer ici. Certains sont très gentils. D'autres le sont un peu trop.")]]);
  },
  cat(){ sfx('meow'); return chat([[null, T("Gwei cligne lentement des yeux. Chez les chats, c'est un signe de confiance.")]]); },
  table(){
    if (phase === 'ch2-go'){ ch2.met = true; return; }
    if (phase === 'ch3-table'){ ch3.talked = true; return; }
    if (phase === 'ch6-table'){ ch6.called = true; return; }
    if (phase === 'ch8-table'){ ch8.talked = true; return; }
    if (phase === 'ch8-tess') return chat([['Oskar', T("Va voir Tess. Si quelqu'un sait comment parler à sa machine, c'est elle.")]]);
    if (chapterDone >= 6) return chat([['Mira', ch6.pick === 'real' ? T("« Le chat qui dort » est accroché au-dessus de mon lit. Enfin, sa preuve est dans le registre, et l'image sur l'étagère.") : T("J'ai appris ma leçon : maintenant, je regarde le créateur avant l'image.")], ['Oskar', T("Je grave un nouveau dessin par semaine. Toujours dans la même machine : c'est ma signature.")]]);
    if (phase === 'ch3-tess') return chat([['Mira', T("Va voir Tess ! On ne bouge pas d'ici.")], ['Oskar', T("Surtout pas avant elle.")]]);
    if (chapterDone >= 5 && ch5.mev) return chat([['Mira', T("Six miettes la graine ! Célestin me les a revendues trois fois leur prix. Et toi, tu as proposé la page…")], ['Oskar', T("Laisse, Mira. C'est la règle du jeu. Mais on s'en souviendra.")]]);
    if (chapterDone >= 3) return chat([['Mira', T("Regarde mon jeu doré. Il brille, hein ?")], ['Oskar', T("Et moi, j'ai deux cristaux. Et aucune rancune. C'est la machine qui a tout fait.")]]);
    if (chapterDone >= 2) return chat([['Oskar', T("Célestin ? Il a essayé avec moi aussi, l'an dernier. Il m'a proposé cent graines d'or.")], ['Mira', T("Et tu as failli recopier tes mots. Tout le monde l'a vu.")]]);
    const sets = [
      [['Mira', T("On joue aux cartes. Personne ne triche : tout le monde voit toutes les mains.")], ['Oskar', T("Enfin… presque toutes. Reviens quand tu veux, on t'apprendra.")]],
      [['Oskar', T("Tu sais pourquoi personne ne triche ici ? Parce qu'on ne peut pas réécrire le registre. J'ai essayé, une fois.")], ['Mira', T("Il a essayé. Tout le monde l'a vu.")]],
    ];
    return chat(sets[tableTalk++ % sets.length]);
  },
  tess(){
    if (phase === 'ch2-tess'){ ch2.metTess = true; return; }
    if (phase === 'ch3-tess'){ ch3.asked = true; return; }
    if (phase === 'ch8-tess'){ ch8.asked = true; return; }
    if (phase === 'ch9-salle'){ ch9.called = true; return; }
    if (chapterDone >= 8) return chat([['Tess', ch8.bridge === 'grand' ? T("Le coquillage d'en face est arrivé intact. Le grand pont prend son temps, mais il ne se trompe pas.") : T("Le pont rapide est fermé pour réparations. On dit que ses gardiens auront désormais dix clés au lieu de trois.")]]);
    if (phase === 'ch3-table') return chat([['Tess', T("Tu entends ce vacarme à la table de cartes ? Va voir, moi je surveille ma machine.")]]);
    if (chapterDone >= 3) return chat([['Tess', T("Ma machine tourne toute seule, maintenant. Je ne peux plus rien y changer. C'est un peu comme regarder un enfant partir à l'école.")]]);
    if (chapterDone >= 2) return chat([['Tess', ch2.stolen ? T("Célestin t'a pris mes cristaux ? Il a essayé avec ma machine aussi. Elle ne l'a pas laissé faire.") : T("Tu as encore mes trois cristaux ? Garde-les bien. Au chapitre suivant, on les met dans la machine.")]]);
    const sets = [
      [['Tess', T("Je fabrique une petite machine à promesses. Tu mets une graine d'un côté, une fleur sort de l'autre. Sans personne au milieu.")], ['Tess', T("Enfin, quand elle marchera. Repasse plus tard.")]],
      [['Tess', T("Le plus dur, ce n'est pas de la faire marcher. C'est d'être sûre que personne ne puisse la faire marcher de travers.")]],
    ];
    return chat(sets[tessTalk++ % sets.length]);
  },
  planter: usePlanter,
  newbie(){ return chat([['Lou', T("Merci encore pour la graine ! Je l'ai plantée à côté de la tienne. Et mes douze mots, je ne les ai dits à personne.")]]); },
  salle(){
    if (phase === 'ch9-salle'){ ch9.called = true; return; }
    return chat([['Tess', T("La salle est ouverte à tout le monde. Entre, échange, et n'oublie pas de relire les résumés. Oskar le fait tous les soirs.")]]);
  },
  crystal(){ return chat([[null, T("Le grand cristal tourne lentement sur lui-même. Personne ne se souvient de qui l'a posé là. Tout le monde a une théorie.")]]); },
};
const INTER = [
  { id:'nonce', hit:() => [nonce.x, nonce.y - 85 * persp(nonce.y), 62], appr:() => [1082, 674] },
  { id:'cat', hit:() => [cat.x, cat.y - 26, 40], appr:() => [cat.x - 62 * cat.face, cat.y + 14] },
  { id:'table', hit:() => [431, 690, 105], appr:() => [566, 776] },
  { id:'tess', hit:() => [1150, 772, 78], appr:() => [1030, 842] },
  { id:'planter', hit:() => [640, 628, 58], appr:() => [724, 664] },
  { id:'salle', hit:() => salle.vis ? [salle.x, salle.y - 80 * persp(salle.y), 60] : [-999, -999, 0], appr:() => [salle.x - 20, salle.y + 64] },
  { id:'newbie', hit:() => newbie.vis ? [newbie.x, newbie.y - 80 * persp(newbie.y), 45] : [-999, -999, 0], appr:() => [newbie.x - 80, newbie.y + 10] },
  { id:'crystal', hit:() => [800, 340, 115], appr:null },
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

/* ---------- input ---------- */
function toWorld(ev){ const r = cv.getBoundingClientRect(); return [cam.x + (ev.clientX - r.left) / scale, cam.y + (ev.clientY - r.top) / scale]; }
cv.addEventListener('pointerdown', ev => {
  if (advanceFn){ advanceFn(); return; }
  if (lock || busy) return;
  const [wx, wy] = toWorld(ev);
  const it = hitTest(wx, wy);
  if (it) return interact(it);
  if (wy > HOR + 10){ const pt = { x:wx, y:wy }; collide(pt); walkTo(player, pt.x, pt.y, 250, true); }
});
cv.addEventListener('pointermove', ev => { const [wx, wy] = toWorld(ev); cv.style.cursor = (!lock && hitTest(wx, wy)) ? 'pointer' : (!lock && wy > HOR + 10 ? 'crosshair' : 'default'); });
const keys = new Set();
const MOVE = { arrowup:[0,-1], z:[0,-1], w:[0,-1], arrowdown:[0,1], s:[0,1], arrowleft:[-1,0], q:[-1,0], a:[-1,0], arrowright:[1,0], d:[1,0] };
window.addEventListener('keydown', ev => {
  const k = ev.key.toLowerCase();
  if (ev.target.tagName === 'BUTTON' && (k === 'enter' || k === ' ')) return;
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

const CH_NAMES = { 1:T("Chapitre 2 · L'inconnu très aimable"), 2:T('Chapitre 3 · La machine à promesses'), 3:T('Chapitre 4 · Les gardiens du registre'), 4:T('Chapitre 5 · La place sur la page'), 5:T("Chapitre 6 · Les jetons de l'Atrium"), 6:T('Chapitre 7 · Le grand vote'), 7:T('Chapitre 8 · Le messager du dehors'), 8:T("Chapitre 9 · Les petites salles d'à côté"), 9:T('Chapitre 10 · Le premier bloc'), 10:T("L'Atrium · fin") };
function setupTitle(){
  const d = readSave(), newBtn = $('newBtn');
  if (!d || !d.chapterDone){ newBtn.hidden = true; return; }
  $('titleEyebrow').textContent = CH_NAMES[d.chapterDone] || T('Partie en cours');
  $('titleLede').textContent = { 1:T("Ta pousse de palmier t'attend, et quelqu'un de très aimable aussi."), 2:T("À la table de cartes, le ton monte. Tess a peut-être une solution."), 3:T("Nonce a une faveur à te demander. Son serment est en jeu."), 4:T("L'Atrium bourdonne, et le tirage au sort est tombé sur le siège de Nonce."), 5:T("À la table de cartes, Mira dessine des petits piques sur une feuille."), 6:T("Une affiche est apparue au pied du grand cristal."), 7:T("Mira et Oskar se disputent sur la météo de la plage d'en face."), 8:T("Près du tapis de Tess, une petite salle a poussé pendant la nuit."), 9:T("Nonce t'attend, un vieux coffre en verre sur les genoux."), 10:T("Lou t'attend près de la jardinière. Et le registre continue de s'écrire.") }[d.chapterDone] || T("L'Atrium n'a pas bougé. Ton coffre et le registre non plus.");
  $('startBtn').textContent = { 1:T('Continuer : chapitre 2'), 2:T('Continuer : chapitre 3'), 3:T('Continuer : chapitre 4'), 4:T('Continuer : chapitre 5'), 5:T('Continuer : chapitre 6'), 6:T('Continuer : chapitre 7'), 7:T('Continuer : chapitre 8'), 8:T('Continuer : chapitre 9'), 9:T('Continuer : chapitre 10') }[d.chapterDone] || T("Retourner dans l'Atrium");
  newBtn.hidden = false;
}
let confirmNew = false;
$('startBtn').addEventListener('click', () => {
  window.Sound && window.Sound.start(); $('title').hidden = true;
  const d = readSave();
  track('Partie lancée', { reprise:!!(d && d.chapterDone), chapitre:d && d.chapterDone ? d.chapterDone + 1 : 1, langue:LANG });
  if (!d || !d.chapterDone) return chapter();
  restore(d);
  if (d.chapterDone === 1) chapter2(); else if (d.chapterDone === 2) chapter3(); else if (d.chapterDone === 3) chapter4(); else if (d.chapterDone === 4) chapter5(); else if (d.chapterDone === 5) chapter6(); else if (d.chapterDone === 6) chapter7(); else if (d.chapterDone === 7) chapter8(); else if (d.chapterDone === 8) chapter9(); else if (d.chapterDone === 9) chapter10(); else resumeFree();
});
$('newBtn').addEventListener('click', () => {
  if (!confirmNew){ confirmNew = true; $('newBtn').textContent = T('Confirmer : effacer ma progression'); return; }
  clearSave(); track('Nouvelle partie'); window.Sound && window.Sound.start(); $('title').hidden = true; chapter();
});
setupTitle();
const soundBtn = $('soundBtn');
function renderSound(m){ soundBtn.setAttribute('aria-pressed', String(!m)); soundBtn.setAttribute('aria-label', m ? T('Activer le son') : T('Couper le son')); soundBtn.classList.toggle('off', m); }
if (window.Sound){ renderSound(window.Sound.muted); window.Sound.onChange(renderSound); soundBtn.addEventListener('click', () => { window.Sound.start(); window.Sound.toggle(); }); } else soundBtn.hidden = true;
$('chestBtn').addEventListener('click', () => { $('panel').hidden = !$('panel').hidden; });
$('panelClose').addEventListener('click', () => { $('panel').hidden = true; });

/* ---------- loop ---------- */
function snapCam(){ const f = focusPoint(); cam.x = f[0]; cam.y = f[1]; }
function focusPoint(){
  const fx0 = camFocus ? camFocus.x : (phase === 'title' ? 800 : player.x), fy0 = camFocus ? camFocus.y : (phase === 'title' ? 640 : player.y);
  return [clamp(fx0 - viewW / 2, 0, Math.max(0, W - viewW)), clamp(fy0 - viewH * .62, 0, Math.max(0, H - viewH))];
}
function update(dt){
  time += dt;
  if (!lock && keys.size && !busy){
    let vx = 0, vy = 0; keys.forEach(k => { vx += MOVE[k][0]; vy += MOVE[k][1]; });
    const l = Math.hypot(vx, vy);
    if (l){ player.target = null; const sp = 250 * persp(player.y) * dt; player.x += vx / l * sp; player.y += vy / l * sp * .8; collide(player); player.moving = true; player.walk += dt * 10; if (vx) player.face = vx > 0 ? 1 : -1; }
  } else if (!player.target) player.moving = false;
  moveEntity(player, dt); moveEntity(cat, dt); moveEntity(nonce, dt);
  if (player.moving){ stepT -= dt; if (stepT <= 0){ sfx('step'); stepT = .34; } } else stepT = 0;
  walkers.forEach(w => { w.x += w.face * w.sp * dt; w.walk += dt * 6; if (w.x > w.max) w.face = -1; if (w.x < w.min) w.face = 1; });
  if (phase === 'follow'){
    if (!cat.target && cat.wp < CAT_WP.length - 1 && dist(player, cat) < 230){
      cat.wp++; const last = cat.wp === CAT_WP.length - 1;
      walkTo(cat, ...CAT_WP[cat.wp], 300).then(() => { cat.face = -1; });
    }
    if (Math.hypot(player.x - nonce.x, player.y - nonce.y) < 200) meetTriggered = true;
  }
  if (phase === 'ch2-go' && player.x < 920) ch2.met = true;
  moveEntity(stranger, dt); moveEntity(newbie, dt);
  if (salle.glow > 0) salle.glow = Math.max(0, salle.glow - dt * .7);
  if (machine.flash > 0) machine.flash = Math.max(0, machine.flash - dt * .8);
  if (machine.deny > 0) machine.deny = Math.max(0, machine.deny - dt * .6);
  for (let i = tweens.length - 1; i >= 0; i--){ const tw = tweens[i]; tw.t += dt; const u = Math.min(1, tw.t / tw.dur); tw.fn(u); if (u >= 1){ tweens.splice(i, 1); tw.res(); } }
  for (let i = fx.length - 1; i >= 0; i--){ const f = fx[i]; f.t += dt; if (f.t >= f.dur){ fx.splice(i, 1); f.res(); } }
  for (let i = waiters.length - 1; i >= 0; i--){ if (waiters[i].fn()){ const w = waiters.splice(i, 1)[0]; w.res(); } }
  const [tx, ty] = focusPoint(), k = Math.min(1, dt * 3);
  cam.x += (tx - cam.x) * k; cam.y += (ty - cam.y) * k;
}
function render(){
  const g = ctx, k = scale * dpr;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height);
  g.setTransform(k, 0, 0, k, -cam.x * k, -cam.y * k);
  g.lineJoin = 'round'; g.lineCap = 'round';
  g.drawImage(cache, 0, 0, W, H);
  drawDiamond(g, time); drawBubbles(g, time);
  const list = [
    { y:614, d:() => drawPedestal(g) },
    { y:738, d:() => drawCardTable(g) },
    { y:815, d:() => drawTess(g, time) },
    { y:salle.y, d:() => { if (salle.vis) drawSalle(g, time); } },
    { y:planter.y, d:() => drawPlanter(g, time) },
    { y:702, d:() => drawPot(g, 180, 702, time, false) },
    { y:717, d:() => drawPot(g, 1420, 717, time, true) },
    { y:nonce.y, d:() => { drawPerson(g, nonce, time); drawNonceBubbles(g, time); } },
    { y:cat.y, d:() => drawCat(g, cat, time) },
    { y:chest.y, d:() => drawChest(g, chest) },
  ];
  if (stranger.vis) list.push({ y:stranger.y, d:() => drawPerson(g, stranger, time) });
  PALMS.forEach(P => list.push({ y:P.base[1], d:() => drawPalm(g, P, time) }));
  walkers.forEach(w => list.push({ y:w.y, d:() => drawPerson(g, w, time) }));
  if (newbie.vis) list.push({ y:newbie.y, d:() => drawPerson(g, newbie, time) });
  if (player.y < H + 60) list.push({ y:player.y, d:() => drawPerson(g, player, time) });
  list.sort((a, b) => a.y - b.y).forEach(o => o.d());
  // guidance marker
  if (phase === 'follow'){ const done = cat.wp >= CAT_WP.length - 1 && !cat.target; if (done) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time); else if (!cat.target) drawMarker(g, cat.x, cat.y - 70 * persp(cat.y), time); }
  if (phase === 'plant' && !busy) drawMarker(g, planter.x, planter.y - 60, time);
  if (phase === 'ch2-tess' && !busy) drawMarker(g, 1150, 815 - 150 * persp(815), time);
  if (phase === 'ch2-go' && !busy) drawMarker(g, 431, 600, time);
  if (phase === 'ch8-table' && !busy) drawMarker(g, 431, 600, time);
  if (phase === 'ch8-tess' && !busy) drawMarker(g, 1150, 815 - 150 * persp(815), time);
  if (phase === 'ch9-salle' && !busy) drawMarker(g, salle.x, salle.y - 220 * persp(salle.y), time);
  if (phase === 'ch10-nonce' && !busy) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time);
  if (phase === 'ch7-nonce' && !busy) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time);
  if (phase === 'ch6-table' && !busy) drawMarker(g, 431, 600, time);
  if (phase === 'ch5-nonce' && !busy) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time);
  if (phase === 'ch4-nonce' && !busy) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time);
  if (phase === 'ch3-table' && !busy) drawMarker(g, 431, 600, time);
  if (phase === 'ch3-tess' && !busy) drawMarker(g, 1150, 815 - 150 * persp(815), time);
  if (phase === 'ch2-nonce' && !busy) drawMarker(g, nonce.x, nonce.y - 215 * persp(nonce.y), time);
  if (time < sparkleUntil){ const a = Math.min(1, (sparkleUntil - time) / .6); g.globalAlpha = a; witnesses().forEach(([x, y], i) => drawSparkle(g, x, y - (reduce ? 0 : Math.abs(Math.sin(time * 3 + i)) * 6), .8)); g.globalAlpha = 1; }
  fx.forEach(f => f.draw(g, Math.min(1, f.t / f.dur)));
  drawForeground(g, time);
}
let last = performance.now(), stepT = 0;
function frame(now){
  const dt = Math.min(.05, (now - last) / 1000); last = now;
  update(dt); render();
  requestAnimationFrame(frame);
}
// outil de test : ouvrir index.html#debug expose window.atrium
if (location.hash === '#debug') window.atrium = { interact:id => interact(INTER.find(i => i.id === id)), state:() => ({ phase, lock, busy, chapterDone, ch2:{ ...ch2 }, ch3:{ ...ch3 }, ch4:{ ...ch4 }, ch5:{ ...ch5 }, ch6:{ ...ch6 }, ch7:{ ...ch7 }, ch8:{ ...ch8 }, ch9:{ ...ch9 }, ch10:{ ...ch10 }, machine:machine.version, items:inventory.items.slice(), key:inventory.key, ledger:ledger.map(e => `${e.bloc} ${e.from}>${e.to} ${e.what}`), player:[Math.round(player.x), Math.round(player.y)] }), goto:(x, y) => walkTo(player, x, y, 400, true) };
resetWorld();
resize();
window.addEventListener('resize', resize);
if (window.visualViewport) window.visualViewport.addEventListener('resize', resize);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {});
requestAnimationFrame(frame);
})();
