# Sama Jàmm

Application mobile de lecture du Coran, d'horaires de prière et de budget personnel, pensée hors ligne d'abord.
Expo SDK 58, React Native 0.88.1, React 19.3, TypeScript 6.0.3, expo-router.

## Prérequis

- Node.js 24 (obligatoire : `npm test` exécute TypeScript directement et utilise `node:sqlite`).
- npm.
- Pour tester : Expo Go sur Android ou iOS. Un build de développement est préférable pour les notifications (Expo Go n'embarque ni les sons d'adhan ni les tâches de fond).

## Démarrage

```bash
npm install
npm start
```

## Scripts

| Commande | Rôle |
| --- | --- |
| `npm start` | Serveur de développement Expo |
| `npm run android` / `npm run ios` | Ouvrir sur un appareil ou un émulateur |
| `npm run lint` | ESLint (`eslint-config-expo`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Tests unitaires (`node --test` sur `src/**/*.test.ts`) |
| `npm run tokens` | Régénère `src/theme/tokens.generated.ts` depuis `design/tokens.json` |

## Branches

| Branche | Rôle |
| --- | --- |
| `dev` | Intégration : tout le travail y est fusionné et vérifié par la CI |
| `staging` | Pré-production interne : builds `staging` pour la recette |
| `main` | Production : ce qui part sur les stores |

Une version passe de `dev` à `staging` puis à `main` par fusion, jamais par commit direct. `main` et `staging` n'ont pas encore reçu de version.

## Données et confidentialité

- Le budget est chiffré et stocké sur le téléphone (SQLite/SQLCipher) : il n'est jamais envoyé.
- Supabase ne sert qu'aux comptes (`profils`), au khatm collectif (`khatms`, `khatm_parts`) et aux déclarations de dons (`declarations_dons`).
- La clé Supabase présente dans le code est publique (« publishable ») et chaque table est protégée par RLS. Aucune autre clé n'est embarquée.

## Base Supabase

Les migrations de `supabase/migrations` s'exécutent à la main, dans l'ordre, via le SQL Editor du projet :

1. `001_comptes.sql`
2. `002_khatm.sql`
3. `003_dons.sql`

Aucun suivi automatique des migrations n'est en place : vérifier l'état des tables avant d'en ajouter une.

## Architecture

```text
src/app/        routes expo-router
src/features/   fonctionnalités (lecture, prière, budget, compte, khatm, dons…)
src/ui/         composants partagés
src/stores/     état local (zustand)
src/services/   client Supabase
src/data/       Coran, translittération, repères, invocations
src/i18n/       fr, ar, wo (brouillon, repli français)
src/lib/        utilitaires purs
```

## Langues

`fr` et `ar` sont complets ; `wo` est un brouillon largement incomplet, à relire par un locuteur wolof, avec repli automatique en français.

## Publication

`eas.json` définit trois profils : `preview` (APK interne), `staging` (APK interne de recette, canal `staging`) et `production` (app-bundle, canal `production`).

```bash
npx eas-cli build --profile staging --platform android
npx eas-cli build --profile production --platform android
```

`expo-updates` est configuré dans `app.json` : chaque build suit son canal et `runtimeVersion` vaut `appVersion`, donc une mise à jour n'est proposée qu'aux builds de la même version. Aucune mise à jour n'a encore été diffusée.

La mise à jour bloquante (écran « Une nouvelle version vous attend ») ne passe pas par `expo-updates` : l'app lit `version.json` publié sur GitHub Pages et compare la version installée. Le contrôle s'applique sur iOS et Android, y compris en développement : si `version.json` impose un minimum supérieur à la version installée, l'écran bloque aussi un build local.

Le chiffrement est déclaré côté iOS (`ITSAppUsesNonExemptEncryption: false`) : le budget chiffré repose sur SQLCipher et les secrets sur le stockage sécurisé du système, sans chiffrement additionnel soumis à déclaration.

## Suite du travail

Voir `design/PLAN.md` : lots faits, reste à faire et examen de `npm audit`.
