// Moteur de recherche pur : correspondance sur un index déjà normalisé, sans accès aux données du Coran.
// `recherche.ts` construit l'index à partir du Coran embarqué et fournit les textes d'origine.
import type { Sourate } from '@/features/lire/coran';

import { contientArabe, normaliserArabe, normaliserLatin } from './normaliser.ts';

/** `translit` : translittération sans balises, vide si la sourate n'en a pas. */
export type ResultatVerset = { sourate: number; verset: number; texte: string; translit: string };
export type Resultats = {
  sourates: Sourate[];
  versets: ResultatVerset[];
  /** Nombre total de versets trouvés, même si la liste est coupée à `LIMITE_VERSETS`. */
  totalVersets: number;
};

export type Index = {
  noms: { sourate: Sourate; nom: string; sansEspaces: string; arabe: string }[];
  /** Versets normalisés, par sourate (indice 0 = sourate 1). */
  arabe: string[][];
  translit: string[][];
};

/** Textes d'origine, pour afficher un résultat. */
export type Textes = {
  versetsDe: (n: number) => readonly string[];
  translitDe: (n: number) => readonly string[];
};

export const LIMITE_VERSETS = 100;
const LIMITE_SOURATES = 10;
const LONGUEUR_MINI = 2;

export const VIDE: Resultats = { sourates: [], versets: [], totalVersets: 0 };

export const nomNormalise = (s: Sourate): Index['noms'][number] => {
  const nom = normaliserLatin(s.nom);
  return { sourate: s, nom, sansEspaces: nom.replace(/ /g, ''), arabe: normaliserArabe(s.arabe) };
};

/** Versets d'une sourate, normalisés en arabe et en translittération (sans balises, sans accents). */
export const versetsNormalises = (arabe: readonly string[], translit: readonly string[]) => ({
  arabe: arabe.map(normaliserArabe),
  translit: translit.map((t) => normaliserLatin(t.replace(/<\/?[a-z]+>/gi, ''))),
});

/** Tous les mots de la requête doivent se trouver dans le texte. */
const contientTout = (texte: string, mots: string[]) => mots.every((m) => texte.includes(m));

export function chercher(idx: Index, requete: string, textes: Textes): Resultats {
  const arabe = contientArabe(requete);
  const norm = arabe ? normaliserArabe(requete) : normaliserLatin(requete);
  if (norm.replace(/ /g, '').length < LONGUEUR_MINI) return VIDE;
  const mots = norm.split(' ');

  // Noms de sourates : « kahf » trouve Al-Kahf, « yasin » trouve Yâ-Sîn.
  const souratesTrouvees = idx.noms
    .filter((n) =>
      arabe ? contientTout(n.arabe, mots) : n.nom.includes(norm) || n.sansEspaces.includes(norm.replace(/ /g, '')),
    )
    .slice(0, LIMITE_SOURATES)
    .map((n) => n.sourate);

  const source = arabe ? idx.arabe : idx.translit;
  const versets: ResultatVerset[] = [];
  let total = 0;
  source.forEach((liste, i) => {
    liste.forEach((texte, j) => {
      if (!contientTout(texte, mots)) return;
      total += 1;
      if (versets.length >= LIMITE_VERSETS) return;
      const n = i + 1;
      versets.push({
        sourate: n,
        verset: j + 1,
        texte: textes.versetsDe(n)[j] ?? '',
        translit: (textes.translitDe(n)[j] ?? '').replace(/<\/?[a-z]+>/gi, ''),
      });
    });
  });

  return { sourates: souratesTrouvees, versets, totalVersets: total };
}
