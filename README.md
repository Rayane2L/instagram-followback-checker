# Instagram Follow-back Checker

Découvre **qui tu suis sur Instagram sans qu'il ou elle te suive en retour** — sans mot de passe, sans installation, sans envoyer tes données nulle part.

L'outil est une simple page web (`index.html`) qui lit l'**export officiel de tes données Instagram** directement dans ton navigateur.

## ✨ Fonctionnalités

- Liste des comptes qui **ne te suivent pas en retour**
- Liste des comptes qui te suivent mais **que tu ne suis pas**
- Liste des **abonnements mutuels**
- Recherche, lien direct vers chaque profil, date de l'abonnement
- Copie de la liste ou export en **CSV** (ouvrable dans Excel)
- Clair / sombre automatique, fonctionne sur ordinateur et mobile

## 🔒 Confidentialité et sécurité

- **Aucun identifiant demandé.** L'outil ne se connecte jamais à Instagram.
- **Aucune donnée envoyée.** Tout est calculé localement dans ton navigateur. La page bloque même toute connexion réseau (en-tête `Content-Security-Policy` avec `connect-src 'none'`).
- **Respect des CGU d'Instagram.** On utilise uniquement la fonction officielle « Télécharger vos informations » : pas de scraping, pas d'automatisation, aucun risque de blocage du compte.
- **Aucune dépendance externe.** Un seul fichier HTML lisible, sans bibliothèque tierce ni CDN.

## 🚀 Utilisation

### 1. Demander l'export à Instagram

1. Dans l'application ou sur instagram.com : **Paramètres** → **Espace comptes** → **Vos informations et autorisations** → **Télécharger vos informations**.
2. **Télécharger ou transférer des informations** → choisis ton compte Instagram → **Certaines de vos informations**.
3. Coche uniquement **Followers et suivis** (section *Connexions*).
4. **Télécharger sur l'appareil**, période **Depuis le début**, format **JSON** ⚠️ (pas HTML).
5. Valide. Instagram t'envoie un e-mail quand le fichier est prêt (de quelques minutes à quelques heures). Télécharge le **ZIP**.

### 2. Analyser

1. Télécharge le fichier [`index.html`](index.html) de ce dépôt (bouton *Download raw file*) et ouvre-le dans ton navigateur (Chrome, Edge, Firefox, Safari récents).
2. Glisse-dépose le ZIP dans la zone prévue (ou clique pour le choisir).
3. Les résultats s'affichent immédiatement.

> Tu peux aussi décompresser le ZIP et sélectionner directement `followers_1.json` (et `followers_2.json`… s'il y en a) **et** `following.json`, situés dans `connections/followers_and_following/`.

## ❓ Questions fréquentes

**« Ton export est au format HTML »** — Refais la demande d'export en choisissant **JSON**.

**« Aucun fichier followers/following trouvé »** — Lors de l'export, la catégorie *Followers et suivis* n'était pas cochée.

**Un compte apparaît alors qu'il me suit** — L'export est une photo à l'instant T : s'il t'a suivi après la demande d'export, il n'y figure pas. Les comptes désactivés ou supprimés peuvent aussi apparaître.

**Les résultats sont-ils fiables ?** — Ils reflètent exactement les données fournies par Instagram dans l'export.

## 🛠️ Pour les développeurs

```
.
├── index.html          # L'outil complet (interface + logique dans <script id="checker">)
├── example/            # Faux export Instagram pour tester
├── tests/              # Tests unitaires (Node.js ≥ 20, sans dépendance)
├── LICENSE
└── README.md
```

Lancer les tests :

```bash
node --test tests/checker.test.js
```

Pour essayer l'interface sans vrai export : sélectionne les deux fichiers de `example/connections/followers_and_following/`.

### Fonctionnement

1. Le ZIP est lu par morceaux (`Blob.slice`) avec un petit lecteur ZIP maison (ZIP64 compris) : seuls `followers_*.json` et `following.json` sont extraits et décompressés via l'API native `DecompressionStream`. Les gros exports (avec photos) ne sont donc pas chargés en mémoire.
2. Les pseudos sont extraits en gérant les différents formats d'export Instagram (`string_list_data[].value`, `title` ou URL `href`).
3. Comparaison par ensembles : *abonnements* − *abonnés* = ceux qui ne te suivent pas en retour.

### Publier l'outil

Une fois le dépôt public, l'outil peut être mis en ligne gratuitement via **GitHub Pages** (*Settings → Pages → Deploy from branch → main / root*) : tes proches n'auront plus qu'à ouvrir un lien.

## 📄 Licence

[MIT](LICENSE). Projet non affilié à Instagram ni à Meta.
