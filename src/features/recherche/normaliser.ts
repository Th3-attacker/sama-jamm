// Normalisation des textes pour la recherche (section Lecture et audio du design).

// Voyelles et signes de récitation, tatwil et petits signes coraniques.
const SIGNES_ARABES = /[ؐ-ًؚ-ٰٟۖ-ۭـ࣓-ࣿ]/g;
const LETTRES_ARABES = /[ء-يٱ]/;

/** Vrai si le texte contient au moins une lettre arabe. */
export function contientArabe(texte: string): boolean {
  return LETTRES_ARABES.test(texte);
}

/** Arabe : sans voyelles ni signes, alifs unifiés (أ إ آ ٱ → ا), ة → ه, ى → ي. */
export function normaliserArabe(texte: string): string {
  return texte
    .replace(SIGNES_ARABES, '')
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Français, wolof, noms : sans accents ni casse (« ë » → « e », « ñ » → « n »), ponctuation en espaces. */
export function normaliserLatin(texte: string): string {
  return texte
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
