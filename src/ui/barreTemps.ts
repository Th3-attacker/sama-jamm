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
