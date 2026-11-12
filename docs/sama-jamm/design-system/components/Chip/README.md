# Chip

Filtre une liste en un geste ; plusieurs puces peuvent être actives à la fois si le filtre le permet.

- **Le consommateur fournit** : le libellé en `children`, `selectionne`, éventuellement `compte` et `onClick`.
- Au repos : `surface` et contour `ligne-forte`. Active : `emeraude-doux`, contour `emeraude`, texte `sur-emeraude-doux`, et `aria-pressed="true"`.
- Une rangée de puces défile horizontalement ; elle ne passe jamais sur deux lignes.
- Libellés d'un ou deux mots : « Coran », « Xassaïdes », « Invocations ».
- À ne pas faire : utiliser une puce comme bouton d'action, ou distinguer l'état actif par la couleur seule (le contour change aussi).
