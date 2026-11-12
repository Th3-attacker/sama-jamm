# Composants : contrat du design system contre `src/ui/`

Comparaison faite le 12 novembre 2026 avec `design-system/components/index.d.ts`. Les props gardent les noms français du contrat ; `onClick` devient `onPress` (React Native).

## Conformes ou proches (props alignées, écarts mineurs)

`Button`, `IconButton`, `Chip` (+ `pilule`, `compacte`), `TopBar`, `PageDots`, `ListItem`, `ListGroup`, `SearchField`, `TextField`, `Switch`, `RadioGroup`, `SegmentedControl`, `ProgressBar`, `Banner`, `Toast`, `Dialog`, `BottomSheet`, `EmptyState`, `DayArc`, `PrayerTimes`, `QiblaCompass`, `TasbihCounter`, `BeadThread`, `AmountDisplay`, `Keypad`, `Envelope`, `Medaillon` (= `Medallion`).

Écarts de contrat connus à reprendre un par un contre leur `README.md` :

| Composant | Écart |
| --- | --- |
| `Toast` | `afficher({ texte })` (API impérative sous `ToastProvider`, 89 appels) ; le contrat : composant avec `children`. Gardé tel quel : renommer n'apporterait rien |
| `PrayerTimes`, `TasbihCounter` | Props de l'app (`onBasculerAppel`, `onCompter`) ; le contrat est une vue sans état |
| `TopBar` | `actions[].onPress` au lieu de `onClick` (voulu) |

## Créés le 12 novembre 2026

`SectionHeader`, `Checkbox`, `Skeleton`, `Ornament`, `KhatmGrid` (déjà utilisé par l'écran Khatm, états `lu` / `en-cours` / `vous` / `libre` du README : « vous » est l'aplat vif, « lu » est en `emeraudeDoux` avec coche, ce qui **inverse** les couleurs de l'ancienne grille).

## Manquants ou sous un autre nom

| Contrat | État |
| --- | --- |
| `ReadingCard` | Pas de composant : `CarteVerset`, `CarteInvocation` et le rendu en ligne de `coran/[sourate].tsx` en tiennent lieu |
| `VerseShareCard` | Dans `features/lire/PartageVerset.tsx` (carte intégrée à la feuille) |
| `AudioPlayer` | `features/ecouter/MiniLecteur.tsx` (barre) et `app/lecteur.tsx` (plein écran) |
| `SavingsGoal` | `features/budget/CarteObjectif.tsx` |
| `Menu` | Remplacé par l'onglet Plus (décision du 8 novembre) : sans objet |
| `TabBar` | `NativeTabs` : sans objet |
| `WalletCard` | Sans objet tant que les dons ne sont pas recréés |
| `Medallion` | `Medaillon` |

## Reste à faire

Aligner `ReadingCard`, `VerseShareCard`, `AudioPlayer`, `SavingsGoal` (extraction en composants du design system) et reprendre `Badge`, `Slider`, `Toast`. Chaque extraction touche des écrans entiers : à faire avec les planches sous les yeux.

## Mis en conformité le 12 novembre 2026 (vérification des composants)
`Badge` (tons `neutre`, `emeraude`, `or`, `alerte`, `erreur`, `icone` de 14) et `Slider` (`min`, `max`, `pas`, `gauche`, `droite` ; crans calculés par `cransDe`, testé). Il ne reste que l'écart `Toast` ci-dessus et l'extraction de `ReadingCard`, `AudioPlayer`, `SavingsGoal`.
