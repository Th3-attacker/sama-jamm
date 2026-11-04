// Épargne avec intention (section Budget du foyer du design) : calculs purs, sans base ni React.
// Les montants sont des entiers dans la plus petite unité de la devise du carnet ; aucun intérêt n'est calculé.

/** Nom d'un objectif : 1 à 40 caractères ; intention : 120 au plus. */
export const NOM_OBJECTIF_MAX = 40;
export const INTENTION_MAX = 120;

/** Part atteinte d'un objectif (0 à 1) ; null sans montant visé (pas de barre : chaque dépôt compte). */
export function progressionObjectif(verse: number, cible: number | null): number | null {
  if (cible === null || cible <= 0) return null;
  return Math.min(1, Math.max(0, verse / cible));
}

export type Projection =
  | { type: 'atteint' }
  /** Encore `paies` versements au rythme choisi ; dernier versement attendu le mois `mois` (« 2027-08 »). */
  | { type: 'rythme'; paies: number; mois: string }
  /** Montant visé sans versement fixé : on ne peut pas estimer. */
  | { type: 'sansRythme' }
  /** Ni montant visé : versement libre. */
  | { type: 'libre' };

/**
 * Quand l'objectif sera atteint, à raison d'un versement par paie (une paie par mois).
 * `aujourdhui` est un jour « aaaa-mm-jj » ; le premier versement restant est compté ce mois-ci.
 */
export function projectionObjectif(
  o: { verse: number; cible: number | null; versementMensuel: number | null },
  aujourdhui: string,
): Projection {
  if (o.cible === null || o.cible <= 0) return { type: 'libre' };
  const manque = o.cible - o.verse;
  if (manque <= 0) return { type: 'atteint' };
  if (!o.versementMensuel || o.versementMensuel <= 0) return { type: 'sansRythme' };
  const paies = Math.ceil(manque / o.versementMensuel);
  const [a, m] = aujourdhui.split('-').map(Number);
  const index = (a ?? 1970) * 12 + ((m ?? 1) - 1) + (paies - 1);
  const mois = `${Math.floor(index / 12)}-${String((index % 12) + 1).padStart(2, '0')}`;
  return { type: 'rythme', paies, mois };
}
