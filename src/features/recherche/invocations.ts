// Recherche dans les invocations embarquées : titre, arabe, translittération et sens en français, sans réseau.
// Fonction pure : la liste vient de l'appelant (`invocations()`), ce qui la rend testable sans les données.
import { contientArabe, normaliserArabe, normaliserLatin } from './normaliser.ts';

export type InvocationCherchable = {
  id: string;
  categorie: string;
  titre: string;
  arabe: string;
  translit: string;
  sens: string | null;
};

export const LIMITE_INVOCATIONS = 50;
const LONGUEUR_MINI = 2;

/** Invocations dont le texte contient tous les mots de la requête (arabe ou lettres latines), dans l'ordre des données. */
export function chercherInvocations<T extends InvocationCherchable>(liste: readonly T[], requete: string): T[] {
  const arabe = contientArabe(requete);
  const norm = arabe ? normaliserArabe(requete) : normaliserLatin(requete);
  if (norm.replace(/ /g, '').length < LONGUEUR_MINI) return [];
  const mots = norm.split(' ');
  const trouvees: T[] = [];
  for (const inv of liste) {
    const texte = arabe
      ? normaliserArabe(inv.arabe)
      : normaliserLatin(`${inv.titre} ${inv.translit.replace(/<\/?[a-z]+>/gi, '')} ${inv.sens ?? ''}`);
    if (!mots.every((m) => texte.includes(m))) continue;
    trouvees.push(inv);
    if (trouvees.length >= LIMITE_INVOCATIONS) break;
  }
  return trouvees;
}
