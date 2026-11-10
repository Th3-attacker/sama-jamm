// Xassaïdes téléchargés pour écouter sans réseau : un fichier par piste, dans le dossier de l'app
// (documents/xassaides/<source>/<identifiant>.mp3). Rien ne part du téléphone.
import { Directory, File, Paths } from 'expo-file-system';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';
import { create } from 'zustand';

import { useTelechargements, WifiRequis } from '@/features/ecouter/telechargements';
import { useReglages } from '@/stores/reglages';

import { pisteXassaides } from './catalogue';
import { urlPiste, type Piste } from './pistes';

const RACINE = 'xassaides';
const EXTENSION = '.mp3';
/** Fichier en cours de réception : il ne prend son nom définitif qu'une fois complet. */
const PARTIEL = '.partiel';

const dossier = (idSource: string) => new Directory(Paths.document, RACINE, idSource);
const fichierPiste = (idSource: string, idPiste: number) => new File(dossier(idSource), `${idPiste}${EXTENSION}`);

export const clePiste = (idSource: string, idPiste: number) => `${idSource}:${idPiste}`;

/** Pistes en cours de téléchargement, par clé « source:piste ». Non persisté. */
export const useTelechargementsXassaides = create<{ enCours: Record<string, true> }>()(() => ({ enCours: {} }));

// L'écran des téléchargements et l'onglet Plus se relisent quand `version` change.
const relire = () => useTelechargements.setState((s) => ({ version: s.version + 1 }));

export function pisteTelechargee(idSource: string, idPiste: number): boolean {
  return fichierPiste(idSource, idPiste).exists;
}

/** Adresse locale de la piste si elle est téléchargée, sinon l'adresse en ligne. */
export function sourcePiste(idSource: string, p: Piste): string {
  const local = fichierPiste(idSource, p.id);
  return local.exists ? local.uri : urlPiste(p);
}

/** Télécharge la piste ; un échec ne laisse aucun fichier incomplet à la place de la piste. */
export async function telechargerPiste(idSource: string, idPiste: number): Promise<void> {
  const p = pisteXassaides(idSource, idPiste);
  const k = clePiste(idSource, idPiste);
  if (!p || useTelechargementsXassaides.getState().enCours[k] || pisteTelechargee(idSource, idPiste)) return;
  if (useReglages.getState().wifiSeulement && (await getNetworkStateAsync()).type !== NetworkStateType.WIFI) {
    throw new WifiRequis();
  }
  const d = dossier(idSource);
  if (!d.exists) d.create({ intermediates: true });
  useTelechargementsXassaides.setState((s) => ({ enCours: { ...s.enCours, [k]: true } }));
  const partiel = new File(d, `${idPiste}${PARTIEL}`);
  try {
    if (partiel.exists) partiel.delete();
    await File.downloadFileAsync(urlPiste(p), partiel);
    partiel.move(fichierPiste(idSource, idPiste));
  } catch (erreur: unknown) {
    if (partiel.exists) partiel.delete();
    throw erreur;
  } finally {
    useTelechargementsXassaides.setState((s) => {
      const { [k]: _fini, ...reste } = s.enCours;
      return { enCours: reste };
    });
    relire();
  }
}

export function supprimerPiste(idSource: string, idPiste: number): void {
  const f = fichierPiste(idSource, idPiste);
  if (f.exists) f.delete();
  relire();
}

export type PisteTelechargee = { source: string; id: number; octets: number };

/** Pistes complètes sur le téléphone, par source. */
export function listeXassaidesTelecharges(): PisteTelechargee[] {
  const racine = new Directory(Paths.document, RACINE);
  if (!racine.exists) return [];
  const resultat: PisteTelechargee[] = [];
  for (const d of racine.list()) {
    if (!(d instanceof Directory)) continue;
    for (const f of d.list()) {
      if (!(f instanceof File) || !f.name.endsWith(EXTENSION)) continue;
      const id = Number(f.name.slice(0, -EXTENSION.length));
      if (Number.isInteger(id)) resultat.push({ source: d.name, id, octets: f.size ?? 0 });
    }
  }
  return resultat.sort((a, b) => a.source.localeCompare(b.source) || a.id - b.id);
}
