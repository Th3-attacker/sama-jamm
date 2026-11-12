// Anneau de progression : règles pures.

/** Pourcentage entier de 0 à 100 pour une part de 0 à 1 (hors limites ou non numérique : borné ou 0). */
export function pourcentage(part: number): number {
  if (!Number.isFinite(part)) return 0;
  return Math.round(Math.max(0, Math.min(1, part)) * 100);
}
