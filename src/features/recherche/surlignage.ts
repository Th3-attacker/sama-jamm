// Surlignage des mots trouvés dans une translittération (planche « Recherche ») : sans accents ni casse, mot entier.
import { contientArabe, normaliserLatin } from './normaliser.ts';

export type Morceau = { texte: string; trouve: boolean };

const LONGUEUR_MINI = 2;

/** Découpe `texte` en morceaux ; un mot qui contient un mot de la requête est marqué `trouve`. */
export function surligner(texte: string, requete: string): Morceau[] {
  if (contientArabe(requete)) return [{ texte, trouve: false }];
  const mots = normaliserLatin(requete)
    .split(' ')
    .filter((m) => m.length >= LONGUEUR_MINI);
  if (mots.length === 0) return [{ texte, trouve: false }];

  // Le groupe capturant garde les mots à l'indice impair ; le reste (espaces, ponctuation) à l'indice pair.
  return texte
    .split(/([\p{L}\p{N}]+)/u)
    .filter((morceau) => morceau.length > 0)
    .map((morceau) => ({
      texte: morceau,
      trouve: /^[\p{L}\p{N}]+$/u.test(morceau) && mots.some((m) => normaliserLatin(morceau).includes(m)),
    }));
}
