// Régénère l'image de partage (og.jpg) et les icônes à partir du jeu lui-même.
// Usage : npm i -D playwright && FONTS=/chemin/vers/polices node tools/make-og.js
// Les polices (Gloock, Atkinson Hyperlegible, JetBrains Mono) viennent de github.com/google/fonts.
const { chromium } = require('playwright');
const path = require('path'), fs = require('fs');
const ROOT = path.resolve(__dirname, '..');
const F = 'file://' + path.resolve(process.env.FONTS || path.join(ROOT, 'tools/fonts')) + '/';
(async()=>{const b=await chromium.launch();
 const p=await b.newPage({viewport:{width:1200,height:702},deviceScaleFactor:1});
 await p.goto('file://' + ROOT + '/game/index.html#debug');
 await p.addStyleTag({content:`
  @font-face{font-family:'Gloock';src:url(${F}Gloock-Regular.ttf)}
  @font-face{font-family:'Atkinson Hyperlegible';src:url(${F}AtkinsonHyperlegible-Regular.ttf)}
  @font-face{font-family:'Atkinson Hyperlegible';font-weight:700;src:url(${F}AtkinsonHyperlegible-Bold.ttf)}
  @font-face{font-family:'JetBrains Mono';src:url(${F}JetBrainsMono-VF.ttf)}
  body{padding:0!important} .caption,#title,.hud-right{display:none!important}
  .stage{border:none!important;border-radius:0!important;box-shadow:none!important;max-width:none!important}
  .og{position:absolute;left:44px;bottom:44px;background:var(--paper);border:3px solid var(--ink);border-radius:14px;box-shadow:8px 8px 0 var(--lav);padding:24px 30px 26px;display:flex;flex-direction:column;gap:8px;max-width:640px}
  .og .eyebrow{font-size:15px}
  .og h1{margin:0;font:400 92px/.92 var(--f-display);color:var(--ink)}
  .og p{margin:0;font:400 25px/1.3 var(--f-body);color:var(--ink)}`});
 await p.evaluate(()=>window.dispatchEvent(new Event('resize')));
 await p.evaluate(()=>document.fonts.ready);
 await p.evaluate(()=>{const d=document.createElement('div');d.className='og';d.innerHTML='<span class="eyebrow">Un jeu gratuit, dans le navigateur</span><h1>L’Atrium</h1><p>Comprendre Ethereum, un chapitre à la fois.</p>';document.getElementById('stage').appendChild(d);});
 await p.waitForTimeout(2500);
 await (await p.$('#stage')).screenshot({path:path.join(ROOT, 'og.png')});
 // icons
 for (const s of [180,192,512]){ const q=await b.newPage({viewport:{width:s,height:s}}); await q.setContent(`<style>html,body{margin:0} svg{display:block;width:${s}px;height:${s}px}</style>`+fs.readFileSync(path.join(ROOT, 'icon.svg'), 'utf8')); await q.waitForTimeout(200); await q.screenshot({path:path.join(ROOT, s === 180 ? 'apple-touch-icon.png' : `icon-${s}.png`)}); await q.close(); }
 await b.close();
 console.log('og.png généré : convertis-le en og.jpg (qualité ~85) pour rester sous 300 Ko.');
})();
