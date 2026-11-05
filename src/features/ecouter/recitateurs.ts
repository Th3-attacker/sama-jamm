// Récitations verset par verset d'alquran.cloud (Islamic Network) : autorisées par les récitateurs ou leurs
// ayants droit pour une redistribution gratuite et non commerciale (alquran.cloud/terms-and-conditions).
// Fonctions pures : la position d'écoute est un couple sourate, verset.

export type Recitateur = { id: string; nom: string; style: 'murattal' | 'mujawwad' };

/** Identifiants des éditions audio d'alquran.cloud, tous disponibles à 64 kbit/s. */
export const RECITATEURS: readonly Recitateur[] = [
  { id: 'ar.alafasy', nom: 'Mishary Rashid Alafasy', style: 'murattal' },
  { id: 'ar.husary', nom: 'Mahmoud Khalil Al-Husary', style: 'murattal' },
  { id: 'ar.abdulsamad', nom: 'Abdul Basit Abdul Samad', style: 'murattal' },
  { id: 'ar.hudhaify', nom: 'Ali Al-Hudhaify', style: 'murattal' },
  { id: 'ar.mahermuaiqly', nom: 'Maher Al-Muaiqly', style: 'murattal' },
];

const DEBIT = 64;

export const recitateur = (id: string): Recitateur | undefined => RECITATEURS.find((r) => r.id === id);

export type Position = { sourate: number; verset: number };

/** Numéro du verset dans tout le Coran (1 à 6236), d'après le nombre de versets de chaque sourate. */
export function numeroGlobal(p: Position, versetsParSourate: readonly number[]): number {
  let n = 0;
  for (let s = 1; s < p.sourate; s++) n += versetsParSourate[s - 1] ?? 0;
  return n + p.verset;
}

/** Inverse de `numeroGlobal` : sourate et verset du verset n (1 à 6236), ou null hors limites. */
export function positionDeNumero(n: number, versetsParSourate: readonly number[]): Position | null {
  if (!Number.isInteger(n) || n < 1) return null;
  let reste = n;
  for (let s = 1; s <= versetsParSourate.length; s++) {
    const total = versetsParSourate[s - 1] ?? 0;
    if (reste <= total) return { sourate: s, verset: reste };
    reste -= total;
  }
  return null;
}

/** Adresse du fichier audio d'un verset. */
export function urlVerset(idRecitateur: string, p: Position, versetsParSourate: readonly number[]): string {
  return `https://cdn.islamic.network/quran/audio/${DEBIT}/${idRecitateur}/${numeroGlobal(p, versetsParSourate)}.mp3`;
}

/** Verset suivant dans la même sourate, ou null à la fin de la sourate (l'écoute s'arrête là). */
export function versetSuivant(p: Position, versetsParSourate: readonly number[]): Position | null {
  const total = versetsParSourate[p.sourate - 1] ?? 0;
  return p.verset < total ? { sourate: p.sourate, verset: p.verset + 1 } : null;
}

/** Verset précédent dans la même sourate, ou le premier verset s'il n'y en a pas. */
export function versetPrecedent(p: Position): Position {
  return { sourate: p.sourate, verset: Math.max(1, p.verset - 1) };
}

/**
 * Versets des pages `debut` à `fin` (comprises), dans l'ordre du mushaf, même à cheval sur deux sourates.
 * `versetsDePage` vient des données du mushaf (features/lire/coran).
 */
export function pistesDePages(
  debut: number,
  fin: number,
  versetsDePage: (page: number) => readonly { sourate: number; verset: number }[],
): Position[] {
  const pistes: Position[] = [];
  for (let p = Math.max(1, debut); p <= fin; p++)
    for (const v of versetsDePage(p)) pistes.push({ sourate: v.sourate, verset: v.verset });
  return pistes;
}

/** Position valable : sourate de 1 à 114, verset dans la sourate. */
export function positionValide(p: Position, versetsParSourate: readonly number[]): boolean {
  const total = versetsParSourate[p.sourate - 1];
  return (
    Number.isInteger(p.sourate) &&
    Number.isInteger(p.verset) &&
    total !== undefined &&
    p.verset >= 1 &&
    p.verset <= total
  );
}
