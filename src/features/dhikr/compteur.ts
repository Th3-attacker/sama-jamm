// Règle du compteur de dhikr : un tour s'arrête à l'objectif, le grain suivant ouvre un nouveau tour.

/**
 * Compte après un grain. Avec un objectif, le compte monte jusqu'à l'objectif (« Objectif atteint » reste affiché),
 * puis le grain suivant repart à 1 : le compteur ne dépasse jamais l'objectif. Sans objectif (« Libre »), il monte
 * sans fin. Un compte déjà au-delà de l'objectif (enregistré avant cette règle, ou objectif abaissé) repart aussi à 1.
 */
export function prochainCompte(compte: number, objectif: number | null): number {
  if (objectif !== null && compte >= objectif) return 1;
  return compte + 1;
}
