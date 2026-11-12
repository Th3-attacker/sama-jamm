# Architecture

Une seule base de code React Native avec Expo (SDK 58, React Native 0.88), une app qui fonctionne d'abord hors ligne, et un backend léger qui ne sert que le contenu, l'audio et la synchronisation facultative. Installer chaque bibliothèque avec `npx expo install` pour obtenir la version compatible avec le SDK.

Règle de choix : React Native de base d'abord, puis un paquet Expo, puis un paquet de la communauté seulement quand ni l'un ni l'autre ne suffit. Le détail écran par écran est dans la fiche technique (https://claude.ai/artifact/QZ3Shi7417TUeoU1BfKwNt) ; le système de bout en bout (bases, serveur, flux, sécurité, tests) dans la conception du système (https://claude.ai/artifact/2aq4hMBhjbzoHvz6JVDcoH).

## Pile technique

| Besoin | Bibliothèque | Règle |
| --- | --- | --- |
| Langage | TypeScript strict | `strict: true`, aucun `any` dans `src/` |
| Navigation | `expo-router` | Routes par fichiers, onglets et piles ; voir Structure et navigation |
| Thème | `tokens.json` → `src/theme/tokens.generated.ts` | Script `scripts/tokens-to-theme.mjs`, jamais de couleur en dur |
| Polices | `expo-font` + paquets `@expo-google-fonts/*` | Chargées avant de masquer l'écran de démarrage |
| Données locales | `expo-sqlite` (FTS5, SQLCipher pour le budget) | Trois bases, voir plus bas |
| Secrets | `expo-secure-store` | Clé de la base du budget, jeton de session |
| Verrou | `expo-local-authentication` | Empreinte, visage ou code du téléphone pour ouvrir le budget |
| Horaires de prière | `adhan` | Calcul sur le téléphone, aucun serveur |
| Position et cap | `expo-location` | Position une fois (ou ville choisie) ; `watchHeadingAsync` pour la qibla |
| Notifications | `expo-notifications` | Locales, fenêtre glissante de 60 (voir Prières et rappels) |
| Audio | `expo-audio` | Lecture en arrière-plan, écran verrouillé (`setActiveForLockScreen`), une sourate = une liste d'un fichier par verset (`AudioPlaylist`) |
| Téléchargements | `expo-file-system` | Sourates et récitations dans le dossier documents |
| Listes longues | `FlatList` et `SectionList` de React Native | 114 sourates, versets, historique du budget ; `@shopify/flash-list` seulement si une mesure montre une saccade |
| Feuilles du bas | `Modal` de React Native, ou présentation `formSheet` d'Expo Router | Récitateur, minuterie, ajout d'une dépense ; `@gorhom/bottom-sheet` seulement si les crans ne suffisent pas |
| Retour haptique | `expo-haptics` | Dhikr, objectif atteint, qibla trouvée, pavé numérique |
| Partage | `react-native-view-shot` + `expo-sharing` | Image de verset 1080 × 1080 |
| Langues | `i18next`, `react-i18next`, `expo-localization` | fr, wo, ar ; textes arabes en blocs RTL |
| État de l'interface | `zustand` | Réglages, lecture en cours ; persistés dans la base utilisateur |
| Données distantes | `@supabase/supabase-js` + `@tanstack/react-query` | Seulement pour le compte et le khatm collectif |
| Plantages | `@sentry/react-native` | Sans données personnelles, sans montant du budget |
| Widgets et activité en direct | `expo-widgets` | Prochaine prière, cinq horaires, Reprendre ; activité en direct et Dynamic Island sur iPhone (voir Hors de l'app) |
| Tâche de fond | `expo-background-task` | Une fois par jour au mieux : horaires, notifications, widgets |
| Compte à rebours Android | Module natif maison (API Expo Modules, Kotlin) | Notification continue avec minuteur ; pastille sur Android 16 |
| Builds et mises à jour | EAS Build, EAS Submit, EAS Update | `runtimeVersion` par empreinte (`fingerprint`) |

## Dossiers

```
app/                         écrans (Expo Router)
  _layout.tsx                polices, thème, i18n, écran de démarrage
  (bienvenue)/               langue, position, rappels
  (onglets)/                 Accueil, Lire, Écouter, Prière, Budget
  plus/                      recherche, favoris, téléchargements, réglages, compte
src/
  theme/                     tokens.generated.ts, ThemeProvider.tsx, useTheme.ts, veille.ts
  ui/                        un fichier par composant du design system
  i18n/                      fr.json, wo.json, ar.json, index.ts
  data/                      contenu.ts, utilisateur.ts, budget.ts (accès aux bases)
  features/
    priere/                  horaires.ts (adhan), rappels.ts (notifications), qibla.ts
    lecture/                 recherche.ts, favoris.ts, progression.ts
    audio/                   lecteur.ts, telechargements.ts, minuterie.ts
    budget/                  cycle.ts, enveloppes.ts, zakat.ts, devises.ts
    khatm/                   khatm.ts (Supabase Realtime)
  lib/                       montant.ts, dates.ts (calendrier hégirien), haptique.ts
assets/
  fonts/  images/  sons/     appels à la prière (30 s au plus pour iOS)
  db/contenu.db              base des textes livrée avec l'app
scripts/tokens-to-theme.mjs
```

## Données

| Base | Contenu | Écriture | Chiffrée |
| --- | --- | --- | --- |
| `contenu.db` | Coran (texte arabe, translittération ; aucune traduction), xassaïdes, invocations et leur sens, index FTS5 | Lecture seule ; remplacée en entier par une mise à jour de contenu | Non |
| `utilisateur.db` | Réglages, favoris, progression de lecture, compteur de dhikr, fil de régularité, téléchargements | L'app | Non (rien de sensible) |
| `budget.db` | Carnets, comptes, enveloppes, opérations, objectifs, zakat | L'app | Oui (SQLCipher, clé dans `expo-secure-store`) |

- Hors ligne d'abord : tout ce qui est lu, prié ou compté marche sans réseau. Le réseau ne sert qu'au téléchargement audio, au khatm collectif et à la synchronisation du compte.
- Migrations : un numéro de version par base (`PRAGMA user_version`), migrations écrites en SQL dans `src/data/migrations/`, jouées au démarrage.
- Argent : entiers uniquement (voir Budget du foyer). Aucune colonne `REAL` pour un montant.
- Mise à jour du contenu : `contenu.db` versionnée (`contenu_version`), téléchargée depuis le stockage Supabase, vérifiée par empreinte SHA-256 avant remplacement.

## Backend (facultatif en v1)

- **Supabase** : authentification (e-mail sans mot de passe, Apple, Google), Postgres, stockage, Realtime.
- Tables : `profils`, `khatms`, `khatm_parts` (une ligne par juz : `khatm_id`, `juz`, `etat`, `profil_id`, `maj_le`), `favoris_sync`, `reglages_sync`. Règles d'accès (RLS) : chacun ne lit que ses lignes et les khatms dont il est membre.
- Le budget n'est **jamais** envoyé au serveur en v1. Sauvegarde : export chiffré dans un fichier que l'utilisateur range où il veut.
- Audio : fichiers MP3 derrière un CDN, un dossier par récitateur, un fichier par sourate et par verset (pour la lecture verset par verset).
- Suppression du compte : fonction serveur qui efface le profil, les favoris et réglages synchronisés et les parts de khatm, puis l'utilisateur d'authentification ; accessible dans l'app (Plus › Compte) et par une page web déclarée dans les fiches.

## Sécurité et vie privée

- Aucune publicité, aucun traceur publicitaire, aucun SDK de profilage.
- Position : utilisée sur le téléphone pour les horaires et la qibla, jamais envoyée. Une ville choisie à la main remplace la position.
- Sentry : `sendDefaultPii: false`, aucun montant ni texte saisi dans les événements.
- Le budget s'ouvre derrière `expo-local-authentication` si l'utilisateur l'active ; les montants peuvent être masqués d'un geste (« ••• »).
- Les fiches confidentialité des stores déclarent exactement ce qui précède (voir Publication).

## Environnements et builds

| Profil EAS | Usage | Canal EAS Update |
| --- | --- | --- |
| `development` | Build de développement (`expo-dev-client`), tests des modules natifs | `development` |
| `preview` | Testeurs : TestFlight interne, test fermé Google Play | `preview` |
| `production` | Stores | `production` |

- Expo Go ne suffit pas : icônes, écran de démarrage, SQLCipher, audio en arrière-plan et notifications personnalisées demandent un build de développement.
- EAS Update ne transporte que du JavaScript et des images ; une nouvelle bibliothèque native impose un nouveau build et une revue.
