// Zakat indicative : la méthode est à faire valider par le référent religieux du projet.
import { ajouterJours, type Jour } from './cycle.ts';
import type { Carnet } from './depot.ts';
import { jourValide, montantValide, noteOuNull, SaisieInvalide, type Contexte } from './depotCommun.ts';
import { SELECT_DETTE, versDette, type LigneDette } from './depotDettes.ts';
import { lireEpargne } from './depotEpargne.ts';
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

export function methodesZakat({ sql, outils, cycleCourant, lireComptesAvecSolde }: Contexte) {
  return {
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
      const epargne = (await lireEpargne(sql, carnet)).total;
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
  };
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
