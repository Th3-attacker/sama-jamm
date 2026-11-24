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

type DonneesDhikr = {
  formule: string;
  comptes: Record<string, number>;
  objectifs: Record<string, number | null>;
};

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);

/**
 * Données de dhikr relues du stockage : seules les valeurs valides sont gardées (compte entier ≥ 0, objectif entier > 0
 * ou null). Une valeur corrompue est ignorée, jamais propagée (un `NaN` bloquerait le compteur).
 */
export function nettoyerDhikr(brut: unknown, parDefaut: DonneesDhikr): DonneesDhikr {
  if (!estObjet(brut)) return parDefaut;
  const comptes: Record<string, number> = {};
  if (estObjet(brut.comptes)) {
    for (const [id, n] of Object.entries(brut.comptes)) {
      if (typeof n === 'number' && Number.isInteger(n) && n >= 0) comptes[id] = n;
    }
  }
  const objectifs: Record<string, number | null> = {};
  if (estObjet(brut.objectifs)) {
    for (const [id, n] of Object.entries(brut.objectifs)) {
      if (n === null || (typeof n === 'number' && Number.isInteger(n) && n > 0)) objectifs[id] = n;
    }
  }
  const formule = typeof brut.formule === 'string' && brut.formule !== '' ? brut.formule : parDefaut.formule;
  return { formule, comptes, objectifs };
}
