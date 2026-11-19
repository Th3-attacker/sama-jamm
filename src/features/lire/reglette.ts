// Réglette des pages du mushaf (planche « Mode page, réglette ») : conversions entre une page et une position.
// Fonctions pures. En interface de droite à gauche la page 1 est à droite, comme le mushaf.

/** Position de la page sur la piste, de 0 (page 1) à 1 (dernière page). */
export function fractionDePage(page: number, total: number): number {
  if (total <= 1) return 0;
  return Math.min(1, Math.max(0, (page - 1) / (total - 1)));
}

/** Page (de 1 à `total`) pour une position `x` sur une piste de `largeur`. */
export function pageDePosition(x: number, largeur: number, total: number, rtl: boolean): number {
  if (largeur <= 0 || total <= 1) return 1;
  const brute = Math.min(1, Math.max(0, x / largeur));
  const fraction = rtl ? 1 - brute : brute;
  return Math.round(fraction * (total - 1)) + 1;
}

/** Position horizontale (0 à `largeur`) d'une fraction de la piste, inversée en lecture de droite à gauche. */
export function positionDeFraction(fraction: number, largeur: number, rtl: boolean): number {
  return (rtl ? 1 - fraction : fraction) * largeur;
}
