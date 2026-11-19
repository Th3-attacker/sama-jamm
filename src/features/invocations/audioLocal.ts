// Audio des invocations gardé sur le téléphone pour écouter sans réseau : documents/adhkar/<n>.mp3,
// rempli à la première écoute. Rien ne part du téléphone.
import { Directory, File, Paths } from 'expo-file-system';
import { getNetworkStateAsync, NetworkStateType } from 'expo-network';

import { useReglages } from '@/stores/reglages';

import { numeroAudio, urlAudio } from './audio';

const dossier = () => new Directory(Paths.document, 'adhkar');

function fichier(id: string): File | null {
  const n = numeroAudio(id);
  return n === null ? null : new File(dossier(), `${n}.mp3`);
}

/** Adresse à lire : le fichier du téléphone s'il y est, sinon l'adresse en ligne. `local` dit lequel. */
export function sourceAudio(id: string): { uri: string; local: boolean } | null {
  const f = fichier(id);
  if (f?.exists) return { uri: f.uri, local: true };
  const url = urlAudio(id);
  return url ? { uri: url, local: false } : null;
}

/** Garde le fichier sur le téléphone. Renvoie false (sans rien casser) si c'est impossible : l'écoute en ligne continue. */
export async function garderAudio(id: string): Promise<boolean> {
  const f = fichier(id);
  const url = urlAudio(id);
  if (!f || !url) return false;
  if (f.exists) return true;
  try {
    if (useReglages.getState().wifiSeulement && (await getNetworkStateAsync()).type !== NetworkStateType.WIFI) return false;
    const d = dossier();
    if (!d.exists) d.create({ intermediates: true });
    await File.downloadFileAsync(url, f);
    return true;
  } catch {
    // Réseau coupé ou fichier incomplet : on retire un éventuel fichier partiel pour ne jamais le lire.
    if (f.exists) f.delete();
    return false;
  }
}

/** Le téléphone a du réseau (ou on ne sait pas : l'essai décidera). */
export async function reseauDisponible(): Promise<boolean> {
  const etat = await getNetworkStateAsync();
  return etat.isInternetReachable !== false;
}
