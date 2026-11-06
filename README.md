# Instagram Follow-back Checker

Découvre **qui tu suis sur Instagram sans qu'il ou elle te suive en retour**, sans mot de passe à donner et sans envoyer tes données à un service tiers.

Deux méthodes au choix :

| | 🧩 Extension navigateur | 📦 Page « export officiel » |
|---|---|---|
| Utilisation | Tu tapes un pseudo, c'est tout | Tu demandes ton export à Instagram, puis tu le déposes dans la page |
| Rapidité | Résultat en quelques secondes / minutes | Attente de l'export (minutes à heures) |
| Installation | Extension Chrome / Edge | Aucune (un fichier HTML) |
| Respect des CGU Instagram | ❌ Non (API interne du site) | ✅ Oui |
| Risque pour le compte | Faible mais réel (limitation temporaire) | Aucun |
| Analyser un autre compte | ✅ (public, ou privé que tu suis) | ❌ Seulement le tien |

## ✨ Fonctionnalités (les deux méthodes)

- Comptes qui **ne te suivent pas en retour**
- Comptes qui te suivent mais **que tu ne suis pas**
- **Abonnements mutuels**
- Recherche, lien direct vers chaque profil
- Copie de la liste ou export **CSV** (ouvrable dans Excel)
- Thème clair / sombre automatique

Extension uniquement : nom affiché, badge « certifié » et option pour **masquer les comptes certifiés** (célébrités, marques…).

---

## 🧩 Méthode 1 : l'extension (automatique)

### Installation (Chrome, Edge, Brave…)

1. Télécharge ce projet : bouton vert **Code** → **Download ZIP**, puis décompresse-le.
2. Ouvre `chrome://extensions` (ou `edge://extensions`).
3. Active le **Mode développeur** (interrupteur en haut à droite ; en bas à gauche dans Edge).
4. Clique sur **Charger l'extension non empaquetée** et choisis le dossier **`extension`** du projet.
5. Épingle l'extension (icône puzzle 🧩 → punaise) pour l'avoir sous la main.

### Utilisation

1. Connecte-toi à [instagram.com](https://www.instagram.com) dans ce navigateur (une seule fois).
2. Clique sur l'icône de l'extension : une page s'ouvre.
3. Tape ton pseudo (ou colle le lien de ton profil) puis **Analyser**.
4. Patiente pendant le chargement des listes : environ 1 à 2 secondes par tranche de 50 comptes (≈ 1 min pour 1 000 abonnés + abonnements).

### Comment ça marche, et pourquoi c'est privé

- L'extension n'a **qu'une seule autorisation de site : `instagram.com`**. Elle ne peut rien envoyer ailleurs : pas de serveur, pas de statistiques, pas de pub.
- Les requêtes sont exécutées **dans un onglet instagram.com**, avec ta session déjà ouverte, exactement comme quand tu fais défiler ta liste d'abonnés. Si aucun onglet Instagram n'est ouvert, l'extension en ouvre un en arrière-plan puis le referme.
- **Ton mot de passe n'est jamais demandé ni lu.**
- Le code tient en quelques centaines de lignes, sans bibliothèque externe : n'importe qui peut le relire dans le dossier [`extension/`](extension/).

### ⚠️ Limites et précautions

- Cette méthode utilise l'API interne du site web d'Instagram : **ce n'est pas autorisé par ses conditions d'utilisation**. Elle fait des pauses aléatoires entre les pages pour rester discrète, mais **évite de l'enchaîner** plusieurs fois de suite, et évite les comptes énormes (des dizaines de milliers d'abonnés).
- Si Instagram répond « patiente quelques minutes », arrête et réessaie plus tard (voire le lendemain).
- Instagram peut changer son site à tout moment ; l'extension peut alors cesser de fonctionner jusqu'à une mise à jour. La méthode 2 continuera de marcher.

---

## 📦 Méthode 2 : la page « export officiel » (zéro risque)

Le fichier [`index.html`](index.html) lit l'**export officiel de tes données Instagram**, entièrement dans ton navigateur. La page bloque même toute connexion réseau (`Content-Security-Policy: connect-src 'none'`).

### 1. Demander l'export à Instagram

1. **Paramètres** → **Espace comptes** → **Vos informations et autorisations** → **Télécharger vos informations**.
2. **Télécharger ou transférer des informations** → ton compte Instagram → **Certaines de vos informations**.
3. Coche uniquement **Followers et suivis** (section *Connexions*).
4. **Télécharger sur l'appareil**, période **Depuis le début**, format **JSON** ⚠️ (pas HTML).
5. Instagram t'envoie un e-mail quand c'est prêt. Télécharge le **ZIP**.

### 2. Analyser

1. Télécharge [`index.html`](index.html) (bouton *Download raw file*) et ouvre-le dans ton navigateur.
2. Glisse-dépose le ZIP dans la zone prévue.

> Tu peux aussi décompresser le ZIP et sélectionner `followers_1.json` (+ `followers_2.json`… s'il y en a) **et** `following.json`, dans `connections/followers_and_following/`.

---

## ❓ Questions fréquentes

**« Tu n'es pas connecté·e à Instagram »** (extension) : ouvre instagram.com dans le même navigateur et connecte-toi.

**« Ce compte est privé »** (extension) : on ne peut analyser un compte privé que si tu le suis (ou si c'est le tien).

**« Ton export est au format HTML »** (page) : refais la demande d'export en choisissant **JSON**.

**Un compte apparaît alors qu'il me suit** : comptes désactivés temporairement, ou (méthode 2) abonnement fait après la date de l'export.

## 🛠️ Pour les développeurs

```
.
├── extension/          # Extension Chrome/Edge (Manifest V3)
│   ├── manifest.json   #   autorisations : scripting + instagram.com uniquement
│   ├── background.js   #   ouvre app.html au clic sur l'icône
│   ├── app.html/.css/.js   interface + exécution des requêtes dans l'onglet Instagram
│   ├── lib.js          #   logique pure : profil, pagination, comparaison, erreurs
│   └── icons/
├── index.html          # Page « export officiel » (interface + logique dans <script id="checker">)
├── example/            # Faux export Instagram pour tester la page
├── tests/              # Tests unitaires (Node.js ≥ 20, sans dépendance)
├── LICENSE
└── README.md
```

Lancer les tests :

```bash
node --test tests/checker.test.js tests/extension.test.js
```

### Détails techniques

**Extension.** `lib.js` est indépendant du navigateur : il reçoit une fonction `igFetch(url)`. Dans l'extension, `app.js` l'implémente avec `chrome.scripting.executeScript` dans un onglet `instagram.com` (même origine, cookies de session inclus). Points d'accès utilisés :
- `GET /api/v1/users/web_profile_info/?username=…` → identifiant et compteurs
- `GET /api/v1/friendships/{id}/following/?count=50&max_id=…`
- `GET /api/v1/friendships/{id}/followers/?count=50&max_id=…`

Pause aléatoire de 0,9 à 1,9 s entre les pages, arrêt immédiat en cas de limitation (HTTP 429), de déconnexion ou de compte privé. Les tests utilisent un faux Instagram ([`tests/extension.test.js`](tests/extension.test.js)).

**Page export.** Le ZIP est lu par morceaux (`Blob.slice`) avec un petit lecteur ZIP maison (ZIP64 compris) : seuls les fichiers followers/following sont décompressés (`DecompressionStream`). Les différents formats d'export Instagram sont gérés (`string_list_data[].value`, `title` ou `href`).

### Publier

- **Page export** : une fois le dépôt public, GitHub Pages (*Settings → Pages → Deploy from branch → main / root*) donne un lien direct à partager.
- **Extension** : pour éviter le mode développeur, elle peut être publiée sur le Chrome Web Store (compte développeur, 5 $ une fois). Une extension qui utilise l'API interne d'Instagram risque toutefois d'être refusée.

## 📄 Licence

[MIT](LICENSE). Projet non affilié à Instagram ni à Meta.
