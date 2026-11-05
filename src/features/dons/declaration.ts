// Déclaration d'un don (facultative), pour remercier : règles pures.
import { WALLETS, type IdWallet } from './wallets.ts';

export const MESSAGE_MAX = 300;
export const PRENOM_DON_MAX = 40;

export type SaisieDeclaration = { wallet: string; montant: string; reference: string; prenom: string; message: string };
export type Declaration = {
  wallet: IdWallet;
  montant: number;
  reference: string;
  prenom: string | null;
  message: string | null;
};

/** Montant en ouguiyas entières, de 1 à 10 000 000. */
export function montantDon(saisie: string): number | null {
  const propre = saisie.replace(/[\s\u00a0\u202f]/g, '');
  if (!/^\d{1,8}$/.test(propre)) return null;
  const n = Number(propre);
  return n >= 1 && n <= 10_000_000 ? n : null;
}

/** Référence de transaction copiée du SMS : lettres et chiffres, 4 à 40 caractères (espaces et tirets ôtés). */
export function referenceDon(saisie: string): string | null {
  const propre = saisie.replace(/[\s-]/g, '').toUpperCase();
  return /^[A-Z0-9]{4,40}$/.test(propre) ? propre : null;
}

const facultatif = (s: string, max: number) => {
  const p = s.trim().replace(/\s+/g, ' ');
  return p === '' ? null : p.slice(0, max);
};

/** Déclaration prête à envoyer, ou null si le wallet, le montant ou la référence ne conviennent pas. */
export function validerDeclaration(s: SaisieDeclaration): Declaration | null {
  const wallet = WALLETS.find((w) => w.id === s.wallet)?.id;
  const montant = montantDon(s.montant);
  const reference = referenceDon(s.reference);
  if (!wallet || montant === null || reference === null) return null;
  return {
    wallet,
    montant,
    reference,
    prenom: facultatif(s.prenom, PRENOM_DON_MAX),
    message: facultatif(s.message, MESSAGE_MAX),
  };
}
