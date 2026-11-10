# Plan de Sama Jàmm : correctifs et reste du projet

Une phase à la fois, un lot à la fois : plan détaillé, accord « Fait », une branche, une PR vers `dev`.
Ordre : **A → B1 → B2 → C2 → C3 → C4 → B4 → C1 → C5 → D → E → F → G → H**.

## Fait

| Lot | Contenu | PR |
| --- | --- | --- |
| Socle | Thème, i18n fr/ar, navigation, composants, bienvenue, accueil, prière, réglages | jusqu'à #38 |
| Lire | Liste, lecteur page et verset, reprise, recherche, favoris, menu Plus, À propos | #39 à #44 |
| Budget | Fondations, quotidien, modifier et supprimer, revenus, archivées, historique, comptes, paie, bilan, virement | #45 à #52 |
| Audit P1 | Cycles uniques (migration v2), file d'attente du dépôt | #53 |
| Audit P2 | Dépendances SDK 58, `eas.json`, CI | #54 |
| Audit P3 | Verrou biométrique, aperçu masqué, icône œil | #55 |
| B1 | Performance : Veille, index de recherche par paquets, notifications ciblées | #56 |
| B2 | Tests (horaires, fenêtre, recherche), examen de `npm audit` | #57 |
| Lecture | Mode page plein écran, taille dans les réglages | #58 |
| C2 · C3 · C4 | Dettes, épargne avec intention, zakat indicative | #59 à #62 |
| B4 | Découpage du dépôt, aides partagées des écrans du budget | #63 |
| B4 (fin) | Montant facultatif partagé, traductions obsolètes, minuteries nettoyées, config web retirée | #64 |
| C1 | Devise personnalisée, changement de devise avec conversion par un taux | #65 |
| C5a | Export CSV, sauvegarde chiffrée par mot de passe, restauration | #66 |
| D1 | Écran d'erreur (repli des écrans qui plantent), mise à jour bloquante via `version.json` | #67 |
| D2 | Explication avant les demandes de position (qibla) et de notifications (zakat), raisons dans la bienvenue | #68 |
| D3 | Démarrage animé (relais du démarrage natif, signature, fondu ; réduit si « Réduire les animations ») | #69 |
| D4 | Journal local des erreurs (sans données personnelles), partagé par l'utilisateur depuis À propos | #70 |
| E3 | Partage d'un verset : image (fond émeraude ou nuit, traduction au choix) ou texte avec lien | #71 |
| Adhan | Appel à la prière dans les notifications (Android), icône de notification ; iOS : extraits WAV. 9 novembre 2026 : deux nouveaux appels (Fajr ; Dhuhr à Isha), canaux `priere-v3-*`, extraits iOS de 29 s et 20 s, anciens sons CC0 retirés ; à entendre sur un téléphone après un build | #72 à #74 ; iOS : PR #80 et #81 |
| E1 · E2 | Crédit Tanzil ; translittération (réglage), repères juz et quarts de hizb, prosternations, juz en mode page | #75 |
| F1 | Écouter : 5 récitateurs (alquran.cloud), lecteur verset par verset, plein écran, mini-lecteur, verset surligné, écoute écran éteint, écoute page par page (la page tourne seule), page mushaf en plein écran | #76 |
| F2 · F3 | Téléchargements par sourate, minuterie, répétition du verset et de la sourate, hors ligne (échec de chargement) | fusionnée dans `dev` (`43dcd3f`) |
| Invocations | Invocations coraniques (matin, soir, avant de dormir) et Hisn (132 chapitres) avec compteur, source notée dans À propos | #79, fusionnée dans `feat/ecrans-selon-captures` puis ramenée sur `dev` (`7d9b03c`) |

## A. Vérifier sur un téléphone (bloquant)

| Lot | Contenu | Qui |
| --- | --- | --- |
| A1 | APK : `npx eas-cli build --profile preview --platform android` | Utilisateur |
| A2 | Recette : lecture, recherche, favoris, budget, verrou, notifications, arabe | Utilisateur |
| A3 | Corriger ce que la recette trouve | Claude |

## B. Correctifs de l'audit

| Lot | Contenu |
| --- | --- |
| B1 | Performance : Veille recalculée à la bascule, index de recherche par paquets, notifications reprogrammées seulement si elles changent |
| B2 | Tests (horaires, fenêtre de notifications, recherche) et examen de `npm audit` |
| B3 | Trois parcours Maestro : bienvenue, lecture, dépense — **à faire** |

### `npm audit` (examen du 4 novembre 2026)

19 alertes (18 moyennes, 1 élevée), **aucune dans le code embarqué dans l'app** : toutes viennent des outils de développement.

| Alerte | Arrive par | Décision |
| --- | --- | --- |
| `minimatch`, `glob` (moyennes) | eslint et ses plugins, `@expo/cli`, `@expo/fingerprint` | Rien : outils lancés sur nos propres fichiers. Le seul correctif proposé ramène Expo à la 51, refusé. |
| `zod` 3.25 (élevée, mémoire épuisée sur des collections géantes) | `eslint-plugin-react-hooks` (lint seulement) | Rien : eslint ne valide aucune donnée externe. `npm audit fix` modifierait aussi `@expo/cli` et une dizaine de paquets. |

À revoir à chaque mise à jour d'Expo ou d'eslint (`npm audit`), sans `npm audit fix --force`.

## C. Terminer le budget

| Lot | Contenu |
| --- | --- |
| C2 | Dettes entre proches (section 17 du design) |
| C3 | Épargne : objectifs avec intention |
| C4 | Zakat : base, nisab, année lunaire, biens |
| C5b | Sauvegarde Android ciblée (règles de sauvegarde automatique, budget exclu) — **à faire** |

## D. Robustesse

D1 à D4 faits ; voir le tableau « Fait ».

## E. Contenus de lecture (après les droits)

E1 bis : licence du texte arabe d'alquran.cloud à confirmer (ou passer au texte de Tanzil) · E4 invocations · E5 xassaïdes : audios de xassaid.com en place dans l'app, autorisation écrite à obtenir avant publication.

## F. Écouter (après les droits audio)

F4 détection du réseau en continu (expo-network), si besoin.

## G. Compte et partage (facultatif en v1)

G1 compte (code par e-mail, profil, suppression) fait ; synchronisation avec G2 · G2 khatm collectif fait (Supabase, temps réel, invitation par lien ou code, rappel local) · G3 dons retiré de l'app (10 novembre 2026).

## H. Publication

| Lot | Contenu | État |
| --- | --- | --- |
| H1 | `expo-updates` (canaux et `runtimeVersion`), profil `staging`, `staging` dans la CI, déclaration de chiffrement iOS | fait (6 novembre 2026) |
| H2 | Icônes et captures | à faire |
| H3 | Confidentialité et suppression du compte | en cours (9 novembre 2026) : documents dans `docs/deploiement/`, site statique `sama-jamm-site` créé, liens centralisés dans `liens.ts` ; reste : textes à valider, email, éditeur, mise en ligne sur Vercel |
| H4 | Comptes des stores et test fermé | à faire |
| H5 | Recette finale et publication progressive | à faire |

## En continu (hors code)

Relecture de l'arabe et du wolof ; validation des formulations religieuses par le référent.

## Reste à faire

A1 à A3 (recette sur téléphone), B3 (Maestro), C5b (sauvegarde Android), H1 à H5 (publication).
