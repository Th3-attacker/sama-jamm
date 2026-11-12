# Logo, icônes et images

Tous les fichiers d'identité sont dans ce système (groupes d'assets Logos, Icônes, Stores et Ornements) et dans le pack « sama-jamm-identite » livré à part, rangé comme un projet Expo. Ne jamais redessiner le logo : copier les fichiers.

## Fichiers

| Groupe | Fichier | Usage |
| --- | --- | --- |
| Logos | `logo-horizontal-clair.svg`, `logo-vertical-clair.svg` | Sur `fond` jour : marque et texte émeraude, accent or |
| Logos | `logo-horizontal-sombre.svg`, `logo-vertical-sombre.svg` | Sur fond nuit ou émeraude : marque or, texte ivoire |
| Logos | `logotype-clair.svg`, `logotype-sombre.svg` | Le nom seul, quand la marque est déjà à l'écran |
| Logos | `marque-emeraude.svg`, `marque-or.svg`, `marque-ivoire.svg`, `marque-noir.svg` | L'étoile et le livre, à partir de 40 px |
| Logos | `marque-petite-taille-emeraude.svg`, `marque-petite-taille-blanc.svg` | Sous 40 px : favicon, notification, en-tête d'Accueil |
| Logos | `icone-app.svg` | Source vectorielle de l'icône d'app |
| Icônes | `icon.png` 1024, `icon-ios-dark.png`, `icon-ios-tinted.png` | Icône iOS clair, sombre (fond transparent), teinté (niveaux de gris) |
| Icônes | `adaptive-icon.png`, `adaptive-icon-monochrome.png`, `adaptive-icon-background.png` | Calques Android de 108 dp, marque dans la zone sûre de 66 dp |
| Icônes | `notification-icon.png` 96 | Notification Android : blanc sur transparent |
| Icônes | `splash-icon.png`, `splash-icon-dark.png` | Écran de démarrage clair et sombre, affiché à 200 dp |
| Icônes | `favicon.png` 48 | Web |
| Stores | `app-store-1024.png`, `google-play-512.png`, `google-play-banniere-1024x500.png` | Fiches des stores |
| Stores | `ios-1320x2868-0N.png`, `android-1080x1920-0N.png` | Captures des fiches (voir plus bas) |
| Ornements | `etoile-8.svg` | L'étoile à huit branches, seul motif décoratif |

Les SVG sont mono-encre ou bicolores aux couleurs de marque (`marque-emeraude` #0A4224, `marque-or` #C5A059, `marque-ivoire` #FDFBF7) : ils n'héritent pas de la couleur du texte. Dans l'app, les charger avec `react-native-svg` (transformateur `react-native-svg-transformer`) ou `expo-image`.

## `app.json`

```json
{
  "expo": {
    "name": "Sama Jàmm",
    "slug": "sama-jamm",
    "scheme": "samajamm",
    "userInterfaceStyle": "automatic",
    "icon": "./assets/images/icon.png",
    "ios": {
      "bundleIdentifier": "à réserver, par exemple app.samajamm",
      "icon": {
        "light": "./assets/images/icon.png",
        "dark": "./assets/images/icon-ios-dark.png",
        "tinted": "./assets/images/icon-ios-tinted.png"
      }
    },
    "android": {
      "package": "à réserver, par exemple app.samajamm",
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "monochromeImage": "./assets/images/adaptive-icon-monochrome.png",
        "backgroundColor": "#0A4224"
      }
    },
    "plugins": [
      ["expo-splash-screen", {
        "image": "./assets/images/splash-icon.png", "imageWidth": 200, "resizeMode": "contain",
        "backgroundColor": "#FDFBF7",
        "dark": { "image": "./assets/images/splash-icon-dark.png", "backgroundColor": "#0B1F15" }
      }],
      ["expo-notifications", { "icon": "./assets/images/notification-icon.png", "color": "#0A4224" }]
    ]
  }
}
```

- `userInterfaceStyle: automatic` est obligatoire : sans lui, ni l'écran de démarrage sombre ni le thème Nuit ne s'activent.
- Remplacer `bundleIdentifier` et `package` par les identifiants réservés (définitifs après la première publication).
- iOS 26 (Liquid Glass) : dans Icon Composer, fond uni #0A4224, importer `calque-2-livre.svg` puis `calque-1-etoile.svg` du pack, exporter `app.icon` et pointer `ios.icon` vers ce fichier.
- Vérifier sur un build de prévisualisation, jamais dans Expo Go (qui montre son icône et son propre écran de démarrage).

## Règles d'usage

- Zone de protection : la hauteur du livre tout autour du logo.
- Sur fond clair : versions émeraude. Sur fond sombre ou émeraude : versions or et ivoire. Jamais la marque or sur l'ivoire (trop pâle au soleil).
- Ne jamais étirer, incliner, ombrer, détourer ni changer les couleurs ; ne jamais poser le logo sur une photo.
- Écran de démarrage : ivoire en mode clair, vert nuit en mode sombre, marque seule au centre (voir la section suivante).

## Écran de démarrage

Toile, page « Écrans de l'app », rangée « Démarrage » : `SplashClair`, `SplashSombre`, `SplashAnime` (en boucle) et `SplashEtapes`.

| Temps | Étape | Ce qui se passe |
| --- | --- | --- |
| 0 ms | Démarrage natif | Le téléphone affiche `splash-icon.png` (ou `-dark`) à 200 dp, marque visible de 120 dp, fond `#FDFBF7` ou `#0B1F15`. Réglé dans `app.json`, rien à coder. |
| 0 à 150 ms | Relais | `app/_layout.tsx` affiche la même marque, même taille, même place, sur le même fond, puis appelle `SplashScreen.hideAsync()` : aucun saut. |
| 150 à 650 ms | Signature | La marque monte de 56 pt et passe à l'échelle 0,75 ; le filet or s'étire de 0 à 64 pt ; « Jàng, déglu, julli ci jàmm. » (Cormorant 28) et « Lire, écouter, prier, en paix. » (Source Serif italique 15) apparaissent avec 10 pt de montée. Courbe `Easing.bezier(0.2, 0.8, 0.2, 1)`. |
| 650 à 850 ms | Accueil | Fondu de 200 ms vers Accueil, ou vers Bienvenue au premier lancement. |

- L'animation joue pendant le chargement (polices, `contenu.db`, réglages) et ne le retarde jamais : si tout est prêt avant 650 ms, elle va quand même au bout ; si le chargement dure plus, la signature reste affichée jusqu'à la fin.
- Une seule fois par ouverture à froid : jamais au retour d'arrière-plan, jamais à l'ouverture depuis une notification de prière (on va droit à l'écran Prière).
- « Réduire les animations » actif (`AccessibilityInfo.isReduceMotionEnabled`) : pas de mouvement, fondu direct de 200 ms vers l'Accueil.
- Le fond suit le mode du téléphone, pas le thème choisi dans l'app : le thème Veille n'existe pas encore à ce moment-là. Le relais lit le thème enregistré et passe au bon fond pendant le fondu.
- Interface en arabe : même animation, signature wolof inchangée (c'est la marque), sous-titre « اقرأ، استمع، صلِّ، في سلام. » en Amiri 17.
- À implémenter avec `react-native-reanimated` (valeurs partagées `translateY`, `scale`, `opacity`), sur le thread UI.

## Captures des stores

Six captures par plateforme, dans cet ordre (les captures actuelles montrent encore une traduction française sous le verset : à refaire avec l'arabe seul) ; chacune montre un vrai écran de l'app, une formule wolof en titre et sa traduction.

| N° | Écran | Titre wolof | Sous-titre |
| --- | --- | --- | --- |
| 1 | Accueil, arc du jour | Jàng, déglu, julli ci jàmm. | Lire, écouter, prier dans la paix. |
| 2 | Lecteur (verset en arabe, translittération en option) | Ndank-ndank mooy jàpp golo ci ñaay. | Le Coran verset par verset, même sans réseau. |
| 3 | Horaires et arc du jour | Waxtu julli jot na. | Vos horaires calculés sur le téléphone, et l'appel à l'heure. |
| 4 | Lecteur en Veille | Fanaanal ak jàmm. | La nuit, l'écran s'adoucit tout seul. |
| 5 | Khatm collectif | Benn loxo du tàccu. | Un juz chacun, le Coran ensemble. |
| 6 | Budget du foyer | Ku bëgg lem, ñemeel yamb. | Votre budget en enveloppes, la zakat comprise. |

- App Store : 1320 × 2868 px (iPhone 6,9 pouces), PNG sans transparence ; App Store Connect les met à l'échelle pour les autres tailles d'iPhone.
- Google Play : 1080 × 1920 px (9:16), PNG 24 bits sans transparence ; au moins quatre captures d'au moins 1080 px pour être mis en avant.
- Bannière Google Play : `google-play-banniere-1024x500.png`.
- Fichiers prêts dans le groupe Stores ; sources sur le canevas, page « Stores ».
