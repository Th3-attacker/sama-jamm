// Dettes entre proches (section 17 du design) : calculs purs, sans base ni React.
// Les montants sont des entiers dans la plus petite unité de la devise du carnet ; aucun intérêt n'est calculé.
import { ecartJours, joursDansMois, type Jour } from './cycle.ts';

/** « prete » : on me doit ; « emprunte » : je dois. */
export type SensDette = 'prete' | 'emprunte';
export const SENS_DETTE: readonly SensDette[] = ['prete', 'emprunte'];
export type StatutDette = 'ouverte' | 'soldee' | 'annulee';

/** Nom de la personne : 1 à 60 caractères, espaces autour retirés (même limite que la base). */
export const PERSONNE_MAX = 60;

export type EtatEcheance =
  { type: 'aucune' } | { type: 'aVenir'; jours: number } | { type: 'aujourdhui' } | { type: 'passee'; jours: number };

/** Où en est l'échéance d'une dette par rapport à aujourd'hui. */
export function etatEcheance(echeance: Jour | null, aujourdhui: Jour): EtatEcheance {
  if (!echeance) return { type: 'aucune' };
  const ecart = ecartJours(aujourdhui, echeance);
  if (ecart > 0) return { type: 'aVenir', jours: ecart };
  if (ecart === 0) return { type: 'aujourdhui' };
  return { type: 'passee', jours: -ecart };
}

/** Totaux des dettes ouvertes : ce qu'on me doit, ce que je dois, et le solde (positif en ma faveur). */
export function resumeDettes(dettes: readonly { sens: SensDette; reste: number }[]): {
  onMeDoit: number;
  jeDois: number;
  solde: number;
} {
  let onMeDoit = 0;
  let jeDois = 0;
  for (const d of dettes) {
    if (d.sens === 'prete') onMeDoit += d.reste;
    else jeDois += d.reste;
  }
  return { onMeDoit, jeDois, solde: onMeDoit - jeDois };
}

const SAISIE_DATE = /^\s*(\d{1,2})\s*[/.-]\s*(\d{1,2})\s*[/.-]\s*(\d{4})\s*$/;

/** Date tapée « jj/mm/aaaa » (aussi « j/m/aaaa », « jj.mm.aaaa ») en jour « aaaa-mm-jj » ; null si elle n'existe pas. */
export function lireSaisieDate(saisie: string): Jour | null {
  const m = SAISIE_DATE.exec(saisie);
  if (!m) return null;
  const jour = Number(m[1]);
  const mois = Number(m[2]);
  const annee = Number(m[3]);
  if (annee < 1900 || annee > 2200 || mois < 1 || mois > 12 || jour < 1 || jour > joursDansMois(annee, mois)) {
    return null;
  }
  return `${annee}-${String(mois).padStart(2, '0')}-${String(jour).padStart(2, '0')}`;
}

/**
 * Saisie d'une date au clavier numérique (sans « / » sur iPhone) : garde les chiffres et place les barres,
 * « 30112026 » → « 30/11/2026 ».
 */
export function masqueDate(saisie: string): string {
  const chiffres = saisie.replace(/\D/g, '').slice(0, 8);
  if (chiffres.length <= 2) return chiffres;
  if (chiffres.length <= 4) return `${chiffres.slice(0, 2)}/${chiffres.slice(2)}`;
  return `${chiffres.slice(0, 2)}/${chiffres.slice(2, 4)}/${chiffres.slice(4)}`;
}

/** Jour « aaaa-mm-jj » en saisie « jj/mm/aaaa », pour préremplir le champ. */
export function versSaisieDate(jour: Jour): string {
  const [a, m, j] = jour.split('-');
  return `${j}/${m}/${a}`;
}
