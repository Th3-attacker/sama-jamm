import { versetsDe } from '@/features/lire/coran';

/** Un verset choisi pour une rubrique : sourate et numéro de verset. */
export type RefVerset = { sourate: number; verset: number };

/** Versets affichés dans les rubriques Prière et Budget. Le texte vient des données embarquées de l'app. */
export const VERSETS_RUBRIQUES = {
  priere: { sourate: 4, verset: 103 },
  budget: { sourate: 25, verset: 67 },
  dettes: { sourate: 2, verset: 280 },
  zakat: { sourate: 2, verset: 43 },
  dhikr: { sourate: 33, verset: 41 },
} as const satisfies Record<string, RefVerset>;

export type Rubrique = keyof typeof VERSETS_RUBRIQUES;

export type VersetAffiche = { reference: string; arabe: string };

/** Texte arabe d'un verset, lu dans les données de l'app. Null si le verset est introuvable. */
export function versetRubrique(rubrique: Rubrique): VersetAffiche | null {
  const { sourate, verset } = VERSETS_RUBRIQUES[rubrique];
  const arabe = versetsDe(sourate)[verset - 1];
  if (!arabe) return null;
  return { reference: `${sourate}:${verset}`, arabe };
}
