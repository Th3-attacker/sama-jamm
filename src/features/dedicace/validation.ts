// Validation locale du nom à dédier : mêmes règles que la fonction serveur `dedier_nom` (migration 015). Le serveur
// reste seul juge ; ce contrôle évite un aller-retour réseau et dit tout de suite ce qui ne va pas. Pur : testable sans Supabase.

export const NOM_MIN = 2;
export const NOM_MAX = 80;

export type Formule = 'masculin' | 'feminin';

/** Raisons de refus ; aucune ne cite le nom saisi (rien de personnel dans les messages ni les journaux). */
export type RaisonNomInvalide = 'trop-court' | 'trop-long' | 'caracteres' | 'lien';

export type NomControle = { valide: true; nom: string } | { valide: false; raison: RaisonNomInvalide };

// Chiffres et symboles d'adresse, de code ou de balise : refusés (une apostrophe, un trait d'union, un point et les lettres arabes passent).
const CARACTERES_REFUSES = /[0-9@/\\<>:;{}[\]|=_&%$#*+~`"!?()]/;
const LIEN = /(http|www\.)/i;

/** Espaces multiples réduits à un, début et fin retirés. Même normalisation que le serveur. */
export function normaliserNom(brut: string): string {
  return brut.replace(/\s+/g, ' ').trim();
}

export function controlerNom(brut: string): NomControle {
  const nom = normaliserNom(brut);
  const longueur = [...nom].length;
  if (longueur < NOM_MIN) return { valide: false, raison: 'trop-court' };
  if (longueur > NOM_MAX) return { valide: false, raison: 'trop-long' };
  if (CARACTERES_REFUSES.test(nom)) return { valide: false, raison: 'caracteres' };
  if (LIEN.test(nom)) return { valide: false, raison: 'lien' };
  return { valide: true, nom };
}
