# Jetons en React Native

`tokens.json` est la seule source des couleurs, tailles, espaces, rayons et ombres. Un script le transforme en module TypeScript ; les composants lisent le thème courant par `useTheme()` et n'écrivent jamais une valeur en dur.

## Générer le thème

`scripts/tokens-to-theme.mjs`, lancé par `npm run tokens` et en `prebuild` :

```js
import fs from 'node:fs';
const t = JSON.parse(fs.readFileSync('design/tokens.json', 'utf8'));
const ids = t.color.themes.map((x) => x.id);               // ['jour', 'nuit', 'veille']
const pick = (v, id) => (typeof v === 'string' ? v : v[id] ?? v[ids[0]]);
const camel = (s) => s.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
const themes = Object.fromEntries(ids.map((id) => [id, {
  couleurs: Object.fromEntries(t.color.tokens.map((k) => [camel(k.name), pick(k.value, id)])),
  ombres: Object.fromEntries(t.shadow.tokens.map((k) => [camel(k.name), pick(k.value, id)])),
}]));
const px = (fam) => Object.fromEntries(t[fam].tokens.map((k) => [camel(k.name), parseFloat(k.value)]));
const out = `// Généré depuis tokens.json — ne pas modifier à la main.
export const themes = ${JSON.stringify(themes, null, 2)} as const;
export const espace = ${JSON.stringify(px('spacing'))} as const;
export const rayon = ${JSON.stringify(px('radius'))} as const;
export const cible = ${JSON.stringify(px('zone-tactile'))} as const;
export type NomTheme = keyof typeof themes;
export type Couleurs = typeof themes.jour.couleurs;
`;
fs.writeFileSync('src/theme/tokens.generated.ts', out);
```

- Copier `tokens.json` de ce système dans `design/tokens.json` à chaque évolution de la charte, puis relancer le script.
- `voile` est une couleur `rgba()` : React Native l'accepte telle quelle.
- `ombre-1` et `ombre-2` sont des chaînes CSS : les passer à la propriété de style `boxShadow` (disponible avec la nouvelle architecture, la seule de SDK 58). La nuit et en Veille elles valent `none` : ne rien appliquer.

## Polices

| Style du système | Famille React Native (paquet `@expo-google-fonts/…`) | Taille / interligne |
| --- | --- | --- |
| `display` | `CormorantGaramond_600SemiBold` | 40 / 44, `letterSpacing: -0.4` |
| `titre-1` | `CormorantGaramond_600SemiBold` | 30 / 36 |
| `titre-2` | `CormorantGaramond_600SemiBold` | 24 / 30 |
| `chiffre` | `SourceSans3_600SemiBold` | 44 / 48, `fontVariant: ['tabular-nums']` |
| `titre-3` | `SourceSans3_600SemiBold` | 18 / 24 |
| `corps` | `SourceSans3_400Regular` | 16 / 24 |
| `libelle` | `SourceSans3_600SemiBold` | 14 / 20 |
| `legende` | `SourceSans3_400Regular` | 12 / 16 |
| `lecture` | `SourceSerif4_400Regular` | 18 / 30 |
| `translitteration` | `SourceSerif4_400Regular_Italic` | 15 / 24 |
| `coran` | `AmiriQuran_400Regular` | 28 / 56 |
| `arabe` | `Amiri_400Regular` | 22 / 40 |
| `titre-ar` (interface arabe) | `Amiri_700Bold` | 30 / 44 |
| `corps-ar`, `titre-3-ar`, `libelle-ar`, `legende-ar` | `NotoSansArabic_400Regular`, `NotoSansArabic_600SemiBold` | 16 / 26, 18 / 28, 14 / 22, 13 / 20 |

- Les fichiers `fonts/*.woff2` de ce système servent aux aperçus web ; dans l'app, utiliser les TTF des paquets `@expo-google-fonts/cormorant-garamond`, `source-sans-3`, `source-serif-4`, `amiri`, `amiri-quran`, `noto-sans-arabic` (ou les TTF officiels de Google Fonts dans `assets/fonts/`), tous sous licence SIL OFL.
- Une famille par graisse : sur Android, `fontWeight` ne choisit pas la bonne graisse d'une police personnalisée. Ne jamais combiner `fontFamily` personnalisée et `fontWeight: '600'`.
- Interface en arabe : remplacer `display` par `titre-ar` et les styles d'interface par leur version `-ar` (Cormorant et Source Sans n'ont pas de lettres arabes). Pas de capitales ni d'espacement de lettres. Les chiffres et le latin restent en Source Sans 3. Sur le web, la classe `interface-ar` de `tokens.css` fait cette substitution seule.
- Charger les polices dans `app/_layout.tsx` avec `useFonts`, garder l'écran de démarrage (`SplashScreen.preventAutoHideAsync()`) jusqu'au chargement.

## Taille du texte

- `allowFontScaling` reste actif partout. Plafonds : `maxFontSizeMultiplier={2}` pour le texte courant, `1.3` pour `display`, `chiffre` et les chiffres du compte à rebours, `1.5` pour la barre d'onglets.
- Le texte arabe a son propre réglage (Réglages › Lecture › Taille du texte arabe, 22 à 40), multiplié par l'échelle du téléphone, plafonné à 56.
- Tester à l'échelle maximale d'iOS et d'Android : aucune ligne coupée, aucun bouton qui déborde.

## Choisir le thème

```ts
// src/theme/veille.ts
export function themeCourant(r: Reglages, systeme: 'light' | 'dark', h: Horaires, maintenant: Date): NomTheme {
  if (r.theme !== 'auto') return r.theme;                                  // choix manuel
  const nuitDePriere = maintenant >= h.isha || maintenant < h.fajrDuLendemainOuDuJour;
  if (r.veilleAuto && nuitDePriere) return 'veille';
  return systeme === 'dark' ? 'nuit' : 'jour';
}
```

- `auto` (défaut) suit le mode du téléphone (`useColorScheme`) : `jour` en clair, `nuit` en sombre.
- Veille automatique (proposée à la bienvenue, réglable) : `veille` entre Isha et Fajr, quel que soit le mode du téléphone. Un `Banner` « Veille activée » s'affiche une fois par nuit, fermable.
- Recalculer au retour au premier plan et à chaque minute (même minuterie que le compte à rebours), jamais en continu.
- Changement de thème : fondu de 200 ms sur `fond`, aucun si « Réduire les animations » est actif.

## Bords et barres système

- `app.json` : `"userInterfaceStyle": "automatic"`. `expo-system-ui` : couleur de fond racine = `fond` du thème, pour qu'aucun flash blanc n'apparaisse entre deux écrans.
- Android est bord à bord (edge-to-edge) : contenu sous les barres système, marges par `react-native-safe-area-context`.
- Barre d'état : icônes sombres en `jour`, claires en `nuit` et `veille` (`expo-status-bar`, `style` selon le thème, pas selon le système).

## Équivalences utiles

| Web (aperçus) | React Native |
| --- | --- |
| `var(--emeraude)` | `theme.couleurs.emeraude` |
| `font-variant-numeric: tabular-nums` | `fontVariant: ['tabular-nums']` |
| `lang="ar" dir="rtl"` | `writingDirection: 'rtl'`, `textAlign: 'right'`, et `accessibilityLanguage="ar"` |
| `:active` | `Pressable` + `style={({ pressed }) => …}` ; `android_ripple={{ color: emeraudeDoux }}` |
| `:focus-visible` | anneau `anneauFocus` de 2 px si `isFocused` (clavier externe, contrôle de sélection) |
| `aria-live="polite"` | `accessibilityLiveRegion="polite"` (Android) et `AccessibilityInfo.announceForAccessibility` (iOS) |
| `prefers-reduced-motion` | `AccessibilityInfo.isReduceMotionEnabled()` / `useReducedMotion()` de Reanimated |

## Icônes

`lucide-react-native` avec `size={20}` (22 dans les onglets et la barre du haut), `strokeWidth={1.75}`, `color` du thème. Correspondance avec `SamaJamm.ICONES` :

| Sama Jàmm | Lucide | Sama Jàmm | Lucide |
| --- | --- | --- | --- |
| `arrow-left` | `ArrowLeft` | `home` | `House` |
| `book` | `BookOpen` | `headphones` | `Headphones` |
| `clock` | `Clock` | `wallet` | `Wallet` |
| `search` | `Search` | `more` | `Ellipsis` |
| `bookmark` | `Bookmark` (rempli si actif) | `share` | `Share2` |
| `play`, `pause` | `Play`, `Pause` (remplis) | `skip-back`, `skip-forward` | `SkipBack`, `SkipForward` |
| `repeat` | `Repeat` | `reset` | `RotateCcw` |
| `download` | `Download` | `bell` | `Bell` |
| `chevron-right`, `chevron-down` | `ChevronRight`, `ChevronDown` | `arrow-up`, `arrow-down` | `ArrowUp`, `ArrowDown` |
| `check`, `close` | `Check`, `X` | `plus`, `minus` | `Plus`, `Minus` |
| `backspace` | `Delete` | `info` | `Info` |
| `alert` | `TriangleAlert` | `offline` | `CloudOff` |
| `moon`, `sun` | `Moon`, `Sun` | `globe` | `Globe` |
| `trash` | `Trash2` | `edit` | `Pencil` |
| `compass` | `Compass` | `pin` | `MapPin` |
| `settings` | `SlidersHorizontal` | `user`, `users` | `User`, `Users` |
| `lock` | `Lock` | `calendar` | `Calendar` |
| `target` | `Target` | `heart` | `Heart` |
| `balance` | `Scale` | `list` | `List` |
| `type` | `Type` | `bolt` | `Zap` |
| `car` | `Car` | `cart` | `ShoppingCart` |
| `kaaba` | tracé propre (copier depuis `bundle.js` dans `src/ui/icones/kaaba.tsx`) | | |

En interface arabe, retourner les flèches de navigation (`arrow-left`, `chevron-right`) avec `transform: [{ scaleX: -1 }]` quand `I18nManager.isRTL` ; ne jamais retourner les icônes audio (`play`, `skip-back`, `skip-forward`).

