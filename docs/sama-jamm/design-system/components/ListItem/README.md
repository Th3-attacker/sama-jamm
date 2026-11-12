# ListItem

Ligne de liste pour les réglages, la bibliothèque et l'historique, regroupée en carte avec `ListGroup`.

- **Le consommateur fournit** : `titre`, `sousTitre`, à gauche `icone` (pastille) ou `numero` (médaillon étoilé, avec `prefixe` « Sourate »), à droite `valeur`, `droite` (Switch, Badge) ou `fin` (`chevron`, `coche`), et `onClick`.
- `ListGroup` : `titre` de groupe au-dessus, carte `surface` à filets `ligne` entre les lignes, `note` en légende dessous.
- Hauteur minimale 56 ; toute la ligne est touchable quand elle ouvre un écran.
- Une ligne qui porte un `Switch` n'est pas elle-même un bouton : c'est l'interrupteur qui agit (pas de bouton dans un bouton).
- Nom arabe (`arabe`) à droite en Amiri 20, sens RTL.
- **React Native** : `Pressable` ; dans les longues listes (114 sourates, historique du budget), une ligne de `FlatList` ou `SectionList` avec `getItemLayout`. `FlashList` seulement si une mesure montre une saccade.
- À ne pas faire : deux lignes de sous-titre, icônes de couleurs différentes à chaque ligne.
