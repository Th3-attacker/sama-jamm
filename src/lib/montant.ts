// Argent : toujours des entiers dans la plus petite unité de la devise (section Budget du foyer du design).
// Aucun calcul en virgule flottante sur un montant : `versPrincipal` ne sert qu'à l'affichage.

export type Devise = {
  /** Code court : « XOF », « MRU », ou celui d'une devise personnelle. */
  code: string;
  nom: string;
  /** 4 caractères au plus : « F CFA », « UM », « DH ». */
  symbole: string;
  position: 'avant' | 'apres';
  /** Chiffres après la virgule à l'affichage et à la saisie : 0 à 2. */
  decimales: 0 | 1 | 2;
  /** Plus petites unités par unité principale : 1 pour le F CFA, 5 pour l'ouguiya (khoums), 100 pour une devise à 2 décimales. */
  sousUnites: number;
  personnelle: boolean;
};

export const XOF: Devise = {
  code: 'XOF',
  nom: 'Franc CFA',
  symbole: 'F CFA',
  position: 'apres',
  decimales: 0,
  sousUnites: 1,
  personnelle: false,
};
export const MRU: Devise = {
  code: 'MRU',
  nom: 'Ouguiya',
  symbole: 'UM',
  position: 'apres',
  decimales: 0,
  sousUnites: 5,
  personnelle: false,
};
export const devisesIntegrees: readonly Devise[] = [XOF, MRU];

/** Plus grand montant saisissable, en unités principales (10¹²) : de la marge avant 2⁵³. */
export const MONTANT_MAX_UNITES = 1_000_000_000_000;

/** Espace fine insécable entre les milliers, insécable entre le nombre et le symbole. */
const MILLIERS = ' ';
const ENTRE_NOMBRE_ET_SYMBOLE = ' ';
const MOINS = '−';

/**
 * Saisie (« 2500 », « 12,50 », « 2 500 ») vers le montant entier en plus petites unités.
 * `null` si la saisie n'est pas un montant valide pour cette devise : lettres, signe, trop de décimales
 * (pas de décimale pour le F CFA), ou plus de 10¹² unités.
 */
export function versMinimes(saisie: string, devise: Devise): number | null {
  const propre = saisie.replace(/[\s  ]/g, '').replace(',', '.');
  const m = /^(\d+)(?:\.(\d+))?$/.exec(propre);
  if (!m) return null;
  const entier = m[1] ?? '';
  const fraction = m[2] ?? '';
  if (fraction.length > devise.decimales) return null;
  const unites = Number(entier);
  if (!Number.isSafeInteger(unites) || unites > MONTANT_MAX_UNITES) return null;
  const echelle = 10 ** devise.decimales;
  const fractionEntiere = fraction === '' ? 0 : Number(fraction.padEnd(devise.decimales, '0'));
  // Part décimale en plus petites unités : doit tomber juste (jamais d'arrondi caché sur de l'argent).
  const partDecimale = (fractionEntiere * devise.sousUnites) / echelle;
  if (!Number.isInteger(partDecimale)) return null;
  const total = unites * devise.sousUnites + partDecimale;
  return Number.isSafeInteger(total) ? total : null;
}

/** Montant en unités principales, pour l'affichage seulement (jamais pour calculer). */
export function versPrincipal(minimes: number, devise: Devise): number {
  return minimes / devise.sousUnites;
}

/** « 2 500 F CFA », « 12,50 DH », « $ 9,99 ». Un montant négatif prend un vrai signe moins. */
export function formatMontant(minimes: number, devise: Devise): string {
  if (!Number.isSafeInteger(minimes)) throw new RangeError('Un montant doit être un entier sûr.');
  const negatif = minimes < 0;
  const absolu = BigInt(Math.abs(minimes));
  const echelle = 10n ** BigInt(devise.decimales);
  const sous = BigInt(devise.sousUnites);
  // Arrondi à la plus proche des décimales affichées (demi vers le haut), en entiers.
  const arrondi = (absolu * echelle + sous / 2n) / sous;
  const entier = (arrondi / echelle).toString().replace(/\B(?=(\d{3})+(?!\d))/g, MILLIERS);
  const fraction = devise.decimales > 0 ? ',' + (arrondi % echelle).toString().padStart(devise.decimales, '0') : '';
  const nombre = (negatif && arrondi > 0n ? MOINS : '') + entier + fraction;
  return devise.position === 'avant'
    ? `${devise.symbole}${ENTRE_NOMBRE_ET_SYMBOLE}${nombre}`
    : `${nombre}${ENTRE_NOMBRE_ET_SYMBOLE}${devise.symbole}`;
}

/**
 * Montant stocké vers le texte d'un champ de saisie (« 2500 », « 12,50 ») : l'inverse de `versMinimes`.
 * `null` si le montant ne s'écrit pas exactement avec les décimales de la devise (khoums isolés en ouguiya).
 */
export function versSaisie(minimes: number, devise: Devise): string | null {
  if (!Number.isSafeInteger(minimes) || minimes < 0) return null;
  const echelle = 10 ** devise.decimales;
  const total = (minimes * echelle) / devise.sousUnites;
  if (!Number.isSafeInteger(total)) return null;
  const entier = Math.floor(total / echelle);
  if (devise.decimales === 0) return String(entier);
  return `${entier},${String(total % echelle).padStart(devise.decimales, '0')}`;
}
