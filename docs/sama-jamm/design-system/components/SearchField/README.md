# SearchField

Champ de recherche dans les textes, les chants et les récitants, qui fonctionne aussi sans connexion.

- **Le consommateur fournit** : `label` (lu par les lecteurs d'écran), `placeholder`, `value` et `onChange`.
- Fond `surface-creux`, contour `ligne-forte`, rayon `rayon-carte`, hauteur 48. L'indication de champ est en `encre-3`.
- La recherche porte sur l'arabe et la translittération (voyelles, signes et accents ignorés) ; ne pas imposer de clavier.
- Les résultats arabes s'affichent en blocs `dir="rtl"`, même si la requête était en translittération.
- À ne pas faire : une loupe seule sans champ visible, ou effacer la requête quand on revient sur l'écran.
