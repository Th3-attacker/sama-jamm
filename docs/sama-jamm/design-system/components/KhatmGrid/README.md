# KhatmGrid

Les 30 juz d'une lecture collective du Coran (khatm) : qui a lu, qui lit, ce qui reste à prendre.

- **Le consommateur fournit** : `juz` (30 entrées `n`, `etat`, `qui`), `onChoisir` (rend les juz libres touchables), `legende`.
- États : `lu` (`emeraude-doux` et coche), `en-cours` (`or-doux` cerclé d'or, trait or), `vous` (aplat `emeraude` doublé d'un anneau : le seul aplat vif de la grille, même en Veille), `libre` (contour `ligne-forte`).
- Grille de 6 × 5, cases carrées, numéros en chiffres arabes occidentaux, légende dessous.
- Chaque case est lue : « Juz 22, le vôtre ».
- Synchronisation : Supabase (table `khatm_parts`), mise à jour en temps réel ; hors ligne, la grille affiche la dernière version avec un `Banner`.
