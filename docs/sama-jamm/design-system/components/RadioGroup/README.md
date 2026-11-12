# RadioGroup

Choix unique dans une liste courte : devise du foyer, récitateur, méthode de calcul des horaires.

- **Le consommateur fournit** : `label`, `options` (`id`, `label`, `description`, `fin`), `valeur`, `onChange`.
- Cercle 24, bordure `ligne-forte` ; choisi : bordure et point `emeraude`.
- `fin` affiche une valeur courte alignée à droite (symbole « F CFA », taille « 120 Mo »).
- Au-delà de sept options, passer à une liste avec recherche (villes, récitateurs).
- **React Native** : `accessibilityRole="radiogroup"` sur le groupe, `radio` et `accessibilityState={{ checked }}` sur chaque ligne.
