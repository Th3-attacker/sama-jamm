# Audit · mise à jour de la conception (12 novembre 2026)

Branche `maj-conception-nov-2026`, partie de `dev` (dépôt propre). Rien n'a été modifié dans le code. Références de départ : `tsc --noEmit` sans erreur, 264 tests réussis, lint à 0 erreur et 358 avertissements.

**Limite de cet audit** : l'état de chaque écran vient des routes, des fichiers, des réglages et des clés i18n, pas d'une comparaison visuelle planche contre appareil. Les lignes « à vérifier » seront tranchées en lisant le fichier et la planche au début de la phase concernée.

## 1. Écrans

Routes sous `src/app/`. Légende : **conforme** (rien d'évident à changer), **à modifier**, **manquant**, **en trop**.

### Bienvenue et démarrage

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `SplashClair`, `SplashSombre` | `app.json` (expo-splash-screen) | à vérifier | Fonds `#f7f7f5` et `#12161b` ; la palette A met le vert nuit fixe à `#0f1714` (`marque-nuit`). Image 120 au lieu de 200 dp |
| `SplashAnime`, `SplashEtapes` | `features/demarrage/DemarrageAnime.tsx` | à vérifier | Animations réduites : fondu seul ; clé `demarrage.traduction` (slogan, pas une traduction du Coran : à garder) |
| `Bienvenue1` | `(bienvenue)/langue.tsx` | à modifier | Appelle `definirTraduction` (à retirer, phase 3) ; fond en `emeraudeAplat` (phase 2) ; annonce RTL avant le choix de l'arabe |
| `Bienvenue2` | `(bienvenue)/position.tsx` | à vérifier | Ordre et textes ; état refus → `EtatPosition` |
| `Bienvenue3` | `(bienvenue)/rappels.tsx` | à vérifier | Son de l'appel, Veille automatique, texte de refus des notifications |
| `AutorisationPosition`, `AutorisationNotifications` | `features/autorisation/AvantAutorisation.tsx` | à modifier | Ordre dans le parcours (aujourd'hui : langue → position → rappels ; la maquette place les deux écrans d'avant-autorisation avant chaque demande système) |

### Accueil, Plus, onglets

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `Accueil`, `ArAccueil` | `(onglets)/accueil.tsx` + `features/accueil/*` | à vérifier | Carte héros en `emeraudeAplat` ; `sagesse.ts` à relire. Route `accueil` au lieu de `index` (le lien profond de `04-structure-et-navigation.md` est à comparer) |
| `PlusHub` | `(onglets)/plus.tsx` | conforme | Six tuiles et liste déjà là. Entrée « Soutenir » : voir Dons |
| `TabBar` | `(onglets)/_layout.tsx` | conforme | `NativeTabs` déjà en place ; `tintColor` utilise `emeraude` (texte/icône, pas un aplat : correct) |

### Lire

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `Bibliotheque`, `ArBibliotheque` | `(onglets)/lire/index.tsx` | à modifier | Modifié dans le commit `fa434c8` (retrait de Juz, Marque-pages, bascule Lire/Écouter) : comparer avec la planche (Coran / Xassaïdes / Invocations, badge « Hors ligne ») |
| `Lecteur`, `LecteurVeille` | `coran/[sourate].tsx`, `features/lire/CarteVerset.tsx` | à modifier | Routes `coran/[sourate]` au lieu de `lire/coran/[sourate]` ; traduction à retirer ; bandeau « Veille activée » |
| `LecteurRecitation` | `coran/[sourate].tsx` + audio | à modifier | Surbrillance du verset récité : dépend du minutage (`scripts/minutages-coran.mjs`) ; sans minutage, pas de surbrillance |
| `LecteurPage`, `LecteurPageReglette` | `features/lire/PageMushaf.tsx` | à modifier | Réglette (`Slider`) et masquage des outils ; la traduction est affichée dans `VersetPage.trad` |
| `Xassaides`, `Chant` | `lire/xassaides/[recitant].tsx`, `features/xassaides/*` | à vérifier | Route par récitant au lieu de recueil/id ; chant vers par vers sans minutage : lecture seule |
| `Invocations` + 2 planches arabes | `lire/invocations/[categorie]/*`, `lire/hisn/*` | à modifier | `CarteInvocation` affiche la traduction (sourates) via `traductionDe` ; double arborescence `invocations` / `hisn` à clarifier |
| `ReglagesLecture` | `features/lire/ReglagesLecture.tsx` (feuille) | à modifier | Retirer le choix de traduction et l'affichage « arabe + trad. / trad. seule » ; garder taille, translittération (défaut off), chiffres ; la planche est une route `plus/reglages/lecture` |
| `Partage` | aucune route | **manquant** | `PartageVerset.tsx` supprimé dans `fa434c8` ; `react-native-view-shot` installé mais inutilisé. À recréer sans traduction, translittération optionnelle (défaut off) |
| `Khatm`, `KhatmInvitation`, `KhatmNouveau` | `plus/khatm/[id]`, `khatm/[code]`, `plus/khatm-nouveau`, `plus/khatms` | à vérifier | Routes différentes de `lire/khatm/[id]` et `plus/khatm/nouveau` ; `trad` stylé à renommer si lié à la traduction |

### Écouter

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `Ecouter` | `features/ecouter/ContenuEcouter.tsx`, `lire/ecouter/[recitateur]` | à modifier | L'interrupteur Lire/Écouter a été retiré dans `fa434c8` ; la planche conserve `Ecouter` et `Recitateur` « interrupteur de Lire » |
| `LecteurAudio`, `LecteurAudioSuite` | `lecteur.tsx` (modal) | à modifier | Traduction affichée (l. 91–230) ; verset en cours, suite, récitateur |
| `Recitateur`, `Minuterie` | `ecouter/[recitateur]`, `features/ecouter/minuterie.ts` | à vérifier | Fondu du son sur 10 s |
| Barre d'écoute | `features/ecouter/MiniLecteur.tsx` | à vérifier | Pile du bas (`EspaceBas`) |

### Prière

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `Priere`, `EtatPosition` | `(onglets)/priere/index.tsx`, `features/priere/ChoixVille.tsx` | à vérifier | Carte de la prochaine prière en `emeraudeAplat` |
| `Qibla`, `QiblaTrouvee`, `QiblaSansBoussole` | `priere/qibla.tsx`, `ui/QiblaCompass.tsx`, `ui/SchemaQibla.tsx` | à vérifier | `expo-sensors` absent : détection du magnétomètre à vérifier |
| `Dhikr`, `DhikrObjectif` | `priere/dhikr.tsx`, `ui/TasbihCounter.tsx` | à vérifier | Compteur en `emeraudeAplat` ; feuille d'objectif |
| `PriereRappels`, `PriereMethode` | `priere/rappels.tsx`, `priere/methode.tsx` | à vérifier | Réglage « compte à rebours Android » (désactivé par défaut) à ajouter en phase 7 |

### Budget et dettes

Toutes les routes existent (`budget/index`, `paie`, `bilan`, `comptes`, `devise`, `enveloppe/[id]`, `epargne/*`, `historique`, `operation/[id]`, `premier`, `revenus`, `zakat/*`, `dettes/*`, `budget-ajout`, `EcranVerrou`). État : **à vérifier** écran par écran (phase 6). Écarts de route déjà visibles :

- `budget/devise` au lieu de `plus/reglages/devise` ; `budget/revenus` au lieu de `budget/revenu` ; `dettes/remboursement` au lieu de la feuille `budget-remboursement` ; `epargne/objectif` au lieu de `epargne/nouveau`.
- **En trop (hors inventaire)** : `budget/sauvegarde` (export, conforme à la décision « export manuel »), `dettes/soldees`, `epargne/versement`, `zakat/bien`. À garder tant qu'une planche ne les remplace pas ; à noter dans `ECARTS.md`.

### Plus et compléments

| Planche | Route ou fichier | État | À changer |
| --- | --- | --- | --- |
| `Recherche` | `plus/recherche.tsx`, `features/recherche/*` | à modifier | Cherche dans la traduction française (`idx.trad`) ; doit chercher en arabe et en translittération |
| `Favoris`, `Telechargements` | `plus/favoris.tsx`, `plus/telechargements.tsx` | à modifier | `favoris.tsx` passe `trad` à `CarteVerset` |
| `Reglages` | `plus/reglages.tsx` | à modifier | Ligne « Traduction » (l. 221) et `definirTraduction` (l. 107) à retirer ; sous-écran Réglages de lecture |
| `Compte`, `CompteSupprimer`, `Connexion` | `plus/compte*`, `plus/connexion.tsx` | à vérifier | Hors ligne : suppression impossible, dit pourquoi |
| `APropos` | `plus/a-propos.tsx` | à modifier | Groupe « Traductions » (Hamidullah, alquran.cloud) à retirer des sources ; à propos garde les sources |
| `Soutenir`, `DonDeclarer`, `DonMerci` | aucune route | **manquant ou à écarter** | `supabase/migrations/004_retrait_dons.sql` indique que les dons ont été retirés volontairement. Ambigu : voir §6 |
| `EtatHorsLigne`, `Erreur`, `MiseAJour` | `useReseau`, `features/erreur/*`, `features/miseAJour/*` | à vérifier | Code support préfixé (`AUD`, `PRI`…) : `lib/codeErreur.ts` existe |
| `Construction`, `Declinaisons`, `Confort`, `Espace*` | planches de règles | sans objet | Servent de référence |

### Hors de l'app

| Planche | État dans le code |
| --- | --- |
| `HorsNotifIOS`, `HorsNotifAndroid`, `HorsCanauxAndroid` | **Partiel.** Fenêtre de 60 (`PLACES = 60`), canaux `priere-v3-*` et `rappels`, extraits d'adhan iOS en `.wav`, réplanification, tâche de fond. À comparer : cinq canaux nommés par la fiche (Prières, Rappels, Khatm, Lecture en cours, Téléchargements), `timeSensitive`, boutons « Arrêter l'appel » et « Couper pour Asr », alarmes exactes (`SCHEDULE_EXACT_ALARM` déclarée) |
| `HorsLectureIOS`, `HorsLectureAndroid` | **Partiel.** `expo-audio` avec `createAudioPlaylist`, `setActiveForLockScreen`, `updateLockScreenMetadata` dans `features/ecouter/lecteur.ts`. À vérifier : un fichier par verset, précédent/suivant = verset, pochette |
| `HorsWidgetsIOS`, `HorsWidgetsThemes`, `HorsVerrouIOS`, `HorsWidgetsAndroid` | **Manquant.** `expo-widgets` non installé |
| `HorsIleIOS` (activité en direct) | **Manquant** |
| `HorsCompteAndroid` | **Manquant.** Module natif Kotlin à écrire ; dossier `android/` présent (prebuild déjà fait) |

## 2. Thème

Source actuelle : `design/tokens.json` (copie plus ancienne), transformée par `scripts/tokens-to-theme.mjs` en `src/theme/tokens.generated.ts`. La source des livrables est `docs/sama-jamm/design-system/tokens.json` (même structure : mêmes jetons, 33 couleurs, `emeraude-aplat` déjà présent).

**Valeurs qui changent (palette A)** :

| Jeton | Thème | Actuel | Livrable |
| --- | --- | --- | --- |
| `emeraude-aplat` | veille | `#1f5f4a` | `#245747` |
| `sur-emeraude` | veille | `#0e1115` | `#d5ddd9` |
| `or-sur-emeraude` | veille | `#3f3010` | `#d8c08a` |
| `sur-emeraude-2` | veille | `#16261f` | `#c4d9cf` |
| `or` | nuit | `#b89a5e` | `#d4b77e` |
| `sur-or` | nuit | `#12161b` | `#0f1714` |
| `sur-erreur` | nuit | `#12161b` | `#0f1714` |
| `anneau-focus` | nuit | `#c9a96a` | `#d4b77e` |
| `accent-inverse` | nuit | `#c9a96a` | `#d4b77e` |
| `inverse` | nuit | `#2a323a` | `#2a3530` |
| `sur-inverse` | nuit | `#e8eaec` | `#eef1ee` |
| `marque-nuit` | fixe | `#12161b` | `#0f1714` |

Douze valeurs changent ; les textes d'usage de `emeraude-aplat`, `sur-emeraude`, `or-sur-emeraude` et `sur-emeraude-2` aussi (règle du 18 px la nuit). Espaces, rayons, ombres, zones tactiles, mise en page, échelle de texte, familles de polices : **identiques**, donc rien à régénérer de ce côté.

**Plan phase 2** : remplacer `design/tokens.json` par la version des livrables, lancer `npm run tokens`, vérifier que les écrans qui lisent `fond`/`marque-nuit` fixes (`app.json` : splash sombre `#12161b`, `plugins`) suivent.

**Grandes surfaces vertes** : `emeraudeAplat` est déjà utilisé dans 26 endroits de `.tsx`. Restent à vérifier avec `emeraude` : `ui/CalendrierDate.tsx:178` (jour choisi en fond plein), `app/plus/khatm/[id].tsx:114` (bord), `features/ecouter/ContenuEcouter.tsx:34` (texte du nom, pas un fond), `ui/ListItem.tsx:38` (c'est `emeraudeDoux`, correct), `ui/Button.tsx` (texte et contour, correct). Le `app.json` pose aussi `#1f5f4a` en dur (icône adaptative Android, couleur de notification) : natif, hors thème, à traiter avec la palette.

**Couleurs en dur** : aucune couleur hexadécimale ni `rgba()` en dehors de `tokens.generated.ts` (vérifié par recherche). **Tailles en dur** : 358 avertissements de lint (`no-restricted-syntax`), dont 122 `fontSize`/`lineHeight` littéraux, hors `src/theme/`. Les plus chargés : `typographie.ts` (échelle elle-même, exclue du lint), `app/lecteur.tsx`, `CarteSourate`, `BarreTaille`, `ContenuEcouter`, `CarteHeros`, `priere/methode`, `plus.tsx`, `(bienvenue)/langue`. Écarts d'échelle déjà vus : `translitteration` 15/24, `legendeAr` 13/20, `lecture` 18/30, `coran` 28/56 (hors des échelles fermées de `AGENTS.md` ; à comparer à `tokens.json` → `echelle-texte`).

## 3. Traduction du Coran

Aujourd'hui l'app affiche **arabe + traduction française par défaut** (`affichage: 'arabeTrad'`, `traduction: 'fr'`).

| Endroit | Détail |
| --- | --- |
| Données | `src/data/coran/fr.json` (Hamidullah via alquran.cloud, 0,9 Mo), chargé par `features/lire/coran.ts` : `traductionDe`, `versetsAvecTraduction`, `basmalaDe().trad`, `VersetPage.trad` |
| Réglages enregistrés | `stores/reglages.ts` : `traduction` (`Langue`), `affichage` (`arabeSeul` / `arabeTrad` / `tradSeule`), actions `definirTraduction`, `definirAffichage`, persistance version 7 |
| Lecteur de sourate | `app/coran/[sourate].tsx`, `features/lire/CarteVerset.tsx` (props `trad`, surlignage), `PageMushaf.tsx` |
| Lecteur audio | `app/lecteur.tsx` l. 29, 91–95, 226–230, 412 |
| Réglages de lecture | `features/lire/ReglagesLecture.tsx` (choix de traduction, affichage, aperçu `lire.apercuTraduction`), `features/lire/BarreTaille.tsx` (commentaire « arabe et traduction ») |
| Réglages (fr et ar) | `app/plus/reglages.tsx` : ligne « Traduction » (l. 221), `definirTraduction` (l. 107) ; `(bienvenue)/langue.tsx` l. 32, 46 |
| Invocations | `features/invocations/CarteInvocation.tsx` : traduction des sourates citées |
| Favoris | `app/plus/favoris.tsx` l. 7, 76 |
| Recherche | `features/recherche/moteur.ts`, `recherche.ts` : index `trad` normalisé, `traductionDe`; test `moteur.test.ts` |
| Partage | Écran supprimé ; clés `partage.ajouterTraduction*`, `partage.source` encore dans `fr.json` et `ar.json` |
| À propos | `a-propos.tsx` groupe `traductions` ; clés `sourceTraduction`, `groupes.traductions` |
| i18n | `fr.json` : `lire.tradSeule`, `arabeTrad`, `apercuTraduction`, `partage.ajouterTraduction`, `ajouterTraductionDetail`, `partage.source`, `reglages.traduction`, `traductionAucune`, `sourceTraduction`, `groupes.traductions` ; `ar.json` : équivalents (l. 269, 721–722, 746, 762, 794, 817). `demarrage.traduction` et `traduction` (slogan) sont des textes de marque : à garder |
| Widgets / notifications | Aucun widget. Pas de verset dans les notifications actuelles (à confirmer en phase 7) |
| Base | Pas de `contenu.db` : le contenu est en JSON embarqué, pas de SQLite de traduction à migrer |

**Migration de réglage** : `reglages` passe de la version 7 à 8 ; `migrate` retire `traduction` et force `affichage` à `arabeSeul` (ou supprime la clé). Le persist ignore déjà les clés inconnues ; il faut quand même nettoyer `partialize`, le type `Donnees` et le test `sonsMigration.test.ts`-style pour la nouvelle migration. Recherche : conserver l'index arabe et la translittération (`translit.json`).

**Hors périmètre** : le sens des invocations et des xassaïdes reste en français.

## 4. Dépendances

| Dépendance | Utilisation dans `src/` | Demandée par les livrables ? | Recommandation |
| --- | --- | --- | --- |
| `expo-widgets` | aucune | Oui (widgets, activité en direct) | **Ajouter** (phase 7) via `npx expo install` ; vérifier les types dans `node_modules` |
| `@react-native-community/slider` | aucune (`ui/Slider.tsx` maison) | Oui, ou `Pressable` + `PanResponder` | **Garder le `Slider` maison** (React Native d'abord), ne pas ajouter |
| `@react-native-community/datetimepicker` | aucune (`CalendrierDate.tsx` maison) | Oui (échéance des dettes) | **Garder le composant maison**, noter l'écart |
| `expo-sensors` | aucune | Oui (détecter le magnétomètre) | **Ajouter** si `QiblaSansBoussole` ne peut pas se détecter autrement (phase 6) |
| `@tanstack/react-query` | absent | Cité pour khatm et compte dans la conception | **Ne pas ajouter** sans décision (voir §6) |
| `@sentry/react-native` | absent | Cité (plantages) | **Ne pas ajouter** : « Mesures d'usage : aucune » par défaut ; décision ouverte |
| `react-native-view-shot` | 0 import | Oui (partage d'image) | **Garder**, utile à l'écran Partage (phase 4) |
| `expo-sharing` | 1 (`budget/sauvegarde.ts`) | Oui | **Garder** |
| `react-native-gesture-handler`, `react-native-worklets` | 0 import direct | Livrés avec Reanimated | **Garder** (requis par Reanimated 4 / Expo Router) |
| `lucide-react-native` | 1 (`ui/Icon.tsx`) | Non : les livrables demandent `react-native-svg` | **Garder** (icônes sur `react-native-svg`, rien à recopier) ; dépendance communautaire déjà justifiée par `Icon.tsx` |
| `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-device`, `expo-asset`, `@expo/ui`, `react-native-web`, `react-dom` | 0 import | `@expo/ui` : requis par `expo-widgets` ; `expo-asset` : plugin déclaré ; `react-native-web`/`react-dom` : cible web non voulue | **Retirer** `expo-glass-effect`, `expo-symbols`, `expo-image`, `expo-device`, `react-native-web`, `react-dom` après vérification qu'aucun plugin ni fichier de config ne les utilise ; **garder** `@expo/ui` (pour `expo-widgets`) et `expo-asset` |
| `expo-document-picker`, `expo-web-browser`, `expo-screen-capture`, `expo-task-manager`, `expo-keep-awake`, `expo-clipboard`, `expo-crypto` | 1 à 3 | Oui (import du budget, auth, capture, tâche de fond, lecture, copie, UUID) | **Garder** |
| `@expo-google-fonts/*` (6) | `theme/polices.ts` | Polices Amiri, Cormorant, Source Sans 3, Source Serif 4 ; Noto Sans Arabic et Amiri Quran en plus | **Garder** |
| `zustand`, `i18next`, `react-i18next` | stores, i18n | Zustand cité par la conception | **Garder** |
| `expo-audio`, `expo-notifications`, `expo-background-task`, `expo-sqlite`, `expo-secure-store`, `expo-local-authentication`, `expo-location`, `expo-network`, `expo-localization`, `expo-updates`, `expo-apple-authentication`, `@supabase/supabase-js`, `adhan`, `expo-router` | utilisées | Oui | **Garder** |

Contraire à « React Native d'abord » : aucune en soi ; `lucide-react-native` et `react-native-view-shot` sont des paquets communautaires justifiés. À noter que `expo-auth-session` (cité pour Google) n'est pas installé : la connexion Google passe autrement (à lire dans `features/compte/fournisseurs.ts`).

Les retraits de dépendances changent le natif : à regrouper avec l'ajout de `expo-widgets` dans un seul nouveau build.

## 5. Données

**Téléphone.** La conception prévoit trois bases : `contenu.db`, `utilisateur.db`, `budget.db`. L'app en a **une seule vraie base** :

| Conception | Existant |
| --- | --- |
| `budget.db` chiffrée, clé 256 bits dans `expo-secure-store`, `PRAGMA user_version`, migrations en transaction | **Conforme** : `features/budget/db.ts` + `schema.ts` (migrations numérotées, `VERSION_SCHEMA`) |
| `PRAGMA cipher_version` vérifié à l'ouverture | **À vérifier** : aucune occurrence de `cipher_version` dans `src/`. Si absent, ajouter la vérification (refuser d'ouvrir sinon) |
| `utilisateur.db` (réglages, favoris, progression, dhikr, téléchargements) | **Écart** : stockage clé-valeur `expo-sqlite/kv-store` via zustand `persist` (`stores/stockage.ts`). Pas de migrations SQL numérotées : les migrations sont des `migrate` de zustand |
| `contenu.db` (Coran, xassaïdes, invocations, FTS5, minutage) | **Écart** : contenu en JSON embarqué (`src/data/coran/*.json`, `invocations/hisn.json`, `features/xassaides/catalogue.json`), recherche en JavaScript. Données `src/data/ummah/` (nouvelles, non branchées) |
| Dates ISO 8601, UUID v7, argent en entiers | `lib/uuid.ts`, `lib/montant.ts` en place ; à valider au passage |

**Décision à prendre (défaut proposé)** : ne pas créer `utilisateur.db` ni `contenu.db` dans cette mise à jour. La section 2 d'`AGENTS.md` interdit de refactoriser ce qui marche ; la migration traduction passe par `migrate` de zustand. À noter en `ECARTS.md`.

**Migrations nécessaires**
1. `reglages` v7 → v8 : retirer `traduction`, forcer `affichage` à `arabeSeul` (zustand `migrate`).
2. `budget.db` : aucune migration si aucune règle produit ne change. À confirmer en phase 6 avec les planches Budget et Dettes (champ « mot de rappel », « remise du reste »).
3. Éventuelle migration du compteur et des favoris : aucune.

**Serveur (Supabase).** Existant (migrations 001–008) : `profils`, `khatms`, `khatm_membres`, `khatm_parts`, `apercus_khatm`, `khatm_signalements`; fonctions `creer_khatm`, `apercu_khatm`, `rejoindre_khatm`, `prendre_juz`, `rendre_juz`, `marquer_juz_lu`, `quitter_khatm`, `supprimer_mon_compte`, `signaler_membre`, `retirer_membre`. Écarts avec la conception : tables `favoris_sync`, `reglages_sync` et **`config_app` absentes** ; fonctions nommées `marquer_juz_lu` et `supprimer_mon_compte` (conception : `terminer_juz`, `supprimer_compte`) ; `002_khatm.sql` définit la plupart des RLS, à relire contre §« Tables ». Il manque aussi `003` (numérotation sautée). Phase 8 : fichiers de migration seulement, rien d'appliqué.

## 6. Risques et ambiguïtés

**Nouveau build natif obligatoire** (rien de cela ne marche dans Expo Go ni par mise à jour OTA) : ajout de `expo-widgets` (et `@expo/ui`), retraits de paquets natifs, module Kotlin du compte à rebours, nouveaux canaux de notification, icônes/splash dans `app.json`, éventuelle capacité Time Sensitive Notifications, App Group. `runtimeVersion` est `appVersion` : une mise à jour OTA ne doit pas partir vers un binaire sans le natif.

**Données des utilisateurs** : réglages enregistrés (migration v8, doit survivre à une valeur inconnue), clé du budget et `budget.db` (ne pas toucher), favoris (format `favorisMigration` déjà là), progression de lecture (`stores/lecture.ts`, modifié par le commit `fa434c8` : relire que l'ancienne clé est ignorée sans erreur), téléchargements de récitations (ne pas supprimer).

**Ambigus (défaut appliqué sauf avis contraire)**
1. **Dons** : les livrables décrivent `Soutenir`, `DonDeclarer`, `DonMerci`, mais le dépôt les a retirés (`004_retrait_dons.sql`). *Défaut* : ne pas les recréer ; le noter dans `ECARTS.md`. À valider.
2. **TanStack Query** : cité par `conception-du-systeme.md`, absent du dépôt, et l'ancien `AGENTS.md` en faisait une cible non adoptée. *Défaut* : ne pas l'installer ; le khatm et le compte restent comme ils sont.
3. **Sentry** : cité par la conception ; « mesures d'usage : aucune ». *Défaut* : ne pas installer.
4. **Routes** : le dépôt a des chemins différents de l'inventaire (`coran/[sourate]`, `plus/khatm/[id]`, `budget/devise`…). *Défaut* : garder les routes existantes, ajouter des redirections seulement si un lien profond de `04-structure-et-navigation.md` l'exige.
5. **`utilisateur.db` / `contenu.db`** : voir §5. *Défaut* : ne pas créer.
6. **Commit `fa434c8`** (fait avant l'audit) a retiré juz, progression et partage : la Bibliothèque ne montre plus Juz/Marque-pages/Khatm en onglets. À confirmer que c'est voulu face à la planche `Bibliotheque`.
7. **Minutage des versets** : `scripts/minutages-coran.mjs` et `src/data/ummah/` existent, non branchés. *Défaut* : si absent, pas de surbrillance.
8. **Traductions du Coran et `a-propos`** : retrait des crédits Hamidullah/alquran.cloud ; l'API alquran.cloud sert encore aux récitations (crédit à garder pour l'audio).
9. **Seuil de la nuit** : `surEmeraude2` et `orSurEmeraude` sur `emeraudeAplat` ne passent qu'à 18 px et plus ; chaque usage sous 18 px doit prendre `surEmeraude`.

## Contradictions entre l'ancien `AGENTS.md` / `CLAUDE.md` et la section 3 du nouveau

L'ancien `AGENTS.md` (générique : TanStack, Supabase comme source de vérité) a été fusionné dans le nouveau. `CLAUDE.md` existe déjà (`@AGENTS.md` + règle `Fait` + économie de tokens) et reste tel quel.

| Ancien | Nouveau (section 3 ou 2) | Résolution |
| --- | --- | --- |
| Cible : TanStack Query, Form, Start « direction technique » | React Native d'abord ; aucune mention de TanStack Form/Start ; Query cité dans la conception | Les trois sont retirés des règles ; Query ne s'installe que sur décision |
| PostgreSQL/Supabase « source de vérité » | Le budget ne quitte jamais le téléphone ; Supabase limité au compte et au khatm | Nouvelle règle gagne |
| « Aucune modification sans `Fait` à chaque demande » | « Une phase = un commit » après validation | Conservé : `Fait` donné pour les phases 2 à 8 vaut autorisation de ces phases ; un nouveau périmètre exige un nouveau `Fait` |
| « Pas de commit sans demande » | « Une phase = un commit » | Les commits de phase sont autorisés par la validation ; pas de push |
| Une librairie nouvelle exige un plan approuvé | Une ligne dans `ECARTS.md` + `npx expo install` | Plan approuvé ET ligne dans `ECARTS.md` |
| Interdiction de toute signature | Aucune règle sur les signatures | Conservée telle quelle |
| Section 3 « État réel du dépôt (6 novembre 2026) » | — | Retirée : remplacée par `AUDIT.md` |
| Sections 8, 9 et 11 (TanStack) | — | Retirées |
