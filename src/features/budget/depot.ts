// Accès aux données du budget. Aucun import d'Expo : la même logique tourne sur `expo-sqlite` dans l'app
// et sur `node:sqlite` dans les tests, à travers l'interface `Sql`.
// Les montants sont des entiers dans la plus petite unité de la devise du carnet.
import type { Devise } from '../../lib/montant.ts';

import { cycleDe, type Jour } from './cycle.ts';

export type Parametre = string | number | null;

export type Sql = {
  tous<T>(requete: string, ...parametres: Parametre[]): Promise<T[]>;
  premier<T>(requete: string, ...parametres: Parametre[]): Promise<T | null>;
  executer(requete: string, ...parametres: Parametre[]): Promise<void>;
  /** Tout ou rien : une erreur annule toutes les écritures de `travail`. */
  transaction(travail: () => Promise<void>): Promise<void>;
};

export type Carnet = { id: string; nom: string; jourPaie: number; devise: Devise };
export type Compte = { id: string; nom: string; type: 'especes' | 'mobile' | 'banque' };
export type CycleBudget = { id: string; debut: Jour; fin: Jour };
export type EnveloppeDuMois = {
  id: string;
  nom: string;
  icone: string;
  fixe: boolean;
  plafond: number;
  depense: number;
};
export type Mois = {
  cycle: CycleBudget;
  recu: number;
  depense: number;
  /** Épargne et sadaqa mises de côté sur le cycle. */
  misDeCote: number;
  /** Ce qu'il reste à régler sur les enveloppes fixes (loyer…) : réservé avant la dépense du jour. */
  chargesFixesNonReglees: number;
  enveloppes: EnveloppeDuMois[];
};
export type Operation = { id: string; montant: number; date: Jour; note: string | null; compte: string | null };
export type TypeOperation = 'depense' | 'revenu' | 'virement' | 'epargne' | 'sadaqa';
export type DetailOperation = {
  id: string;
  type: TypeOperation;
  montant: number;
  date: Jour;
  note: string | null;
  enveloppeId: string | null;
  compteId: string | null;
};
export type ModificationOperation = {
  montant: number;
  /** Obligatoire pour une dépense ; ignoré pour les autres opérations. */
  enveloppeId: string | null;
  compteId: string | null;
  note: string | null;
};
export type NouvelleEnveloppe = { nom: string; icone: string; fixe: boolean; plafond: number };
export type DetailEnveloppe = { enveloppe: EnveloppeDuMois; cycle: CycleBudget; operations: Operation[] };

export type EnveloppeDeDepart = { nom: string; icone: string; fixe: boolean; plafond: number };
export type NouveauCarnet = {
  nom: string;
  deviseCode: string;
  jourPaie: number;
  /** Revenu déjà reçu sur ce cycle ; 0 si l'utilisateur ne le donne pas. */
  revenu: number;
  /** Nom du compte créé d'office (« Espèces »), dans la langue de l'utilisateur. */
  nomCompte: string;
  enveloppes: EnveloppeDeDepart[];
};
export type NouvelleDepense = {
  carnetId: string;
  montant: number;
  enveloppeId: string;
  compteId: string | null;
  note: string | null;
};

type CleSaisie = 'montantInvalide' | 'jourPaieInvalide' | 'enveloppeInconnue' | 'operationInconnue' | 'nomInvalide';

/** Nom d'enveloppe : 1 à 40 caractères, espaces autour retirés. */
export const NOM_ENVELOPPE_MAX = 40;

/** Erreur de saisie que l'écran peut expliquer (clé i18n dans `cle`). */
export class SaisieInvalide extends Error {
  readonly cle: CleSaisie;
  constructor(cle: CleSaisie) {
    super(cle);
    this.name = 'SaisieInvalide';
    this.cle = cle;
  }
}

type Outils = {
  /** Nouvel identifiant (UUID v7 dans l'app). */
  nouvelId: () => string;
  /** Jour local courant « 2026-10-29 ». */
  aujourdhui: () => Jour;
  /** Horodatage ISO de création. */
  horodatage: () => string;
};

const montantValide = (m: number) => Number.isSafeInteger(m) && m > 0;

type LigneCarnet = {
  id: string;
  nom: string;
  jour_paie: number;
  code: string;
  dnom: string;
  symbole: string;
  position: 'avant' | 'apres';
  decimales: 0 | 1 | 2;
  sous_unites: number;
  personnelle: number;
};

export function creerDepot(sql: Sql, outils: Outils) {
  /** Cycle qui contient aujourd'hui ; créé s'il n'existe pas, avec les plafonds du cycle précédent. */
  async function cycleCourant(carnet: Carnet): Promise<CycleBudget> {
    const jour = outils.aujourdhui();
    const existant = await sql.premier<CycleBudget>(
      'SELECT id, debut, fin FROM cycles WHERE carnet_id = ? AND debut <= ? AND fin >= ? ORDER BY debut DESC LIMIT 1',
      carnet.id,
      jour,
      jour,
    );
    if (existant) return existant;
    const bornes = cycleDe(jour, carnet.jourPaie);
    const id = outils.nouvelId();
    await sql.transaction(async () => {
      const precedent = await sql.premier<{ id: string }>(
        'SELECT id FROM cycles WHERE carnet_id = ? AND debut < ? ORDER BY debut DESC LIMIT 1',
        carnet.id,
        bornes.debut,
      );
      await sql.executer(
        'INSERT INTO cycles (id, carnet_id, debut, fin, clos) VALUES (?, ?, ?, ?, 0)',
        id,
        carnet.id,
        bornes.debut,
        bornes.fin,
      );
      // La répartition reprend celle du cycle précédent (section Budget du foyer) ; le bilan viendra la corriger.
      if (precedent) {
        await sql.executer(
          `INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report)
           SELECT ?, p.enveloppe_id, p.montant, 0 FROM plafonds p
           JOIN enveloppes e ON e.id = p.enveloppe_id AND e.archivee = 0
           WHERE p.cycle_id = ?`,
          id,
          precedent.id,
        );
      }
    });
    return { id, debut: bornes.debut, fin: bornes.fin };
  }

  async function enveloppesDuCycle(
    carnetId: string,
    cycleId: string,
    enveloppeId?: string,
  ): Promise<EnveloppeDuMois[]> {
    const lignes = await sql.tous<{
      id: string;
      nom: string;
      icone: string;
      fixe: number;
      plafond: number;
      depense: number;
    }>(
      `SELECT e.id, e.nom, e.icone, e.fixe,
              COALESCE(p.montant, 0) + COALESCE(p.report, 0) AS plafond,
              COALESCE((SELECT SUM(o.montant) FROM operations o
                        WHERE o.cycle_id = ? AND o.enveloppe_id = e.id AND o.type = 'depense'), 0) AS depense
       FROM enveloppes e
       LEFT JOIN plafonds p ON p.enveloppe_id = e.id AND p.cycle_id = ?
       WHERE e.carnet_id = ? AND e.archivee = 0 ${enveloppeId ? 'AND e.id = ?' : ''}
       ORDER BY e.ordre`,
      ...[cycleId, cycleId, carnetId, ...(enveloppeId ? [enveloppeId] : [])],
    );
    return lignes.map((l) => ({ ...l, fixe: l.fixe === 1 }));
  }

  return {
    cycleCourant,

    /** Premier carnet du téléphone, ou null avant le premier budget. */
    async carnetActif(): Promise<Carnet | null> {
      const l = await sql.premier<LigneCarnet>(
        `SELECT c.id, c.nom, c.jour_paie, d.code, d.nom AS dnom, d.symbole, d.position, d.decimales, d.sous_unites, d.personnelle
         FROM carnets c JOIN devises d ON d.code = c.devise_code ORDER BY c.rowid LIMIT 1`,
      );
      if (!l) return null;
      return {
        id: l.id,
        nom: l.nom,
        jourPaie: l.jour_paie,
        devise: {
          code: l.code,
          nom: l.dnom,
          symbole: l.symbole,
          position: l.position,
          decimales: l.decimales,
          sousUnites: l.sous_unites,
          personnelle: l.personnelle === 1,
        },
      };
    },

    /** Crée le carnet, son compte « Espèces », le premier cycle, les enveloppes et le revenu déjà reçu. */
    async creerCarnet(n: NouveauCarnet): Promise<string> {
      if (!Number.isInteger(n.jourPaie) || n.jourPaie < 1 || n.jourPaie > 31)
        throw new SaisieInvalide('jourPaieInvalide');
      if (!Number.isSafeInteger(n.revenu) || n.revenu < 0) throw new SaisieInvalide('montantInvalide');
      if (n.enveloppes.some((e) => !Number.isSafeInteger(e.plafond) || e.plafond < 0))
        throw new SaisieInvalide('montantInvalide');
      const carnetId = outils.nouvelId();
      const compteId = outils.nouvelId();
      const cycleId = outils.nouvelId();
      const jour = outils.aujourdhui();
      const bornes = cycleDe(jour, n.jourPaie);
      await sql.transaction(async () => {
        await sql.executer(
          'INSERT INTO carnets (id, nom, devise_code, jour_paie) VALUES (?, ?, ?, ?)',
          carnetId,
          n.nom,
          n.deviseCode,
          n.jourPaie,
        );
        await sql.executer(
          "INSERT INTO comptes (id, carnet_id, nom, type, solde_initial) VALUES (?, ?, ?, 'especes', 0)",
          compteId,
          carnetId,
          n.nomCompte,
        );
        await sql.executer(
          'INSERT INTO cycles (id, carnet_id, debut, fin, clos) VALUES (?, ?, ?, ?, 0)',
          cycleId,
          carnetId,
          bornes.debut,
          bornes.fin,
        );
        for (const [ordre, e] of n.enveloppes.entries()) {
          const id = outils.nouvelId();
          await sql.executer(
            'INSERT INTO enveloppes (id, carnet_id, nom, icone, fixe, ordre, archivee) VALUES (?, ?, ?, ?, ?, ?, 0)',
            id,
            carnetId,
            e.nom,
            e.icone,
            e.fixe ? 1 : 0,
            ordre,
          );
          await sql.executer(
            'INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report) VALUES (?, ?, ?, 0)',
            cycleId,
            id,
            e.plafond,
          );
        }
        if (n.revenu > 0) {
          await sql.executer(
            "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, cree_le) VALUES (?, ?, ?, 'revenu', ?, ?, ?, ?)",
            outils.nouvelId(),
            carnetId,
            cycleId,
            n.revenu,
            jour,
            compteId,
            outils.horodatage(),
          );
        }
      });
      return carnetId;
    },

    async comptes(carnetId: string): Promise<Compte[]> {
      return sql.tous<Compte>('SELECT id, nom, type FROM comptes WHERE carnet_id = ? ORDER BY rowid', carnetId);
    },

    /** Le cycle en cours : reçu, dépensé, mis de côté, charges fixes à régler et enveloppes. */
    async mois(carnet: Carnet): Promise<Mois> {
      const cycle = await cycleCourant(carnet);
      const totaux = await sql.premier<{ recu: number; depense: number; misDeCote: number }>(
        `SELECT COALESCE(SUM(CASE WHEN type = 'revenu' THEN montant END), 0) AS recu,
                COALESCE(SUM(CASE WHEN type = 'depense' THEN montant END), 0) AS depense,
                COALESCE(SUM(CASE WHEN type IN ('epargne','sadaqa') THEN montant END), 0) AS misDeCote
         FROM operations WHERE cycle_id = ?`,
        cycle.id,
      );
      const enveloppes = await enveloppesDuCycle(carnet.id, cycle.id);
      const chargesFixesNonReglees = enveloppes
        .filter((e) => e.fixe)
        .reduce((total, e) => total + Math.max(0, e.plafond - e.depense), 0);
      return {
        cycle,
        recu: totaux?.recu ?? 0,
        depense: totaux?.depense ?? 0,
        misDeCote: totaux?.misDeCote ?? 0,
        chargesFixesNonReglees,
        enveloppes,
      };
    },

    /** Enregistre une dépense sur le cycle en cours. */
    async ajouterDepense(carnet: Carnet, d: NouvelleDepense): Promise<void> {
      if (!montantValide(d.montant)) throw new SaisieInvalide('montantInvalide');
      const cycle = await cycleCourant(carnet);
      const env = await sql.premier<{ id: string }>(
        'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ? AND archivee = 0',
        d.enveloppeId,
        carnet.id,
      );
      if (!env) throw new SaisieInvalide('enveloppeInconnue');
      const note = d.note?.trim() ? d.note.trim() : null;
      await sql.executer(
        "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, enveloppe_id, compte_id, note, cree_le) VALUES (?, ?, ?, 'depense', ?, ?, ?, ?, ?, ?)",
        outils.nouvelId(),
        carnet.id,
        cycle.id,
        d.montant,
        outils.aujourdhui(),
        d.enveloppeId,
        d.compteId,
        note,
        outils.horodatage(),
      );
    },

    /** Une enveloppe du cycle en cours et ses dépenses, les plus récentes d'abord ; null si elle n'existe pas. */
    async detailEnveloppe(carnet: Carnet, enveloppeId: string): Promise<DetailEnveloppe | null> {
      const cycle = await cycleCourant(carnet);
      const [enveloppe] = await enveloppesDuCycle(carnet.id, cycle.id, enveloppeId);
      if (!enveloppe) return null;
      const operations = await sql.tous<Operation>(
        `SELECT o.id, o.montant, o.date, o.note, c.nom AS compte
         FROM operations o LEFT JOIN comptes c ON c.id = o.compte_id
         WHERE o.cycle_id = ? AND o.enveloppe_id = ? AND o.type = 'depense'
         ORDER BY o.date DESC, o.cree_le DESC`,
        cycle.id,
        enveloppeId,
      );
      return { enveloppe, cycle, operations };
    },

    /** Change le plafond d'une enveloppe pour le cycle en cours. */
    async modifierPlafond(carnet: Carnet, enveloppeId: string, montant: number): Promise<void> {
      if (!Number.isSafeInteger(montant) || montant < 0) throw new SaisieInvalide('montantInvalide');
      const cycle = await cycleCourant(carnet);
      await sql.executer(
        `INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report) VALUES (?, ?, ?, 0)
         ON CONFLICT (cycle_id, enveloppe_id) DO UPDATE SET montant = excluded.montant`,
        cycle.id,
        enveloppeId,
        montant,
      );
    },

    /** Une opération du carnet, quel que soit son cycle ; null si elle n'existe pas. */
    async operation(carnet: Carnet, id: string): Promise<DetailOperation | null> {
      return sql.premier<DetailOperation>(
        `SELECT id, type, montant, date, note, enveloppe_id AS enveloppeId, compte_id AS compteId
         FROM operations WHERE id = ? AND carnet_id = ?`,
        id,
        carnet.id,
      );
    },

    /** Corrige une opération : montant, enveloppe (dépense), compte, note. Le jour et le cycle ne changent pas. */
    async modifierOperation(carnet: Carnet, id: string, m: ModificationOperation): Promise<void> {
      if (!montantValide(m.montant)) throw new SaisieInvalide('montantInvalide');
      const actuelle = await sql.premier<{ type: TypeOperation }>(
        'SELECT type FROM operations WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!actuelle) throw new SaisieInvalide('operationInconnue');
      let enveloppeId: string | null = null;
      if (actuelle.type === 'depense') {
        const env = m.enveloppeId
          ? await sql.premier<{ id: string }>(
              'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ? AND archivee = 0',
              m.enveloppeId,
              carnet.id,
            )
          : null;
        if (!env) throw new SaisieInvalide('enveloppeInconnue');
        enveloppeId = env.id;
      }
      const note = m.note?.trim() ? m.note.trim() : null;
      await sql.executer(
        'UPDATE operations SET montant = ?, enveloppe_id = ?, compte_id = ?, note = ? WHERE id = ? AND carnet_id = ?',
        m.montant,
        enveloppeId,
        m.compteId,
        note,
        id,
        carnet.id,
      );
    },

    /** Supprime définitivement une opération (après confirmation de l'utilisateur). */
    async supprimerOperation(carnet: Carnet, id: string): Promise<void> {
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM operations WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('operationInconnue');
      await sql.executer('DELETE FROM operations WHERE id = ? AND carnet_id = ?', id, carnet.id);
    },

    /** Revenus du cycle en cours, les plus récents d'abord. */
    async revenusDuCycle(carnet: Carnet): Promise<{ cycle: CycleBudget; revenus: Operation[] }> {
      const cycle = await cycleCourant(carnet);
      const revenus = await sql.tous<Operation>(
        `SELECT o.id, o.montant, o.date, o.note, c.nom AS compte
         FROM operations o LEFT JOIN comptes c ON c.id = o.compte_id
         WHERE o.cycle_id = ? AND o.type = 'revenu'
         ORDER BY o.date DESC, o.cree_le DESC`,
        cycle.id,
      );
      return { cycle, revenus };
    },

    /** Nouvelle enveloppe, placée après les autres, avec son plafond pour le cycle en cours. */
    async ajouterEnveloppe(carnet: Carnet, e: NouvelleEnveloppe): Promise<string> {
      const nom = e.nom.trim();
      if (nom.length < 1 || nom.length > NOM_ENVELOPPE_MAX) throw new SaisieInvalide('nomInvalide');
      if (!Number.isSafeInteger(e.plafond) || e.plafond < 0) throw new SaisieInvalide('montantInvalide');
      const cycle = await cycleCourant(carnet);
      const id = outils.nouvelId();
      await sql.transaction(async () => {
        const dernier = await sql.premier<{ ordre: number | null }>(
          'SELECT MAX(ordre) AS ordre FROM enveloppes WHERE carnet_id = ?',
          carnet.id,
        );
        await sql.executer(
          'INSERT INTO enveloppes (id, carnet_id, nom, icone, fixe, ordre, archivee) VALUES (?, ?, ?, ?, ?, ?, 0)',
          id,
          carnet.id,
          nom,
          e.icone,
          e.fixe ? 1 : 0,
          (dernier?.ordre ?? -1) + 1,
        );
        await sql.executer(
          'INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report) VALUES (?, ?, ?, 0)',
          cycle.id,
          id,
          e.plafond,
        );
      });
      return id;
    },

    async renommerEnveloppe(carnet: Carnet, id: string, nouveauNom: string): Promise<void> {
      const nom = nouveauNom.trim();
      if (nom.length < 1 || nom.length > NOM_ENVELOPPE_MAX) throw new SaisieInvalide('nomInvalide');
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('enveloppeInconnue');
      await sql.executer('UPDATE enveloppes SET nom = ? WHERE id = ? AND carnet_id = ?', nom, id, carnet.id);
    },

    /** Retire l'enveloppe des listes ; ses dépenses passées restent dans les totaux et l'historique. */
    async archiverEnveloppe(carnet: Carnet, id: string): Promise<void> {
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('enveloppeInconnue');
      await sql.executer('UPDATE enveloppes SET archivee = 1 WHERE id = ? AND carnet_id = ?', id, carnet.id);
    },
  };
}

export type Depot = ReturnType<typeof creerDepot>;
