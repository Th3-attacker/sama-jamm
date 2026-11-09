// Classement des 132 chapitres de la Citadelle du musulman par moment ou situation. Chaque chapitre figure dans
// une seule catégorie. Classement éditorial de Sama Jàmm, à faire valider par le référent religieux.
// Fonctions pures : aucune dépendance à React Native.

import type { ChapitreHisn } from './hisn';

export const CATEGORIES_HISN = [
  'matinSoir',
  'sommeil',
  'dansPriere',
  'apresPriere',
  'purification',
  'maisonMosquee',
  'repas',
  'voyage',
  'hajj',
  'epreuves',
  'santeDeuil',
  'nature',
  'relations',
  'louange',
] as const;
export type CategorieHisnId = (typeof CATEGORIES_HISN)[number];

/** Suite d'identifiants de `debut` à `fin` inclus. */
const suite = (debut: number, fin: number): number[] => Array.from({ length: fin - debut + 1 }, (_, i) => debut + i);

const CHAPITRES_PAR_CATEGORIE: Record<CategorieHisnId, readonly number[]> = {
  matinSoir: [1],
  sommeil: [2, 3, 29, 30, 31],
  dansPriere: [...suite(18, 26), 28, 32],
  apresPriere: [27, 33],
  purification: [...suite(4, 7), ...suite(14, 17)],
  maisonMosquee: suite(8, 13),
  repas: suite(68, 76),
  voyage: suite(95, 105),
  hajj: suite(115, 121),
  epreuves: [...suite(34, 46), 126, 128],
  santeDeuil: [...suite(49, 60), 124],
  nature: suite(61, 67),
  relations: [47, 48, ...suite(77, 94), 106, ...suite(108, 114), 122, 123, 125, 127, 132],
  louange: [107, ...suite(129, 131)],
};

export function estCategorieHisn(valeur: string): valeur is CategorieHisnId {
  return CATEGORIES_HISN.some((c) => c === valeur);
}

export function idsDeCategorie(categorie: CategorieHisnId): readonly number[] {
  return CHAPITRES_PAR_CATEGORIE[categorie];
}

/** Les chapitres d'une catégorie, dans l'ordre de l'ouvrage. */
export function chapitresDeCategorie(categorie: CategorieHisnId, tous: readonly ChapitreHisn[]): ChapitreHisn[] {
  const ids = new Set(CHAPITRES_PAR_CATEGORIE[categorie]);
  return tous.filter((c) => ids.has(c.id));
}
