// Barre de temps du lecteur : règles pures.

/** Temps (s) correspondant au point `x` touché sur une barre de `largeur` points, borné à la durée. */
export function tempsAuPoint(x: number, largeur: number, duree: number): number {
  if (!(largeur > 0) || !(duree > 0) || !Number.isFinite(x)) return 0;
  return (Math.max(0, Math.min(largeur, x)) / largeur) * duree;
}

/** Part écoulée, de 0 à 1. */
export function partEcoulee(temps: number, duree: number): number {
  if (!(duree > 0) || !Number.isFinite(temps)) return 0;
  return Math.max(0, Math.min(1, temps / duree));
}

/** Temps posé par l'utilisateur, gardé à l'écran jusqu'à ce que la lecture l'ait rejoint. */
export type CibleBarre = { valeur: number };

/** Durée maximale (ms) pendant laquelle la cible reste affichée si la lecture ne la rejoint pas. */
export const DELAI_CIBLE_MS = 1000;

/** Écart (s) sous lequel la lecture est considérée comme arrivée à la cible. */
export const ECART_CIBLE_S = 1.5;

/** La cible est atteinte quand le temps du lecteur est assez proche. */
export function cibleAtteinte(cible: CibleBarre, temps: number): boolean {
  return Math.abs(temps - cible.valeur) <= ECART_CIBLE_S;
}

/**
 * Temps affiché pendant la lecture : le dernier temps reçu (`base`) avancé de `ecouleMs` millisecondes, sans dépasser
 * la durée. À l'arrêt ou en chargement (`avance` faux), le temps reçu tel quel.
 */
export function tempsAvance(base: number, ecouleMs: number, duree: number, avance: boolean): number {
  if (!avance || !(ecouleMs > 0)) return base;
  const v = base + ecouleMs / 1000;
  return duree > 0 ? Math.min(duree, v) : v;
}
