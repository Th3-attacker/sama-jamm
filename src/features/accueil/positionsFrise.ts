/**
 * Fraction (0 à 1) d'un horaire sur la frise du jour, de Fajr à la dernière prière.
 * Les minutes sont comptées depuis Fajr modulo 24 h : une Isha après minuit (01:02 après 13:15) reste à sa place.
 */
export function fractionFrise(minutes: number, premiere: number, derniere: number): number {
  const ecart = (m: number) => (m - premiere + 1440) % 1440;
  const etendue = Math.max(1, ecart(derniere));
  return Math.min(1, ecart(minutes) / etendue);
}
