// Devises personnelles et changement de devise d'un carnet : règles pures, sans base de données.
import { formatMontant, type Devise } from '../../lib/montant.ts';

export const NOM_DEVISE_MAX = 30;
export const SYMBOLE_DEVISE_MAX = 4;
/** Chiffres après la virgule acceptés dans un taux : « 0,001524 ». */
export const TAUX_DECIMALES_MAX = 6;
const TAUX_MAX = 1_000_000_000;

export type SaisieDevise = {
  nom: string;
  symbole: string;
  position: Devise['position'];
  decimales: Devise['decimales'];
};

/** Devise personnelle prête à enregistrer, ou null si le nom ou le symbole ne conviennent pas. */
export function deviseDepuisSaisie(s: SaisieDevise, code: string): Devise | null {
  const nom = s.nom.trim();
  const symbole = s.symbole.trim();
  if (nom.length < 1 || nom.length > NOM_DEVISE_MAX) return null;
  if (symbole.length < 1 || symbole.length > SYMBOLE_DEVISE_MAX) return null;
  if (s.position !== 'avant' && s.position !== 'apres') return null;
  if (s.decimales !== 0 && s.decimales !== 1 && s.decimales !== 2) return null;
  return {
    code,
    nom,
    symbole,
    position: s.position,
    decimales: s.decimales,
    sousUnites: 10 ** s.decimales,
    personnelle: true,
  };
}

/** Exemple affiché sous une devise : 2 500 unités principales. */
export function apercuDevise(d: Pick<Devise, 'symbole' | 'position' | 'decimales' | 'sousUnites'>): string {
  return formatMontant(2500 * d.sousUnites, { code: '', nom: '', personnelle: true, ...d });
}

/** Taux exact « 1 ancienne unité = numerateur / denominateur nouvelle unité » : jamais de virgule flottante. */
export type Taux = { numerateur: number; denominateur: number };

/** Saisie « 0,0165 » ou « 655.957 » vers un taux exact ; null si vide, nul, négatif ou trop précis. */
export function lireTaux(saisie: string): Taux | null {
  const propre = saisie.replace(/[\s\u00a0\u202f]/g, '').replace(',', '.');
  const m = /^(\d+)(?:\.(\d+))?$/.exec(propre);
  if (!m) return null;
  const entier = m[1] ?? '';
  const fraction = m[2] ?? '';
  if (fraction.length > TAUX_DECIMALES_MAX) return null;
  const denominateur = 10 ** fraction.length;
  const numerateur = Number(entier + fraction);
  if (!Number.isSafeInteger(numerateur) || numerateur <= 0 || numerateur / denominateur > TAUX_MAX) return null;
  return { numerateur, denominateur };
}

/**
 * Montant converti d'une devise à l'autre, arrondi à la plus petite unité la plus proche (moitié vers l'extérieur).
 * Calcul en entiers (BigInt) : ancien × numérateur × sous-unités nouvelles ÷ (dénominateur × sous-unités anciennes).
 */
export function convertirMontant(
  montant: number,
  de: Pick<Devise, 'sousUnites'>,
  vers: Pick<Devise, 'sousUnites'>,
  taux: Taux,
): number {
  const haut = BigInt(Math.abs(montant)) * BigInt(taux.numerateur) * BigInt(vers.sousUnites);
  const bas = BigInt(taux.denominateur) * BigInt(de.sousUnites);
  const arrondi = (2n * haut + bas) / (2n * bas);
  const resultat = Number(arrondi);
  return montant < 0 ? -resultat : resultat;
}

/** Comme `convertirMontant`, mais un montant positif reste au moins d'une unité (opérations, dettes). */
export function convertirMontantPositif(
  montant: number,
  de: Pick<Devise, 'sousUnites'>,
  vers: Pick<Devise, 'sousUnites'>,
  taux: Taux,
): number {
  return montant > 0
    ? Math.max(1, convertirMontant(montant, de, vers, taux))
    : convertirMontant(montant, de, vers, taux);
}
