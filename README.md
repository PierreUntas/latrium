# L'Atrium

Un jeu cozy dans l'univers d'Ethereum. On y arrive un peu perdu, un guide nommé Nonce nous accueille, nous confie un coffre en verre et une phrase de douze mots, puis nous offre une première graine : la première transaction, vécue comme un geste d'amitié.

Le jeu apprend les notions d'Ethereum par l'histoire et les gestes, jamais par des définitions :

| Dans le jeu | Dans Ethereum |
| --- | --- |
| Le coffre en verre | Le wallet : contenu visible par tous, ouvrable par toi seul |
| Les douze mots | La seed phrase |
| « Ne les donne jamais » | La protection contre le phishing |
| Donner la graine | Une transaction, irréversible et publique |
| Le registre et ses blocs | La blockchain |
| Le parchemin de Célestin | Une approbation de token signée à l'aveugle |
| Révoquer l'autorisation | Révoquer une approbation (revoke) |
| La machine à promesses | Un smart contract (ici un séquestre) |
| Le bac à sable | Le testnet |
| Poser la machine | Déployer : le code devient immuable |
| « Tess peut tout retirer » | Une clé d'admin, un point de défaillance |
| Les gardiens | Les validateurs |
| Le serment de 32 cristaux | Le staking (32 ETH) |
| Attester une page | L'attestation d'un bloc |
| Page scellée aux deux tiers | La finalité |
| Serment brûlé pour deux signatures contradictoires | Le slashing |
| La salle d'attente | Le mempool |
| Les places d'une page | La limite de gas d'un bloc |
| Prix de base brûlé, pourboire | Base fee (EIP-1559) et priority fee |
| Les miettes | Le gwei |
| Célestin juste avant Mira | Le front-running, le MEV |

## État actuel

- **Chapitre 1, « L'arrivée »** : le coffre en verre, les douze mots, la première transaction.
- **Chapitre 2, « L'inconnu très aimable »** : Tess paie 3 cristaux, puis Célestin tente trois ruses (l'urgence, le cadeau trop beau, la signature à l'aveugle). Si le joueur se fait avoir, le vol est public et irréversible ; avec des mots donnés, Nonce crée un nouveau coffre, avec une signature, on révoque l'autorisation.
- **Chapitre 3, « La machine à promesses »** : Mira et Oskar veulent échanger sans se faire confiance. Le joueur choisit les règles de la machine de Tess parmi six cartes (dont deux pièges), les teste dans un bac à sable sur quatre scénarios, puis la pose dans le registre. Une machine posée ne se modifie plus : en cas de faille, elle est exploitée et il faut en poser une nouvelle.
- **Chapitre 4, « Les gardiens du registre »** : le joueur garde à la place de Nonce. Il vérifie cinq pages proposées (soldes, signatures, doubles dépenses) et les atteste ou les refuse ; une page est scellée avec les deux tiers des gardiens. Célestin lui propose de signer deux versions contradictoires d'une même page : accepter brûle une partie du serment de Nonce.
- **Chapitre 5, « La place sur la page »** : le joueur propose une page de 10 places en choisissant parmi huit demandes (place prise, pourboire). Le prix de base est brûlé, le pourboire revient au proposeur. Célestin propose d'acheter les graines juste avant Mira pour les lui revendre (MEV). Puis le joueur envoie sa propre demande en pleine cohue et choisit son pourboire : payer pour passer tout de suite, ou attendre le calme.

## Stack

- HTML, CSS et JavaScript natifs, sans framework, sans dépendance et sans étape de build.
- Le décor et les personnages sont dessinés en code avec l'API Canvas 2D. Il n'y a aucune image dans le projet.
- Les dialogues, le HUD et les fenêtres sont en HTML et CSS, par-dessus le canvas.
- Le son est généré en direct avec la Web Audio API : une nappe en ré lydien, une boîte à musique aléatoire et des effets (pas, bulles, registre, vol…). Aucun fichier audio.
- Les polices viennent de Google Fonts (Gloock, Atkinson Hyperlegible, JetBrains Mono).

```
index.html      structure de la page et des overlays
src/style.css   palette (variables CSS), interface
src/audio.js    musique et effets sonores (Web Audio)
src/game.js     rendu du décor, personnages, déplacements, dialogues, histoire
```

## Sauvegarde

La progression est enregistrée dans le navigateur (`localStorage`, clé `atrium.save.v1`) à la fin de chaque chapitre. L'écran titre propose alors de continuer, ou de repartir de zéro avec une confirmation.

## Lancer en local

Ouvre `index.html` dans un navigateur. Pour un serveur local :

```bash
npx serve .
# ou
python3 -m http.server 8000
```

## Commandes

- Souris ou doigt : touche le sol pour marcher, touche quelqu'un pour lui parler.
- Clavier : flèches ou ZQSD pour marcher, Espace ou Entrée pour parler et avancer dans les dialogues.

## Tester

Ouvrir `index.html#debug` expose `window.atrium` dans la console : `state()`, `interact('nonce')`, `goto(x, y)`.

## Pistes

- Chapitre 6 : quand l'Atrium déborde, les petites salles d'à côté (layer 2, rollups).
- Un carnet pour recopier ses mots.
