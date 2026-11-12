// Calcul pur du temps écoulé et restant d'une sourate d'après la durée de ses versets (voir dureesDonnees.ts).

export type TempsSourate = { ecoule: number; total: number };

/**
 * Temps écoulé et durée totale de la sourate, en secondes entières, à la vitesse 1×.
 * `verset` : verset en cours (1 à n) ; `dansVerset` : secondes déjà lues dans ce verset.
 * Renvoie null si les durées manquent ou ne couvrent pas la sourate.
 */
export function tempsSourate(
  d: readonly number[] | undefined,
  versetsParSourate: readonly number[],
  sourate: number,
  verset: number,
  dansVerset: number,
): TempsSourate | null {
  const nb = versetsParSourate[sourate - 1];
  if (!d || !nb || verset < 1 || verset > nb) return null;
  let premier = 0;
  for (let s = 1; s < sourate; s++) premier += versetsParSourate[s - 1] ?? 0;
  let avant = 0;
  let total = 0;
  for (let i = 0; i < nb; i++) {
    const dixiemes = d[premier + i];
    if (!dixiemes) return null;
    if (i < verset - 1) avant += dixiemes;
    total += dixiemes;
  }
  const duree = d[premier + verset - 1] ?? 0;
  const dedans = Math.min(duree, Math.max(0, Math.round((Number.isFinite(dansVerset) ? dansVerset : 0) * 10)));
  return { ecoule: Math.round((avant + dedans) / 10), total: Math.round(total / 10) };
}
