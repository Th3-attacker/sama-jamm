// Invocations (Hisn al-Muslim) : 71 invocations en 4 moments (matin 24, soir 24, après la prière 8, sommeil 15),
// arabe seul : ni sens ni translittération (absents de la source ; le texte sacré n'est jamais écrit de mémoire).
// Fonctions pures, données lues au premier besoin (fichier d'environ 55 Ko).

export const CATEGORIES_IDS = [
  'morning',
  'evening',
  'after_prayer',
  'sleep',
] as const;
export type CategorieId = (typeof CATEGORIES_IDS)[number];

export type Categorie = { id: CategorieId; nom: string };

export type Invocation = {
  id: string;
  categorie: CategorieId;
  /** Titre en français. */
  titre: string;
  arabe: string;
  /** Translittération latine, affichée seulement si l'utilisateur l'active. */
  translit: string;
  /** Sens en français, ou null pour un texte du Coran (arabe seul). */
  sens: string | null;
  /** Recueil et numéro : « Sahih Muslim 2723 ». */
  source: string;
  /** Nombre de lectures recommandé ; 1 sans compteur. */
  repetitions: number;
};

type Donnees = { categories: Categorie[]; duas: Invocation[] };

let enMemoire: Donnees | undefined;

function donnees(): Donnees {
  enMemoire ??= require('@/data/invocations/duas.json') as Donnees;
  return enMemoire;
}

export const categories = (): readonly Categorie[] => donnees().categories;
export const invocations = (): readonly Invocation[] => donnees().duas;

export const estCategorie = (valeur: string): valeur is CategorieId => CATEGORIES_IDS.some((c) => c === valeur);

export const invocationsDe = (categorie: CategorieId): Invocation[] => invocations().filter((i) => i.categorie === categorie);
