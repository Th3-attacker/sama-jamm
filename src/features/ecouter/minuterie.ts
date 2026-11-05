// Minuterie et répétition du lecteur : règles pures.

export type Minuterie = { type: 'aucune' } | { type: 'duree'; finA: number } | { type: 'finSourate' };
export const DUREES_MINUTERIE = [15, 30, 60] as const;

/** Répéter chaque verset : 1 (une seule écoute), 3, 5, ou 0 pour sans fin. */
export const REPETITIONS_VERSET = [1, 3, 5, 0] as const;
export type RepetitionVerset = (typeof REPETITIONS_VERSET)[number];

export function minuterieDans(minutes: number, maintenant: number): Minuterie {
  return { type: 'duree', finA: maintenant + minutes * 60_000 };
}

/** Millisecondes restantes (0 si échue), ou null sans minuterie de durée. */
export function resteMinuterie(m: Minuterie, maintenant: number): number | null {
  return m.type === 'duree' ? Math.max(0, m.finA - maintenant) : null;
}

/**
 * Après une écoute du verset (`ecoutes` compte celle qui vient de finir) : le rejouer, ou passer au suivant.
 * Sans fin (0) : toujours rejouer.
 */
export function rejouerVerset(repetition: RepetitionVerset, ecoutes: number): boolean {
  return repetition === 0 || ecoutes < repetition;
}

/** « 12:05 » pour 725 000 ms : affichage du temps restant. */
export function formatReste(ms: number): string {
  const secondes = Math.ceil(ms / 1000);
  const m = Math.floor(secondes / 60);
  return `${m}:${String(secondes % 60).padStart(2, '0')}`;
}
