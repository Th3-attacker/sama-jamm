# Publication sur les stores

Prévoir au moins trois semaines entre l'ouverture des comptes et la première mise en ligne, surtout à cause du test fermé obligatoire de 14 jours sur Google Play pour un compte personnel.

## Exigences

| Exigence | App Store (Apple) | Google Play |
| --- | --- | --- |
| Compte développeur | 99 USD par an | 25 USD, une seule fois |
| Version de build | Xcode 26 et SDK iOS 26 minimum depuis le 28 avril 2026 (Apple relève ce seuil chaque printemps) ; les builds EAS de SDK 58 le couvrent | Cible Android 16 (API 36) obligatoire depuis le 31 août 2026 |
| Test avant lancement | TestFlight, conseillé | Compte personnel créé après le 13 novembre 2023 : 12 testeurs en test fermé pendant 14 jours consécutifs |
| Comptes utilisateurs | Suppression du compte et de ses données depuis l'app | Option de suppression dans l'app et lien web déclaré dans la fiche |
| Confidentialité | Étiquettes App Privacy et manifeste de confidentialité (`PrivacyInfo.xcprivacy`, généré par Expo) | Formulaire Sécurité des données |
| Visuels | Icône 1024, captures 1320 × 2868 | Icône 512, bannière 1024 × 500, captures 1080 × 1920 |

Si les comptes sont ouverts au nom d'une association ou d'une entreprise, demander d'abord un numéro D-U-N-S, exigé par les deux stores (compter une à deux semaines).

## Ce que chaque store vérifie en plus

| Sujet | App Store (Apple) | Google Play |
| --- | --- | --- |
| Contenu réel | L'app doit apporter assez de fonctions natives ; pas un simple site emballé | Idem, pas de contenu trompeur ni de fonctions cachées |
| Connexion | Si l'app propose Google, elle doit proposer aussi une connexion respectueuse de la vie privée (Se connecter avec Apple) ; compte de démonstration fourni à l'examinateur | Instructions d'accès à l'app dans la Console si une partie demande un compte |
| Suppression du compte | Depuis l'app, données comprises | Depuis l'app et par une page web déclarée |
| Données personnelles | Politique de confidentialité en ligne, étiquettes App Privacy, manifeste de confidentialité ; demande de suivi (ATT) seulement si l'app suit l'utilisateur (ce n'est pas le cas) | Politique de confidentialité, formulaire Sécurité des données |
| Autorisations | Chaque demande (position, notifications) avec une phrase claire dans `app.json` (`infoPlist`) | Déclarations dans la Console : service au premier plan pour la lecture audio, alarmes exactes pour l'appel à la prière |
| Âge | Questionnaire de classification | Questionnaire IARC, public cible |
| Finances | — | Déclaration des fonctions financières : budget personnel, sans prêt ni paiement |
| Paiements | Achat intégré obligatoire pour tout contenu numérique ; dons : voir la section Dons | Facturation Google obligatoire pour le numérique, sauf dons défiscalisés ; voir la section Dons |
| Droits | Droits sur les textes et récitations publiés | Idem |
| Technique | Build Xcode 26 / SDK iOS 26 au moins ; chiffrement : HTTPS standard, déclarer `ITSAppUsesNonExemptEncryption: false` | Cible API 36 ; bibliothèques natives compatibles avec les pages mémoire de 16 Ko (assuré par Expo SDK 58) |
| Test | TestFlight conseillé | 12 testeurs pendant 14 jours pour un compte personnel récent |

Ces règles changent souvent : relire les règles de revue d'Apple et les politiques de Google Play au moment de chaque envoi.

## Fiche

| Champ | Limite | Texte |
| --- | --- | --- |
| Nom | 30 | Sama Jàmm |
| Sous-titre (iOS) | 30 | Lire, écouter, prier en paix |
| Description courte (Google) | 80 | Coran, xassaïdes, horaires de prière, qibla et budget du foyer, hors ligne. |
| Texte promotionnel (iOS) | 170 | Jàng, déglu, julli ci jàmm. Le Coran verset par verset, les xassaïdes, vos horaires et la qibla, et un budget du foyer en enveloppes, sans publicité. |
| Mots-clés (iOS) | 100 | coran,priere,salat,qibla,adhan,xassaid,wolof,senegal,mauritanie,dhikr,zakat,budget,khatm |
| Catégorie | — | Style de vie (secondaire : Livres sur iOS) |
| Âge | — | 4+ (Apple), Tout public / PEGI 3 (Google) |

Description longue (même texte sur les deux stores, 4 000 caractères au plus) :

> Sama Jàmm, « ma paix » en wolof, réunit ce qui accompagne la journée : lire, écouter, prier, et tenir le budget du foyer.
>
> Lire : le Coran verset par verset, en arabe, avec la translittération si vous le souhaitez ; les xassaïdes et les invocations du matin et du soir. Tout se lit sans réseau, la recherche aussi.
>
> Écouter : récitations et chants, verset surligné pendant la récitation, téléchargement pour l'écoute hors ligne, minuterie douce pour s'endormir.
>
> Prier : horaires calculés sur votre téléphone, l'arc du jour pour voir où en est la journée, appel et rappels prière par prière, qibla guidée, compteur de dhikr.
>
> Ensemble : le khatm collectif, un juz chacun, le Coran terminé à plusieurs.
>
> Le budget du foyer : une enveloppe par poste, la dépense du jour, l'épargne avec son intention et le calcul de la zakat. Vos chiffres restent sur votre téléphone, chiffrés.
>
> La nuit, la Veille adoucit l'écran entre Isha et Fajr. Aucune publicité, aucune série à perdre, aucun classement.

Langues de la fiche : français (principal), arabe. Le wolof n'est pas proposé comme langue de fiche : ses formules figurent dans le texte français et sur les captures.

## Confidentialité à déclarer

| Donnée | Sans compte (v1) | Avec compte |
| --- | --- | --- |
| Position | Utilisée sur le téléphone, jamais envoyée : non collectée | Idem |
| Budget | Sur le téléphone, chiffré : non collecté | Idem (jamais synchronisé en v1) |
| Diagnostics (plantages) | Collectés, non liés à l'identité, sans suivi | Idem |
| Adresse e-mail | — | Collectée pour le compte, liée à l'identité, sans suivi |
| Contenu de l'utilisateur (favoris, réglages, parts de khatm) | — | Collecté pour la synchronisation, lié à l'identité, sans suivi |
| Déclaration de don (prénom, message, référence) | Collectée, non liée à l'identité, sans suivi | Idem |
| Publicité, suivi entre apps | Aucun | Aucun |

Politique de confidentialité publiée à une adresse web stable avant l'envoi ; page web de suppression de compte pour Google Play.

## EAS

```json
{
  "build": {
    "development": { "developmentClient": true, "distribution": "internal", "channel": "development" },
    "preview": { "distribution": "internal", "channel": "preview" },
    "production": { "autoIncrement": true, "channel": "production" }
  },
  "submit": {
    "production": {
      "ios": { "ascAppId": "à remplir après création de l'app" },
      "android": { "track": "internal", "releaseStatus": "draft" }
    }
  }
}
```

## Étapes

1. Décider du titulaire des comptes (personnel, association ou entreprise) ; D-U-N-S si structure.
2. Ouvrir le compte Apple Developer et la Google Play Console ; réserver le nom « Sama Jàmm » et les identifiants.
3. Publier la politique de confidentialité et la page de suppression de compte.
4. Recruter 12 testeurs Android (proches, dahira, association) et les inscrire au test fermé.
5. Envoyer un premier build de prévisualisation sur TestFlight et en test fermé ; lancer les 14 jours.
6. Pendant le test : corriger, vérifier la page Recette sur appareils réels, préparer les fiches et les captures du groupe Stores.
7. Remplir App Privacy et Sécurité des données selon le tableau ci-dessus ; questionnaire de classification (4+).
8. Envoyer en revue ; publication progressive sur Google Play (10 %, puis 50 %, puis 100 %).
