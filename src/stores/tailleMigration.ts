// La taille de l'écriture est limitée aux niveaux 2 à 4 (échelons 1 à 3, coefficients de 0,9 à 1,15) : au niveau 5 des
// lettres de versets étaient rognées et les grands niveaux faisaient sauter la liste. Un ancien téléphone a pu enregistrer
// un échelon hors de cette plage.

/** Plus petit échelon proposé (niveau 2, le défaut). */
export const TAILLE_MIN = 1;
/** Plus grand échelon proposé (niveau 4). */
export const TAILLE_MAX = 3;

/** Ramène un échelon enregistré (valeur non fiable) dans la plage ; une valeur illisible redonne le défaut. */
export function borneTaille(valeur: unknown): number {
  if (typeof valeur !== 'number' || !Number.isFinite(valeur)) return TAILLE_MIN;
  return Math.max(TAILLE_MIN, Math.min(TAILLE_MAX, Math.round(valeur)));
}

/** Migration : l'échelon enregistré est ramené dans la plage ; le reste des réglages n'est pas touché. */
export function limiterTaille(etat: Record<string, unknown>): void {
  if ('tailleLecture' in etat) etat.tailleLecture = borneTaille(etat.tailleLecture);
}
