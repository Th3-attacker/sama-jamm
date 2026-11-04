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
| B3 | Trois parcours Maestro : bienvenue, lecture, dépense |
| B4 | Propreté : découpage de `depot.ts`, composants partagés, code mort, minuteries, sauvegarde Android ciblée, retrait du web |

## C. Terminer le budget

| Lot | Contenu |
| --- | --- |
| C1 | Devise personnalisée et changement de devise |
| C2 | Dettes entre proches (section 17 du design) |
| C3 | Épargne : objectifs avec intention |
| C4 | Zakat : base, nisab, année lunaire, biens |
| C5 | Export CSV, sauvegarde chiffrée, restauration |

## D. Robustesse

| Lot | Contenu |
| --- | --- |
| D1 | États hors ligne et erreur, mise à jour bloquante |
| D2 | Écrans « avant la demande » de position et de notifications |
| D3 | Démarrage animé |
| D4 | Suivi des plantages anonymisé |

## E. Contenus de lecture (après les droits)

E1 licences du texte et de la traduction · E2 translittération, juz, hizb, prosternation · E3 partage d'un verset · E4 xassaïdes et invocations.

## F. Écouter (après les droits audio)

F1 lecteur audio, mini-lecteur, récitateurs · F2 téléchargements, minuterie, verset surligné.

## G. Compte et partage (facultatif en v1)

G1 compte et synchronisation (Supabase) · G2 khatm collectif · G3 dons.

## H. Publication

H1 `expo-updates` et déclaration de chiffrement iOS · H2 icônes et captures · H3 confidentialité et suppression du compte · H4 comptes des stores et test fermé · H5 recette finale et publication progressive.

## En continu (hors code)

Relecture de l'arabe et du wolof ; validation des formulations religieuses par le référent.
