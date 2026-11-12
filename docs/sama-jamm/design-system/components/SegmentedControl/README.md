# SegmentedControl

Bascule entre deux à quatre vues ou modes exclusifs : thème Auto / Jour / Nuit / Veille, Verset / Page, sens d'une dette.

- **Le consommateur fournit** : `label`, `options` (`id`, `label` d'un ou deux mots), `valeur`, `onChange`.
- Fond `surface-creux`, option choisie sur `surface` avec `ombre-1` et texte en gras ; hauteur 48 au total.
- Le changement s'applique tout de suite, sans bouton de validation.
- **React Native** : `Pressable` dans une `View`, `accessibilityRole="tab"` et `accessibilityState={{ selected }}`.
- À ne pas faire : plus de quatre options, libellés tronqués, utiliser comme navigation entre écrans (c'est le rôle des onglets).
