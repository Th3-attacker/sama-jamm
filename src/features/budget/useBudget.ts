// Le budget pour les écrans : ouvre la base chiffrée, lit le carnet et se relit après chaque écriture.
// Pas de TanStack Query ici : tout est local, sans réseau ; une écriture prévient les écrans ouverts.
import * as Crypto from 'expo-crypto';
import type { SQLiteBindValue, SQLiteDatabase } from 'expo-sqlite';
import { useEffect, useRef, useState } from 'react';

import { cleJour } from '@/lib/dates';
import { uuidV7 } from '@/lib/uuid';

import { BudgetIllisible, budgetDb } from './db';
import { creerDepot, type Carnet, type Depot, type Parametre, type Sql } from './depot';

function sqlExpo(db: SQLiteDatabase): Sql {
  const p = (ps: Parametre[]) => ps as SQLiteBindValue[];
  return {
    tous: (r, ...ps) => db.getAllAsync(r, p(ps)),
    premier: (r, ...ps) => db.getFirstAsync(r, p(ps)),
    executer: async (r, ...ps) => {
      await db.runAsync(r, p(ps));
    },
    transaction: (travail) => db.withTransactionAsync(travail),
  };
}

let depotEnCours: Promise<Depot> | undefined;

/** Dépôt du budget, créé une fois la base ouverte. Un échec d'ouverture est réessayé à l'appel suivant. */
export function depotBudget(): Promise<Depot> {
  depotEnCours ??= budgetDb()
    .then((db) =>
      creerDepot(sqlExpo(db), {
        nouvelId: () => uuidV7(Date.now(), Crypto.getRandomBytes(10)),
        aujourdhui: () => cleJour(new Date()),
        horodatage: () => new Date().toISOString(),
      }),
    )
    .catch((erreur: unknown) => {
      depotEnCours = undefined;
      throw erreur;
    });
  return depotEnCours;
}

/** Oublie le dépôt (après une remise à zéro du budget). */
export function oublierDepot(): void {
  depotEnCours = undefined;
}

const abonnes = new Set<() => void>();

/** À appeler après chaque écriture : les écrans du budget se relisent. */
export function budgetModifie(): void {
  abonnes.forEach((a) => a());
}

export type EtatBudget<T> =
  | { etat: 'chargement' }
  | { etat: 'illisible' }
  | { etat: 'erreur' }
  | { etat: 'vide' }
  | { etat: 'pret'; carnet: Carnet; depot: Depot; donnees: T };

/**
 * Lit le budget avec `lire` et le relit après chaque `budgetModifie()`.
 * `vide` : aucun carnet (premier budget à créer) ; `illisible` : la base ne s'ouvre pas (clé perdue).
 * `cle` : à changer quand `lire` dépend d'un paramètre (identifiant d'enveloppe) pour relire.
 */
export function useBudget<T>(lire: (depot: Depot, carnet: Carnet) => Promise<T>, cle = ''): EtatBudget<T> {
  const [etat, setEtat] = useState<EtatBudget<T>>({ etat: 'chargement' });
  const [version, setVersion] = useState(0);
  // `lire` est souvent une fonction écrite dans le rendu : on garde la dernière sans relancer la lecture.
  const lireCourant = useRef(lire);
  // Avant l'effet de lecture ci-dessous : les effets s'exécutent dans l'ordre.
  useEffect(() => {
    lireCourant.current = lire;
  });

  useEffect(() => {
    const relire = () => setVersion((v) => v + 1);
    abonnes.add(relire);
    return () => {
      abonnes.delete(relire);
    };
  }, []);

  useEffect(() => {
    let actif = true;
    (async () => {
      try {
        const depot = await depotBudget();
        const carnet = await depot.carnetActif();
        if (!actif) return;
        if (!carnet) return setEtat({ etat: 'vide' });
        const donnees = await lireCourant.current(depot, carnet);
        if (actif) setEtat({ etat: 'pret', carnet, depot, donnees });
      } catch (erreur: unknown) {
        if (!actif) return;
        if (erreur instanceof BudgetIllisible) {
          console.error('Budget illisible', erreur.cause);
          setEtat({ etat: 'illisible' });
        } else {
          console.error('Lecture du budget impossible', erreur);
          setEtat({ etat: 'erreur' });
        }
      }
    })();
    return () => {
      actif = false;
    };
  }, [cle, version]);

  return etat;
}
