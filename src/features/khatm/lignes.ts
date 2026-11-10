// Contrôle à l'exécution des lignes renvoyées par Supabase. Les types TypeScript ne vérifient rien au runtime :
// une ligne au format inattendu est rejetée au lieu d'être utilisée telle quelle.
import type { EtatPart, Part } from './logique';

export type Khatm = {
  id: string;
  nom: string;
  intention: string | null;
  echeance: string | null;
  createur: string | null;
  code: string;
};
export type Membre = { user_id: string; prenom: string | null };
export type Apercu = {
  id: string;
  nom: string;
  intention: string | null;
  echeance: string | null;
  invite_par: string | null;
  libres: number;
};
export type LignePart = { khatm_id: string; etat: string };

type Objet = Record<string, unknown>;

const estObjet = (v: unknown): v is Objet => typeof v === 'object' && v !== null;
const estTexte = (v: unknown): v is string => typeof v === 'string';
const estTexteOuNul = (v: unknown): v is string | null => v === null || typeof v === 'string';
const estEtat = (v: unknown): v is EtatPart => v === 'libre' || v === 'en_cours' || v === 'lu';

export const estKhatm = (v: unknown): v is Khatm =>
  estObjet(v) &&
  estTexte(v.id) &&
  estTexte(v.nom) &&
  estTexteOuNul(v.intention) &&
  estTexteOuNul(v.echeance) &&
  estTexteOuNul(v.createur) &&
  estTexte(v.code);

export const estMembre = (v: unknown): v is Membre => estObjet(v) && estTexte(v.user_id) && estTexteOuNul(v.prenom);

export const estPart = (v: unknown): v is Part =>
  estObjet(v) && typeof v.juz === 'number' && estTexteOuNul(v.user_id) && estEtat(v.etat);

export const estApercu = (v: unknown): v is Apercu =>
  estObjet(v) &&
  estTexte(v.id) &&
  estTexte(v.nom) &&
  estTexteOuNul(v.intention) &&
  estTexteOuNul(v.echeance) &&
  estTexteOuNul(v.invite_par) &&
  typeof v.libres === 'number';

export const estLignePart = (v: unknown): v is LignePart =>
  estObjet(v) && estTexte(v.khatm_id) && estTexte(v.etat);

/** Liste renvoyée par Supabase : chaque ligne doit passer la garde, sinon erreur explicite. */
export function lireListe<T>(brut: unknown, garde: (v: unknown) => v is T): T[] {
  if (!Array.isArray(brut)) throw new Error('Réponse Supabase inattendue : liste attendue.');
  const sortie: T[] = [];
  for (const ligne of brut) {
    if (!garde(ligne)) throw new Error('Réponse Supabase inattendue : ligne au mauvais format.');
    sortie.push(ligne);
  }
  return sortie;
}
