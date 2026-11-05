// Sagesse du jour de l'Accueil (« Wax ju rafet ») : un proverbe wolof par jour, le même toute la journée.

/** Clés `formules.<cle>` (proverbe) et `formules.<cle>Trad` (traduction). */
export const PROVERBES = ['regularite', 'entraide', 'partage', 'effort'] as const;
export type Proverbe = (typeof PROVERBES)[number];

/** Proverbe du jour local : il change à minuit et tourne sur la liste. */
export function proverbeDuJour(date: Date): Proverbe {
  const jour = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000);
  return PROVERBES[jour % PROVERBES.length] ?? 'regularite';
}
