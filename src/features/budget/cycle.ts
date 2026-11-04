// Cycle de paie et dépense du jour (section Budget du foyer du design).
// Les dates sont des jours civils locaux « 2026-10-29 », comparés en nombre de jours : le changement
// d'heure ne peut pas décaler un jour. Les montants sont des entiers dans la plus petite unité de la devise.
import type { Devise } from '../../lib/montant.ts';

export type Jour = string;

const MS_PAR_JOUR = 86_400_000;
const FORMAT = /^(\d{4})-(\d{2})-(\d{2})$/;

const deux = (n: number) => String(n).padStart(2, '0');

function lire(jour: Jour): { annee: number; mois: number; jour: number } {
  const m = FORMAT.exec(jour);
  if (!m) throw new RangeError(`Jour invalide : « ${jour} »`);
  const annee = Number(m[1]);
  const mois = Number(m[2]);
  const j = Number(m[3]);
  if (mois < 1 || mois > 12 || j < 1 || j > joursDansMois(annee, mois))
    throw new RangeError(`Jour invalide : « ${jour} »`);
  return { annee, mois, jour: j };
}

function ecrire(annee: number, mois: number, jour: number): Jour {
  return `${String(annee).padStart(4, '0')}-${deux(mois)}-${deux(jour)}`;
}

/** Nombre de jours du mois (mois de 1 à 12), années bissextiles comprises. */
export function joursDansMois(annee: number, mois: number): number {
  return new Date(Date.UTC(annee, mois, 0)).getUTCDate();
}

/** Numéro de jour absolu (UTC) : la différence de deux numéros est un nombre exact de jours. */
function numero(jour: Jour): number {
  const { annee, mois, jour: j } = lire(jour);
  return Date.UTC(annee, mois - 1, j) / MS_PAR_JOUR;
}

/** Jour décalé de `n` jours (négatif pour reculer). */
export function ajouterJours(jour: Jour, n: number): Jour {
  const d = new Date((numero(jour) + n) * MS_PAR_JOUR);
  return ecrire(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

/** Nombre de jours de `de` à `a` (positif si `a` est après `de`). */
export function ecartJours(de: Jour, a: Jour): number {
  return numero(a) - numero(de);
}

/** Jour de paie réel d'un mois : le 31 devient le dernier jour d'un mois plus court. */
export function jourDePaieDuMois(annee: number, mois: number, jourPaie: number): Jour {
  if (!Number.isInteger(jourPaie) || jourPaie < 1 || jourPaie > 31)
    throw new RangeError('Le jour de paie va de 1 à 31.');
  return ecrire(annee, mois, Math.min(jourPaie, joursDansMois(annee, mois)));
}

export type Cycle = {
  /** Jour de paie qui ouvre le cycle. */
  debut: Jour;
  /** Veille de la paie suivante : dernier jour du cycle. */
  fin: Jour;
};

/** Cycle qui contient `aujourdhui`, du jour de paie à la veille du suivant. */
export function cycleDe(aujourdhui: Jour, jourPaie: number): Cycle {
  const { annee, mois } = lire(aujourdhui);
  const cetteAnnee = jourDePaieDuMois(annee, mois, jourPaie);
  const moisSuivant = mois === 12 ? { annee: annee + 1, mois: 1 } : { annee, mois: mois + 1 };
  const moisPrecedent = mois === 1 ? { annee: annee - 1, mois: 12 } : { annee, mois: mois - 1 };
  if (numero(aujourdhui) >= numero(cetteAnnee)) {
    return {
      debut: cetteAnnee,
      fin: ajouterJours(jourDePaieDuMois(moisSuivant.annee, moisSuivant.mois, jourPaie), -1),
    };
  }
  return {
    debut: jourDePaieDuMois(moisPrecedent.annee, moisPrecedent.mois, jourPaie),
    fin: ajouterJours(cetteAnnee, -1),
  };
}

/** Jours à couvrir, aujourd'hui compris, jusqu'à la veille de la prochaine paie : au moins 1. */
export function joursRestants(aujourdhui: Jour, fin: Jour): number {
  return Math.max(1, ecartJours(aujourdhui, fin) + 1);
}

/** `recu − misDeCote − depenses − chargesFixesNonReglees` : ce qui reste à vivre sur le cycle. */
export function resteAVivre(c: {
  recu: number;
  misDeCote: number;
  depenses: number;
  chargesFixesNonReglees: number;
}): number {
  return c.recu - c.misDeCote - c.depenses - c.chargesFixesNonReglees;
}

/** Pas d'arrondi de la dépense du jour, en plus petites unités : 100 unités sans décimales, 1 unité sinon. */
export function pasArrondi(devise: Devise): number {
  return devise.decimales === 0 ? 100 * devise.sousUnites : devise.sousUnites;
}

/** Ce que l'on peut dépenser aujourd'hui, arrondi vers le bas au pas. Jamais négatif : voir `depassement`. */
export function depenseDuJour(reste: number, jours: number, pas: number): number {
  if (!(jours >= 1) || !(pas >= 1)) throw new RangeError('Jours et pas doivent être positifs.');
  if (reste <= 0) return 0;
  return Math.floor(reste / jours / pas) * pas;
}

/** Montant dont le cycle est déjà dépassé quand le reste à vivre est négatif, sinon 0. */
export function depassement(reste: number): number {
  return reste < 0 ? -reste : 0;
}

export type EtatEnveloppe = 'normal' | 'presque-plein' | 'depasse' | 'reglee';

/** Seuil à partir duquel une enveloppe est « presque pleine ». */
export const SEUIL_PRESQUE_PLEIN = 0.85;

/**
 * État d'une enveloppe : normal sous 85 %, presque plein de 85 % à 100 %, dépassé au-delà.
 * Une enveloppe fixe (loyer…) exactement pleine est « réglée pour ce cycle ».
 */
export function etatEnveloppe(depense: number, plafond: number, fixe: boolean): EtatEnveloppe {
  if (plafond <= 0) return depense > 0 ? 'depasse' : 'normal';
  if (depense > plafond) return 'depasse';
  if (fixe && depense === plafond) return 'reglee';
  return depense / plafond >= SEUIL_PRESQUE_PLEIN ? 'presque-plein' : 'normal';
}
