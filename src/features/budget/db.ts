// Base du budget : SQLCipher, clé aléatoire de 256 bits gardée dans le trousseau du téléphone.
// Rien ici ne s'exécute dans Expo Go : SQLCipher demande un build natif (plugin `expo-sqlite` avec `useSQLCipher`).
import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { File } from 'expo-file-system';
import { defaultDatabaseDirectory, deleteDatabaseAsync, openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';

import { devisesIntegrees } from '@/lib/montant';

import { ChiffrementIndisponible, verifierChiffrement } from './chiffrement';
import { nettoyerExportsCsv } from './exports';
import { migrations, VERSION_SCHEMA } from './schema';

const NOM_BASE = 'budget.db';
const CLE_TROUSSEAU = 'budget.cle';
const FORMAT_CLE = /^[0-9a-f]{64}$/;

/** La base existe mais ne s'ouvre pas : clé perdue ou fichier abîmé. On n'efface jamais sans demande de l'utilisateur. */
export class BudgetIllisible extends Error {
  constructor(cause: unknown) {
    super('Le budget ne peut pas être ouvert.', { cause });
    this.name = 'BudgetIllisible';
  }
}

const versHex = (octets: Uint8Array) => Array.from(octets, (o) => o.toString(16).padStart(2, '0')).join('');

/** Clé du trousseau, créée à la première ouverture. Elle ne quitte jamais ce téléphone. */
export async function cleDuBudget(): Promise<string> {
  const existante = await SecureStore.getItemAsync(CLE_TROUSSEAU);
  if (existante !== null) {
    if (!FORMAT_CLE.test(existante)) throw new BudgetIllisible(new Error('Clé du trousseau illisible.'));
    return existante;
  }
  const nouvelle = versHex(Crypto.getRandomBytes(32));
  await SecureStore.setItemAsync(CLE_TROUSSEAU, nouvelle, {
    keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  return nouvelle;
}

async function appliquerMigrations(db: SQLiteDatabase): Promise<void> {
  const ligne = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const actuelle = ligne?.user_version ?? 0;
  if (actuelle > VERSION_SCHEMA) throw new Error(`Budget plus récent que l'app (version ${actuelle}).`);
  for (let version = actuelle + 1; version <= VERSION_SCHEMA; version++) {
    const sql = migrations[version - 1];
    if (sql === undefined) throw new Error(`Migration ${version} manquante.`);
    // `user_version` avance dans la même transaction : une migration à moitié faite est annulée en entier.
    await db.withTransactionAsync(async () => {
      await db.execAsync(sql);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}

async function semerDevises(db: SQLiteDatabase): Promise<void> {
  for (const d of devisesIntegrees) {
    await db.runAsync(
      'INSERT OR IGNORE INTO devises (code, nom, symbole, position, decimales, sous_unites, personnelle) VALUES (?, ?, ?, ?, ?, ?, ?)',
      d.code,
      d.nom,
      d.symbole,
      d.position,
      d.decimales,
      d.sousUnites,
      d.personnelle ? 1 : 0,
    );
  }
}

async function ouvrir(): Promise<SQLiteDatabase> {
  const cle = await cleDuBudget();
  const db = await openDatabaseAsync(NOM_BASE);
  try {
    // Sans SQLCipher, la clé serait ignorée et la base resterait en clair : on refuse d'aller plus loin.
    verifierChiffrement(await db.getFirstAsync<{ cipher_version: string }>('PRAGMA cipher_version'));
    // Valeur validée (64 chiffres hexadécimaux) : la syntaxe x'…' de SQLCipher n'accepte pas de paramètre lié.
    await db.execAsync(`PRAGMA key = "x'${cle}'"`);
    // Première lecture : échoue ici (« file is not a database ») si la clé ne correspond pas au fichier.
    await db.getFirstAsync('SELECT count(*) FROM sqlite_master');
  } catch (erreur) {
    await db.closeAsync();
    if (erreur instanceof ChiffrementIndisponible) throw erreur;
    throw new BudgetIllisible(erreur);
  }
  await db.execAsync('PRAGMA foreign_keys = ON');
  await appliquerMigrations(db);
  await semerDevises(db);
  // Un export CSV en clair resté dans le cache (partage Android) disparaît à l'ouverture suivante du budget.
  nettoyerExportsCsv();
  return db;
}

let ouverture: Promise<SQLiteDatabase> | undefined;

/** Base du budget, ouverte une seule fois. Lève `BudgetIllisible` si elle ne s'ouvre pas ; l'appel suivant réessaie. */
export function budgetDb(): Promise<SQLiteDatabase> {
  ouverture ??= ouvrir().catch((erreur: unknown) => {
    ouverture = undefined;
    throw erreur;
  });
  return ouverture;
}

/**
 * Efface le budget et sa clé. À n'appeler qu'après la confirmation explicite de l'utilisateur,
 * quand la base est illisible : les données sont alors perdues.
 */
export async function reinitialiserBudget(): Promise<void> {
  const courante = ouverture;
  ouverture = undefined;
  if (courante) await courante.then((db) => db.closeAsync()).catch(() => undefined);
  await deleteDatabaseAsync(NOM_BASE);
  await SecureStore.deleteItemAsync(CLE_TROUSSEAU);
}

/** Chemin de fichier (sans « file:// ») d'une base du dossier SQLite, pour `ATTACH`. */
export function cheminDansDossierBase(nom: string): string {
  const dossier = String(defaultDatabaseDirectory).replace(/^file:\/\//, '');
  return `${decodeURIComponent(dossier).replace(/\/$/, '')}/${nom}`;
}

const fichierDuDossier = (nom: string) => new File(`file://${cheminDansDossierBase(nom)}`);

/**
 * Remplace le budget par la base `nom` du même dossier (déjà chiffrée avec la clé de ce téléphone), puis la rouvre.
 * L'ancienne base est gardée de côté jusqu'à ce que la nouvelle s'ouvre : en cas d'échec, elle reprend sa place.
 */
export async function remplacerBudget(nom: string): Promise<void> {
  const courante = ouverture;
  ouverture = undefined;
  if (courante) await courante.then((db) => db.closeAsync()).catch(() => undefined);
  const actuelle = fichierDuDossier(NOM_BASE);
  const ancienne = fichierDuDossier(`${NOM_BASE}.ancienne`);
  const nouvelle = fichierDuDossier(nom);
  if (ancienne.exists) ancienne.delete();
  if (actuelle.exists) await actuelle.move(ancienne);
  // Fichiers de journal laissés par l'ancienne base : ils ne doivent jamais s'appliquer à la nouvelle.
  for (const suffixe of ['-wal', '-shm', '-journal']) {
    const journal = fichierDuDossier(`${NOM_BASE}${suffixe}`);
    if (journal.exists) journal.delete();
  }
  try {
    await nouvelle.move(fichierDuDossier(NOM_BASE));
    await budgetDb();
  } catch (erreur: unknown) {
    ouverture = undefined;
    const ratee = fichierDuDossier(NOM_BASE);
    if (ratee.exists) ratee.delete();
    if (ancienne.exists) await ancienne.move(fichierDuDossier(NOM_BASE));
    throw erreur;
  }
  if (ancienne.exists) ancienne.delete();
}
