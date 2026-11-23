// Quand l'activité en direct est visible : règle pure, sans dépendance native.

/** L'activité part 30 minutes avant la prière. */
export const AVANT_MS = 30 * 60_000;

/** Vrai quand la prière tombe dans les 30 minutes qui viennent (ni passée, ni plus lointaine). */
export function activiteAttendue(heurePriere: number, maintenant: number, actif: boolean): boolean {
  if (!actif || !Number.isFinite(heurePriere) || !Number.isFinite(maintenant)) return false;
  const reste = heurePriere - maintenant;
  return reste > 0 && reste <= AVANT_MS;
}
