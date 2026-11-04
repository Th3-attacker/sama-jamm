// Zakat indicative (section Budget du foyer du design) : calculs purs, sans base ni React.
// Méthode à faire valider par le référent religieux du projet avant publication. Les montants sont des entiers
// dans la plus petite unité de la devise ; les poids sont en milligrammes ; aucun cours n'est lu sur le réseau.
import { ajouterJours, ecartJours, type Jour } from './cycle.ts';

export type BaseNisab = 'or' | 'argent';
export const BASES_NISAB: readonly BaseNisab[] = ['argent', 'or'];
/** Nisab : 85 g d'or ou 595 g d'argent. */
export const NISAB_GRAMMES: Record<BaseNisab, number> = { or: 85, argent: 595 };
/** Une année lunaire (hawl), arrondie au jour. */
export const JOURS_HAWL = 354;
/** Au-delà, le prix du gramme saisi est signalé comme ancien. */
export const COURS_ANCIEN_JOURS = 30;

/** Valeur d'un poids de métal au prix du gramme (milligrammes × prix / 1000, arrondi). */
export function valeurMetal(milligrammes: number, prixDuGramme: number): number {
  return Math.round((milligrammes * prixDuGramme) / 1000);
}

/** Seuil en monnaie ; null tant que le prix du gramme du métal choisi n'est pas saisi. */
export function seuilNisab(base: BaseNisab, prix: { or: number | null; argent: number | null }): number | null {
  const p = prix[base];
  return p !== null && p > 0 ? NISAB_GRAMMES[base] * p : null;
}

/** 2,5 %, arrondi au-dessus : une estimation ne doit jamais faire verser moins que dû. */
export function montantZakat(base: number): number {
  return base > 0 ? Math.ceil((base * 25) / 1000) : 0;
}

export type Composition = {
  /** Total mis de côté (épargne libre et objectifs actifs). */
  epargne: number;
  /** Soldes positifs des comptes. */
  comptes: number;
  /** Or et argent, au prix du gramme. */
  metaux: number;
  /** Autres biens déclarés. */
  autres: number;
  /** Ce qu'on me doit : dettes « On me doit » ouvertes et créances déclarées. */
  creances: number;
  /** Ce que je dois avant l'échéance de la zakat, à déduire. */
  dettes: number;
};

export function baseDeCalcul(c: Composition): number {
  return c.epargne + c.comptes + c.metaux + c.autres + c.creances - c.dettes;
}

/** Début de l'année lunaire à garder : posé le jour où la base atteint le nisab, effacé si elle repasse dessous. */
export function debutHawlSuivi(debut: Jour | null, atteint: boolean | null, aujourdhui: Jour): Jour | null {
  if (atteint === null) return debut;
  if (!atteint) return null;
  return debut ?? aujourdhui;
}

export type EtatZakat =
  /** Prix du gramme manquant : pas de nisab, pas de verdict. */
  | { type: 'sansCours'; base: number }
  | { type: 'sousNisab'; base: number; nisab: number }
  /** Au-dessus du nisab : la zakat sera due à l'échéance (ou l'est déjà si `joursRestants` ≤ 0). */
  | { type: 'due'; base: number; nisab: number; montant: number; echeance: Jour; joursRestants: number };

export function etatZakat(base: number, nisab: number | null, debutHawl: Jour | null, aujourdhui: Jour): EtatZakat {
  if (nisab === null) return { type: 'sansCours', base };
  if (base < nisab || debutHawl === null) return { type: 'sousNisab', base, nisab };
  const echeance = ajouterJours(debutHawl, JOURS_HAWL);
  return {
    type: 'due',
    base,
    nisab,
    montant: montantZakat(base),
    echeance,
    joursRestants: ecartJours(aujourdhui, echeance),
  };
}

/** Poids tapé en grammes (« 48 », « 48,5 », « 0.25 ») en milligrammes ; null si illisible ou nul. */
export function grammesVersMg(saisie: string): number | null {
  const m = /^\s*(\d{1,7})(?:[.,](\d{1,3}))?\s*$/.exec(saisie);
  if (!m) return null;
  const mg = Number(m[1]) * 1000 + Number((m[2] ?? '').padEnd(3, '0') || '0');
  return mg > 0 ? mg : null;
}

/** Milligrammes en grammes lisibles, virgule décimale : 48 500 → « 48,5 ». */
export function mgVersGrammes(mg: number): string {
  const entier = Math.floor(mg / 1000);
  const reste = String(mg % 1000)
    .padStart(3, '0')
    .replace(/0+$/, '');
  return reste ? `${entier},${reste}` : String(entier);
}

/** Le prix du gramme date-t-il de plus de 30 jours ? */
export function coursAncien(majLe: Jour | null, aujourdhui: Jour): boolean {
  return majLe === null || ecartJours(majLe, aujourdhui) > COURS_ANCIEN_JOURS;
}
