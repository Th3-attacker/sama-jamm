// Déclaration d'un don (facultative), pour remercier : règles pures.
import { WALLETS, type IdWallet } from './wallets.ts';

export const MESSAGE_MAX = 300;

export type SaisieDeclaration = { wallet: string; montant: string; message: string };
export type Declaration = {
  wallet: IdWallet;
  montant: number;
  reference: string;
  prenom: string | null;
  message: string | null;
};

/** Wallet reçu d'un écran précédent (paramètre de route), ou null s'il n'est pas connu. */
export function walletConnu(saisie: string): IdWallet | null {
  return WALLETS.find((w) => w.id === saisie)?.id ?? null;
}

/**
 * Référence interne, générée par l'app : le numéro de transaction n'est plus demandé.
 * Elle reste unique (date + aléa) pour la contrainte (wallet, référence) de la base.
 */
export function referenceInterne(maintenant: number = Date.now(), alea: number = Math.random()): string {
  const date = maintenant.toString(36).toUpperCase();
  const hasard = Math.floor(alea * 36 ** 4).toString(36).toUpperCase().padStart(4, '0');
  return `APP${date}${hasard}`;
}

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

/** Déclaration prête à envoyer, ou null si le wallet ou le montant ne conviennent pas. */
export function validerDeclaration(s: SaisieDeclaration, reference: string = referenceInterne()): Declaration | null {
  const wallet = walletConnu(s.wallet);
  const montant = montantDon(s.montant);
  const propre = referenceDon(reference);
  if (!wallet || montant === null || propre === null) return null;
  return {
    wallet,
    montant,
    reference: propre,
    prenom: null,
    message: facultatif(s.message, MESSAGE_MAX),
  };
}
