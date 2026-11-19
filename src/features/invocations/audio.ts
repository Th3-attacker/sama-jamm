// Audio des invocations : un fichier MP3 par invocation, dans le bucket public « adhkar » du projet Supabase.
// Le numéro du fichier est le dernier nombre de l'identifiant (« morning-27-66 » → 66.mp3) ; le matin et le soir
// partagent les mêmes fichiers. Fonctions pures.

export const BASE_AUDIO = 'https://nfyrsfgtyxlbwivjpbjh.supabase.co/storage/v1/object/public/adhkar';

/** Numéro du fichier audio d'une invocation, ou null si l'identifiant n'a pas la forme « moment-chapitre-numéro ». */
export function numeroAudio(id: string): number | null {
  const m = /^[a-z_]+-\d+-(\d+)$/.exec(id);
  return m ? Number(m[1]) : null;
}

/** Adresse en ligne du fichier audio, ou null sans numéro. */
export function urlAudio(id: string): string | null {
  const n = numeroAudio(id);
  return n === null ? null : `${BASE_AUDIO}/${n}.mp3`;
}

/** Part écoutée, de 0 à 1 (0 tant que la durée est inconnue). */
export function partEcoutee(courant: number, duree: number): number {
  if (!Number.isFinite(courant) || !Number.isFinite(duree) || duree <= 0) return 0;
  return Math.min(1, Math.max(0, courant / duree));
}
