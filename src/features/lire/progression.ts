// Progression du khatm (lecture du Coran entier) d'après le dernier verset lu : règle pure.
import { numeroGlobal, type Position } from '../ecouter/recitateurs.ts';

const TOTAL_VERSETS = 6236;

/** Part du Coran lue jusqu'à ce verset compris, de 0 à 1. */
export function progressionKhatm(p: Position, versetsParSourate: readonly number[]): number {
  return Math.min(1, Math.max(0, numeroGlobal(p, versetsParSourate) / TOTAL_VERSETS));
}

/** Pourcentage arrondi à l'entier (« 34 »), jamais 100 avant le dernier verset. */
export function pourcentageKhatm(part: number): number {
  return part >= 1 ? 100 : Math.min(99, Math.round(part * 100));
}
