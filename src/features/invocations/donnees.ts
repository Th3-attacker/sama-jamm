// Invocations coraniques : des références vers le texte du Coran déjà embarqué (Tanzil pour l'arabe, traduction de
// l'app), jamais un texte recopié ici. Les invocations tirées des hadiths s'ajouteront quand leur source et leur
// licence seront validées. Fonctions pures : aucune dépendance à React Native.

export const CATEGORIES = ['matin', 'soir', 'sommeil'] as const;
export type CategorieId = (typeof CATEGORIES)[number];

export type Invocation = {
  id: string;
  categorie: CategorieId;
  /** Verset (ou suite de versets) du Coran : sourate, du verset `de` au verset `a` inclus. */
  sourate: number;
  de: number;
  a: number;
  /** Nombre de lectures recommandé ; 1 sans compteur. */
  repetitions: number;
};

const ayatAlKursi = { sourate: 2, de: 255, a: 255 } as const;
const troisSourates = [112, 113, 114] as const;

const matinSoir = (categorie: 'matin' | 'soir'): Invocation[] => [
  { id: `${categorie}-kursi`, categorie, ...ayatAlKursi, repetitions: 1 },
  ...troisSourates.map((s) => ({
    id: `${categorie}-${s}`,
    categorie,
    sourate: s,
    de: 1,
    a: s === 112 ? 4 : s === 113 ? 5 : 6,
    repetitions: 3,
  })),
];

export const INVOCATIONS: readonly Invocation[] = [
  ...matinSoir('matin'),
  ...matinSoir('soir'),
  { id: 'sommeil-kursi', categorie: 'sommeil', ...ayatAlKursi, repetitions: 1 },
  { id: 'sommeil-baqara', categorie: 'sommeil', sourate: 2, de: 285, a: 286, repetitions: 1 },
  ...troisSourates.map((s) => ({
    id: `sommeil-${s}`,
    categorie: 'sommeil' as const,
    sourate: s,
    de: 1,
    a: s === 112 ? 4 : s === 113 ? 5 : 6,
    repetitions: 3,
  })),
];

export function estCategorie(valeur: string): valeur is CategorieId {
  return CATEGORIES.some((c) => c === valeur);
}

export function invocationsDe(categorie: CategorieId): Invocation[] {
  return INVOCATIONS.filter((i) => i.categorie === categorie);
}
