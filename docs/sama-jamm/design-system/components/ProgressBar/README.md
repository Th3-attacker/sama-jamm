# ProgressBar

Barre de progression dont la valeur est toujours écrite à côté : lecture d'une sourate, téléchargement, enveloppe du budget.

- **Le consommateur fournit** : `valeur` (0 à 1), `label`, `detail` (la valeur en mots : « Verset 46 sur 110 »), `ton`, `fine`.
- Tons : `emeraude` (défaut, tâches), `or` (progression spirituelle : lecture, khatm, épargne), `alerte`, `erreur`. Au-delà de 1, la barre est pleine et passe en `erreur`.
- Piste `surface-creux`, 8 px (4 px en `fine`). L'or sur la piste claire est sous 3:1 : c'est pourquoi le texte `detail` est obligatoire.
- À ne pas faire : pourcentage seul pour une lecture (préférer « verset 46 sur 110 »), barre animée en boucle.
