// Curseur à crans : règles pures.

/** Valeurs d'un curseur de `min` à `max` par pas de `pas` (crans), sans erreur d'arrondi flottant. */
export function cransDe(min: number, max: number, pas: number): number[] {
  if (!(pas > 0) || !(max >= min)) return [min];
  const decimales = Math.max(0, ...[min, max, pas].map((n) => (String(n).split('.')[1] ?? '').length));
  const n = Math.floor((max - min) / pas + 1e-9);
  return Array.from({ length: n + 1 }, (_, i) => Number((min + i * pas).toFixed(decimales)));
}
