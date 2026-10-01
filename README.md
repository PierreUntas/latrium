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
| Les piques de Mira | Un token fongible (ERC-20) |
| Mira peut en créer d'autres | Le mint, l'inflation d'un token |
| Le dessin unique d'Oskar | Un NFT (ERC-721) : numéro, créateur, historique |
| L'étagère où l'image est rangée | Le stockage des métadonnées (serveur, IPFS, on-chain) |
| « Oskar_officiel » | Une collection contrefaite, un faux contrat |
| Le trésor commun et la machine du vote | Une DAO : trésorerie et gouvernance on-chain |
| 1 pique = 1 voix | Le vote pondéré par les tokens (plutocratie) |
| Les piques empruntés le temps du vote | L'attaque par flash loan sur la gouvernance |
| Les inconnus masqués | L'attaque Sybil (faux comptes) |
| Soldes de la veille, quorum, délai | Snapshot, quorum, timelock |
| Le messager du dehors | Un oracle |
| Cinq messagers avec caution | Un oracle décentralisé avec staking (type Chainlink) |
| Le pont des trois gardiens | Un bridge multisig (2 signatures sur 3) |
| Le grand pont qui vérifie le registre d'en face | Un bridge à vérification native (light client) |
| Le cristal imprimé en face | Le token « wrappé » (lock and mint) |
| La petite salle de Tess | Un layer 2 (rollup optimiste) |
| La passerelle de la salle | Le bridge canonique du rollup (dépôt et retrait) |
| Le résumé inscrit dans le registre | Le batch publié sur le layer 1 |
| La fenêtre de contestation | La preuve de fraude et son délai (7 jours) |
| L'avance de Mira | Un bridge rapide, qui avance la liquidité |
| Les salles avec une preuve mathématique | Les rollups ZK |

## État actuel

- **Chapitre 1, « L'arrivée »** : le coffre en verre, les douze mots, la première transaction.
- **Chapitre 2, « L'inconnu très aimable »** : Tess paie 3 cristaux, puis Célestin tente trois ruses (l'urgence, le cadeau trop beau, la signature à l'aveugle). Si le joueur se fait avoir, le vol est public et irréversible ; avec des mots donnés, Nonce crée un nouveau coffre, avec une signature, on révoque l'autorisation.
- **Chapitre 3, « La machine à promesses »** : Mira et Oskar veulent échanger sans se faire confiance. Le joueur choisit les règles de la machine de Tess parmi six cartes (dont deux pièges), les teste dans un bac à sable sur quatre scénarios, puis la pose dans le registre. Une machine posée ne se modifie plus : en cas de faille, elle est exploitée et il faut en poser une nouvelle.
- **Chapitre 4, « Les gardiens du registre »** : le joueur garde à la place de Nonce. Il vérifie cinq pages proposées (soldes, signatures, doubles dépenses) et les atteste ou les refuse ; une page est scellée avec les deux tiers des gardiens. Célestin lui propose de signer deux versions contradictoires d'une même page : accepter brûle une partie du serment de Nonce.
- **Chapitre 5, « La place sur la page »** : le joueur propose une page de 10 places en choisissant parmi huit demandes (place prise, pourboire). Le prix de base est brûlé, le pourboire revient au proposeur. Célestin propose d'acheter les graines juste avant Mira pour les lui revendre (MEV). Puis le joueur envoie sa propre demande en pleine cohue et choisit son pourboire : payer pour passer tout de suite, ou attendre le calme.
- **Chapitre 6, « Les jetons de l'Atrium »** : le joueur écrit les règles des piques, les jetons du club de Mira (quantité, création de nouveaux jetons, liberté de les donner), puis Oskar grave un dessin unique. Le joueur choisit où ranger l'image, et aide Mira à reconnaître le vrai dessin parmi deux copies (même image, autre créateur, nom qui imite celui d'Oskar).
- **Chapitre 7, « Le grand vote »** : le trésor commun (50 cristaux) se décide au vote. Le joueur dépose une proposition, puis écrit les règles du vote face à celle de Célestin : 1 pique = 1 voix ou 1 habitant = 1 voix, et des protections (soldes de la veille, vérification des habitants, quorum, délai de deux jours). Une répétition montre ses trois ruses : piques empruntés, faux votants, vote en pleine nuit.
- **Chapitre 8, « Le messager du dehors »** : Mira et Oskar parient sur la pluie, mais la machine de Tess ne voit que le registre. Le joueur choisit qui lui apportera la météo (Tess, Célestin, ou cinq messagers à la majorité, avec ou sans caution) et le teste sur quatre situations. Puis il envoie un cristal vers l'Atrium d'en face par un pont rapide à trois gardiens ou par le grand pont qui vérifie le registre d'en face ; Célestin vole deux clés et vide le pont rapide.
- **Chapitre 9, « Les petites salles d'à côté »** : Tess ouvre une petite salle. Le joueur y dépose un cristal par la passerelle, enchaîne les échanges pour presque rien, et Tess n'inscrit qu'un résumé dans le registre. Célestin publie un faux résumé : le joueur a une fenêtre de contestation pour le démasquer (sinon Oskar s'en charge). Pour ressortir, il attend la fin de la fenêtre ou paie Mira pour une avance.
- **Chapitre 10, « Le premier bloc »** (épilogue) : Nonce montre son vieux coffre et la page 0 du registre (« Personne ne possède l'Atrium. Tout le monde le fait tourner. Accueillez le suivant. »). Une nouvelle arrivante, Lou, entre dans l'Atrium : le joueur devient le guide, lui crée son coffre, lui offre une graine de son palmier et répond à ses questions. L'écran de fin récapitule la partie et renvoie vers ethereum.org pour créer un vrai wallet.

## Le carnet

Le bouton « Coffre » (ou les touches I / C) ouvre le carnet du joueur, en quatre onglets :

- **Coffre** : les objets possédés, avec leur icône, la serrure et qui peut voir ou ouvrir le coffre.
- **Parcours** : les 10 chapitres, ce que le joueur y a fait (d'après ses choix), et 10 hauts faits à débloquer.
- **Lexique** : les mots de l'Atrium et leur nom dans le vrai Ethereum, débloqués chapitre par chapitre.
- **Registre** : toutes les pages inscrites au nom du joueur.

## Stack

- HTML, CSS et JavaScript natifs, sans framework, sans dépendance et sans étape de build.
- Le décor et les personnages sont dessinés en code avec l'API Canvas 2D. Il n'y a aucune image dans le projet.
- Les dialogues, le HUD et les fenêtres sont en HTML et CSS, par-dessus le canvas.
- Le son est généré en direct avec la Web Audio API : une nappe en ré lydien, une boîte à musique aléatoire et des effets (pas, bulles, registre, vol…). Aucun fichier audio.
- Les polices viennent de Google Fonts (Gloock, Atkinson Hyperlegible, JetBrains Mono).

```
index.html      structure de la page et des overlays
src/style.css   palette (variables CSS), interface
src/i18n.js     choix de la langue, traduction (T, TD), textes fixes de la page
src/i18n-en.js  dictionnaire anglais, indexé par le texte français
src/audio.js    musique et effets sonores (Web Audio)
src/game.js     rendu du décor, personnages, déplacements, dialogues, histoire
```

## Langues

Le jeu existe en français et en anglais. La langue se choisit dans cet ordre :

1. le paramètre d'URL `?lang=fr` ou `?lang=en` (ex. https://latrium.vercel.app/?lang=en) ;
2. le dernier choix, gardé dans `localStorage` (`atrium.lang`) ;
3. la langue du navigateur : français si elle commence par `fr`, anglais sinon.

Un bouton « English / Français » sur l'écran titre change de langue et recharge la page. La sauvegarde est commune aux deux langues.

Le texte français reste la source : dans `game.js`, chaque texte affiché passe par `T('…')` ou ``T`… ${x}` ``, et sert de clé dans `src/i18n-en.js` (les valeurs deviennent `{0}`, `{1}`…). Un texte absent du dictionnaire s'affiche en français. Les entrées du registre et le contenu du coffre restent en français dans la sauvegarde et sont traduits à l'affichage par `TD()`.

Pour modifier un texte : changer la phrase française dans `game.js`, puis la clé correspondante dans `i18n-en.js`.

## Sauvegarde

La progression est enregistrée dans le navigateur (`localStorage`, clé `atrium.save.v1`) à la fin de chaque chapitre. L'écran titre propose alors de continuer, ou de repartir de zéro avec une confirmation.

## Statistiques

Le site utilise Vercel Web Analytics (visites, pays, appareils), sans cookie. Le jeu envoie aussi quelques événements de progression :

| Événement | Données |
| --- | --- |
| `Partie lancée` | `reprise` (true/false), `chapitre` commencé, `langue` (fr/en) |
| `Nouvelle partie` | aucune |
| `Chapitre terminé` | `chapitre` (1 à 5), `score` : ruses déjouées (ch. 2), machines posées (ch. 3), bonnes décisions ou -1 si slashing (ch. 4), pourboires ou -1 si MEV (ch. 5) |

Les événements personnalisés ne s'affichent que sur les offres Pro et Enterprise de Vercel ; sur l'offre gratuite, seules les visites sont comptées. Rien n'est envoyé en local ni avec `#debug`.

## Partage

`index.html` contient les balises Open Graph et Twitter : un lien vers le jeu s'affiche avec l'image `og.jpg`, un titre et une description dans WhatsApp, iMessage, Discord, LinkedIn, etc. Les icônes (`icon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) et `site.webmanifest` permettent d'ajouter le jeu à l'écran d'accueil d'un téléphone.

L'image et les icônes se régénèrent à partir du jeu avec `tools/make-og.js`.

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

- Tester le jeu avec de vrais débutants et ajuster.

- Un carnet pour recopier ses mots.

## L'Atrium · histoire vraie (`/histoire/`)

Une deuxième version du jeu, dans la vraie histoire d'Ethereum : chaque chapitre est une vraie époque, vécue par des personnages inventés. Les dates, numéros de bloc, empreintes et chiffres sont réels et vérifiés (ethereum.org/fr/history, etherscan).

- **Chapitre 1 · Frontier (30 juillet – 7 août 2015)** : un hackerspace à Paris le soir du lancement. Fabriquer le bloc zéro à partir de l'empreinte du bloc 1 028 201 du réseau de test, créer son compte et choisir où garder sa clé, voir le premier bloc, découvrir le plafond de gaz de 5 000, puis attendre la première transaction (bloc 46 147, plafond 21 003).
- **Chapitre 2 · The DAO (mai – juillet 2016)** : Lena y croit, Karim relit le code. Repérer la faille de réentrance, choisir d'y mettre son ether ou non, voir The DAO se faire vider (17 juin, plus de 3,6 millions d'ETH), écouter les deux camps, puis choisir la chaîne de son nœud au bloc 1 920 000 (`--support-dao-fork` ou `--oppose-dao-fork`) : Ethereum ou Ethereum Classic.
- **Chapitre 3 · 2017, la ruée** : le vol des multisigs Parity (19 juillet, 153 037 ETH), un white paper d'ICO inventé dont il faut repérer les signaux d'alerte, Byzantium (5 → 3 ETH), la caisse du hackerspace gelée avec 513 774 ETH (6 novembre), puis l'enchère du gaz en pleine folie CryptoKitties.
- **Chapitre 4 · 2020, l'été de la DeFi** : sauver le coffre Maker de Lena pendant le Jeudi noir (197 $ → 89 $, liquidations à 0 DAI), COMP et la culture de rendement, le jeton inventé PATATE, les 400 UNI, le contrat de dépôt et la Beacon Chain.
- **Chapitre 5 · 2021, London** : un NFT inventé la veille, puis l'EIP-1559 au bloc 12 965 000 : frais de base brûlés et pourboire.
- **Chapitre 6 · 2022, la Fusion** : la difficulté totale atteint 58 750 000 000 000 000 000 000, la machine de Karim s'arrête au bloc 15 537 394, puis Shapella.
- **Chapitre 7 · 2024 – 2025, dix ans** : expliquer les L2 et les blobs de Dencun à Inès, une nouvelle venue, rendre son compte de 2015 intelligent avec l'EIP-7702 (Pectra), et fêter les dix ans le 30 juillet 2025. La carte de fin récapitule tout le parcours.

**Version anglaise** : même choix de langue que L'Atrium (`?lang=en`, bouton sur l'écran titre, ou langue du navigateur). Le code anglais `histoire/histoire.en.js` est généré à partir du français : les traductions sont dans `histoire/i18n/en.json`. Après avoir modifié un texte du jeu, lance `python3 tools/histoire-en.py --check` pour voir ce qui manque, complète `en.json`, puis `python3 tools/histoire-en.py` pour régénérer.

Fichiers : `histoire/index.html`, `histoire/histoire.js`, `histoire/histoire.css` (réutilise `src/style.css` et `src/audio.js`). Sauvegarde locale : `atrium.histoire.v1`. Test : ouvrir `histoire/index.html#debug` (expose `window.histoire`).

## Organisation du site

- `/` : le portfolio de Pierre Untas, à visiter dans le hall de L'Atrium (`index.html`, page autonome qui reprend le moteur de dessin et la musique du jeu). Pierre se présente dès l'entrée, et chaque vitrine présente un projet (Mona Editions, Secib & Claude, Mines d'Éther, Decentralized Cloud Storage, L'Atrium).
- `/en/` : la version anglaise du portfolio (`en/index.html`), générée par `python3 tools/portfolio-en.py` à partir de `index.html`. Après chaque modification du portfolio, relancer ce script. La page `/` envoie vers `/en/` les navigateurs non francophones, sauf si le visiteur a choisi le français (`?lang=fr`, choix mémorisé avec celui du jeu).
- Images de partage du portfolio : `og-portfolio.jpg` et `og-portfolio-en.jpg`, générées par `node tools/make-og-portfolio.js`.
- `/game/` : le jeu L'Atrium (`game/index.html`, qui charge `src/`).
- `/histoire/` : L'Atrium · histoire vraie.
- `/portfolio/` redirige vers `/` (`vercel.json`).
