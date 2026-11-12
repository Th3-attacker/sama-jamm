# TasbihCounter

Compte les répétitions d'un dhikr : un grand grain rond à toucher, un anneau or qui se remplit jusqu'à l'objectif.

- **Le consommateur fournit** : `formuleArabe`, `formule` (translittération), `objectif` (33 par défaut) et éventuellement `compte` de départ.
- Toute la pastille de 200 px est la zone tactile ; chaque toucher ajoute un grain avec un retour haptique léger.
- Anneau : piste `surface-creux`, progression `or` ; à l'objectif, l'anneau passe en `emeraude` et la légende dit « Objectif atteint » (le changement ne repose pas sur la couleur seule).
- Le nombre est en `chiffre` (Source Sans 3, chiffres tabulaires) et annoncé par les lecteurs d'écran à chaque changement.
- « Remettre à zéro » est un bouton `discret` sous la formule, jamais à côté du grain.
- À ne pas faire : compter par appui long, faire vibrer à chaque grain si l'utilisateur a coupé les vibrations.
