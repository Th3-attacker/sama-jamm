# Écarts, choix et dépendances

Tenu par l'agent de code (voir `AGENTS.md`, section 1). Un écart par ligne : date, fichier, ce qui diffère, ce qui a été fait.

## Écarts

| Date | Fichier | Écart | Décision |
| --- | --- | --- | --- |
| 2026-11-12 | `design/tokens.json` | Copie ancienne de la palette (12 valeurs différentes) | Remplacée par `docs/sama-jamm/design-system/tokens.json` ; `npm run tokens` régénère `src/theme/tokens.generated.ts` |
| 2026-11-12 | `scripts/tokens-to-theme.mjs` | Les livrables ne donnent pas de noms aux tailles de texte | Ajout des exports `tailles` (`t14`…) et `interlignes` (`l20`…), générés depuis `echelle-texte` ; chaque nom est la valeur de l'échelle fermée |
| 2026-11-12 | `src/**` | 358 avertissements « valeur en dur » | 221 corrigés par jetons (`espace`, `rayon`, `tailles`, `interlignes`). Restent 137 : `height`, `width`, `minHeight` (icônes, pistes, zones), rayons et espaces hors échelle (2, 3, 9, 10, 14…) et 3 `fontSize`. Aucun jeton ne les couvre ; à traiter planche par planche, pas par substitution aveugle |
| 2026-11-12 | `app.json` | Couleur du splash sombre `#12161b` | Passée à `#0f1714` (`marque-nuit`, palette A). Le vert `#1f5f4a` (icône adaptative, notification) reste : c'est `emeraude-aplat` du jour |
| 2026-11-12 | `package.json` | `expo install --check` : 27 paquets en retard de version de correctif (ex. `expo-updates` 58.0.22) | Préexistant, non touché : pas de mise à jour d'Expo sans nécessité (`AGENTS.md`, section 7) |
| 2026-11-12 | Dons (`Soutenir`, `DonDeclarer`, `DonMerci`) | Planches présentes, écrans retirés du dépôt (`004_retrait_dons.sql`) | Non recréés (défaut). À valider |
| 2026-11-12 | Routes | Chemins du dépôt ≠ inventaire (`coran/[sourate]`, `plus/khatm/[id]`, `budget/devise`…) | Routes existantes conservées |
| 2026-11-12 | Bases | Pas de `utilisateur.db` ni `contenu.db` (stockage clé-valeur + JSON) | Conservé (défaut), migrations des réglages via `migrate` de zustand |
| 2026-11-12 | `src/stores/reglages.ts` | Réglages `traduction` et `affichage` supprimés | Version 7 → 8 : `retirerTraduction` (`traductionMigration.ts`, testé) efface les deux clés enregistrées ; la translittération reste telle que choisie (désactivée par défaut) |
| 2026-11-12 | `src/data/coran/fr.json` | Traduction Hamidullah embarquée | Fichier supprimé du dépôt (le texte arabe et la translittération restent) ; crédit retiré de À propos |
| 2026-11-12 | `features/recherche` | La recherche portait sur la traduction française | Elle porte sur l'arabe et la translittération sans balises ; les résultats montrent la translittération surlignée quand la requête est en lettres latines |
| 2026-11-12 | Écran Partage | Option « Ajouter la traduction » | Clés retirées ; l'option de translittération viendra avec l'écran recréé (phase 4) |
| 2026-11-12 | `src/app/(onglets)/lire/**`, `src/app/coran/[sourate].tsx` | Le commit `fa434c8` avait réduit tous les écrans de Lire à `return null` (onglet vide), et retiré juz, progression et partage, alors que les planches `Bibliotheque` et `Partage` les montrent. L'audit les avait notés « à modifier » à tort | Écrans, `ListeJuz`, `juz`, `progression`, `BasculeMode`, `InterrupteurLireEcouter`, `PartageVerset` restaurés depuis `fa434c8^`, puis adaptés : arabe seul, translittération en option |
| 2026-11-12 | `src/data/ummah/` | Choix demandé : reconstruire Lire sur ces données. Mais `sourates.json` n'a ni translittération ni autre chose que l'arabe et une traduction française (interdite), la licence est « non déclarée » (manifeste) | Non branchées : le Coran reste sur `data/coran/ar.json` + `translit.json`. À rediscuter avant d'utiliser `duas.json` ou `pages.json` |
| 2026-11-12 | `src/features/lire/PartageVerset.tsx` | Écran Partage = feuille (`BottomSheet`), pas la route modale `partage` de l'inventaire | Conservé tel quel ; sans traduction ; option « Translittération » désactivée par défaut |
| 2026-11-12 | `src/stores/lecture.ts` | `ModeLecture` accepte `'sourate'` (ajout de `fa434c8`) sans écran qui l'utilise | Laissé ; clé i18n `lire.modeSourateCourt` conservée |

## Dépendances

| Date | Paquet | Raison |
| --- | --- | --- |
