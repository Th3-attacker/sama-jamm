// Les moments de la planche « Invocations » : trois moments faits de versets du Coran (donnees.ts) et trois
// tirés de la Citadelle du musulman (categoriesHisn.ts). Fonctions pures.

import type { CategorieHisnId } from './categoriesHisn.ts';
import { CATEGORIES, estCategorie, type CategorieId } from './donnees.ts';

/** Moment de la citadelle → catégorie de chapitres qui lui correspond. */
export const MOMENTS_HISN = {
  voyage: 'voyage',
  repas: 'repas',
  apresPriere: 'apresPriere',
} as const satisfies Record<string, CategorieHisnId>;
export type MomentHisnId = keyof typeof MOMENTS_HISN;

export const MOMENTS = [...CATEGORIES, ...(Object.keys(MOMENTS_HISN) as MomentHisnId[])] as const;
export type MomentId = CategorieId | MomentHisnId;

export function estMomentHisn(valeur: string): valeur is MomentHisnId {
  return Object.hasOwn(MOMENTS_HISN, valeur);
}

export function estMoment(valeur: string): valeur is MomentId {
  return estCategorie(valeur) || estMomentHisn(valeur);
}
