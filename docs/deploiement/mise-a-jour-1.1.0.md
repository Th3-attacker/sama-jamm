# Mise à jour 1.1.0 : guide de soumission (Apple, Android, serveur)

Rédigé le 24 novembre 2026 d'après `eas.json`, `app.json`, `checklist-soumission.md`, `notes-revue-apple.md` et le manifeste Android. Les points marqués **À VÉRIFIER** ne sont pas confirmés : ne rien soumettre sans les avoir contrôlés dans la console concernée. Version actuelle sur les deux stores : 1.0.2.

## 1. Règles de sécurité

| Règle | Pourquoi |
| --- | --- |
| `version` est passée à **1.1.0** dans `app.json` avant tout build. | `runtimeVersion` suit la version de l'app (`policy: appVersion`). La 1.1.0 embarque de nouveaux modules natifs (22 paquets Expo mis à jour, clé `locales` iOS). |
| Aucun `eas update` sur la 1.0.2 avec ce code. | Du JavaScript neuf envoyé vers une 1.0.2 installée, dont les modules natifs sont plus anciens, la casserait. |
| Copie hors ligne du keystore `SAMA-JAM` et de la clé `.p8` Apple. | Perdre la clé de signature Android bloque les mises à jour. `.gitignore` exclut déjà `.jks`, `.p8`, `.env*` et `google-service-account.json`. |
| Jamais `npm audit fix --force`. | Il ferait reculer Expo de 6 versions. Les 10 alertes `npm audit` (24 nov) ne touchent que les outils de build et le lint. |
| Recette sur téléphone avant toute soumission. | Aucun écran n'a été vu sur appareil depuis la mise à jour des paquets du 24 nov. |
| Aucun push ni publication sans accord explicite du propriétaire. | `AGENTS.md`, sections 2 et 7. |

## 2. Serveur (Supabase, projet `sama-jamm`)

| Étape | Comment | Risque si on la saute |
| --- | --- | --- |
| Sauvegarde de la base | Tableau de bord Supabase | Aucun retour possible |
| Essai de la migration `018_robustesse_khatm.sql` | Transaction annulée, avec l'accord explicite du propriétaire | Faute de syntaxe non vue (le SQL n'a été que relu) |
| Appliquer la 018 avant la sortie | Avec l'accord explicite du propriétaire. Compatible avec les anciennes versions de l'app. | Un khatm complet reste `ouvert` ; pas de limite de 10 créations par jour |
| `supabase/verification.sql`, section 9 | Les résultats attendus sont écrits sous chaque requête | On ignore si la 018 est bien en place |
| Conseils de sécurité et de performance | Outil `get_advisors` ou onglet Advisors | Une faille de configuration passe inaperçue |
| Retour arrière | En-tête de la 018 | |

État de production au 24 nov : migrations 008, 010 à 017 appliquées ; 009 et 018 non appliquées.

## 3. Commun aux deux stores

| Étape | Comment |
| --- | --- |
| Version 1.1.0 | Déjà posée dans `app.json`. |
| Nouveautés | `notes-de-version.md`, section 1.1.0 (français, anglais, arabe). **Arabe et anglais à faire relire.** |
| Fiches | Le Coran est en arabe seul : aucune mention de traduction. Corrigé le 24 nov dans `fiche-store.md`, `notes-de-version.md`, `visuels-captures.md` et `notes-revue-apple.md`. Vérifier que les fiches déjà en ligne sont à jour. |
| Confidentialité (App Privacy et Data safety) | Aucune donnée nouvelle collectée depuis la 1.0.2 : **À VÉRIFIER** sur les formulaires. |
| Build de test | `eas build --profile staging` pour iOS ; build Android sur la machine habituelle. |

## 4. Apple

| Étape | Comment | Point d'attention |
| --- | --- | --- |
| Build iOS | `eas build -p ios --profile production` (`autoIncrement`, `appVersionSource: remote`) | La checklist note qu'Apple exige Xcode 27 : **À VÉRIFIER** avec l'image EAS. |
| Envoi | `eas submit -p ios` ; `submit.production.ios.ascAppId` doit être renseigné dans `eas.json` (valeur numérique d'App Store Connect, jamais inventée) | Absent de `eas.json` à ce jour. |
| TestFlight | Sur un iPhone, en français puis en arabe : position, Face ID, notifications, adhan, widgets, activité en direct, Sign in with Apple | Les textes de permission en arabe et en anglais n'ont jamais été vus. |
| App Store Connect | Version 1.1.0, nouveautés collées, **sortie manuelle**, **déploiement progressif sur 7 jours** | Permet de s'arrêter. |
| Notes de revue | `notes-revue-apple.md` : sans compte, Sign in with Apple avec l'identifiant du relecteur | |
| Suppression de compte | Apple (5.1.1(v)) demande aussi la révocation du jeton Sign in with Apple. **Non implémentée.** | Risque de refus. À décider : fonction côté serveur avant l'envoi, ou le signaler en connaissance de cause. |
| Disponibilité | Décocher Mac (Apple silicon) et Apple Vision Pro | App réservée à l'iPhone (`supportsTablet: false`). |

## 5. Android

| Étape | Comment | Point d'attention |
| --- | --- | --- |
| Numéro de version interne | Décision du propriétaire (24 nov) : les builds Android reprennent sur **EAS**. `eas build -p android --profile production` (`autoIncrement`, `appVersionSource: remote`) : ne pas poser `android.versionCode` dans `app.json`. | Le compteur EAS est à 4 (production 1.0.1, builds 3 et 4, lus le 24 nov) : le prochain sera **5**. La Play Console a le `versionCode` 1 (notes du 16 nov, **À VÉRIFIER**). Il doit être strictement plus bas que 5, sinon corriger le compteur EAS avant de builder. |
| Clé de signature | **Avant le premier build EAS à envoyer** : `eas credentials -p android`, relever l'empreinte SHA-1 du keystore stocké chez EAS, la comparer à la clé d'envoi (upload key) affichée dans la Play Console › Intégrité de l'appli | La 1.0.2 de Play a été construite sur une autre machine avec la clé `SAMA-JAM`. Si EAS signe avec une autre clé, Google refuse l'envoi. Dans ce cas : importer `SAMA-JAM` dans EAS ou demander à Google une réinitialisation de la clé d'envoi. |
| Envoi à Google | `eas submit -p android` exige `google-service-account.json` à la racine (ignoré par Git). Notes du 20 nov : aucune clé de compte de service n'est enregistrée sur Expo. | Sans elle, envoyer l'AAB à la main dans la Play Console. Le compte développeur est celui d'un ami. |
| Sauvegarde | Copie hors ligne du keystore `SAMA-JAM` et des identifiants EAS | Perdre la clé bloque les mises à jour. |
| Alarmes exactes | Déclaration de `SCHEDULE_EXACT_ALARM` dans la Play Console, avec la justification (appel à la prière à l'heure) | Prévoir un repli si l'utilisateur refuse. |
| Audio en arrière-plan | Le manifeste déclare `FOREGROUND_SERVICE_MEDIA_PLAYBACK` : remplir la déclaration de service de premier plan | |
| Data safety | Inchangée : **À VÉRIFIER** | |
| Parcours | Test fermé (12 testeurs inscrits en continu pendant 14 jours), puis production | Le compte développeur est celui d'un ami : les e-mails de Google lui arrivent. |
| Mise en production | Déploiement progressif : 10 %, puis 50 %, puis 100 % | Permet d'arrêter. |
| Visuels manquants | Icône 512, image 1024×500, captures Android | |

## 6. Retour arrière

| Cas | Action |
| --- | --- |
| Défaut grave pendant le déploiement Android | Arrêter le déploiement, corriger, republier avec un `versionCode` plus haut (EAS incrémente seul ; un numéro plus bas est refusé). |
| Défaut grave pendant le déploiement iOS | Mettre en pause le déploiement progressif, envoyer un nouveau build, demander une revue accélérée. |
| Problème côté base | Rejouer les anciennes fonctions listées dans l'en-tête de la 018. |

## 7. Recette sur téléphone avant soumission

- Budget chiffré : ouverture, ajout d'une dépense, export CSV, restauration.
- Horaires de prière, qibla, notifications et adhan (iPhone et Android).
- Lecteur : mode page, audio sur écran verrouillé, partage d'un verset long (2:282).
- Khatm : création, partage du code, prise d'un juz, bandeau « Khatm terminé » à 30 juz.
- Interface arabe, thème nuit, texte à 200 %, VoiceOver et TalkBack, réglage « Réduire les animations ».
- Saisie d'un montant et d'une date avec un clavier arabe.
