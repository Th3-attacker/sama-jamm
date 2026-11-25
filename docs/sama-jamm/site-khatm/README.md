# Page du site pour les invitations au khatm

L'app partage `https://sama-jamm-site.vercel.app/khatm/CODE`. Fichiers à copier à la racine du site (Vercel) :

| Fichier | Rôle |
| --- | --- |
| `khatm.html` | Page du lien : code, bouton « Ouvrir dans l'app », « Copier le code », lien App Store. Le lien Google Play est en commentaire. |
| `vercel.json` | Envoie `/khatm/<code>` vers `khatm.html` et sert le fichier Apple en `application/json`. |
| `.well-known/apple-app-site-association` | Sans extension. Fait ouvrir l'app iPhone depuis le lien. |
| `.well-known/assetlinks.json.apres-publication` | Android, à renommer en `assetlinks.json` après la publication sur Google Play. |

## À remplir avant de copier

- `apple-app-site-association` : Team ID `US4UK93AT3` déjà en place. Le numéro `6834012757` est l'identifiant App Store de l'app et sert au lien « Télécharger ».
- Android, plus tard : dans `assetlinks.json`, mettre l'empreinte SHA-256 de Play Console (Intégrité de l'application › Signature d'application), et ouvrir le lien Google Play dans `khatm.html`.

Sans l'association (Team ID), le lien s'ouvre dans le navigateur ; la page propose alors « Ouvrir dans l'app ».
