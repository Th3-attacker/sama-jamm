// Devises du budget : liste, devise personnelle, changement de devise du carnet avec conversion par un taux.
import type { Devise } from '../../lib/montant.ts';
import type { Carnet } from './depot.ts';
import { SaisieInvalide, type Contexte } from './depotCommun.ts';
import {
  convertirMontant,
  convertirMontantPositif,
  deviseDepuisSaisie,
  lireTaux,
  type SaisieDevise,
  type Taux,
} from './devises.ts';

type LigneDevise = {
  code: string;
  nom: string;
  symbole: string;
  position: Devise['position'];
  decimales: Devise['decimales'];
  sous_unites: number;
  personnelle: number;
};

const versDevise = (l: LigneDevise): Devise => ({
  code: l.code,
  nom: l.nom,
  symbole: l.symbole,
  position: l.position,
  decimales: l.decimales,
  sousUnites: l.sous_unites,
  personnelle: l.personnelle === 1,
});

const SELECT_DEVISE = 'SELECT code, nom, symbole, position, decimales, sous_unites, personnelle FROM devises';

/** Colonnes d'argent par table, et le filtre qui les rattache au carnet (`?` = identifiant du carnet). */
const COLONNES: { table: string; colonnes: string[]; positives: boolean; duCarnet: string }[] = [
  { table: 'comptes', colonnes: ['solde_initial'], positives: false, duCarnet: 'carnet_id = ?' },
  {
    table: 'plafonds',
    colonnes: ['montant', 'report'],
    positives: false,
    duCarnet: 'cycle_id IN (SELECT id FROM cycles WHERE carnet_id = ?)',
  },
  { table: 'objectifs', colonnes: ['cible', 'versement_mensuel'], positives: false, duCarnet: 'carnet_id = ?' },
  { table: 'operations', colonnes: ['montant'], positives: true, duCarnet: 'carnet_id = ?' },
  { table: 'zakat', colonnes: ['cours_or_g', 'cours_argent_g'], positives: true, duCarnet: 'carnet_id = ?' },
  { table: 'biens_zakat', colonnes: ['montant'], positives: false, duCarnet: 'carnet_id = ?' },
  {
    table: 'paiements_dette',
    colonnes: ['montant'],
    positives: true,
    duCarnet: 'dette_id IN (SELECT id FROM dettes WHERE carnet_id = ?)',
  },
];

export function methodesDevises({ sql, outils }: Contexte) {
  return {
    /** Devises intégrées d'abord, puis les devises personnelles dans l'ordre d'ajout. */
    async devises(): Promise<Devise[]> {
      const lignes = await sql.tous<LigneDevise>(`${SELECT_DEVISE} ORDER BY personnelle, rowid`);
      return lignes.map(versDevise);
    },

    async ajouterDevise(s: SaisieDevise): Promise<Devise> {
      const devise = deviseDepuisSaisie(s, `P-${outils.nouvelId()}`);
      if (!devise) throw new SaisieInvalide('deviseInvalide');
      await sql.executer(
        'INSERT INTO devises (code, nom, symbole, position, decimales, sous_unites, personnelle) VALUES (?, ?, ?, ?, ?, ?, 1)',
        devise.code,
        devise.nom,
        devise.symbole,
        devise.position,
        devise.decimales,
        devise.sousUnites,
      );
      return devise;
    },

    /**
     * Passe le carnet à une autre devise et convertit tout son argent au taux saisi (« 1 ancienne = taux nouvelle »),
     * en une seule transaction. Le reste d'une dette est converti à part : une dette soldée le reste.
     */
    async changerDevise(carnet: Carnet, code: string, saisieTaux: string): Promise<void> {
      if (code === carnet.devise.code) throw new SaisieInvalide('memeDevise');
      const taux = lireTaux(saisieTaux);
      if (!taux) throw new SaisieInvalide('tauxInvalide');
      const ligne = await sql.premier<LigneDevise>(`${SELECT_DEVISE} WHERE code = ?`, code);
      if (!ligne) throw new SaisieInvalide('deviseInconnue');
      const de = carnet.devise;
      const vers = versDevise(ligne);

      await sql.transaction(async () => {
        // Restes des dettes avant conversion des paiements.
        const dettes = await sql.tous<{ id: string; reste: number }>(
          `SELECT d.id, d.montant_initial - COALESCE((SELECT SUM(p.montant) FROM paiements_dette p WHERE p.dette_id = d.id), 0) AS reste
           FROM dettes d WHERE d.carnet_id = ?`,
          carnet.id,
        );
        for (const { table, colonnes, positives, duCarnet } of COLONNES) {
          const lignes = await sql.tous<Record<string, number | null> & { rowid: number }>(
            `SELECT rowid, ${colonnes.join(', ')} FROM ${table} WHERE ${duCarnet}`,
            carnet.id,
          );
          for (const l of lignes) {
            const valeurs = colonnes.map((c) => convertir(l[c] ?? null, positives, de, vers, taux));
            await sql.executer(
              `UPDATE ${table} SET ${colonnes.map((c) => `${c} = ?`).join(', ')} WHERE rowid = ?`,
              ...valeurs,
              l.rowid,
            );
          }
        }
        for (const d of dettes) {
          // Montant initial = paiements convertis + reste converti : la somme des paiements ne le dépasse jamais.
          await sql.executer(
            `UPDATE dettes SET montant_initial = COALESCE((SELECT SUM(montant) FROM paiements_dette WHERE dette_id = ?), 0) + ?
             WHERE id = ?`,
            d.id,
            convertirMontantPositif(d.reste, de, vers, taux),
            d.id,
          );
        }
        await sql.executer('UPDATE carnets SET devise_code = ? WHERE id = ?', vers.code, carnet.id);
      });
    },
  };
}

function convertir(valeur: number | null, positive: boolean, de: Devise, vers: Devise, taux: Taux): number | null {
  if (valeur === null) return null;
  return positive ? convertirMontantPositif(valeur, de, vers, taux) : convertirMontant(valeur, de, vers, taux);
}
