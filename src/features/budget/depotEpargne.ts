// Épargne avec intention : objectifs, versements, objectif utilisé. Un versement est une opération « épargne ».
import type { Carnet, Operation } from './depot.ts';
import { montantValide, noteOuNull, SaisieInvalide, type Contexte, type Sql } from './depotCommun.ts';
import { INTENTION_MAX, NOM_OBJECTIF_MAX } from './epargne.ts';

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

/** Total mis de côté, épargne libre, objectifs actifs et utilisés (fonction interne, hors file d'attente). */
export async function lireEpargne(sql: Sql, carnet: Carnet): Promise<Epargne> {
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

export function methodesEpargne({ sql, outils, cycleCourant }: Contexte) {
  async function changerArchive(carnet: Carnet, id: string, archive: 0 | 1): Promise<void> {
    const existe = await sql.premier<{ id: string }>(
      'SELECT id FROM objectifs WHERE id = ? AND carnet_id = ?',
      id,
      carnet.id,
    );
    if (!existe) throw new SaisieInvalide('objectifInconnu');
    await sql.executer('UPDATE objectifs SET archive = ? WHERE id = ?', archive, id);
  }

  return {
    /** Total mis de côté, épargne libre, objectifs actifs et objectifs utilisés. */
    async epargne(carnet: Carnet): Promise<Epargne> {
      return lireEpargne(sql, carnet);
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
  };
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
