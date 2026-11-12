# Switch

Interrupteur pour un réglage qui prend effet tout de suite : rappels de prière, Veille automatique.

- **Le consommateur fournit** : `active`, `onChange`, `label` (obligatoire si aucune ligne ne le nomme), `disabled`.
- Activé : piste `emeraude`, pouce `sur-emeraude` avec une coche ; désactivé : piste `surface-creux`, contour et pouce `ligne-forte` (≥ 3:1). La coche donne l'état sans la couleur.
- 52 × 32 dans une zone tactile de 48.
- **React Native** : `Switch` natif avec `trackColor={{ false: surface-creux, true: emeraude }}`, `thumbColor` selon l'état, ou ce composant dessiné si le rendu natif ne tient pas le contraste ; `accessibilityRole="switch"`.
- À ne pas faire : un interrupteur qui demande ensuite une validation (utiliser une case à cocher et un bouton).
