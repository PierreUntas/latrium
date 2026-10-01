// Régénère les images de partage du portfolio (og-portfolio.jpg et og-portfolio-en.jpg) à partir de la scène elle-même.
// Usage : npm i -D playwright && FONTS=/chemin/vers/polices node tools/make-og-portfolio.js
// Polices : Gloock, Atkinson Hyperlegible (Regular et Bold), JetBrains Mono, depuis github.com/google/fonts.
const { chromium } = require('playwright');
const path = require('path'), { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '..');
const F = 'file://' + path.resolve(process.env.FONTS || path.join(ROOT, 'tools/fonts')) + '/';
const PAGES = [
  ['index.html', 'og-portfolio', 'Développeur blockchain & full-stack', 'Un portfolio à visiter : chaque vitrine garde un projet.'],
  ['en/index.html', 'og-portfolio-en', 'Blockchain & full-stack developer', 'A portfolio you walk through: each display case holds a project.'],
];
(async () => { const b = await chromium.launch();
  for (const [file, out, eyebrow, line] of PAGES){
    const p = await b.newPage({ viewport:{ width:1200, height:702 }, deviceScaleFactor:1 });
    await p.route(/fonts\.(googleapis|gstatic)\.com|_vercel/, r => r.abort());
    await p.goto('file://' + path.join(ROOT, file));
    await p.addStyleTag({ content:`
      @font-face{font-family:'Gloock';src:url(${F}Gloock-Regular.ttf)}
      @font-face{font-family:'Atkinson Hyperlegible';src:url(${F}AtkinsonHyperlegible-Regular.ttf)}
      @font-face{font-family:'Atkinson Hyperlegible';font-weight:700;src:url(${F}AtkinsonHyperlegible-Bold.ttf)}
      @font-face{font-family:'JetBrains Mono';src:url(${F}JetBrainsMono-VF.ttf)}
      body{padding:0!important;margin:0!important} .caption,#title,.hud-right{display:none!important}
      .stage{border:none!important;border-radius:0!important;box-shadow:none!important;max-width:none!important;margin:0!important}
      .og{position:absolute;left:36px;top:36px;background:var(--paper);border:3px solid var(--ink);border-radius:14px;box-shadow:8px 8px 0 var(--lav);padding:22px 30px 24px;display:flex;flex-direction:column;gap:8px;max-width:430px}
      .og .eyebrow{font:600 13px var(--f-mono);letter-spacing:.05em;white-space:nowrap;text-transform:uppercase;color:var(--ink-2)}
      .og h1{margin:0;font:400 62px/1 var(--f-display);color:var(--ink);white-space:nowrap}
      .og p{margin:0;font:400 20px/1.3 var(--f-body);color:var(--ink)}` });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(() => window.dispatchEvent(new Event('resize')));
    await p.evaluate(([e, l]) => { const d = document.createElement('div'); d.className = 'og';
      d.innerHTML = `<span class="eyebrow">${e}</span><h1>Pierre Untas</h1><p>${l}</p>`; document.getElementById('stage').appendChild(d); }, [eyebrow, line]);
    await p.waitForTimeout(2500);
    const png = path.join(ROOT, out + '.png');
    await (await p.$('#stage')).screenshot({ path:png, clip:undefined });
    execFileSync('convert', [png, '-resize', '1200x630^', '-gravity', 'center', '-extent', '1200x630', '-quality', '86', path.join(ROOT, out + '.jpg')]);
    require('fs').unlinkSync(png); await p.close();
  }
  await b.close(); console.log('og-portfolio.jpg et og-portfolio-en.jpg générés.');
})();
