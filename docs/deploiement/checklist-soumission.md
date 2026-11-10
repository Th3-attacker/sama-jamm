# Checklist avant soumission (état du dépôt au 9 novembre 2026)

## Déjà en place
- Identifiants `com.samajamm.app` (iOS et Android), `usesAppleSignIn`, `ITSAppUsesNonExemptEncryption: false`, `allowBackup: false`.
- Profils EAS `preview`, `staging`, `production` (app-bundle, `autoIncrement`, `appVersionSource: remote`).
- Suppression de compte in-app et fonction SQL `supprimer_mon_compte`.
- CI : types, lint, tests.

## À fournir (utilisateur)
- [x] Email de contact : `EMAIL_CONTACT` renseigné (9 novembre 2026).
- [ ] Pages hébergées : confidentialité, conditions, aide, suppression de compte (URL web exigée par Google) → `liens.ts`.
- [ ] Nom et adresse de l'éditeur.
- [ ] Compte Apple Developer et App Store Connect (app créée, identifiant numérique ascAppId).
- [ ] Compte Google Play Console + clé de compte de service pour EAS Submit.
- [ ] Textes arabes et wolof validés ; licences des invocations et des récitations validées.
- [ ] Captures et visuels (voir `visuels-captures.md`).
- [ ] Connexion Google et Apple : configurer les fournisseurs dans Supabase (Auth) et l'URL de retour `samajamm://auth`.

## À faire dans le code ou la config (non appliqué, sur plan)
- [x] `eas.json` : `submit.production.android` posé (track `internal`, statut `draft`, clé `./google-service-account.json` ignorée par Git).
- [ ] `eas.json` : ajouter `submit.production.ios.ascAppId` une fois l'app créée dans App Store Connect (valeur numérique, ne pas l'inventer).
- [ ] Build iOS : Apple exige Xcode 27 (SDK iOS 27) ; confirmer qu'une image EAS compatible Expo SDK 58 le fournit (docs EAS) avant le premier build.
- [x] iPad exclu : `ios.supportsTablet: false` posé dans `app.json`.
- [ ] Décision : app limitée à l'iPhone. Dans App Store Connect › Disponibilité, **décocher Mac (Apple silicon) et Apple Vision Pro** (à faire dans la console, pas dans le code).
- [ ] `app.json` : décider `supportsTablet`, ajouter `ios.buildNumber` seulement si on quitte la version distante.
- [ ] Vérifier le texte de justification de `SCHEDULE_EXACT_ALARM` et des permissions localisation (français seulement).
- [ ] Ajouter un lien App Store dans `liens.ts` quand l'app existe.
- [ ] Étendre la CI vers un build EAS (optionnel).

## Site web (Vercel)
- [ ] Remplacer tous les `[À VALIDER]` et `[À FOURNIR]` dans `../sama-jamm-site` (email, éditeur, région Supabase, chemin de suppression de compte, liens des stores).
- [ ] Retirer la balise `noindex` des pages au moment de publier.
- [ ] Pousser `sama-jamm-site` sur un dépôt Git et l'importer dans Vercel (Framework : Other, sans build).
- [ ] Reporter l'adresse de production dans `SITE` (`src/constants/liens.ts`) et publier une nouvelle version de l'app : les builds installés gardent l'ancienne adresse.
- [ ] Vérifier que `https://<site>/version.json` répond (l'app ne bloque rien si le fichier est absent).
- [ ] Renseigner `EMAIL_CONTACT` et, une fois l'app sur l'App Store, `URL_STORE_IOS`.

## Parcours
1. Build `staging` Android + iOS, recette.
2. Google Play : test fermé (exigence pour les nouveaux comptes personnels : **À VALIDER** les règles en vigueur), puis production.
3. App Store : TestFlight, puis revue.
4. Fusion `dev` → `staging` → `main` selon le README.

## Contrôles finaux
- [ ] Aucun `À VALIDER` dans les textes publiés.
- [ ] Mentions À propos alignées sur `licences.md`.
- [ ] `npx tsc --noEmit`, `npx eslint`, `npm test` verts.

## Ce qui manque de ton côté (récapitulatif)
1. Apple Developer Program (compte payant) + app créée dans App Store Connect (ascAppId).
2. Google Play Console + compte de service JSON (à placer à la racine sous `google-service-account.json`, jamais versionné).
3. Email de support, nom/adresse de l'éditeur, site web.
4. Pages hébergées : confidentialité, conditions, aide, suppression de compte, accessibilité (facultative).
5. Compte de démonstration pour la revue Apple.
6. Captures (iPhone, téléphone Android ; pas d'iPad), icône 1024 et 512, image 1024×500.
7. Tests sur appareil : VoiceOver, texte agrandi, notifications/adhan, alarmes exactes Android.
8. Validation des textes arabes et wolof ; licences des invocations et récitations ; questionnaires d'âge et de confidentialité à remplir dans les consoles.
9. Test fermé Google Play si ton compte est un compte personnel récent (règle à vérifier dans la console).
