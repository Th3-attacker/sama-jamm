// Postes proposés au premier budget (section Budget du foyer) : l'utilisateur garde ceux qui lui servent.
import type { IconName } from '@/ui/types';

export type PosteDeDepart = {
  /** Clé i18n sous `budget.enveloppesDefaut`. */
  cle: 'quotidien' | 'loyer' | 'energie' | 'transport' | 'scolarite' | 'sante' | 'famille' | 'ceremonies' | 'sadaqa';
  icone: IconName;
  /** Charge fixe : réservée avant la dépense du jour tant qu'elle n'est pas réglée. */
  fixe: boolean;
};

export const postesDeDepart: readonly PosteDeDepart[] = [
  { cle: 'quotidien', icone: 'cart', fixe: false },
  { cle: 'loyer', icone: 'home', fixe: true },
  { cle: 'energie', icone: 'bolt', fixe: true },
  { cle: 'transport', icone: 'car', fixe: false },
  { cle: 'scolarite', icone: 'book', fixe: true },
  { cle: 'sante', icone: 'heart', fixe: false },
  { cle: 'famille', icone: 'users', fixe: false },
  { cle: 'ceremonies', icone: 'calendar', fixe: false },
  { cle: 'sadaqa', icone: 'balance', fixe: false },
];

const ICONES_ENVELOPPE = new Set<string>(postesDeDepart.map((p) => p.icone));

/** Icône enregistrée en base vers une icône connue ; repli sur le portefeuille. */
export function iconeEnveloppe(icone: string): IconName {
  return ICONES_ENVELOPPE.has(icone) ? (icone as IconName) : 'wallet';
}
