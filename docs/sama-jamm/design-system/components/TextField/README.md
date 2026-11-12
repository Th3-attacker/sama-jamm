# TextField

Champ de saisie avec libellé toujours visible, aide ou erreur en dessous.

- **Le consommateur fournit** : `label`, `aide`, `erreur`, `prefixe`/`suffixe` (devise, unité) et les attributs d'un `input` (`placeholder`, `inputMode`, `defaultValue`).
- Hauteur 48, fond `surface`, bordure `ligne-forte` (≥ 3:1), au focus bordure `emeraude` de 2 px.
- Erreur : bordure et texte `erreur`, icône d'alerte, message qui dit comment corriger (« Le symbole est obligatoire (4 caractères au plus). »).
- Montants : préférer `AmountDisplay` + `Keypad` ; un `TextField` numérique sert aux plafonds dans les réglages.
- **React Native** : `TextInput` avec `accessibilityLabel` = libellé, `keyboardType="number-pad"` pour les montants, erreur annoncée (`accessibilityLiveRegion="polite"`).
- À ne pas faire : libellé remplacé par le texte indicatif, erreur seulement en couleur.
