// Accès aux données du budget. Aucun import d'Expo : la même logique tourne sur `expo-sqlite` dans l'app
// et sur `node:sqlite` dans les tests, à travers l'interface `Sql`.
// Les montants sont des entiers dans la plus petite unité de la devise du carnet.
import type { Devise } from '../../lib/montant.ts';

import { ajouterJours, cycleDe, type Jour } from './cycle.ts';
import { lireSaisieDate, PERSONNE_MAX, versSaisieDate, type SensDette, type StatutDette } from './dettes.ts';
import { INTENTION_MAX, NOM_OBJECTIF_MAX } from './epargne.ts';
import {
  baseDeCalcul,
  debutHawlSuivi,
  etatZakat,
  JOURS_HAWL,
  seuilNisab,
  valeurMetal,
  type BaseNisab,
  type Composition,
  type EtatZakat,
} from './zakat.ts';

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
  /** Plafond du cycle, report compris. */
  plafond: number;
  /** Part du plafond reportée du cycle précédent (bilan). */
  report: number;
  depense: number;
  /** Cachée des listes, mais ses dépenses comptent toujours dans les totaux. */
  archivee: boolean;
};
export type ChoixBilan = 'reporter' | 'epargner' | 'sadaqa';
export type Bilan = { cycle: CycleBudget; enveloppes: { id: string; nom: string; reste: number }[] };
export type JourDePaie = {
  /** Revenu reçu ce jour-là ; 0 pour seulement revoir la répartition. */
  revenu: number;
  compteId: string | null;
  /** Épargne sans objectif (« Autre épargne »). */
  epargne: number;
  sadaqa: number;
  /** Nouveaux plafonds (hors report) des enveloppes touchées. */
  plafonds: { enveloppeId: string; montant: number }[];
  /** Versements aux objectifs actifs. */
  versements?: { objectifId: string; montant: number }[];
};

/** Objectif d'épargne : ce qu'on vise, pourquoi, et ce qui y a déjà été versé. */
export type Objectif = {
  id: string;
  nom: string;
  intention: string | null;
  cible: number | null;
  versementMensuel: number | null;
  icone: string;
  /** Objectif utilisé (le mouton est acheté) : il sort du total mis de côté. */
  utilise: boolean;
  verse: number;
};
export type Epargne = {
  /** Tout ce qui est mis de côté : épargne libre et objectifs actifs. */
  total: number;
  /** Épargne sans objectif (jour de paie, bilan). */
  libre: number;
  objectifs: Objectif[];
  utilises: Objectif[];
};
export type DetailObjectif = Objectif & { versements: Operation[] };
export type SaisieObjectif = {
  nom: string;
  intention: string | null;
  cible: number | null;
  versementMensuel: number | null;
};

/** Pas encore réparti : reçu − mis de côté − plafonds du cycle (hors report, venu d'un cycle précédent). */
export function nonReparti(mois: Pick<Mois, 'recu' | 'misDeCote' | 'enveloppes'>): number {
  return mois.recu - mois.misDeCote - mois.enveloppes.reduce((t, e) => t + (e.plafond - e.report), 0);
}
export type EnveloppeArchivee = { id: string; nom: string; icone: string; nombre: number; total: number };
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
  /** Bornes du cycle de l'opération : son jour ne peut changer qu'entre elles. */
  cycleDebut: Jour;
  cycleFin: Jour;
};
export type FiltreHistorique = 'tout' | 'depenses' | 'revenus';
export type OperationHistorique = Operation & {
  type: TypeOperation;
  enveloppe: string | null;
  icone: string | null;
};
export type TypeCompte = Compte['type'];
export type CompteAvecSolde = Compte & { solde: number };
export const TYPES_COMPTE: readonly TypeCompte[] = ['especes', 'mobile', 'banque'];
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

type CleSaisie =
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

/** Dette entre proches, avec ce qui a déjà été remboursé (ou remis) et ce qui reste. */
export type Dette = {
  id: string;
  sens: SensDette;
  personne: string;
  montantInitial: number;
  rembourse: number;
  reste: number;
  date: Jour;
  echeance: Jour | null;
  note: string | null;
  statut: StatutDette;
};
export type PaiementDette = {
  id: string;
  /** « remise » : le reste effacé, sans argent reçu ni versé. */
  type: 'remboursement' | 'remise';
  montant: number;
  date: Jour;
  note: string | null;
};
export type DetailDette = Dette & { paiements: PaiementDette[] };
export type SaisieDette = {
  sens: SensDette;
  personne: string;
  montant: number;
  echeance: Jour | null;
  note: string | null;
};

export type TypeBien = 'or' | 'argent' | 'creance' | 'dette' | 'autre';
export const TYPES_BIEN: readonly TypeBien[] = ['or', 'argent', 'creance', 'dette', 'autre'];
/** Bien déclaré pour la zakat : un poids (or, argent) ou un montant (créance, dette, autre bien). */
export type BienZakat = {
  id: string;
  type: TypeBien;
  libelle: string | null;
  /** Or et argent seulement. */
  milligrammes: number | null;
  /** Créance, dette, autre bien. */
  montant: number | null;
};
/** `valeur` : milligrammes pour l'or et l'argent, montant sinon. */
export type SaisieBien = { type: TypeBien; libelle: string | null; valeur: number };
export type ReglagesZakat = {
  base: BaseNisab;
  prixOr: number | null;
  prixArgent: number | null;
  prixMajLe: Jour | null;
  /** Jour où la base a atteint le nisab : début de l'année lunaire. */
  debutHawl: Jour | null;
};
export type ZakatDuCarnet = {
  reglages: ReglagesZakat;
  biens: BienZakat[];
  composition: Composition;
  nisab: number | null;
  etat: EtatZakat;
};
export const LIBELLE_BIEN_MAX = 40;
const estMetal = (t: TypeBien) => t === 'or' || t === 'argent';

/** Jour « aaaa-mm-jj » qui existe vraiment. */
const jourValide = (j: string) => lireSaisieDate(versSaisieDate(j)) === j;
const noteOuNull = (note: string | null) => (note?.trim() ? note.trim() : null);

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

/**
 * Fait passer chaque fonction publique du dépôt l'une après l'autre : la connexion SQLite est partagée, et deux
 * appels entremêlés pourraient se glisser dans la transaction de l'autre. Une erreur ne bloque pas la suite.
 * Les fonctions internes appelées depuis une fonction publique ne repassent pas par la file (sinon elles
 * s'attendraient elles-mêmes).
 */
function enFileUnique<T extends Record<string, (...args: never[]) => Promise<unknown>>>(api: T): T {
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
    let cycle: CycleBudget = { id, debut: bornes.debut, fin: bornes.fin };
    await sql.transaction(async () => {
      const precedent = await sql.premier<{ id: string }>(
        'SELECT id FROM cycles WHERE carnet_id = ? AND debut < ? ORDER BY debut DESC LIMIT 1',
        carnet.id,
        bornes.debut,
      );
      // L'index unique (carnet, début) garantit un seul cycle : si un autre appel l'a créé, on relit le sien.
      await sql.executer(
        'INSERT OR IGNORE INTO cycles (id, carnet_id, debut, fin, clos) VALUES (?, ?, ?, ?, 0)',
        id,
        carnet.id,
        bornes.debut,
        bornes.fin,
      );
      const enregistre = await sql.premier<CycleBudget>(
        'SELECT id, debut, fin FROM cycles WHERE carnet_id = ? AND debut = ?',
        carnet.id,
        bornes.debut,
      );
      if (enregistre) cycle = enregistre;
      // La répartition reprend celle du cycle précédent (section Budget du foyer) ; le bilan viendra la corriger.
      if (precedent && cycle.id === id) {
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
    return cycle;
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
      report: number;
      depense: number;
      archivee: number;
    }>(
      `SELECT e.id, e.nom, e.icone, e.fixe, e.archivee,
              COALESCE(p.montant, 0) + COALESCE(p.report, 0) AS plafond,
              COALESCE(p.report, 0) AS report,
              COALESCE((SELECT SUM(o.montant) FROM operations o
                        WHERE o.cycle_id = ? AND o.enveloppe_id = e.id AND o.type = 'depense'), 0) AS depense
       FROM enveloppes e
       LEFT JOIN plafonds p ON p.enveloppe_id = e.id AND p.cycle_id = ?
       WHERE e.carnet_id = ? AND ${enveloppeId ? 'e.id = ?' : 'e.archivee = 0'}
       ORDER BY e.ordre`,
      ...[cycleId, cycleId, carnetId, ...(enveloppeId ? [enveloppeId] : [])],
    );
    return lignes.map((l) => ({ ...l, fixe: l.fixe === 1, archivee: l.archivee === 1 }));
  }

  async function lireComptesAvecSolde(carnet: Carnet): Promise<CompteAvecSolde[]> {
    return sql.tous<CompteAvecSolde>(
      `SELECT c.id, c.nom, c.type,
              c.solde_initial
              + COALESCE((SELECT SUM(CASE WHEN o.type = 'revenu' THEN o.montant
                                          WHEN o.type IN ('depense','epargne','sadaqa','virement') THEN -o.montant END)
                          FROM operations o WHERE o.compte_id = c.id), 0)
              + COALESCE((SELECT SUM(o.montant) FROM operations o
                          WHERE o.compte_dest_id = c.id AND o.type = 'virement'), 0) AS solde
       FROM comptes c WHERE c.carnet_id = ? ORDER BY c.rowid`,
      carnet.id,
    );
  }

  async function lireEpargne(carnet: Carnet): Promise<Epargne> {
    const objectifs = (
      await sql.tous<LigneObjectif>(`${SELECT_OBJECTIF} WHERE ob.carnet_id = ? ORDER BY ob.rowid`, carnet.id)
    ).map(versObjectif);
    const libre = await sql.premier<{ total: number }>(
      "SELECT COALESCE(SUM(montant), 0) AS total FROM operations WHERE carnet_id = ? AND type = 'epargne' AND objectif_id IS NULL",
      carnet.id,
    );
    const actifs = objectifs.filter((o) => !o.utilise);
    const totalLibre = libre?.total ?? 0;
    return {
      total: totalLibre + actifs.reduce((t, o) => t + o.verse, 0),
      libre: totalLibre,
      objectifs: actifs,
      utilises: objectifs.filter((o) => o.utilise),
    };
  }

  async function changerArchive(carnet: Carnet, id: string, archive: 0 | 1): Promise<void> {
    const existe = await sql.premier<{ id: string }>(
      'SELECT id FROM objectifs WHERE id = ? AND carnet_id = ?',
      id,
      carnet.id,
    );
    if (!existe) throw new SaisieInvalide('objectifInconnu');
    await sql.executer('UPDATE objectifs SET archive = ? WHERE id = ?', archive, id);
  }

  return enFileUnique({
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
      // Enveloppe archivée : toutes ses dépenses, tous cycles, pour pouvoir les corriger ou les supprimer.
      const operations = await sql.tous<Operation>(
        `SELECT o.id, o.montant, o.date, o.note, c.nom AS compte
         FROM operations o LEFT JOIN comptes c ON c.id = o.compte_id
         WHERE o.enveloppe_id = ? AND o.type = 'depense' ${enveloppe.archivee ? '' : 'AND o.cycle_id = ?'}
         ORDER BY o.date DESC, o.cree_le DESC`,
        ...(enveloppe.archivee ? [enveloppeId] : [enveloppeId, cycle.id]),
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
        `SELECT o.id, o.type, o.montant, o.date, o.note, o.enveloppe_id AS enveloppeId, o.compte_id AS compteId,
                c.debut AS cycleDebut, c.fin AS cycleFin
         FROM operations o JOIN cycles c ON c.id = o.cycle_id
         WHERE o.id = ? AND o.carnet_id = ?`,
        id,
        carnet.id,
      );
    },

    /** Corrige une opération : montant, enveloppe (dépense), compte, note. Le jour et le cycle ne changent pas. */
    async modifierOperation(carnet: Carnet, id: string, m: ModificationOperation): Promise<void> {
      if (!montantValide(m.montant)) throw new SaisieInvalide('montantInvalide');
      const actuelle = await sql.premier<{ type: TypeOperation; enveloppeId: string | null }>(
        'SELECT type, enveloppe_id AS enveloppeId FROM operations WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!actuelle) throw new SaisieInvalide('operationInconnue');
      let enveloppeId: string | null = null;
      if (actuelle.type === 'depense') {
        // Une dépense peut garder son enveloppe archivée, mais pas être déplacée vers une enveloppe archivée.
        const env = m.enveloppeId
          ? await sql.premier<{ id: string }>(
              'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ? AND (archivee = 0 OR id = ?)',
              m.enveloppeId,
              carnet.id,
              actuelle.enveloppeId,
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

    /** Enveloppes archivées avec leurs dépenses (tous cycles) : à retrouver pour corriger ou supprimer. */
    async enveloppesArchivees(carnet: Carnet): Promise<EnveloppeArchivee[]> {
      return sql.tous<EnveloppeArchivee>(
        `SELECT e.id, e.nom, e.icone,
                (SELECT COUNT(*) FROM operations o WHERE o.enveloppe_id = e.id) AS nombre,
                (SELECT COALESCE(SUM(o.montant), 0) FROM operations o WHERE o.enveloppe_id = e.id) AS total
         FROM enveloppes e WHERE e.carnet_id = ? AND e.archivee = 1 ORDER BY e.ordre`,
        carnet.id,
      );
    },

    /** Remet une enveloppe archivée dans les listes. */
    async restaurerEnveloppe(carnet: Carnet, id: string): Promise<void> {
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('enveloppeInconnue');
      await sql.executer('UPDATE enveloppes SET archivee = 0 WHERE id = ? AND carnet_id = ?', id, carnet.id);
    },

    /** Dépenses d'une enveloppe, tous cycles confondus : à annoncer avant de la supprimer. */
    async depensesDeLEnveloppe(carnet: Carnet, id: string): Promise<{ nombre: number; total: number }> {
      const r = await sql.premier<{ nombre: number; total: number }>(
        'SELECT COUNT(*) AS nombre, COALESCE(SUM(montant), 0) AS total FROM operations WHERE enveloppe_id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      return { nombre: r?.nombre ?? 0, total: r?.total ?? 0 };
    },

    /** Supprime l'enveloppe avec ses plafonds et ses dépenses, tout ou rien (après confirmation). */
    async supprimerEnveloppe(carnet: Carnet, id: string): Promise<void> {
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('enveloppeInconnue');
      await sql.transaction(async () => {
        await sql.executer('DELETE FROM operations WHERE enveloppe_id = ? AND carnet_id = ?', id, carnet.id);
        await sql.executer('DELETE FROM plafonds WHERE enveloppe_id = ?', id);
        await sql.executer('DELETE FROM enveloppes WHERE id = ? AND carnet_id = ?', id, carnet.id);
      });
    },

    /** Argent reçu en cours de cycle (salaire, aide…) : augmente le reçu et la dépense du jour. */
    async ajouterRevenu(
      carnet: Carnet,
      r: { montant: number; compteId: string | null; note: string | null },
    ): Promise<void> {
      if (!montantValide(r.montant)) throw new SaisieInvalide('montantInvalide');
      const cycle = await cycleCourant(carnet);
      const note = r.note?.trim() ? r.note.trim() : null;
      await sql.executer(
        "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, note, cree_le) VALUES (?, ?, ?, 'revenu', ?, ?, ?, ?, ?)",
        outils.nouvelId(),
        carnet.id,
        cycle.id,
        r.montant,
        outils.aujourdhui(),
        r.compteId,
        note,
        outils.horodatage(),
      );
    },

    /** Opérations du cycle en cours, les plus récentes d'abord, filtrées par sorte. */
    async historique(
      carnet: Carnet,
      filtre: FiltreHistorique,
    ): Promise<{ cycle: CycleBudget; operations: OperationHistorique[] }> {
      const cycle = await cycleCourant(carnet);
      const types =
        filtre === 'depenses'
          ? "('depense')"
          : filtre === 'revenus'
            ? "('revenu')"
            : "('depense','revenu','virement','epargne','sadaqa')";
      const operations = await sql.tous<OperationHistorique>(
        `SELECT o.id, o.type, o.montant, o.date, o.note, c.nom AS compte, e.nom AS enveloppe, e.icone AS icone
         FROM operations o
         LEFT JOIN comptes c ON c.id = o.compte_id
         LEFT JOIN enveloppes e ON e.id = o.enveloppe_id
         WHERE o.cycle_id = ? AND o.type IN ${types}
         ORDER BY o.date DESC, o.cree_le DESC`,
        cycle.id,
      );
      return { cycle, operations };
    },

    /** Change le jour d'une opération, sans la faire sortir de son cycle (les totaux de deux cycles bougeraient). */
    async modifierDateOperation(carnet: Carnet, id: string, date: Jour): Promise<void> {
      const op = await sql.premier<{ debut: Jour; fin: Jour }>(
        'SELECT c.debut, c.fin FROM operations o JOIN cycles c ON c.id = o.cycle_id WHERE o.id = ? AND o.carnet_id = ?',
        id,
        carnet.id,
      );
      if (!op) throw new SaisieInvalide('operationInconnue');
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || date < op.debut || date > op.fin)
        throw new SaisieInvalide('dateHorsCycle');
      await sql.executer('UPDATE operations SET date = ? WHERE id = ? AND carnet_id = ?', date, id, carnet.id);
    },

    /** Comptes avec leur solde : départ + revenus − dépenses, épargne et sadaqa ± virements. */
    async comptesAvecSolde(carnet: Carnet): Promise<CompteAvecSolde[]> {
      return lireComptesAvecSolde(carnet);
    },

    /** Nouveau compte : espèces, mobile money ou banque, avec son solde de départ. */
    async ajouterCompte(carnet: Carnet, c: { nom: string; type: TypeCompte; soldeInitial: number }): Promise<string> {
      const nom = c.nom.trim();
      if (nom.length < 1 || nom.length > NOM_ENVELOPPE_MAX) throw new SaisieInvalide('nomInvalide');
      if (!TYPES_COMPTE.includes(c.type)) throw new SaisieInvalide('typeCompteInvalide');
      if (!Number.isSafeInteger(c.soldeInitial) || c.soldeInitial < 0) throw new SaisieInvalide('montantInvalide');
      const id = outils.nouvelId();
      await sql.executer(
        'INSERT INTO comptes (id, carnet_id, nom, type, solde_initial) VALUES (?, ?, ?, ?, ?)',
        id,
        carnet.id,
        nom,
        c.type,
        c.soldeInitial,
      );
      return id;
    },

    /** Jour de paie, tout ou rien : revenu reçu, mise de côté d'abord (épargne, sadaqa), puis répartition. */
    async jourDePaie(carnet: Carnet, p: JourDePaie): Promise<void> {
      const entier = (m: number) => Number.isSafeInteger(m) && m >= 0;
      const versements = p.versements ?? [];
      const montants = [p.revenu, p.epargne, p.sadaqa, ...p.plafonds.map((x) => x.montant)];
      if (![...montants, ...versements.map((v) => v.montant)].every(entier))
        throw new SaisieInvalide('montantInvalide');
      // Hors transaction : `cycleCourant` peut en ouvrir une pour créer le cycle.
      const cycle = await cycleCourant(carnet);
      const jour = outils.aujourdhui();
      await sql.transaction(async () => {
        const operation = async (
          type: 'revenu' | 'epargne' | 'sadaqa',
          montant: number,
          objectifId: string | null = null,
        ) => {
          if (montant <= 0) return;
          await sql.executer(
            'INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, objectif_id, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            outils.nouvelId(),
            carnet.id,
            cycle.id,
            type,
            montant,
            jour,
            p.compteId,
            objectifId,
            outils.horodatage(),
          );
        };
        await operation('revenu', p.revenu);
        await operation('epargne', p.epargne);
        for (const v of versements) {
          if (v.montant <= 0) continue;
          const objectif = await sql.premier<{ id: string }>(
            'SELECT id FROM objectifs WHERE id = ? AND carnet_id = ? AND archive = 0',
            v.objectifId,
            carnet.id,
          );
          if (!objectif) throw new SaisieInvalide('objectifInconnu');
          await operation('epargne', v.montant, objectif.id);
        }
        await operation('sadaqa', p.sadaqa);
        for (const x of p.plafonds) {
          const env = await sql.premier<{ id: string }>(
            'SELECT id FROM enveloppes WHERE id = ? AND carnet_id = ? AND archivee = 0',
            x.enveloppeId,
            carnet.id,
          );
          if (!env) throw new SaisieInvalide('enveloppeInconnue');
          await sql.executer(
            `INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report) VALUES (?, ?, ?, 0)
             ON CONFLICT (cycle_id, enveloppe_id) DO UPDATE SET montant = excluded.montant`,
            cycle.id,
            x.enveloppeId,
            x.montant,
          );
        }
      });
    },

    /** Dernier cycle terminé et pas encore clos, avec le reste de chaque enveloppe ; null s'il n'y en a pas. */
    async bilanAFaire(carnet: Carnet): Promise<Bilan | null> {
      const cycle = await sql.premier<CycleBudget>(
        'SELECT id, debut, fin FROM cycles WHERE carnet_id = ? AND fin < ? AND clos = 0 ORDER BY fin DESC LIMIT 1',
        carnet.id,
        outils.aujourdhui(),
      );
      if (!cycle) return null;
      const enveloppes = (await enveloppesDuCycle(carnet.id, cycle.id))
        .map((e) => ({ id: e.id, nom: e.nom, reste: e.plafond - e.depense }))
        .filter((e) => e.reste > 0);
      return { cycle, enveloppes };
    },

    /**
     * Clôt un cycle terminé : chaque reste est reporté au cycle en cours (défaut), épargné ou donné en sadaqa.
     * Une seule fois par cycle. Renvoie les montants de chaque choix.
     */
    async cloreCycle(
      carnet: Carnet,
      cycleId: string,
      choix: Record<string, ChoixBilan>,
    ): Promise<{ reporte: number; epargne: number; sadaqa: number }> {
      const ancien = await sql.premier<CycleBudget & { clos: number }>(
        'SELECT id, debut, fin, clos FROM cycles WHERE id = ? AND carnet_id = ?',
        cycleId,
        carnet.id,
      );
      if (!ancien || ancien.clos === 1 || ancien.fin >= outils.aujourdhui())
        throw new SaisieInvalide('cycleNonTermine');
      const courant = await cycleCourant(carnet);
      const restes = (await enveloppesDuCycle(carnet.id, ancien.id))
        .map((e) => ({ ...e, reste: e.plafond - e.depense }))
        .filter((e) => e.reste > 0);
      const totaux = { reporte: 0, epargne: 0, sadaqa: 0 };
      await sql.transaction(async () => {
        for (const e of restes) {
          const c = choix[e.id] ?? 'reporter';
          if (c === 'reporter') {
            totaux.reporte += e.reste;
            await sql.executer(
              `INSERT INTO plafonds (cycle_id, enveloppe_id, montant, report) VALUES (?, ?, 0, ?)
               ON CONFLICT (cycle_id, enveloppe_id) DO UPDATE SET report = report + excluded.report`,
              courant.id,
              e.id,
              e.reste,
            );
          } else {
            totaux[c === 'epargner' ? 'epargne' : 'sadaqa'] += e.reste;
            await sql.executer(
              'INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, note, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
              outils.nouvelId(),
              carnet.id,
              ancien.id,
              c === 'epargner' ? 'epargne' : 'sadaqa',
              e.reste,
              ancien.fin,
              e.nom,
              outils.horodatage(),
            );
          }
        }
        await sql.executer('UPDATE cycles SET clos = 1 WHERE id = ? AND carnet_id = ?', ancien.id, carnet.id);
      });
      return totaux;
    },

    /** Virement entre deux comptes du carnet : ni dépense ni revenu, les enveloppes ne bougent pas. */
    async virement(
      carnet: Carnet,
      v: { de: string; vers: string; montant: number; note: string | null },
    ): Promise<void> {
      if (!montantValide(v.montant)) throw new SaisieInvalide('montantInvalide');
      if (v.de === v.vers) throw new SaisieInvalide('comptesIdentiques');
      const trouves = await sql.tous<{ id: string }>(
        'SELECT id FROM comptes WHERE carnet_id = ? AND id IN (?, ?)',
        carnet.id,
        v.de,
        v.vers,
      );
      if (trouves.length !== 2) throw new SaisieInvalide('compteInconnu');
      const cycle = await cycleCourant(carnet);
      await sql.executer(
        "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, compte_dest_id, note, cree_le) VALUES (?, ?, ?, 'virement', ?, ?, ?, ?, ?, ?)",
        outils.nouvelId(),
        carnet.id,
        cycle.id,
        v.montant,
        outils.aujourdhui(),
        v.de,
        v.vers,
        v.note?.trim() ? v.note.trim() : null,
        outils.horodatage(),
      );
    },

    // --- Épargne avec intention : un versement est une opération « épargne » du cycle en cours. ---

    /** Total mis de côté, épargne libre, objectifs actifs et objectifs utilisés. */
    async epargne(carnet: Carnet): Promise<Epargne> {
      return lireEpargne(carnet);
    },

    async objectif(carnet: Carnet, id: string): Promise<DetailObjectif | null> {
      const ligne = await sql.premier<LigneObjectif>(
        `${SELECT_OBJECTIF} WHERE ob.carnet_id = ? AND ob.id = ?`,
        carnet.id,
        id,
      );
      if (!ligne) return null;
      const versements = await sql.tous<Operation>(
        `SELECT o.id, o.montant, o.date, o.note, c.nom AS compte
         FROM operations o LEFT JOIN comptes c ON c.id = o.compte_id
         WHERE o.carnet_id = ? AND o.objectif_id = ? AND o.type = 'epargne'
         ORDER BY o.date DESC, o.cree_le DESC`,
        carnet.id,
        id,
      );
      return { ...versObjectif(ligne), versements };
    },

    async ajouterObjectif(carnet: Carnet, s: SaisieObjectif): Promise<string> {
      const v = validerObjectif(s);
      const id = outils.nouvelId();
      await sql.executer(
        "INSERT INTO objectifs (id, carnet_id, nom, intention, cible, versement_mensuel, icone, archive) VALUES (?, ?, ?, ?, ?, ?, 'target', 0)",
        id,
        carnet.id,
        v.nom,
        v.intention,
        s.cible,
        s.versementMensuel,
      );
      return id;
    },

    async modifierObjectif(carnet: Carnet, id: string, s: SaisieObjectif): Promise<void> {
      const v = validerObjectif(s);
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM objectifs WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('objectifInconnu');
      await sql.executer(
        'UPDATE objectifs SET nom = ?, intention = ?, cible = ?, versement_mensuel = ? WHERE id = ? AND carnet_id = ?',
        v.nom,
        v.intention,
        s.cible,
        s.versementMensuel,
        id,
        carnet.id,
      );
    },

    /** Met de côté ce mois-ci, pour un objectif actif ou sans objectif (épargne libre). */
    async verserEpargne(
      carnet: Carnet,
      v: { montant: number; objectifId: string | null; compteId: string | null; note: string | null },
    ): Promise<void> {
      if (!montantValide(v.montant)) throw new SaisieInvalide('montantInvalide');
      if (v.objectifId) {
        const o = await sql.premier<{ id: string }>(
          'SELECT id FROM objectifs WHERE id = ? AND carnet_id = ? AND archive = 0',
          v.objectifId,
          carnet.id,
        );
        if (!o) throw new SaisieInvalide('objectifInconnu');
      }
      if (v.compteId) {
        const c = await sql.premier<{ id: string }>(
          'SELECT id FROM comptes WHERE id = ? AND carnet_id = ?',
          v.compteId,
          carnet.id,
        );
        if (!c) throw new SaisieInvalide('compteInconnu');
      }
      const cycle = await cycleCourant(carnet);
      await sql.executer(
        "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, objectif_id, note, cree_le) VALUES (?, ?, ?, 'epargne', ?, ?, ?, ?, ?, ?)",
        outils.nouvelId(),
        carnet.id,
        cycle.id,
        v.montant,
        outils.aujourdhui(),
        v.compteId,
        v.objectifId,
        noteOuNull(v.note),
        outils.horodatage(),
      );
    },

    /** L'objectif a servi (le mouton est acheté) : il sort du total mis de côté, ses versements restent. */
    async marquerUtilise(carnet: Carnet, id: string): Promise<void> {
      await changerArchive(carnet, id, 1);
    },

    /** Annule « utilisé » : l'objectif revient avec ce qu'il a reçu. */
    async restaurerObjectif(carnet: Carnet, id: string): Promise<void> {
      await changerArchive(carnet, id, 0);
    },

    // --- Zakat indicative : la méthode est à faire valider par le référent religieux. ---

    /**
     * Tout ce qu'il faut pour l'écran Zakat. Tient aussi le début de l'année lunaire à jour : posé le jour où la base
     * atteint le nisab, effacé si elle repasse dessous (le suivi n'avance que quand on consulte la zakat).
     */
    async zakat(carnet: Carnet): Promise<ZakatDuCarnet> {
      const aujourdhui = outils.aujourdhui();
      await sql.executer("INSERT OR IGNORE INTO zakat (carnet_id, base_nisab) VALUES (?, 'argent')", carnet.id);
      const r = await sql.premier<{
        debut_hawl: Jour | null;
        base_nisab: BaseNisab;
        cours_or_g: number | null;
        cours_argent_g: number | null;
        cours_maj_le: Jour | null;
      }>(
        'SELECT debut_hawl, base_nisab, cours_or_g, cours_argent_g, cours_maj_le FROM zakat WHERE carnet_id = ?',
        carnet.id,
      );
      const reglages: ReglagesZakat = {
        base: r?.base_nisab ?? 'argent',
        prixOr: r?.cours_or_g ?? null,
        prixArgent: r?.cours_argent_g ?? null,
        prixMajLe: r?.cours_maj_le ?? null,
        debutHawl: r?.debut_hawl ?? null,
      };
      const biens = await sql.tous<BienZakat>(
        'SELECT id, type, libelle, milligrammes, montant FROM biens_zakat WHERE carnet_id = ? ORDER BY rowid',
        carnet.id,
      );
      const epargne = (await lireEpargne(carnet)).total;
      const comptes = (await lireComptesAvecSolde(carnet)).reduce((t, c) => t + Math.max(0, c.solde), 0);
      // Dettes à déduire : celles qui tombent avant l'échéance de la zakat, ou sans échéance.
      const limite = ajouterJours(reglages.debutHawl ?? aujourdhui, JOURS_HAWL);
      const dettes = (
        await sql.tous<LigneDette>(`${SELECT_DETTE} WHERE d.carnet_id = ? AND d.statut = 'ouverte'`, carnet.id)
      ).map(versDette);
      const composition: Composition = { epargne, comptes, metaux: 0, autres: 0, creances: 0, dettes: 0 };
      for (const d of dettes) {
        if (d.sens === 'prete') composition.creances += d.reste;
        else if (d.echeance === null || d.echeance <= limite) composition.dettes += d.reste;
      }
      for (const b of biens) {
        const prix = b.type === 'or' ? reglages.prixOr : b.type === 'argent' ? reglages.prixArgent : null;
        if (estMetal(b.type)) composition.metaux += prix ? valeurMetal(b.milligrammes ?? 0, prix) : 0;
        else if (b.type === 'creance') composition.creances += b.montant ?? 0;
        else if (b.type === 'dette') composition.dettes += b.montant ?? 0;
        else composition.autres += b.montant ?? 0;
      }
      const base = baseDeCalcul(composition);
      const nisab = seuilNisab(reglages.base, { or: reglages.prixOr, argent: reglages.prixArgent });
      const debut = debutHawlSuivi(reglages.debutHawl, nisab === null ? null : base >= nisab, aujourdhui);
      if (debut !== reglages.debutHawl) {
        await sql.executer('UPDATE zakat SET debut_hawl = ? WHERE carnet_id = ?', debut, carnet.id);
        reglages.debutHawl = debut;
      }
      return { reglages, biens, composition, nisab, etat: etatZakat(base, nisab, debut, aujourdhui) };
    },

    /** Base du nisab, prix du gramme (sa date est notée), ou début de l'année lunaire corrigé à la main. */
    async reglerZakat(
      carnet: Carnet,
      r: { base?: BaseNisab; prixOr?: number | null; prixArgent?: number | null; debutHawl?: Jour | null },
    ): Promise<void> {
      const prixValide = (p: number | null | undefined) => p === undefined || p === null || montantValide(p);
      if (!prixValide(r.prixOr) || !prixValide(r.prixArgent)) throw new SaisieInvalide('montantInvalide');
      if (r.base !== undefined && r.base !== 'or' && r.base !== 'argent') throw new SaisieInvalide('montantInvalide');
      if (r.debutHawl && (!jourValide(r.debutHawl) || r.debutHawl > outils.aujourdhui()))
        throw new SaisieInvalide('dateInvalide');
      await sql.executer("INSERT OR IGNORE INTO zakat (carnet_id, base_nisab) VALUES (?, 'argent')", carnet.id);
      if (r.base !== undefined)
        await sql.executer('UPDATE zakat SET base_nisab = ? WHERE carnet_id = ?', r.base, carnet.id);
      if (r.prixOr !== undefined || r.prixArgent !== undefined) {
        if (r.prixOr !== undefined)
          await sql.executer('UPDATE zakat SET cours_or_g = ? WHERE carnet_id = ?', r.prixOr, carnet.id);
        if (r.prixArgent !== undefined)
          await sql.executer('UPDATE zakat SET cours_argent_g = ? WHERE carnet_id = ?', r.prixArgent, carnet.id);
        await sql.executer('UPDATE zakat SET cours_maj_le = ? WHERE carnet_id = ?', outils.aujourdhui(), carnet.id);
      }
      if (r.debutHawl !== undefined)
        await sql.executer('UPDATE zakat SET debut_hawl = ? WHERE carnet_id = ?', r.debutHawl, carnet.id);
    },

    async ajouterBien(carnet: Carnet, b: SaisieBien): Promise<string> {
      const v = validerBien(b);
      const id = outils.nouvelId();
      await sql.executer(
        'INSERT INTO biens_zakat (id, carnet_id, type, libelle, montant, milligrammes) VALUES (?, ?, ?, ?, ?, ?)',
        id,
        carnet.id,
        b.type,
        v.libelle,
        v.montant,
        v.milligrammes,
      );
      return id;
    },

    async modifierBien(carnet: Carnet, id: string, b: SaisieBien): Promise<void> {
      const v = validerBien(b);
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM biens_zakat WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('bienInconnu');
      await sql.executer(
        'UPDATE biens_zakat SET type = ?, libelle = ?, montant = ?, milligrammes = ? WHERE id = ? AND carnet_id = ?',
        b.type,
        v.libelle,
        v.montant,
        v.milligrammes,
        id,
        carnet.id,
      );
    },

    async supprimerBien(carnet: Carnet, id: string): Promise<void> {
      const existe = await sql.premier<{ id: string }>(
        'SELECT id FROM biens_zakat WHERE id = ? AND carnet_id = ?',
        id,
        carnet.id,
      );
      if (!existe) throw new SaisieInvalide('bienInconnu');
      await sql.executer('DELETE FROM biens_zakat WHERE id = ? AND carnet_id = ?', id, carnet.id);
    },

    /** Zakat versée : une sadaqa du montant dans le cycle en cours, et l'année lunaire repart d'aujourd'hui. */
    async marquerZakatVersee(carnet: Carnet, v: { montant: number; compteId: string | null }): Promise<void> {
      if (!montantValide(v.montant)) throw new SaisieInvalide('montantInvalide');
      const cycle = await cycleCourant(carnet);
      await sql.transaction(async () => {
        await sql.executer(
          "INSERT INTO operations (id, carnet_id, cycle_id, type, montant, date, compte_id, note, cree_le) VALUES (?, ?, ?, 'sadaqa', ?, ?, ?, 'Zakat', ?)",
          outils.nouvelId(),
          carnet.id,
          cycle.id,
          v.montant,
          outils.aujourdhui(),
          v.compteId,
          outils.horodatage(),
        );
        await sql.executer("INSERT OR IGNORE INTO zakat (carnet_id, base_nisab) VALUES (?, 'argent')", carnet.id);
        await sql.executer('UPDATE zakat SET debut_hawl = ? WHERE carnet_id = ?', outils.aujourdhui(), carnet.id);
      });
    },

    // --- Dettes entre proches : séparées du budget du mois, elles ne touchent ni enveloppes ni comptes. ---

    /** Dettes ouvertes (échéance la plus proche d'abord), ou soldées et annulées (les plus récentes d'abord). */
    async dettes(carnet: Carnet, vue: 'ouvertes' | 'closes'): Promise<Dette[]> {
      const lignes = await sql.tous<LigneDette>(
        `${SELECT_DETTE} WHERE d.carnet_id = ? AND ${vue === 'ouvertes' ? "d.statut = 'ouverte'" : "d.statut <> 'ouverte'"}
         ORDER BY ${vue === 'ouvertes' ? 'd.echeance IS NULL, d.echeance, d.date' : 'd.date DESC'}, d.cree_le`,
        carnet.id,
      );
      return lignes.map(versDette);
    },

    async dette(carnet: Carnet, id: string): Promise<DetailDette | null> {
      const ligne = await sql.premier<LigneDette>(`${SELECT_DETTE} WHERE d.carnet_id = ? AND d.id = ?`, carnet.id, id);
      if (!ligne) return null;
      const paiements = await sql.tous<PaiementDette>(
        'SELECT id, type, montant, date, note FROM paiements_dette WHERE dette_id = ? ORDER BY date DESC, cree_le DESC',
        id,
      );
      return { ...versDette(ligne), paiements };
    },

    async ajouterDette(carnet: Carnet, s: SaisieDette): Promise<string> {
      const personne = validerDette(s);
      const id = outils.nouvelId();
      await sql.executer(
        "INSERT INTO dettes (id, carnet_id, sens, personne, montant_initial, date, echeance, note, statut, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'ouverte', ?)",
        id,
        carnet.id,
        s.sens,
        personne,
        s.montant,
        outils.aujourdhui(),
        s.echeance,
        noteOuNull(s.note),
        outils.horodatage(),
      );
      return id;
    },

    /** Corrige une dette ; le montant ne descend jamais sous ce qui est déjà remboursé. */
    async modifierDette(carnet: Carnet, id: string, s: SaisieDette): Promise<void> {
      const personne = validerDette(s);
      const actuelle = await sql.premier<LigneDette>(
        `${SELECT_DETTE} WHERE d.carnet_id = ? AND d.id = ?`,
        carnet.id,
        id,
      );
      if (!actuelle) throw new SaisieInvalide('detteInconnue');
      if (s.montant < actuelle.rembourse) throw new SaisieInvalide('montantSousRembourse');
      // Une dette annulée le reste ; sinon, elle est soldée exactement quand tout est remboursé.
      const statut: StatutDette =
        actuelle.statut === 'annulee' ? 'annulee' : s.montant === actuelle.rembourse ? 'soldee' : 'ouverte';
      await sql.executer(
        'UPDATE dettes SET sens = ?, personne = ?, montant_initial = ?, echeance = ?, note = ?, statut = ? WHERE id = ? AND carnet_id = ?',
        s.sens,
        personne,
        s.montant,
        s.echeance,
        noteOuNull(s.note),
        statut,
        id,
        carnet.id,
      );
    },

    /** Annule une dette ouverte : elle passe avec les dettes closes, son historique est gardé. */
    async annulerDette(carnet: Carnet, id: string): Promise<void> {
      const d = await sql.premier<{ statut: StatutDette }>(
        'SELECT statut FROM dettes WHERE carnet_id = ? AND id = ?',
        carnet.id,
        id,
      );
      if (!d) throw new SaisieInvalide('detteInconnue');
      if (d.statut !== 'ouverte') throw new SaisieInvalide('detteFermee');
      await sql.executer("UPDATE dettes SET statut = 'annulee' WHERE id = ?", id);
    },

    /**
     * Remboursement (montant donné, jamais plus que le reste) ou remise du reste (le montant est le reste).
     * La dette est soldée quand il ne reste plus rien.
     */
    async ajouterPaiement(
      carnet: Carnet,
      detteId: string,
      p: { type: 'remboursement' | 'remise'; montant: number; date: Jour; note: string | null },
    ): Promise<void> {
      if (!jourValide(p.date)) throw new SaisieInvalide('dateInvalide');
      await sql.transaction(async () => {
        const d = await sql.premier<LigneDette>(
          `${SELECT_DETTE} WHERE d.carnet_id = ? AND d.id = ?`,
          carnet.id,
          detteId,
        );
        if (!d) throw new SaisieInvalide('detteInconnue');
        if (d.statut !== 'ouverte') throw new SaisieInvalide('detteFermee');
        const reste = d.montant_initial - d.rembourse;
        const montant = p.type === 'remise' ? reste : p.montant;
        if (!montantValide(montant)) throw new SaisieInvalide('montantInvalide');
        if (montant > reste) throw new SaisieInvalide('paiementTropGrand');
        await sql.executer(
          'INSERT INTO paiements_dette (id, dette_id, type, montant, date, note, cree_le) VALUES (?, ?, ?, ?, ?, ?, ?)',
          outils.nouvelId(),
          detteId,
          p.type,
          montant,
          p.date,
          noteOuNull(p.note),
          outils.horodatage(),
        );
        if (montant === reste) await sql.executer("UPDATE dettes SET statut = 'soldee' WHERE id = ?", detteId);
      });
    },

    /** Retire un paiement saisi par erreur ; une dette soldée redevient ouverte. */
    async supprimerPaiement(carnet: Carnet, paiementId: string): Promise<void> {
      await sql.transaction(async () => {
        const p = await sql.premier<{ dette_id: string; statut: StatutDette }>(
          `SELECT p.dette_id, d.statut FROM paiements_dette p JOIN dettes d ON d.id = p.dette_id
           WHERE p.id = ? AND d.carnet_id = ?`,
          paiementId,
          carnet.id,
        );
        if (!p) throw new SaisieInvalide('detteInconnue');
        await sql.executer('DELETE FROM paiements_dette WHERE id = ?', paiementId);
        if (p.statut === 'soldee') await sql.executer("UPDATE dettes SET statut = 'ouverte' WHERE id = ?", p.dette_id);
      });
    },
  });
}

type LigneObjectif = {
  id: string;
  nom: string;
  intention: string | null;
  cible: number | null;
  versement_mensuel: number | null;
  icone: string;
  archive: number;
  verse: number;
};

const SELECT_OBJECTIF = `SELECT ob.id, ob.nom, ob.intention, ob.cible, ob.versement_mensuel, ob.icone, ob.archive,
  COALESCE((SELECT SUM(o.montant) FROM operations o WHERE o.objectif_id = ob.id AND o.type = 'epargne'), 0) AS verse
  FROM objectifs ob`;

function versObjectif(l: LigneObjectif): Objectif {
  return {
    id: l.id,
    nom: l.nom,
    intention: l.intention,
    cible: l.cible,
    versementMensuel: l.versement_mensuel,
    icone: l.icone,
    utilise: l.archive === 1,
    verse: l.verse,
  };
}

/** Vérifie une saisie d'objectif ; rend le nom et l'intention nettoyés. */
function validerObjectif(s: SaisieObjectif): { nom: string; intention: string | null } {
  const nom = s.nom.trim();
  if (nom.length < 1 || nom.length > NOM_OBJECTIF_MAX) throw new SaisieInvalide('nomInvalide');
  const intention = noteOuNull(s.intention);
  if (intention !== null && intention.length > INTENTION_MAX) throw new SaisieInvalide('nomInvalide');
  if (s.cible !== null && !montantValide(s.cible)) throw new SaisieInvalide('montantInvalide');
  if (s.versementMensuel !== null && !montantValide(s.versementMensuel)) throw new SaisieInvalide('montantInvalide');
  return { nom, intention };
}

/** Vérifie un bien de zakat ; rend ce qui s'enregistre (poids pour un métal, montant sinon). */
function validerBien(b: SaisieBien): { libelle: string | null; montant: number | null; milligrammes: number | null } {
  if (!TYPES_BIEN.includes(b.type)) throw new SaisieInvalide('bienInconnu');
  const libelle = noteOuNull(b.libelle);
  if (libelle !== null && libelle.length > LIBELLE_BIEN_MAX) throw new SaisieInvalide('nomInvalide');
  if (!montantValide(b.valeur)) throw new SaisieInvalide('montantInvalide');
  return estMetal(b.type)
    ? { libelle, montant: null, milligrammes: b.valeur }
    : { libelle, montant: b.valeur, milligrammes: null };
}

type LigneDette = {
  id: string;
  sens: SensDette;
  personne: string;
  montant_initial: number;
  rembourse: number;
  date: Jour;
  echeance: Jour | null;
  note: string | null;
  statut: StatutDette;
};

const SELECT_DETTE = `SELECT d.id, d.sens, d.personne, d.montant_initial, d.date, d.echeance, d.note, d.statut,
  COALESCE((SELECT SUM(p.montant) FROM paiements_dette p WHERE p.dette_id = d.id), 0) AS rembourse
  FROM dettes d`;

function versDette(l: LigneDette): Dette {
  return {
    id: l.id,
    sens: l.sens,
    personne: l.personne,
    montantInitial: l.montant_initial,
    rembourse: l.rembourse,
    reste: l.montant_initial - l.rembourse,
    date: l.date,
    echeance: l.echeance,
    note: l.note,
    statut: l.statut,
  };
}

/** Vérifie une saisie de dette ; rend le nom nettoyé. */
function validerDette(s: SaisieDette): string {
  const personne = s.personne.trim();
  if (personne.length < 1 || personne.length > PERSONNE_MAX) throw new SaisieInvalide('personneInvalide');
  if (!montantValide(s.montant)) throw new SaisieInvalide('montantInvalide');
  if (s.echeance !== null && !jourValide(s.echeance)) throw new SaisieInvalide('dateInvalide');
  return personne;
}

export type Depot = ReturnType<typeof creerDepot>;
