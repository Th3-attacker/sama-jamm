/**
 * Fraction (0 à 1) d'un horaire sur la frise du jour, de Fajr à la dernière prière.
 * Les minutes sont comptées depuis Fajr modulo 24 h : une Isha après minuit (01:02 après 13:15) reste à sa place.
 */
export function fractionFrise(minutes: number, premiere: number, derniere: number): number {
  const ecart = (m: number) => (m - premiere + 1440) % 1440;
  const etendue = Math.max(1, ecart(derniere));
  return Math.min(1, ecart(minutes) / etendue);
}

/**
 * Position (0 à 1) de l'heure actuelle sur la frise, pour le petit cercle « maintenant » entre deux prières.
 * `null` avant Fajr et après la dernière prière : le cercle n'a alors pas de place sur la frise du jour.
 */
export function fractionMaintenant(maintenant: number, premiere: number, derniere: number): number | null {
  const ecart = (m: number) => (m - premiere + 1440) % 1440;
  const etendue = Math.max(1, ecart(derniere));
  const e = ecart(maintenant);
  return e <= etendue ? e / etendue : null;
}

/**
 * Où se trouve l'heure actuelle entre deux prières : indice de la prière déjà passée et fraction (0 à 1) du chemin
 * vers la suivante. Sert à la carte de l'Accueil, dont les cinq points sont répartis régulièrement sous leurs noms.
 * `null` avant la première prière ou après la dernière.
 */
export function segmentMaintenant(maintenant: number, minutes: readonly number[]): { indice: number; fraction: number } | null {
  const premiere = minutes[0];
  if (premiere === undefined || minutes.length < 2) return null;
  const ecart = (m: number) => (m - premiere + 1440) % 1440;
  const e = ecart(maintenant);
  for (let i = 0; i < minutes.length - 1; i++) {
    const a = ecart(minutes[i] ?? 0);
    const b = ecart(minutes[i + 1] ?? 0);
    if (e >= a && e <= b) return { indice: i, fraction: b > a ? (e - a) / (b - a) : 0 };
  }
  return null;
}
