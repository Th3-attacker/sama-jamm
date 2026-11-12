# Checkbox

Case à cocher pour des choix multiples qui s'additionnent : éléments affichés sous un verset, postes inclus dans un bilan.

- **Le consommateur fournit** : `label`, `description`, `coche`, `onChange`, `disabled`.
- Case 24, bordure `ligne-forte` de 2 px ; cochée : fond `emeraude` et coche `sur-emeraude`.
- Toute la ligne (case et texte) est touchable, hauteur 48 au moins.
- **React Native** : `Pressable` avec `accessibilityRole="checkbox"` et `accessibilityState={{ checked }}`.
