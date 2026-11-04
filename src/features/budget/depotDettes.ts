// Dettes entre proches : séparées du budget du mois, elles ne touchent ni enveloppes ni comptes.
import type { Jour } from './cycle.ts';
import type { Carnet } from './depot.ts';
import { jourValide, montantValide, noteOuNull, SaisieInvalide, type Contexte } from './depotCommun.ts';
import { PERSONNE_MAX, type SensDette, type StatutDette } from './dettes.ts';

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

export function methodesDettes({ sql, outils }: Contexte) {
  return {
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
  };
}

export type LigneDette = {
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

export const SELECT_DETTE = `SELECT d.id, d.sens, d.personne, d.montant_initial, d.date, d.echeance, d.note, d.statut,
  COALESCE((SELECT SUM(p.montant) FROM paiements_dette p WHERE p.dette_id = d.id), 0) AS rembourse
  FROM dettes d`;

export function versDette(l: LigneDette): Dette {
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
