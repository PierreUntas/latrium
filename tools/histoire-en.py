#!/usr/bin/env python3
"""Version anglaise de L'Atrium · histoire vraie.

  python3 tools/histoire-en.py          → régénère histoire/histoire.en.js à partir de histoire/histoire.js
  python3 tools/histoire-en.py --check  → liste les textes français qui n'ont pas encore de traduction

Les traductions sont dans histoire/i18n/en.json : clé = texte français exact, valeur = anglais.
Après avoir modifié un texte du jeu, lance --check, ajoute les nouvelles entrées dans en.json, puis régénère.
"""
import json, re, sys, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, 'histoire', 'histoire.js')
OUT = os.path.join(ROOT, 'histoire', 'histoire.en.js')
DICT = os.path.join(ROOT, 'histoire', 'i18n', 'en.json')
src = open(SRC, encoding='utf-8').read()
lits = []  # (start, end, quote, body)
i, n = 0, len(src)
while i < n:
    c = src[i]
    if src.startswith('//', i):
        j = src.find('\n', i); i = n if j < 0 else j; continue
    if src.startswith('/*', i):
        i = src.find('*/', i) + 2; continue
    if c in '\'"`':
        q = c; j = i + 1; depth = 0
        while j < n:
            d = src[j]
            if d == '\\': j += 2; continue
            if q == '`' and src.startswith('${', j):
                # skip balanced braces (may contain nested literals — keep simple)
                k = j + 2; b = 1
                while b and k < n:
                    ch = src[k]
                    if ch in '\'"':
                        m = k + 1
                        while src[m] != ch:
                            m += 2 if src[m] == '\\' else 1
                        k = m + 1; continue
                    if ch == '`':
                        m = k + 1
                        while src[m] != '`':
                            m += 2 if src[m] == '\\' else 1
                        k = m + 1; continue
                    if ch == '{': b += 1
                    elif ch == '}': b -= 1
                    k += 1
                j = k; continue
            if d == q: break
            j += 1
        lits.append((i, j + 1, q, src[i + 1:j])); i = j + 1; continue
    i += 1

FR = re.compile(r"[a-zA-Zàâçéèêëîïôûùüœ]{2,}")
def keep(b):
    if not FR.search(b): return False
    if not (' ' in b or re.search(r'[àâçéèêëîïôûùüœÉÀ’«»]', b)): return False
    if re.match(r'^[\d. ]+(px|%)', b) or 'monospace' in b or 'Gloock' in b: return False
    if re.match(r'^(card|btn|rule|tl|verdict|pill)[ a-z-]*$', b): return False
    return True

d = json.load(open(DICT, encoding='utf-8'))
if '--check' in sys.argv:
    miss = sorted({l[3] for l in lits if keep(l[3]) and l[3] not in d})
    for m in miss: print(json.dumps(m, ensure_ascii=False))
    print(f'{len(miss)} texte(s) sans traduction', file=sys.stderr); sys.exit(1 if miss else 0)
out, last = [], 0
for (a, b, q, body) in lits:
    t = d.get(body)
    if t is None and body == '58 750 000 000': t = '58,750,000,000,'
    if t is None and re.fullmatch(r'#?\d{1,3}( \d{3})+', body):  # nombres du décor : 1 028 201 → 1,028,201
        t = body.replace(' ', ',')
    if t is None and body == '000 000 000 000': t = '000,000,000,000'
    if t is None and body == 'CÂBLES': t = 'CABLES'
    if t is not None and t != body:
        if q != '`' and q in t: t = t.replace(q, '\\' + q)
        out.append(src[last:a + 1]); out.append(t); last = b - 1
out.append(src[last:])
en = ''.join(out)
for a, b in [("toLocaleString('fr-FR')", "toLocaleString('en-US')"), (".replace(/\\B(?=(\\d{3})+(?!\\d))/g, ' ')", ".replace(/\\B(?=(\\d{3})+(?!\\d))/g, ',')"),
             ("'Continuer'", "'Continue'"), ("['Adresse',", "['Address',"), ("['Solde',", "['Balance',")]:
    en = en.replace(a, b)
open(OUT, 'w', encoding='utf-8').write(en)
print('histoire/histoire.en.js régénéré')
