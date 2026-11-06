# Instagram Follow-back Checker

Cet outil te montre **les comptes Instagram que tu suis mais qui ne te suivent pas en retour**.

- Tu n'as pas besoin de donner ton mot de passe.
- Tes données ne sont envoyées à aucun site ni service tiers.
- C'est gratuit et open source.

Il existe deux façons de l'utiliser :

1. **L'extension** (recommandée) : tu tapes ton pseudo et la liste s'affiche.
2. **La page « export officiel »** : plus longue, mais sans aucun risque pour ton compte. Voir plus bas.

---

## Méthode 1 : l'extension

Elle fonctionne avec **Google Chrome**, **Microsoft Edge** et **Brave**, sur ordinateur (pas sur téléphone).

### Étape 1 : télécharger l'extension

1. Clique sur ce lien : **[Télécharger l'extension](https://github.com/Rayane2L/instagram-followback-checker/releases/latest/download/follow-back-checker-extension.zip)**. Le fichier `follow-back-checker-extension.zip` se télécharge.
2. Ouvre le dossier **Téléchargements** de ton ordinateur.
3. Fais un clic droit sur `follow-back-checker-extension.zip`, puis **Extraire tout...** et **Extraire**.

Tu obtiens un dossier `follow-back-checker-extension`. Garde-le, par exemple dans tes Documents : si tu le supprimes, l'extension ne marchera plus.

Le lien ne marche pas ? Va dans la section **Releases** à droite de cette page, ouvre la dernière version et clique sur `follow-back-checker-extension.zip`.

### Étape 2 : installer l'extension

1. Ouvre Chrome (ou Edge).
2. Dans la barre d'adresse, tape `chrome://extensions` (dans Edge : `edge://extensions`), puis appuie sur Entrée.
3. Active l'interrupteur **Mode développeur**.
   - Dans Chrome, il est en haut à droite.
   - Dans Edge, il est dans le menu de gauche.
4. Clique sur le bouton **Charger l'extension non empaquetée**.
5. Sélectionne le dossier `follow-back-checker-extension` (celui qui contient le fichier `manifest.json`), puis clique sur **Sélectionner un dossier**.

L'extension « Follow-back Checker » apparaît dans la liste. C'est installé.

Pour la retrouver facilement, clique sur l'icône en forme de pièce de puzzle à droite de la barre d'adresse, puis sur la punaise à côté de « Follow-back Checker ».

### Étape 3 : l'utiliser

1. Va sur [instagram.com](https://www.instagram.com) et connecte-toi à ton compte, si ce n'est pas déjà fait.
2. Clique sur l'icône de l'extension (un carré rose avec une coche blanche). Une page s'ouvre.
3. Tape ton pseudo Instagram, puis clique sur **Analyser**.
4. Attends la fin du chargement. Compte environ 1 minute pour 1 000 comptes.

Le résultat contient trois listes :

- **Ne suivent pas en retour** : tu les suis, eux ne te suivent pas.
- **Pas suivis en retour** : ils te suivent, toi non.
- **Mutuels** : vous vous suivez tous les deux.

Tu peux cliquer sur un pseudo pour ouvrir son profil, copier la liste ou l'exporter dans Excel (bouton **Exporter CSV**).

### À savoir

- **Ce n'est pas autorisé par Instagram.** L'extension lit les listes comme le site Instagram le fait quand tu les fais défiler, mais les conditions d'utilisation d'Instagram l'interdisent. Pour limiter les risques, elle avance lentement. **Ne l'utilise pas plusieurs fois d'affilée** : Instagram pourrait bloquer temporairement certaines actions sur ton compte.
- **Tes données restent privées.** L'extension ne peut communiquer qu'avec instagram.com. Elle n'a pas de serveur, ne collecte rien et ne lit jamais ton mot de passe.
- Au démarrage de Chrome, un message peut te proposer de désactiver les extensions en mode développeur. Choisis de les garder.
- Si Instagram modifie son site, l'extension peut arrêter de fonctionner. La méthode 2 continuera de marcher.

### En cas de problème

| Message | Que faire |
|---|---|
| « Tu n'es pas connecté·e à Instagram » | Ouvre instagram.com dans le même navigateur et connecte-toi. |
| « Ce compte est privé » | Tu ne peux analyser un compte privé que si c'est le tien ou si tu le suis. |
| « Instagram limite temporairement les requêtes » | Attends au moins une heure avant de réessayer. |
| « Ce compte Instagram est introuvable » | Vérifie l'orthographe du pseudo. |

### Mettre à jour l'extension

1. Télécharge et extrais le nouveau ZIP (étape 1).
2. Remplace le contenu de ton ancien dossier `follow-back-checker-extension` par celui du nouveau.
3. Dans `chrome://extensions`, clique sur la flèche circulaire de « Follow-back Checker ».

---

## Méthode 2 : la page « export officiel » (sans risque)

Avec cette méthode, Instagram te fournit lui-même tes données. C'est autorisé, mais plus long.

### Étape 1 : demander tes données à Instagram

1. Dans Instagram, ouvre **Paramètres**, puis **Espace comptes**, puis **Vos informations et autorisations**, puis **Télécharger vos informations**.
2. Choisis **Télécharger ou transférer des informations**, sélectionne ton compte, puis **Certaines de vos informations**.
3. Coche uniquement **Followers et suivis**.
4. Choisis **Télécharger sur l'appareil**, période **Depuis le début**, format **JSON** (et pas HTML).
5. Valide. Instagram t'envoie un e-mail quand le fichier est prêt, en général en quelques minutes, parfois en quelques heures.
6. Télécharge le fichier ZIP indiqué dans l'e-mail.

### Étape 2 : voir le résultat

1. Clique sur ce lien : **[Télécharger la page d'analyse](https://github.com/Rayane2L/instagram-followback-checker/releases/latest/download/follow-back-checker-export.html)**.
2. Ouvre le fichier `follow-back-checker-export.html` téléchargé (double-clic). Il s'ouvre dans ton navigateur.
3. Fais glisser le ZIP d'Instagram dans le cadre de la page.

La page fonctionne sans Internet et n'envoie rien.

---

## Pour les développeurs

```
extension/        Extension Chrome/Edge (Manifest V3)
  manifest.json     autorisations : scripting et instagram.com uniquement
  background.js     ouvre app.html au clic sur l'icône
  app.html/css/js   interface, requêtes exécutées dans un onglet instagram.com
  lib.js            logique : profil, pagination, comparaison, erreurs
index.html        page « export officiel » (logique dans <script id="checker">)
example/          faux export Instagram pour tester la page
tests/            tests unitaires (Node.js 20 ou plus, sans dépendance)
```

Lancer les tests :

```bash
node --test tests/checker.test.js tests/extension.test.js
```

**Extension.** `lib.js` ne dépend pas du navigateur : il reçoit une fonction `igFetch(url)`. `app.js` l'implémente avec `chrome.scripting.executeScript` dans un onglet instagram.com, ce qui réutilise la session existante. Si aucun onglet Instagram n'est ouvert, l'extension en ouvre un en arrière-plan puis le referme. Points d'accès utilisés :

- `GET /{pseudo}/` (page de profil publique) : identifiant (`"profile_id"`) et compteurs approximatifs (balise `og:description`). L'ancien point d'accès `/api/v1/users/web_profile_info/` renvoie 404 depuis novembre 2026.
- `GET /api/v1/friendships/{id}/following/?count=50&max_id=...`
- `GET /api/v1/friendships/{id}/followers/?count=50&max_id=...`

Il y a une pause aléatoire de 0,9 à 1,9 s entre les pages. L'analyse s'arrête dès qu'Instagram limite les requêtes (HTTP 429), demande une connexion ou refuse l'accès à un compte privé, et n'affiche alors aucun résultat partiel.

**Page export.** Le ZIP est lu par morceaux avec un petit lecteur ZIP intégré (ZIP64 compris). Seuls les fichiers followers et following sont décompressés, avec `DecompressionStream`. La page interdit toute connexion réseau (`Content-Security-Policy: connect-src 'none'`).

**Nouvelle version.** Augmente `version` dans `extension/manifest.json`, puis crée une release avec les deux fichiers, sous ces noms exacts (les liens du README pointent vers `releases/latest/download/...`) :

```bash
git archive -o follow-back-checker-extension.zip HEAD:extension
cp index.html follow-back-checker-export.html
gh release create v1.0.1 follow-back-checker-extension.zip follow-back-checker-export.html --title "v1.0.1"
```

**Publication.** Une fois le dépôt public, GitHub Pages (Settings, Pages, branche `main`) peut héberger `index.html`. Pour éviter le mode développeur, l'extension peut être publiée sur le Chrome Web Store, mais elle risque d'y être refusée parce qu'elle utilise l'API interne d'Instagram.

## Licence

[MIT](LICENSE). Projet non affilié à Instagram ni à Meta.
