# Sama Jàmm · fiche technique de la maquette

Nov 11, 2026 · @ELhadj Malick

Ce que demande à React Native chaque partie de la maquette, de la première planche aux widgets. Pour chaque élément : d'abord ce que React Native fait seul, avec ses composants de base ; ensuite Expo, seulement là où React Native ne suffit pas ; en dernier, un paquet de la communauté. À lire avant d'ouvrir Claude Code. Base : Expo SDK 58, build de développement.

## Le principe : React Native d'abord

Chaque élément de la maquette passe par trois questions, dans cet ordre.

1. **React Native de base** : les composants et les API livrés avec React Native (`View`, `Text`, `FlatList`, `Pressable`, `Switch`, `Modal`, `Share`, `Linking`…). Rien à installer. On commence toujours par là.
2. **Expo** : un paquet `expo-…`, seulement quand React Native n'a rien, ou trop peu (la position, le son, la boussole, une base chiffrée).
3. **Communauté** : un paquet tiers quand ni l'un ni l'autre ne suffit. La plupart sont déjà testés avec Expo (`react-native-svg`, `react-native-safe-area-context`, `react-native-reanimated`).

Deux changements récents de React Native comptent pour Sama Jàmm. Depuis la version 0.81, `SafeAreaView` est obsolète : on utilise `react-native-safe-area-context`. Et Android 16 impose l'affichage bord à bord, sans possibilité de refuser : l'app dessine sous la barre d'état et la barre de navigation, et c'est à elle de laisser la marge.

Dans les tableaux qui suivent, la colonne « React Native » dit ce qu'on construit avec la base ; la colonne « Si ça ne suffit pas » ne s'ajoute que quand c'est nécessaire. Un tiret veut dire : rien d'autre à ajouter.

## La boîte à outils de React Native

Ce que React Native fournit sans rien installer, et où on s'en sert dans la maquette. La grande majorité des planches se construit avec cette seule liste.

| Composant ou API | Ce qu'il fait | Où dans la maquette |
| --- | --- | --- |
| `View` | Boîte de mise en page (flexbox) | Toutes les cartes, lignes, barres, la grille du khatm |
| `Text` | Texte ; un `Text` dans un `Text` met un mot en valeur | Tout le texte, le verset récité en lumière, le mot trouvé surligné |
| `Image`, `ImageBackground` | Images | Logo, marque, pochettes de récitateur |
| `ScrollView` | Défilement d'un contenu court | Accueil, Réglages, Zakat, fiches de détail |
| `FlatList` | Longue liste rendue au fil du défilement, horizontale ou paginée | 114 sourates, versets d'une sourate, pages du Mushaf, récitateurs |
| `SectionList` | Liste par groupes | Historique du budget par jour, villes par pays, invocations par moment |
| `Pressable` | Toute zone qui se touche | Boutons, cartes, onglets, puces, cercle du dhikr, pavé numérique |
| `TextInput` | Saisie au clavier | Recherche, montants, notes, noms, e-mail |
| `Switch` | Interrupteur natif | Bienvenue, rappels, Wi-Fi seulement, synchronisation |
| `Modal` | Écran ou feuille par-dessus | Réglages de lecture, minuterie, formule du dhikr, confirmations |
| `ActivityIndicator` | Attente | Chargement des récitations |
| `RefreshControl` | Tirer pour actualiser | Khatm, téléchargements |
| `KeyboardAvoidingView` | Garde le champ visible au-dessus du clavier | Formulaires du budget, connexion |
| `StatusBar` | Couleur de la barre d'état | Bienvenue en émeraude, lecture de nuit |
| `Animated`, `Easing`, `LayoutAnimation` | Animations | Barre d'écoute qui s'ouvre, anneau du dhikr, outils du lecteur |
| `PanResponder` | Gestes simples | Glisser la barre d'écoute, réglette du mode page |
| `Alert` | Boîte de dialogue native | « Supprimer cette dépense ? » |
| `Share` | Feuille de partage du système | Partager un verset en texte, inviter au khatm, mot de rappel d'une dette |
| `Linking` | Ouvre un lien, reçoit un lien | Invitation au khatm, réglages du téléphone, store, aide |
| `Appearance`, `useColorScheme` | Thème clair ou sombre du téléphone | Apparence « Auto » |
| `useWindowDimensions`, `PixelRatio` | Taille de la fenêtre, taille du texte système | Trois classes de largeur, texte à 200 % |
| `I18nManager` | Sens droite à gauche | Interface en arabe |
| Props d'accessibilité, `AccessibilityInfo` | Lecteur d'écran, réduction des animations | Toutes les planches : chaque `aria-label` de la maquette devient un `accessibilityLabel` |
| `AppState` | L'app revient au premier plan | Recalculer les horaires, replanifier les rappels, reverrouiller le budget |
| `Keyboard`, `BackHandler` | Clavier, bouton retour d'Android | Fermer le clavier, fermer une feuille |
| `PermissionsAndroid` | Permissions Android | Notifications sur Android 13 et plus |
| `Platform` | iOS ou Android | Les écarts entre les planches iPhone et Android |
| `Vibration` | Vibration simple | Voir `expo-haptics`, plus juste sur iPhone |
| `Intl` (moteur Hermes) | Dates et nombres formatés | « Jeudi 29 octobre », « 137 500 MRU », chiffres arabes ١٢٣ |

## Ce que React Native n'a pas

La liste complète des paquets à ajouter, chacun pour une raison précise. Expo en premier ; la communauté seulement quand Expo n'a rien.

| Besoin | Pourquoi React Native ne suffit pas | Paquet retenu |
| --- | --- | --- |
| Naviguer entre les écrans, onglets | React Native n'a pas de navigation | `expo-router` |
| Marges des encoches et des barres système | `SafeAreaView` obsolète, Android 16 bord à bord | `react-native-safe-area-context` (communauté, livré avec Expo) |
| Polices Amiri, Cormorant Garamond, Source Sans 3, Source Serif 4 | React Native les affiche mais ne les embarque pas seul | `expo-font` |
| Dessins : arc du jour, anneaux, boussole | Pas de SVG dans React Native | `react-native-svg` (communauté, livré avec Expo) |
| Position | Rien | `expo-location` |
| Boussole | Rien | `expo-location` (`watchHeadingAsync`), `expo-sensors` pour savoir s'il y a un magnétomètre |
| Vibration légère | `Vibration` est forte et sans nuance sur iPhone | `expo-haptics` |
| Son, lecture en arrière-plan | Rien | `expo-audio` |
| Fichiers, téléchargements avec pause et reprise | Rien | `expo-file-system` (`DownloadTask`) |
| Données du budget chiffrées | Pas de stockage dans React Native | `expo-sqlite` avec SQLCipher, clé dans `expo-secure-store` |
| Verrou du budget | Rien | `expo-local-authentication` |
| Copier un texte | Le presse-papiers a quitté React Native | `expo-clipboard` |
| Partager une image | `Share` partage du texte et un lien, pas un fichier sur Android | `react-native-view-shot` (communauté) pour faire l'image, `expo-sharing` pour l'envoyer |
| Garder l'écran allumé pendant la lecture | Rien | `expo-keep-awake` |
| Réseau, Wi-Fi seulement | Rien | `expo-network` |
| Langue du téléphone | Rien | `expo-localization` |
| Écran de démarrage, icônes | Partie native du projet | `expo-splash-screen`, configuration `app.json` |
| Version installée, mises à jour | Rien | `expo-application`, `expo-updates` |
| Connexion Apple ou Google | Rien | `expo-apple-authentication`, `expo-auth-session` |
| Notifications, widgets, activité en direct | Rien | `expo-notifications`, `expo-widgets` (voir Hors de l'app) |
| Curseur : position dans la sourate, réglette | Le curseur a quitté React Native | `@react-native-community/slider`, ou `Pressable` + `PanResponder` |
| Choisir une date | Le sélecteur de date a quitté React Native | `@react-native-community/datetimepicker` |
| Gestes et animations fluides | `Animated` et `PanResponder` suffisent, mais saccadent sur un geste suivi au doigt | `react-native-gesture-handler`, `react-native-reanimated` (communauté, livrés avec Expo) |

Pas un paquet mais du JavaScript : le calcul des horaires et de la qibla avec la bibliothèque `adhan`, qui tourne sur le téléphone sans réseau.

## Les composants du design system en React Native

Les composants de la maquette (`SamaJamm.*`) deviennent des composants React maison, construits sur la base de React Native. Un seul fichier par composant, stylé avec les jetons de couleur, de taille et d'espace.

| Composant de la maquette | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Button, IconButton | `Pressable` + `Text`, retour visuel avec l'état `pressed` | `react-native-svg` pour l'icône |
| ListGroup, ListItem | `View` + `Pressable` ; dans une longue liste, une ligne de `FlatList` | — |
| Switch | `Switch` avec `trackColor` et `thumbColor`. Sur iPhone sa taille est fixe, très proche des 52 × 32 de la maquette | — |
| SegmentedControl, Chip, RadioGroup | `Pressable` dans une `View`, avec `accessibilityRole` (`radio`, `tab`) et `accessibilityState` | — |
| TextField, SearchField | `TextInput` (`keyboardType`, `autoComplete`, `returnKeyType`) | — |
| Keypad, AmountDisplay | Grille de `Pressable` + `Text` ; montant formaté avec `Intl.NumberFormat` | `expo-haptics` au toucher |
| Banner, Badge, EmptyState | `View` + `Text` | — |
| ProgressBar | Une `View` dans une `View`, largeur en pourcentage, `Animated` pour la transition | — |
| BottomSheet | `Modal` (`presentationStyle="pageSheet"` sur iPhone), ou `Modal` transparent + `Animated` | `expo-router` en feuille (`formSheet`) avec des crans de hauteur |
| Dialog | `Alert` pour une confirmation simple, entièrement native ; `Modal` transparent pour la version dessinée | — |
| KhatmGrid | `View` en `flexWrap`, 30 cases | — |
| QiblaCompass | `View` tournée avec `transform: rotate` et `Animated` | `react-native-svg`, `expo-location`, `expo-haptics` |
| ReadingCard | `View` + `Text` arabe (`writingDirection: 'rtl'`) | `expo-font` (Amiri) |
| AudioPlayer (barre d'écoute) | `Pressable` + `Text`, `Animated` pour l'ouverture | `expo-audio` ; `react-native-gesture-handler` et `react-native-reanimated` pour la glisser |
| TabBar | — : React Native n'a pas d'onglets | `expo-router` (`NativeTabs`) : barre native, verre sur iOS 26, Material sur Android (décision du 8 novembre) |

## Démarrage et bienvenue

Planches : Démarrage natif clair et sombre, Bienvenue 1 à 3, Avant la demande de position, Avant la demande de notifications.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Démarrage clair et sombre, marque au centre | — : s'affiche avant que React Native démarre | `expo-splash-screen` : image de 200 dp, fond ivoire, variante sombre |
| Choix Français ou العربية | Deux `Pressable` en `radio` ; si arabe, `I18nManager.forceRTL(true)` | `expo-localization` pour proposer d'emblée la langue du téléphone ; `expo-updates` (`reloadAsync`) car le sens droite à gauche demande de relancer l'app |
| Points d'étape, Continuer, retour | `View`, `Pressable` | — |
| Pastille « Prochaine Asr » de Bienvenue 2 | `View` ronde + `Text` | Calcul : `adhan` |
| Notification d'exemple de Bienvenue 3 | `View` dessinée : ce n'est pas une vraie notification | — |
| Interrupteurs Appel, Rappel, Veille | `Switch` | — |
| Écrans d'explication avant chaque demande | `View`, `Text`, `Pressable` | — |
| Demande de position | — | `expo-location` (`requestForegroundPermissionsAsync`) |
| Demande de notifications | `PermissionsAndroid` (`POST_NOTIFICATIONS`) sur Android 13 et plus ; rien sur iPhone | `expo-notifications` (`requestPermissionsAsync`), qui couvre les deux |
| Position refusée : choisir une ville | `TextInput` + `SectionList` | Liste des villes embarquée dans l'app (fichier JSON avec latitude et longitude) |

## Accueil, barre d'onglets et recherche

Planches : Accueil, Composant · barre d'onglets, Recherche.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Barre de cinq onglets | — : React Native n'a pas d'onglets | `expo-router` (`NativeTabs`, barre native) ; `react-native-safe-area-context` pour la marge du bas |
| « Jàmm nga am ? » et la date | `Text` ; date avec `Intl.DateTimeFormat('fr')` | `expo-font` |
| Prochaine prière : 42 min, 16:35 | `Text`, mis à jour chaque minute avec un minuteur, relancé par `AppState` au retour dans l'app | Calcul : `adhan` |
| Ligne des cinq prières avec points | `View` (ligne et ronds) possible | `react-native-svg` pour la ligne pointillée |
| Cartes Reprendre, Khatm, Budget, Dhikr | `Pressable` + `View`, grille en `flexWrap` | `react-native-svg` pour l'anneau du dhikr |
| Grille des 30 juz | `View` en `flexWrap` | — |
| Continuer l'écoute | `Pressable` | `expo-audio` |
| Wax ju rafet | `Text` | — |
| Champ de recherche, filtres Tout, Coran, Xassaïdes, Invocations | `TextInput`, `Pressable` | — |
| Résultats avec le mot surligné | `FlatList` ; `Text` imbriqué pour le surlignage | Index local pour chercher sans réseau : `expo-sqlite` (recherche plein texte) |
| « Cherchez comme vous parlez » | Normalisation en JavaScript : ignorer voyelles et signes arabes, et les accents de translittération (ḥ, ʿ, ā) | — |

## Lire : le Coran

Planches : Bibliothèque, Lecteur ligne continue, Lecteur pendant la récitation, Mode page Mushaf ivoire, Réglette au toucher, Lecteur en Veille, Réglages de lecture, Partager un verset.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Lire ou Écouter ; Sourates, Juz, Marque-pages, Khatm | `Pressable` en onglets | — |
| Liste des 114 sourates | `FlatList` avec `getItemLayout` pour un défilement instantané | — |
| Verset en arabe | `Text` en police coranique, `writingDirection: 'rtl'`, `textAlign: 'right'` | `expo-font` ; police à choisir (Amiri Quran ou KFGQPC Uthmani) |
| Translittération, seulement si activée | `Text` sous le verset, affiché selon le réglage | Réglage gardé avec `expo-sqlite` |
| Les versets d'une sourate | `FlatList` (jusqu'à 286 versets) | — |
| Verset récité en lumière | `Text`, style changé selon la position du son | `expo-audio` (position) + l'horaire de chaque verset dans l'audio : données à fournir |
| Mode page, Mushaf ivoire | `FlatList` horizontale paginée (`pagingEnabled`, `inverted` pour l'ordre arabe) | Pour une page identique au Mushaf imprimé : une police par page (QCF) ou des images de pages. À décider |
| Réglette au toucher | `Pressable` + `PanResponder` | `@react-native-community/slider` |
| Outils qui apparaissent au toucher | `Pressable` + `Animated` | — |
| Veille : lumière atténuée jusqu'à Fajr | Thème de l'app (couleurs Veille) choisi selon l'heure | `expo-keep-awake` pendant la lecture ; `expo-brightness` seulement si on veut vraiment baisser l'écran |
| Réglages de lecture en feuille | `Modal` | `expo-router` en `formSheet` |
| Taille de l'arabe, chiffres ١٢٣ | `Pressable`, `fontSize` ; chiffres avec `Intl.NumberFormat('ar')` | — |
| Marque-page | `Pressable` | `expo-haptics`, `expo-sqlite` |
| Partage : trois styles, carré ou story | L'image est une `View` dessinée ; choix avec `Pressable` | `react-native-view-shot` (communauté) pour en faire une image, `expo-sharing` pour l'envoyer |
| Partager le texte et le lien | `Share` | — |
| Copier le texte | — | `expo-clipboard` |

## Lire : écouter et xassaïdes

Planches : Barre d'écoute, Lecteur ouvert, Lecteur défilé, Récitateur, Minuterie et répétition, Xassaïdes, Chant.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Barre d'écoute au-dessus des onglets | `View` en position absolue + `Pressable` | `expo-audio` ; `react-native-safe-area-context` |
| Lecteur qui s'ouvre en glissant vers le haut | `Animated` + `PanResponder` | `react-native-gesture-handler` + `react-native-reanimated` pour suivre le doigt sans saccade |
| Position dans la sourate, temps écoulé et restant | `Text` | `@react-native-community/slider` ; `expo-audio` (`seekTo`) |
| Verset précédent et suivant, répéter | `Pressable` | `expo-audio` : liste de lecture d'un fichier par verset (`AudioPlaylist`) |
| Vitesse | `Pressable` | `expo-audio` (vitesse de lecture) |
| Minuterie de sommeil | `Modal`, `Pressable` | Un minuteur JavaScript peut s'endormir app en arrière-plan : arrêter plutôt à la fin d'une liste de lecture calculée. À tester |
| Lecteur défilé : verset en cours, à suivre, récitateur | `ScrollView` | — |
| Récitateur, tout télécharger | `FlatList`, `Pressable` | `expo-file-system` (`DownloadTask`, avec pause et reprise) |
| Xassaïdes : recueils, auteurs, reprendre | `FlatList`, `Pressable` en filtres | — |
| Chant : le vers chanté s'illumine | `Text`, style selon la position du son | `expo-audio` + l'horaire de chaque vers : ces données n'existent pas, il faut les créer pour chaque enregistrement |
| Texte en wolofal | `Text` de droite à gauche | Vérifier que la police arabe affiche les lettres propres au wolofal |

## Lire : invocations

Planches : Invocations par moment, Liste du moment, Lecteur et compteur.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| « Maintenant · après Fajr » | `Text`, moment choisi d'après l'heure | Heures des prières : `adhan` |
| Moments, liste du moment, favorites | `FlatList` ou `SectionList`, `Pressable` | — |
| Invocation : arabe, translittération, source | `ScrollView`, `Text` | `expo-font` |
| Compter 1 sur 3 | `Pressable` + `Text` | `expo-haptics` à chaque compte |
| Précédente, suivante | `Pressable` ; ou `FlatList` horizontale paginée pour glisser | — |
| Progression du jour (1 sur 12) | `Text` | Gardée avec `expo-sqlite` |

## Prière : horaires, rappels, qibla, dhikr

Planches : Horaires, Méthode de calcul, Appel et rappels, Qibla, Qibla trouvée, Qibla sans boussole, Dhikr, Formule et objectif.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Les cinq horaires, noms wolof et arabes | `View`, `Text` | Calcul : `adhan` ; position : `expo-location` |
| Arc de la journée | — | `react-native-svg` |
| Cloche d'appel par prière | `Pressable` | `expo-notifications` pour replanifier |
| Méthode, heure d'Asr, ajustements à la minute | `Pressable` en radio et segmenté, `Text` | Paramètres d'`adhan` (méthode, école pour Asr, ajustements) |
| Appel et rappels prière par prière | `Switch` | `expo-notifications` |
| Bandeau « Autorisez les alarmes exactes » | `Linking.openSettings()` | `expo-notifications` (`requestExactAlarmPermissionsAsync`) |
| Boussole de la qibla | `View` tournée (`transform: rotate`) + `Animated` | `expo-location` (`watchHeadingAsync`, cap vrai) ; angle de la qibla calculé avec `adhan` |
| Qibla trouvée : une vibration | `Vibration` (une fois) | `expo-haptics` (vibration de réussite), plus douce |
| Pas de boussole : 76° depuis le nord | `Text` | `expo-sensors` (`Magnetometer.isAvailableAsync`) pour le détecter |
| Dhikr : toucher le cercle, légère vibration, remise à zéro | `Pressable`, `Text`, `Animated` | `expo-haptics` (impact léger) ; `react-native-svg` pour l'anneau |
| Formule et objectif en feuille | `Modal`, `Pressable` en radio | — |

## Budget : le cycle du mois

Planches : Premier usage, Le mois, Jour de paie, Ajouter une dépense, Ajouter un revenu, Détail d'une enveloppe, Historique, Modifier une opération, Bilan du cycle, Comptes, Devise, Verrou.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| « Tout reste sur ce téléphone, chiffré » | — : React Native ne stocke rien | `expo-sqlite` avec SQLCipher (option `useSQLCipher`, puis `PRAGMA key`) ; clé générée et gardée dans `expo-secure-store`. Vérifier avec `PRAGMA cipher_version` : sans SQLCipher, la clé est ignorée sans erreur et la base reste en clair |
| Montants en MRU | `Text` ; `Intl.NumberFormat` (espace entre les milliers) | — |
| Devise, jour de paie, enveloppes | `Pressable` en segmenté et en puces, `TextInput` | — |
| Pavé numérique | Grille de `Pressable` | `expo-haptics` |
| Dépense, revenu, note | `TextInput`, `Pressable`, `KeyboardAvoidingView` | — |
| Reste à vivre, enveloppes, barres | `View`, `Text` | — |
| Historique par jour, filtres | `SectionList`, `Pressable` en puces | — |
| Modifier, supprimer une opération | `TextInput` ; `Alert` pour la confirmation | — |
| Bilan du cycle, clôturer | `View`, `Pressable` | — |
| Comptes : espèces, mobile money, banque | `View` ou `FlatList` | — |
| Ajouter sa devise, aperçu | `TextInput`, `Pressable` | — |
| Verrou : empreinte, visage ou code | — | `expo-local-authentication` ; `AppState` pour reverrouiller quand l'app passe en arrière-plan |

## Budget : épargne, dettes et zakat

Planches : Épargne, Nouvel objectif, Dettes, Nouvelle dette, Détail d'une dette, Remboursement, Zakat, Biens comptés.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Objectifs avec leur intention, rythme par paie | `View`, `Text`, `TextInput` | — |
| Dettes : sens, personne, montant | `Pressable` en segmenté, `TextInput` | — |
| Échéance (facultative) | — : pas de sélecteur de date | `@react-native-community/datetimepicker` |
| « Écrire un mot de rappel » | `Share` (texte vers WhatsApp, SMS…) | — |
| Remboursement, faire remise du reste | Pavé en `Pressable`, `Pressable` en puces pour la date | — |
| Zakat : biens, nisab, estimation à 2,5 % | `Text`, `TextInput`, calcul en JavaScript | — |
| Cours de l'or | Saisi par l'utilisateur, ce qui garde l'app sans réseau | Pour un cours du jour : un appel réseau vers une source à choisir |
| Date hégirienne | `Intl.DateTimeFormat` avec le calendrier islamique : le support par Hermes est à vérifier | Sinon, un petit calcul en JavaScript |
| « Me le rappeler » | — | `expo-notifications` |

## Plus : khatm, compte, réglages

Planches : Tout Sama Jàmm, Khatm collectif, Créer et inviter, Invitation, Favoris, Téléchargements, Connexion, Compte, Suppression, Réglages, À propos.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Khatm : grille, prendre un juz, continuer | `View`, `Pressable`, `RefreshControl` | Un serveur (Supabase par exemple), puisqu'on lit à plusieurs |
| Créer et inviter par WhatsApp ou SMS | `TextInput`, `Switch`, `Share` pour le lien | Lien qui ouvre l'app : `expo-router` + liens universels iOS et App Links Android (`app.json`) |
| Ouvrir une invitation | `Linking` reçoit le lien | `expo-router` mène au bon écran |
| Favoris, filtres | `FlatList`, `Pressable` en puces | `expo-sqlite` |
| Téléchargements : place utilisée, en cours, supprimer | `FlatList`, `Pressable` | `expo-file-system` (taille, suppression, `DownloadTask` avec pause et reprise) |
| « Seulement en Wi-Fi » | `Switch` | `expo-network` (type de connexion) |
| Connexion Apple, Google, lien par e-mail | `Pressable`, `TextInput` | `expo-apple-authentication`, `expo-auth-session` ; le lien e-mail revient par `Linking` |
| Compte, synchronisation | `Switch`, `Text` | Serveur |
| Supprimer le compte | `Alert` ou `Modal` | Serveur ; la suppression dans l'app est exigée par l'App Store |
| Thème Auto, Jour, Nuit, Veille | `Appearance`, `Pressable` en segmenté | — |
| Taille du texte | `Pressable`, `fontSize` | — |
| Langue de l'app | `I18nManager` | `expo-localization`, `expo-updates` pour relancer |
| À propos : version, sources | `Text`, `Linking` | `expo-application` (numéro de version) |

**Écart avec la maquette** : Réglages et Réglages en arabe montrent encore une ligne « Traduction · Français » (« الترجمة »), alors que le Coran est désormais en arabe seul. À retirer des deux planches.

## États et système

Planches : Hors ligne, Position refusée, Favoris vides, Erreur générale, Mise à jour obligatoire.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Bandeau et badges « Hors ligne » | `View`, `Text` | `expo-network` (écoute des changements de réseau) |
| Position refusée : chercher une ville | `TextInput` + `SectionList` | Liste des villes embarquée |
| Favoris vides | `View`, `Text` | — |
| Erreur avec un code à donner au support | `Text` sélectionnable (`selectable`) | `expo-clipboard` pour un bouton Copier |
| Mise à jour obligatoire, Mettre à jour | `Linking.openURL` vers la fiche du store | `expo-application` (version installée) ; version minimale lue sur un serveur ; `expo-updates` pour corriger le JavaScript sans passer par le store |

## Interface en arabe, de droite à gauche

Planches : Arabe · accueil, bibliothèque, invocations, liste du moment, lecteur et compteur, réglages.

Ici React Native fait presque tout seul. Avec `I18nManager.forceRTL(true)`, les rangées (`flexDirection: 'row'`) s'inversent d'elles-mêmes, et les marges `marginStart` et `marginEnd` suivent le sens de lecture. Il faut donc écrire `start` et `end`, jamais `left` et `right`.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Miroir de toute l'interface | `I18nManager.allowRTL` et `forceRTL` | `expo-localization` (`supportsRTL` dans `app.json`) ; le changement demande une relance : `expo-updates` (`reloadAsync`) |
| Flèches de retour et de suite | `transform: [{ scaleX: -1 }]` quand `I18nManager.isRTL` | — |
| Chiffres ٠ à ٩ en option | `Intl.NumberFormat('ar-EG')` ou une table de dix chiffres | — |
| Textes arabes de l'interface | `Text` | `expo-font` |
| Mots wolof et translittérations dans une page arabe | `Text` avec `writingDirection: 'ltr'` pour ce passage | — |

## Espace et mise en page

Planches : La pile du bas, Icônes d'onglet, Trois classes de largeur, Densité et défilement, Cas limites.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Pile du bas : onglets, barre d'écoute, compteur, outils | `View` en position absolue ; hauteurs mesurées avec `onLayout` | `react-native-safe-area-context` (`useSafeAreaInsets`) ; hauteur réelle de la barre d'onglets fournie par `expo-router` |
| Icônes d'onglet | — | `react-native-svg` (les tracés de la maquette se reprennent tels quels) |
| Trois classes de largeur : barre en bas, en haut ou rail à gauche | `useWindowDimensions` pour choisir la disposition | La disposition des onglets se code avec `expo-router` |
| Densité, défilement | `ScrollView`, `FlatList` | — |
| Texte à 200 % | `Text` suit la taille système ; `maxFontSizeMultiplier` là où la mise en page casserait ; `PixelRatio.getFontScale()` | — |
| Android 16 bord à bord | — | `react-native-safe-area-context` ; couleur des barres système avec `expo-system-ui` |
| Accessibilité | `accessibilityLabel`, `accessibilityRole`, `accessibilityState` ; `AccessibilityInfo.isReduceMotionEnabled()` pour couper les animations | — |

## Identité : icônes et démarrage

Planches : Le logo retenu, Construction, Déclinaisons, Icônes iOS et Android, Écran de démarrage toutes tailles, Confort visuel.

Tout se passe avant que React Native démarre, dans la partie native du projet : React Native n'y intervient pas. Expo le règle par la configuration.

| Élément | React Native | Si ça ne suffit pas |
| --- | --- | --- |
| Icône iOS par défaut, sombre, teintée | — | `app.json` (`ios.icon` avec ses variantes) ; pour Liquid Glass d'iOS 26, le fichier Icon Composer. Le format exact est à vérifier avec la version d'Expo |
| Icône Android adaptative et à thème | — | `app.json` (`android.adaptiveIcon` : premier plan, fond, monochrome) |
| Icône de notification Android | — | Plugin `expo-notifications` (icône et couleur) |
| Démarrage clair et sombre, toutes tailles | — | `expo-splash-screen` (image de 200 dp, variante sombre) |
| Logo dans l'app (À propos, Bienvenue) | `Image` | — |
| Thèmes Jour, Nuit, Veille (Confort visuel) | `Appearance` + jetons de couleur en JavaScript | — |

## Hors de l'app : ce que React Native fait seul

Planches : la page « Hors de l'app », notifications, lecture sur l'écran verrouillé, widgets, activité en direct, compte à rebours.

Ici, React Native fait très peu. Il ne sait pas planifier une notification, jouer un son écran éteint, ni dessiner un widget : tout cela vit en dehors de l'app, dans le système. Il sert quand même à trois choses.

- `Linking` : ouvrir le bon écran quand on touche une notification, un widget ou l'activité en direct.
- `AppState` : au retour dans l'app, recalculer les horaires, replanifier les rappels et mettre à jour les widgets.
- `PermissionsAndroid` : demander la permission de notification sur Android 13 et plus.

Tout le reste vient d'Expo, détaillé ci-dessous, sauf le compte à rebours Android, qui demande un petit module natif.

## Hors de l'app en bref

| Élément de la maquette | Ce qu'il faut | iOS | Android | Effort |
| --- | --- | --- | --- | --- |
| Notifications de prière et rappels | expo-notifications | Oui, adhan limité à 30 s | Oui, adhan complet possible | Moyen |
| Catégories de notifications | expo-notifications (canaux) | Sans objet | Oui | Faible |
| Lecture sur l'écran verrouillé | expo-audio | Oui | Oui, sans les boutons Répéter et Minuterie | Moyen |
| Widgets écran d'accueil | expo-widgets | Oui, compte à rebours possible | Oui, mais l'heure plutôt que le compte à rebours | Moyen |
| Widgets écran verrouillé | expo-widgets | Oui | Sans objet | Faible |
| Activité en direct, Dynamic Island | expo-widgets | Oui, mais démarrage à prévoir | Sans objet | Élevé |
| Compte à rebours Android, pastille | Module natif Kotlin maison | Sans objet | Oui, pastille sur Android 16+ | Élevé |

Trois points changent la maquette ou le projet : l'adhan sur iPhone dure moins de 30 secondes ; le widget Android ne peut pas compter les minutes tout seul ; l'activité en direct ne démarre pas d'elle-même si l'app est fermée.

## Notifications de prière et rappels

Planches : iPhone · notifications de prière, Android · notifications de prière.

**Paquet** : `expo-notifications`. Chaque prière est une notification locale planifiée avec `scheduleNotificationAsync` et un déclencheur `SchedulableTriggerInputTypes.DATE`. Les horaires sont calculés sur le téléphone (bibliothèque `adhan`), puis planifiés.

**Limite iPhone : 64 notifications en attente par app.** Cinq prières et cinq rappels par jour, cela fait 10 par jour : on planifie au plus 6 jours d'avance. Il faut replanifier à chaque ouverture de l'app et en tâche de fond avec `expo-background-task` (intervalle minimum 15 minutes, et iOS décide quand il la lance : ce n'est pas garanti). Prévoir un message discret dans l'app si l'utilisateur ne l'a pas ouverte depuis 5 jours.

**Son de l'adhan.**

- iPhone : le fichier doit faire moins de 30 secondes, sinon iOS joue le son par défaut. Formats : `aiff`, `wav` ou `caf` (PCM linéaire ou IMA4). Prévoir un extrait court de l'adhan, déclaré dans l'option `sounds` du plugin.
- Android : l'adhan complet est possible comme son du canal. Mais le son d'un canal ne peut plus changer après sa création : un canal par muezzin (par exemple `prieres-afasy`), et changer de muezzin revient à basculer de canal.
- Le son ne sort pas en mode silencieux ou si un mode Concentration le bloque.

**Heure exacte sur Android.** Il faut la permission `SCHEDULE_EXACT_ALARM`, refusée par défaut aux nouvelles installations depuis Android 14. La demander avec `requestExactAlarmPermissionsAsync`, précédée d'un écran d'explication (comme les autres demandes de la maquette). Sans elle, la notification arrive avec du retard. `USE_EXACT_ALARM` est réservée par Google Play aux apps d'alarme et d'agenda : ne pas compter dessus.

**iPhone, « Sensible au facteur temps ».** `interruptionLevel: 'timeSensitive'` laisse passer l'appel à la prière à travers un mode Concentration. Il faut activer la capacité Time Sensitive Notifications dans le projet iOS.

**Boutons « Arrêter l'appel » et « Couper pour Asr ».** Catégories créées avec `setNotificationCategoryAsync`, reliées par `categoryIdentifier`. Couper pour une prière se fait dans l'app à la réception de la réponse. À tester : sur Android, arrêter un adhan complet revient à fermer la notification.

## Catégories de notifications Android

Planche : Android · catégories de notifications.

Cinq canaux créés avec `setNotificationChannelAsync` : Prières (importance haute, son adhan), Rappels (son discret), Khatm, Lecture en cours (silencieux), Téléchargements (silencieux). Après création, seuls le nom et la description se modifient. Sur Android 13, la demande de permission n'apparaît pas tant qu'aucun canal n'existe : créer les canaux avant de la demander.

## Lecture sur l'écran verrouillé

Planches : iPhone · lecture sur l'écran verrouillé, Android · commandes de lecture.

**Paquet** : `expo-audio`, plugin avec `enableBackgroundPlayback: true` (mode `audio` sur iOS, service de premier plan sur Android).

- `setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'doNotMix' })` : sans `doNotMix`, pas de commandes sur l'écran verrouillé.
- `player.setActiveForLockScreen(true, { title: 'Al-Kahf · verset 10', artist: 'Mishary Al-Afasy', artworkUrl }, { showPreviousTrack: true, showNextTrack: true })`, puis `updateLockScreenMetadata` à chaque verset.
- **Verset précédent et suivant** : lire la sourate comme un `AudioPlaylist` d'un fichier par verset. Les boutons Précédent et Suivant de l'écran verrouillé deviennent alors verset précédent et suivant, ce que montre la maquette.
- Android : demander la permission de notification, sinon la carte n'apparaît pas. Sans commandes, Android coupe le son après environ 3 minutes.
- Une seule lecture à la fois contrôle l'écran verrouillé. Le son s'arrête quand on débranche le casque.
- Pochette : une image par sourate (le nom arabe sur fond émeraude, comme la maquette), fournie en fichier local.

**Écart avec la maquette** : les boutons « Répéter le verset » et « Minuterie » de la carte Android ne sont pas proposés par expo-audio, qui n'expose que précédent, suivant et les sauts. Décidé le 12 novembre : ils restent dans l'app seulement, sans module natif. Ils sont retirés de la planche Android.

## Widgets de l'écran d'accueil et de l'écran verrouillé

Planches : iPhone · widgets de l'écran d'accueil, iPhone · widgets clair, sombre, teinté, iPhone · écran verrouillé, Android · widgets de l'écran d'accueil.

**Paquet** : `expo-widgets`. Les widgets s'écrivent en TSX avec la directive `'widget'`, avec `@expo/ui/swift-ui` sur iOS et `@expo/ui/jetpack-compose` sur Android, puis s'enregistrent avec `createWidget`.

**Configuration** (`app.json`) : une entrée `widgets[]` par widget.

- Prochaine prière : `systemSmall`, plus `accessoryCircular`, `accessoryRectangular`, `accessoryInline` pour l'écran verrouillé.
- Les cinq prières : `systemMedium`.
- Reprendre : `systemSmall`.
- `groupIdentifier` (App Group) pour partager les données avec l'app ; `enableAndroid: true` pour Android.

**Contraintes du code de widget** : pas de hooks, pas d'état, pas d'import, pas d'appel réseau. Le widget ne calcule rien : l'app calcule les horaires et les lui passe en props.

**Données iPhone** : `updateTimeline([{ date, props }])` avec plusieurs jours d'entrées : une entrée à chaque prière, et une par minute dans l'heure qui précède la suivante pour « dans 42 min ». Un affichage de minuteur natif (le `Text` à minuteur de SwiftUI) n'est pas documenté dans expo-widgets : à vérifier, sinon les entrées par minute suffisent.

**Données Android** : `updateSnapshot(props)` seulement. Android n'a pas de frise d'entrées dans expo-widgets, donc « dans 42 min » serait vite faux. **Écart avec la maquette** : sur Android, afficher « Asr à 16:35 » au lieu du compte à rebours, et rafraîchir à chaque prière depuis l'app et la tâche de fond.

**Bouton Écouter de Reprendre** : un bouton de widget peut changer ce qu'affiche le widget sans ouvrir l'app (iOS 17+), mais il ne lance pas le son. Le plus sûr : le bouton ouvre l'app sur la lecture avec un lien profond.

**Rendus** : sur iOS 17 et plus, la vue racine doit porter `containerBackground`. Le sombre suit `colorScheme`. Le rendu teinté est appliqué par le système : à vérifier sur appareil que l'arabe et la barre de progression restent lisibles.

## Activité en direct et Dynamic Island

Planches : iPhone · écran verrouillé et activité en direct, iPhone · Dynamic Island.

**Paquet** : `expo-widgets`, avec `createLiveActivity`. Zones utilisées : `banner` (écran verrouillé), `compactLeading` et `compactTrailing` (réduite), `minimal`, `expandedLeading`, `expandedTrailing`, `expandedBottom` (ouverte). Démarrage avec `start(props, url, staleDate)`, fin avec `end('after', …)` à l'heure de la prière.

**Le vrai problème : le démarrage.** Une activité locale ne démarre que si l'app tourne. Or le compte à rebours doit partir 30 minutes avant la prière, téléphone en poche. Deux options :

1. **Simple** : l'activité démarre quand l'utilisateur ouvre l'app dans les 30 minutes. Pas de serveur, mais elle n'apparaîtra pas toujours.
2. **Complète** : démarrage à distance par notification push (`enablePushNotifications`, iOS 17.2+). Il faut un serveur qui envoie un push APNs à chaque prière, pour chaque ville. Cela touche au principe « tout sur le téléphone » : le serveur doit connaître la ville de l'utilisateur.

Je conseille l'option 1 pour la première version. La décision te revient.

## Compte à rebours en direct sur Android

Planche : Android · compte à rebours en direct.

**Aucun paquet tout prêt.** Notifee est archivé. La notification personnalisée d'expo-widgets (`createCustomNotification`) utilise une mise en page sur mesure, qui l'empêche d'être promue en Live Update, et n'a pas de minuteur documenté. Il faut un petit module natif (API Expo Modules, en Kotlin) qui :

- planifie une alarme exacte 30 minutes avant chaque prière ;
- poste une notification `setOngoing(true)` avec `setWhen(heure de la prière)`, `setUsesChronometer(true)`, `setChronometerCountDown(true)` et une barre de progression ;
- sur Android 16 et plus, demande la promotion avec `setRequestPromotedOngoing(true)` et `setShortCriticalText('42 min')` pour la pastille (96 dp au plus), et déclare la permission `POST_PROMOTED_NOTIFICATIONS`.

**Règles Google pour les Live Updates** : pas de `setColorized`, pas de mise en page sur mesure, un titre obligatoire. « Un événement qui va commencer » est autorisé, mais les alertes et les événements d'agenda à venir ne le sont pas. Le compte à rebours de prière est donc à la limite : on le rend optionnel (désactivé par défaut, réglé dans Prière › Appel et rappels), avec « Masquer pour aujourd'hui ». Si Google ne le promeut pas, il reste une notification ordinaire avec minuteur.

## Hors de l'app : ordre conseillé

1. Notifications, canaux, adhan court sur iPhone et complet sur Android, alarmes exactes, replanification.
2. Lecture sur l'écran verrouillé avec expo-audio et une liste de lecture par verset.
3. Widgets iPhone et Android, écran verrouillé compris.
4. Activité en direct iPhone, option 1.
5. Module Kotlin du compte à rebours Android.

## Hors de l'app : à tester sur un vrai téléphone

- L'adhan sonne à l'heure, téléphone verrouillé depuis 6 heures, sur un Android récent sans la permission d'alarme exacte, puis avec.
- Aucune notification ne manque après 7 jours sans ouvrir l'app sur iPhone.
- Mode silencieux et mode Concentration : ce qui passe et ce qui ne passe pas.
- Lecture d'Al-Kahf écran éteint pendant 30 minutes ; verset suivant depuis l'écran verrouillé ; casque débranché.
- Widgets en clair, sombre et teinté ; arabe lisible ; heure juste après un changement de ville.
- Activité en direct : réduite, minimale avec une autre activité, ouverte ; disparition à l'heure de la prière.
- Android 16 : la pastille apparaît, et le réglage Live Updates de l'app est activé.
- Les tâches de fond ne marchent pas sur le simulateur iOS.

## Sources

- [Expo · Widgets](https://docs.expo.dev/versions/latest/sdk/widgets/)
- [Expo · Audio](https://docs.expo.dev/versions/latest/sdk/audio/)
- [Expo · Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Expo · BackgroundTask](https://docs.expo.dev/versions/latest/sdk/background-task/)
- [Apple · UNNotificationSound](https://developer.apple.com/documentation/usernotifications/unnotificationsound)
- [Apple Developer Forums · limite de 64 notifications](https://developer.apple.com/forums/thread/811171)
- [Android · Créer une notification Live Update](https://developer.android.com/develop/ui/views/notifications/live-update)
- [DEV · Notifee est archivé](https://dev.to/marco_crupi/notifee-is-archived-heres-a-maintained-new-architecture-drop-in-replacement-3ib5)
- [React Native 0.81 : SafeAreaView obsolète, Android 16](https://reactnative.dev/blog/2025/08/12/react-native-0.81)
- [Expo · SQLite (SQLCipher)](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Expo · FileSystem (DownloadTask)](https://docs.expo.dev/versions/latest/sdk/filesystem/)
