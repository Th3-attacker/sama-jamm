// Invocations (UmmahAPI) : 78 invocations en 16 catégories, arabe, translittération, sens en français et source.
// Les textes coraniques (Al-Fatiha, Ayat al-Kursi, derniers versets d'al-Baqara…) n'ont pas de sens : le Coran
// s'affiche en arabe seul. Fonctions pures, données lues au premier besoin (fichier d'environ 55 Ko).

export const CATEGORIES_IDS = [
  'morning',
  'evening',
  'wudu',
  'prayer',
  'after_prayer',
  'sleep',
  'travel',
  'home',
  'masjid',
  'illness',
  'protection',
  'marriage',
  'grief',
  'business',
  'night_prayer',
  'quran_recitation',
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

/** Les premiers mots d'une phrase, pour le titre court du compteur. */
export function debutDe(texte: string, mots = 3): string {
  return texte.replace(/[()[\]﴿﴾]/g, ' ').split(/\s+/).filter(Boolean).slice(0, mots).join(' ');
}
