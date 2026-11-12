# Audit avant publication — Sama Jàmm 1.0.0

Date : 10 novembre 2026 · Branche : `feat/navigation-native` (57 fichiers modifiés ou non suivis, non commités) · Aucun code modifié par cet audit.

## Verdict

| Cible | Verdict | Raison principale |
| --- | --- | --- |
| Code (types, tests, bundle) | **Sain** | Tout passe, voir section 1 |
| Google Play | **Pas prêt** | Pages légales incomplètes, comptes absents |
| App Store | **Pas prêt** | Compte de démonstration, `ascAppId` absent |
| Design | **Bon niveau, 3 corrections** | Icône, valeurs en dur, manques face au marché |

Le code est nettement plus avancé que le dossier de publication. Ce qui bloque est surtout hors du code.

## 1. Vérifications automatiques (résultats réels)

| Commande | Résultat |
| --- | --- |
| `npm run typecheck` | OK, 0 erreur |
| `npm run lint` | 0 erreur, **406 avertissements**, tous « valeur en dur : utiliser un jeton du thème » |
| `npm test` | **235 / 235** réussis (1,6 s) |
| `npx expo-doctor` | 19 / 20 : dépendance paire `expo-asset` non déclarée (requise par `expo-audio`) |
| `npm audit --omit=dev` | 5 vulnérabilités modérées (`glob`, `minimatch`) dans l'outillage Expo, pas dans l'app livrée |
| `npx expo export` (iOS + Android) | OK : bundles Hermes de 12,6 Mo (iOS) et 12,8 Mo (Android) |

- Ne pas lancer `npm audit fix --force` : il rétrograderait Expo en version 52.
- Non exécuté : build natif EAS, tests sur appareil, tests de composants et de bout en bout (il n'en existe pas).

## 2. Bloquants

### B1. Dons hors app au profit d'une personne — **résolu le 10 novembre 2026**
L'app affichait un numéro de wallet et le nom d'un particulier pour recevoir des dons hors de l'app (pourboire au développeur au sens d'Apple 3.1.1, risque équivalent chez Google).
- Rectification du constat initial : la ligne « Soutenir » était déjà masquée du menu sur iOS ; les écrans restaient toutefois dans le binaire et ouvrables par lien.
- **Décision prise** : les dons sont retirés entièrement de l'app (écrans, textes, logique, documentation), sur iOS comme sur Android.
- **Reste à faire** : exécuter `supabase/migrations/004_retrait_dons.sql` si la table `declarations_dons` existe, et retirer les mentions de dons du site web (`confidentialite`, `conditions`, `supprimer-compte`).

### B2. Pages légales en ligne inachevées
Vérifié en direct sur `sama-jamm-site.vercel.app` : les quatre pages répondent, mais `/confidentialite` et `/supprimer-compte` contiennent encore « À FOURNIR », et toutes portent `noindex`. Les deux stores exigent une politique de confidentialité complète ; Google exige aussi la page de suppression de compte. Il manque : nom et pays de l'éditeur, région Supabase, âge minimal, durées de conservation, droit applicable.

### B3. Licences des contenus religieux — **plus demandées**
Décision du propriétaire (12 novembre 2026) : aucune licence n'est demandée aux sources. Les crédits et les attributions exigées par les licences publiques (Tanzil CC BY 3.0, polices SIL OFL, icônes ISC) restent dans l'app et sur le site. Les traductions de Hamidullah ne sont plus dans l'app.

### B4. Revue Apple impossible sans compte de démonstration
La connexion se fait par code reçu par email, Google ou Apple. Le relecteur d'Apple ne peut pas recevoir ce code : il faut un compte de démonstration utilisable, sinon rejet (règle 2.1). Les notes de revue (`notes-revue-apple.md`) ont encore le contact « À FOURNIR ».

### B5. Comptes et soumission
- Pas de compte Apple Developer ni d'app dans App Store Connect ; `eas.json` n'a pas de `submit.production.ios`.
- Pas de compte Google Play ni de clé de service. Un compte personnel récent impose un test fermé (12 testeurs pendant 14 jours) avant la production : à confirmer dans la console.
- Captures d'écran, image 1024×500 et fiche store non produites.

### B6. Aucun test sur appareil attesté
Rien n'indique qu'un build `staging` a été recetté sur un iPhone et un Android réels. C'est un préalable, voir la liste en section 6.

## 3. Majeurs

| # | Constat | Où | Action |
| --- | --- | --- | --- |
| M1 | **Wolof proposé à l'accueil mais traduit à 6 %** (77 clés sur 1188, statut « brouillon ») : interface mélangée wolof et français. De plus, le lecteur proposait une traduction « Wolof » du Coran alors que seule la traduction française existe | `src/i18n/wo.json`, `src/i18n/langues.ts` | **Résolu le 10 novembre 2026** : le wolof n'est plus proposé (interface et traduction) ; il reviendra une fois traduit et relu |
| M2 | **Alarmes exactes Android non vérifiées** : aucun contrôle de l'autorisation dans `src`. Sur Android 14+, elle est refusée par défaut, l'adhan peut sonner en retard | `features/priere/notifications.ts` | Vérifier sur appareil, ajouter le contrôle et l'écran d'explication ; remplir le formulaire Google |
| M3 | **Téléphones d'entrée de gamme** (Tecno, Infinix, Itel, Xiaomi) : leur économie de batterie tue les notifications programmées. Rien ne guide l'utilisateur | Parcours rappels | Ajouter une aide « autoriser en arrière-plan » ; tester sur un de ces appareils |
| M4 | `expo-asset` non déclaré : risque de plantage hors Expo Go selon `expo-doctor` | `package.json` | `npx expo install expo-asset` |
| M5 | `version.json` en ligne n'a pas d'entrée `ios` ; `URL_STORE_IOS` est vide | site, `constants/liens.ts` | Compléter avant la sortie iOS |
| M6 | Arbre de travail non commité : 57 fichiers, dont les sons d'adhan remplacés | Git | Commiter et construire depuis un état propre |
| M7 | Lecture audio en arrière-plan activée : déclaration « service de premier plan » à remplir chez Google, justification du mode audio chez Apple | `app.json` (`expo-audio`) | À faire dans les consoles |
| M8 | Arabe complet (1264 clés) mais non relu par un locuteur ; 24 chaînes identiques au français | `src/i18n/ar.json` | Relecture avant publication |
| M9 | Aucun test de parcours (composants, bout en bout) | — | 5 scénarios Maestro : accueil, lecture, rappel, budget, compte |
| M10 | **Khatm collectif sans signalement** : nom, intention et prénoms sont visibles des autres membres, mais rien ne permet de signaler un contenu ou d'écarter un membre. Apple l'exige pour tout contenu d'utilisateurs (règle 1.2) | `src/app/plus/khatm/`, `002_khatm.sql` | Ajouter « signaler » et le retrait d'un membre par le créateur, ou expliquer dans les notes de revue que le groupe est privé (risque de rejet) |

## 4. Mineurs

- `ITSAppUsesNonExemptEncryption: false` alors que le budget est chiffré (SQLCipher) : réponse défendable (algorithmes standards), à confirmer, y compris la déclaration propre à la France si l'app y est distribuée.
- Contact public sur une adresse Gmail personnelle et site en `vercel.app` : acceptable, mais une adresse et un domaine dédiés inspirent plus confiance.
- Aucun suivi des plantages (choix de confidentialité assumé) : s'appuyer sur les rapports de la Play Console et de TestFlight.
- `design/PALETTE.md` annonce un fond d'icône Android `#f7f7f5`, `app.json` utilise `#1f5f4a`.
- `predictiveBackGestureEnabled: false` : à réactiver plus tard.
- 5 vulnérabilités modérées de l'outillage : attendre le correctif d'Expo.

## 5. Revue design

### Ce qui est solide
- Palette sobre (sauge, laiton, pierre, ardoise) avec trois thèmes Jour, Nuit, Veille : plus calme et plus lisible que la plupart des apps du secteur, souvent saturées de vert et de publicité.
- Contrastes recalculés pour cet audit sur 17 paires et trois thèmes : texte principal 11,8 à 15,3:1, texte secondaire ≥ 5:1, bouton principal ≥ 7:1. Conforme AA partout pour le texte.
- Zones tactiles 44/48, taille de texte du téléphone respectée (11 blocages seulement), barre d'onglets native, RTL arabe prévu.
- Sans publicité, budget chiffré local : vrai argument face à Muslim Pro et Athan.

### À corriger
| # | Constat | Recommandation |
| --- | --- | --- |
| D1 | **Icône** : laiton sur sauge à 2,8:1, trait fin. Peu lisible en petit et proche des nombreuses icônes vert et or du rayon | Épaissir le trait ou passer le motif en clair ; tester à 48 px à côté des concurrents |
| D2 | **406 valeurs en dur** hors jetons, surtout dans `app/(onglets)` (26 fichiers) : écarts probables avec les maquettes | Les résorber écran par écran |
| D3 | Contour des champs sur fond en retrait, thème Jour : 2,89:1 (seuil 3:1) | Foncer `ligne-forte` Jour vers `#7f878d` |
| D4 | Sept polices embarquées (trois familles latines) | Garder, mais surveiller le poids et la cohérence ; Cormorant réservé aux grands titres |
| D5 | Périmètre large (Coran, prière, budget, khatm) : la fiche store doit choisir un message principal | « Prière et Coran, sans publicité » en tête, le budget en second |

### Manques face au marché (hors 1.0, par priorité)
1. **Widget des horaires** (écran d'accueil et écran verrouillé) : fonction la plus utilisée des apps de prière.
2. **Date hégirienne et mode Ramadan** (imsak, iftar) : absents du code.
3. **Demande d'avis native** (fenêtre du système) : absente ; seul un lien existe dans À propos, alors que les avis portent le classement.
4. Tafsir, choix élargi de récitateurs, mosquées proches : secondaires.

### Limite de cette revue
Les écrans n'ont pas été vus sur appareil ; une tentative de rendu web a échoué (le budget chiffré ne se compile pas pour le web), et les 70 planches du canevas n'ont pas été comparées une à une au code. La revue porte sur les jetons, les composants et la structure.

## 6. Tests manuels à faire sur appareil (build `staging`)

- Adhan complet et court à l'heure exacte, téléphone verrouillé, mode économie d'énergie, après redémarrage ; Android 14+ et iOS.
- Replanification après 12 jours sans ouvrir l'app (tâche de fond).
- Refus puis acceptation de la position et des notifications ; choix manuel de la ville.
- Qibla : boussole face à une direction connue.
- Budget : verrou biométrique, capture d'écran bloquée, sauvegarde puis restauration, changement de téléphone.
- Lecture audio en arrière-plan, appel entrant, casque débranché, hors ligne.
- Arabe en RTL sur tous les écrans ; texte agrandi au maximum ; VoiceOver et TalkBack sur les 5 onglets.
- Petit écran (360×640) et grand écran ; thème sombre et Veille.
- Connexion Google, Apple, code email ; suppression de compte.
- Démarrage à froid sur un Android d'entrée de gamme (bundle de 12,8 Mo).

## 7. Ordre conseillé

1. ~~Trancher B1 (dons) et M1 (wolof)~~ : fait.
2. Compléter les pages légales (B2). B3 (licences) : plus de demande de licence, seules les attributions exigées restent.
3. Corriger M2, M3, M4, puis commiter (M6).
4. Ouvrir les comptes, build `staging`, recette sur appareil (B5, B6).
5. Compte de démonstration, captures, fiches, soumission (B4).
