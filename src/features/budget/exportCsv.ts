// Export des opérations du budget en CSV (RFC 4180, UTF-8 avec BOM pour les tableurs) : fonctions pures.
import type { Devise } from '../../lib/montant.ts';
import type { TypeOperation } from './depot.ts';

/** Une opération telle qu'elle part dans le fichier. */
export type LigneExport = {
  date: string;
  type: TypeOperation;
  enveloppe: string | null;
  compte: string | null;
  compteDestination: string | null;
  objectif: string | null;
  montant: number;
  note: string | null;
};

export type EntetesExport = {
  date: string;
  type: string;
  enveloppe: string;
  compte: string;
  compteDestination: string;
  objectif: string;
  montant: string;
  devise: string;
  note: string;
};

const BOM = '﻿';
const FIN_DE_LIGNE = '\r\n';

/**
 * Montant exact en unités principales, point décimal (« 12.5 », « 0.2 ») : assez de chiffres pour la plus petite
 * unité (1 pour les khoums de l'ouguiya), jamais d'arrondi.
 */
export function montantDecimal(minimes: number, devise: Pick<Devise, 'sousUnites'>): string {
  const sous = devise.sousUnites;
  let chiffres = 0;
  while (chiffres < 6 && 10 ** chiffres % sous !== 0) chiffres++;
  const echelle = 10 ** chiffres;
  const negatif = minimes < 0;
  const total = BigInt(Math.abs(minimes)) * BigInt(echelle / sous);
  const entier = (total / BigInt(echelle)).toString();
  const reste = (total % BigInt(echelle)).toString().padStart(chiffres, '0').replace(/0+$/, '');
  return `${negatif ? '-' : ''}${entier}${reste ? `.${reste}` : ''}`;
}

/**
 * Cellule CSV : entre guillemets si besoin, et neutralisée si elle commence comme une formule de tableur
 * (`=`, `+`, `-`, `@`, tabulation, retour chariot) : une note « =HYPERLINK(…) » reste du texte.
 */
export function celluleCsv(valeur: string): string {
  const sure = /^[=+\-@\t\r]/.test(valeur) ? `'${valeur}` : valeur;
  return /[",\r\n]/.test(sure) ? `"${sure.replace(/"/g, '""')}"` : sure;
}

/** Fichier CSV complet : en-têtes traduites, une ligne par opération, types traduits par `libelleType`. */
export function versCsv(
  lignes: LigneExport[],
  devise: Pick<Devise, 'sousUnites'>,
  /** Code ou symbole écrit dans la colonne devise (« XOF », « DH » pour une devise personnelle). */
  nomDevise: string,
  entetes: EntetesExport,
  libelleType: (type: TypeOperation) => string,
): string {
  const tete = [
    entetes.date,
    entetes.type,
    entetes.enveloppe,
    entetes.compte,
    entetes.compteDestination,
    entetes.objectif,
    entetes.montant,
    entetes.devise,
    entetes.note,
  ];
  const corps = lignes.map((l) => [
    l.date,
    libelleType(l.type),
    l.enveloppe ?? '',
    l.compte ?? '',
    l.compteDestination ?? '',
    l.objectif ?? '',
    montantDecimal(l.montant, devise),
    nomDevise,
    l.note ?? '',
  ]);
  // Les montants sont des nombres : jamais neutralisés, sinon les tableurs les liraient comme du texte.
  return (
    BOM +
    [tete.map(celluleCsv), ...corps.map((c) => c.map((v, i) => (i === 6 ? v : celluleCsv(v))))]
      .map((c) => c.join(','))
      .join(FIN_DE_LIGNE) +
    FIN_DE_LIGNE
  );
}
