// Sauvegarde chiffrée du budget, restauration et partage d'un export CSV.
// La sauvegarde est une copie SQLCipher protégée par un mot de passe choisi par l'utilisateur (`sqlcipher_export`) :
// elle se lit sur un autre téléphone, contrairement à la base, dont la clé ne quitte jamais celui-ci.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { cleJour } from '@/lib/dates';

import { budgetDb, cheminDansDossierBase, cleDuBudget, remplacerBudget } from './db';
import { VERSION_SCHEMA } from './schema';

export const MOT_DE_PASSE_MIN = 8;
const EXTENSION = 'samajamm';
const NOM_RESTAURATION = 'budget-restauration.db';

/** Le mot de passe ne correspond pas à la sauvegarde (ou le fichier n'en est pas une). */
export class MotDePasseIncorrect extends Error {
  constructor() {
    super('Mot de passe incorrect ou fichier illisible.');
    this.name = 'MotDePasseIncorrect';
  }
}

/** Sauvegarde faite par une version plus récente de l'app, ou sans budget. */
export class SauvegardeIncompatible extends Error {
  constructor() {
    super('Sauvegarde incompatible avec cette version.');
    this.name = 'SauvegardeIncompatible';
  }
}

/** Chaîne SQL entre apostrophes : les apostrophes du texte sont doublées. */
const litteral = (texte: string) => `'${texte.replace(/'/g, "''")}'`;
const chemin = (f: File) => decodeURIComponent(f.uri.replace(/^file:\/\//, ''));

function fichierNeuf(nom: string): File {
  const f = new File(Paths.cache, nom);
  if (f.exists) f.delete();
  return f;
}

async function partager(f: File, mimeType: string, titre: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) throw new Error('Partage indisponible sur cet appareil.');
  await Sharing.shareAsync(f.uri, { mimeType, dialogTitle: titre });
}

/** Écrit le CSV dans le cache et ouvre la feuille de partage du téléphone. */
export async function partagerCsv(contenu: string, titre: string): Promise<void> {
  const f = fichierNeuf(`sama-jamm-budget-${cleJour(new Date())}.csv`);
  await f.write(contenu);
  await partager(f, 'text/csv', titre);
}

/** Copie chiffrée du budget avec `motDePasse`, puis feuille de partage (fichier, messagerie, Drive…). */
export async function sauvegarder(motDePasse: string, titre: string): Promise<void> {
  if (motDePasse.length < MOT_DE_PASSE_MIN) throw new MotDePasseIncorrect();
  const db = await budgetDb();
  const f = fichierNeuf(`sama-jamm-budget-${cleJour(new Date())}.${EXTENSION}`);
  await db.execAsync(`ATTACH DATABASE ${litteral(chemin(f))} AS sauvegarde KEY ${litteral(motDePasse)}`);
  try {
    await db.execAsync("SELECT sqlcipher_export('sauvegarde')");
    await db.execAsync(`PRAGMA sauvegarde.user_version = ${VERSION_SCHEMA}`);
  } finally {
    await db.execAsync('DETACH DATABASE sauvegarde');
  }
  await partager(f, 'application/octet-stream', titre);
}

/** Choix du fichier de sauvegarde ; null si l'utilisateur annule. */
export async function choisirSauvegarde(): Promise<{ uri: string; nom: string } | null> {
  const choix = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true, multiple: false });
  const fichier = choix.canceled ? undefined : choix.assets[0];
  return fichier ? { uri: fichier.uri, nom: fichier.name } : null;
}

/**
 * Remplace tout le budget par la sauvegarde `uri`. Vérifie d'abord le mot de passe et la version ; la copie est
 * chiffrée avec la clé de ce téléphone, puis prend la place de la base (l'ancienne revient si l'ouverture échoue).
 */
export async function restaurer(uri: string, motDePasse: string): Promise<void> {
  const db = await budgetDb();
  const source = chemin(new File(uri));
  const cible = cheminDansDossierBase(NOM_RESTAURATION);
  const restes = new File(`file://${cible}`);
  if (restes.exists) restes.delete();

  await db.execAsync(`ATTACH DATABASE ${litteral(source)} AS restauree KEY ${litteral(motDePasse)}`);
  try {
    let version: number;
    try {
      // Première lecture : échoue ici si le mot de passe ne correspond pas.
      const ligne = await db.getFirstAsync<{ user_version: number }>('PRAGMA restauree.user_version');
      const tables = await db.getFirstAsync<{ n: number }>(
        "SELECT count(*) AS n FROM restauree.sqlite_master WHERE type = 'table' AND name = 'carnets'",
      );
      version = ligne?.user_version ?? 0;
      if (!tables || tables.n !== 1) throw new SauvegardeIncompatible();
    } catch (erreur: unknown) {
      if (erreur instanceof SauvegardeIncompatible) throw erreur;
      throw new MotDePasseIncorrect();
    }
    if (version < 1 || version > VERSION_SCHEMA) throw new SauvegardeIncompatible();

    const cle = await cleDuBudget();
    await db.execAsync(`ATTACH DATABASE ${litteral(cible)} AS nouvelle KEY "x'${cle}'"`);
    try {
      await db.execAsync("SELECT sqlcipher_export('nouvelle', 'restauree')");
      await db.execAsync(`PRAGMA nouvelle.user_version = ${version}`);
    } finally {
      await db.execAsync('DETACH DATABASE nouvelle');
    }
  } catch (erreur: unknown) {
    if (restes.exists) restes.delete();
    throw erreur;
  } finally {
    await db.execAsync('DETACH DATABASE restauree');
  }
  // Les migrations de la version installée s'appliquent à la réouverture.
  await remplacerBudget(NOM_RESTAURATION);
}
