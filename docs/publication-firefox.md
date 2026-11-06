# Publier l'extension sur Firefox (ordinateur et Android)

Sur Android, Firefox n'installe que les extensions publiées sur addons.mozilla.org (AMO). La publication est gratuite. Mozilla vérifie chaque extension avant de la mettre en ligne : compte de quelques heures à quelques jours.

Le même fichier `follow-back-checker-extension.zip` sert pour Chrome et pour Firefox.

## 1. Créer le compte développeur

1. Va sur https://addons.mozilla.org/developers/ et clique sur **Se connecter** (ou **Register**).
2. Crée un compte Mozilla, ou connecte-toi avec un compte existant.
3. Accepte le contrat de distribution des développeurs quand il s'affiche.

## 2. Envoyer l'extension

1. Télécharge `follow-back-checker-extension.zip` depuis la dernière release du dépôt GitHub.
2. Sur https://addons.mozilla.org/developers/, clique sur **Soumettre un nouveau module** (Submit a New Add-on).
3. Choisis **Sur ce site** (On this site). C'est ce qui permet l'installation sur Android.
4. Envoie le fichier ZIP. Mozilla lance une vérification automatique. Des avertissements peuvent apparaître, par exemple sur la clé `service_worker` ignorée par Firefox : ils ne bloquent pas l'envoi. Seules les **erreurs** bloquent.
5. Coche les plateformes **Firefox** et **Firefox pour Android**.
6. À la question sur le code source, réponds **Non** : le code n'est ni minifié ni généré.

## 3. Remplir la fiche

Copie-colle les textes ci-dessous.

**Nom**

```
Follow-back Checker
```

**Adresse de la fiche (slug)**

```
follow-back-checker
```

Le README renvoie vers `https://addons.mozilla.org/fr/firefox/addon/follow-back-checker/`. Si ce nom est déjà pris, choisis-en un autre et préviens-moi pour corriger le lien du README.

**Résumé** (250 caractères maximum)

```
Liste les comptes Instagram que tu suis et qui ne te suivent pas en retour. Aucun mot de passe demandé, aucune donnée envoyée ailleurs qu'à Instagram.
```

**Description**

```
Follow-back Checker affiche, à partir d'un pseudo Instagram :
- les comptes que tu suis et qui ne te suivent pas en retour ;
- les comptes qui te suivent et que tu ne suis pas ;
- les abonnements mutuels.

Tu peux filtrer la liste, masquer les comptes certifiés, ouvrir chaque profil, copier la liste ou l'exporter en CSV.

Fonctionnement : l'extension lit les listes depuis instagram.com avec la session déjà ouverte dans ton navigateur, comme le site le fait quand tu fais défiler ta liste d'abonnés. Elle fait une pause entre chaque page pour rester discrète.

Confidentialité : l'extension ne demande jamais ton mot de passe, n'a pas de serveur et ne collecte aucune donnée. Sa seule autorisation de site est instagram.com.

Attention : la lecture automatique des listes n'est pas autorisée par les conditions d'utilisation d'Instagram. Utilise l'extension avec modération pour éviter une limitation temporaire de ton compte.

Projet open source (licence MIT), non affilié à Instagram ni à Meta.
```

**Catégories** : « Réseaux sociaux et communication » (Social & Communication) pour Firefox et pour Android.

**Licence** : MIT.

**Site web / support** : l'adresse du dépôt GitHub (une fois public), ou ton adresse e-mail.

**Politique de confidentialité** : pas nécessaire, l'extension ne collecte aucune donnée (`data_collection_permissions: none` dans le manifest).

**Notes pour les vérificateurs** (champ « Notes to Reviewer »)

```
The extension only talks to www.instagram.com. It opens (or reuses) an instagram.com tab and runs fetch() there via scripting.executeScript, using the user's existing session, to read GET /{username}/ (profile id), /api/v1/friendships/{id}/following/ and /api/v1/friendships/{id}/followers/. No data leaves the browser, no remote code, no analytics. To test: log in to instagram.com, click the toolbar button, enter a username, click "Analyser".
```

## 4. Après l'envoi

- Mozilla t'envoie un e-mail quand l'extension est acceptée ou refusée.
- En cas de refus, transmets-moi le message : on corrige et on renvoie.
- Pour une nouvelle version, augmente `version` dans `extension/manifest.json`, reconstruis le ZIP, puis sur la page de l'extension dans AMO clique sur **Envoyer une nouvelle version** (Upload New Version).
