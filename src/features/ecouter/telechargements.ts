// Récitations téléchargées pour écouter sans réseau : un fichier par verset, dans le dossier de l'app
// (documents/recitations/<récitateur>/<numéro global>.mp3). Rien ne part du téléphone.
import { Directory, File, Paths } from 'expo-file-system';
import { create } from 'zustand';

import { sourates } from '@/features/lire/coran';

import { numeroGlobal, positionDeNumero, urlVerset, type Position } from './recitateurs';

const VERSETS = sourates.map((s) => s.versets);
const RACINE = 'recitations';

const dossier = (idRecitateur: string) => new Directory(Paths.document, RACINE, idRecitateur);
const fichierVerset = (idRecitateur: string, p: Position) =>
  new File(dossier(idRecitateur), `${numeroGlobal(p, VERSETS)}.mp3`);

/** Adresse locale du verset s'il est téléchargé, sinon l'adresse en ligne. */
export function sourceVerset(idRecitateur: string, p: Position): string {
  const local = fichierVerset(idRecitateur, p);
  return local.exists ? local.uri : urlVerset(idRecitateur, p, VERSETS);
}

/** Téléchargements en cours, par clé « récitateur:sourate » : part faite, de 0 à 1. Non persisté. */
export const useTelechargements = create<{ enCours: Record<string, number>; version: number }>()(() => ({
  enCours: {},
  version: 0,
}));
const cle = (idRecitateur: string, sourate: number) => `${idRecitateur}:${sourate}`;
const relire = () => useTelechargements.setState((s) => ({ version: s.version + 1 }));

/** Tous les versets de la sourate sont sur le téléphone. */
export function sourateTelechargee(idRecitateur: string, sourate: number): boolean {
  const total = VERSETS[sourate - 1] ?? 0;
  if (total === 0 || !dossier(idRecitateur).exists) return false;
  for (let v = 1; v <= total; v++) if (!fichierVerset(idRecitateur, { sourate, verset: v }).exists) return false;
  return true;
}

/** Télécharge les versets manquants de la sourate ; un échec laisse les versets déjà reçus. */
export async function telechargerSourate(idRecitateur: string, sourate: number): Promise<void> {
  const k = cle(idRecitateur, sourate);
  if (useTelechargements.getState().enCours[k] !== undefined) return;
  const total = VERSETS[sourate - 1] ?? 0;
  const d = dossier(idRecitateur);
  if (!d.exists) d.create({ intermediates: true });
  const avancer = (part: number) => useTelechargements.setState((s) => ({ enCours: { ...s.enCours, [k]: part } }));
  avancer(0);
  try {
    for (let v = 1; v <= total; v++) {
      const p = { sourate, verset: v };
      const f = fichierVerset(idRecitateur, p);
      if (!f.exists) await File.downloadFileAsync(urlVerset(idRecitateur, p, VERSETS), f);
      avancer(v / total);
    }
  } finally {
    useTelechargements.setState((s) => {
      const { [k]: _fini, ...reste } = s.enCours;
      return { enCours: reste };
    });
    relire();
  }
}

export function supprimerSourate(idRecitateur: string, sourate: number): void {
  const total = VERSETS[sourate - 1] ?? 0;
  for (let v = 1; v <= total; v++) {
    const f = fichierVerset(idRecitateur, { sourate, verset: v });
    if (f.exists) f.delete();
  }
  relire();
}

export type SourateTelechargee = { recitateur: string; sourate: number; versets: number; octets: number };

/** Ce qui est sur le téléphone, regroupé par récitateur et sourate (sourates partielles comprises). */
export function listeTelechargements(): SourateTelechargee[] {
  const racine = new Directory(Paths.document, RACINE);
  if (!racine.exists) return [];
  const resultat = new Map<string, SourateTelechargee>();
  for (const d of racine.list()) {
    if (!(d instanceof Directory)) continue;
    for (const f of d.list()) {
      if (!(f instanceof File)) continue;
      const p = positionDeNumero(Number(f.name.replace(/\.mp3$/, '')), VERSETS);
      if (!p) continue;
      const k = cle(d.name, p.sourate);
      const courant = resultat.get(k) ?? { recitateur: d.name, sourate: p.sourate, versets: 0, octets: 0 };
      courant.versets += 1;
      courant.octets += f.size ?? 0;
      resultat.set(k, courant);
    }
  }
  return [...resultat.values()].sort((a, b) => a.recitateur.localeCompare(b.recitateur) || a.sourate - b.sourate);
}
