// Outils communs du dépôt du budget : interface SQL, erreurs de saisie, validations et file d'attente.
// Aucun import d'Expo : la même logique tourne sur `expo-sqlite` dans l'app et sur `node:sqlite` dans les tests.
import type { Jour } from './cycle.ts';
import type { Carnet, CompteAvecSolde, CycleBudget } from './depot.ts';
import { lireSaisieDate, versSaisieDate } from './dettes.ts';

export type Parametre = string | number | null;

export type Sql = {
  tous<T>(requete: string, ...parametres: Parametre[]): Promise<T[]>;
  premier<T>(requete: string, ...parametres: Parametre[]): Promise<T | null>;
  executer(requete: string, ...parametres: Parametre[]): Promise<void>;
  /** Tout ou rien : une erreur annule toutes les écritures de `travail`. */
  transaction(travail: () => Promise<void>): Promise<void>;
};

export type CleSaisie =
  | 'montantInvalide'
  | 'jourPaieInvalide'
  | 'enveloppeInconnue'
  | 'operationInconnue'
  | 'nomInvalide'
  | 'dateHorsCycle'
  | 'typeCompteInvalide'
  | 'comptesIdentiques'
  | 'compteInconnu'
  | 'cycleNonTermine'
  | 'personneInvalide'
  | 'detteInconnue'
  | 'detteFermee'
  | 'paiementTropGrand'
  | 'montantSousRembourse'
  | 'dateInvalide'
  | 'objectifInconnu'
  | 'bienInconnu';

/** Erreur de saisie que l'écran peut expliquer (clé i18n dans `cle`). */
export class SaisieInvalide extends Error {
  readonly cle: CleSaisie;
  constructor(cle: CleSaisie) {
    super(cle);
    this.name = 'SaisieInvalide';
    this.cle = cle;
  }
}

export type Outils = {
  /** Nouvel identifiant (UUID v7 dans l'app). */
  nouvelId: () => string;
  /** Jour local courant « 2026-10-29 ». */
  aujourdhui: () => Jour;
  /** Horodatage ISO de création. */
  horodatage: () => string;
};

export const montantValide = (m: number) => Number.isSafeInteger(m) && m > 0;

/** Jour « aaaa-mm-jj » qui existe vraiment. */
export const jourValide = (j: string) => lireSaisieDate(versSaisieDate(j)) === j;
export const noteOuNull = (note: string | null) => (note?.trim() ? note.trim() : null);

/**
 * Fait passer chaque fonction publique du dépôt l'une après l'autre : la connexion SQLite est partagée, et deux
 * appels entremêlés pourraient se glisser dans la transaction de l'autre. Une erreur ne bloque pas la suite.
 * Les fonctions internes appelées depuis une fonction publique ne repassent pas par la file (sinon elles
 * s'attendraient elles-mêmes).
 */
export function enFileUnique<T extends Record<string, (...args: never[]) => Promise<unknown>>>(api: T): T {
  let derniere: Promise<unknown> = Promise.resolve();
  const enFile = {} as Record<string, unknown>;
  for (const [nom, fonction] of Object.entries(api)) {
    enFile[nom] = (...args: never[]) => {
      const resultat = derniere.then(() => fonction(...args));
      derniere = resultat.catch(() => undefined);
      return resultat;
    };
  }
  // Mêmes clés et mêmes signatures que `api` : seule l'exécution change.
  return enFile as T;
}

/** Ce que les parties du dépôt (épargne, zakat, dettes) partagent avec son cœur. */
export type Contexte = {
  sql: Sql;
  outils: Outils;
  /** Cycle qui contient aujourd'hui, créé s'il n'existe pas. */
  cycleCourant: (carnet: Carnet) => Promise<CycleBudget>;
  lireComptesAvecSolde: (carnet: Carnet) => Promise<CompteAvecSolde[]>;
};
