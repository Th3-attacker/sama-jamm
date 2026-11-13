export const langues = ['fr', 'en', 'wo', 'ar'] as const;
export type Langue = (typeof langues)[number];

export function estLangue(code: string | null | undefined): code is Langue {
  return langues.some((l) => l === code);
}

/**
 * Langues que l'on peut choisir. Le wolof reste chargé pour les formules de la marque, mais n'est pas proposé
 * tant que sa traduction n'est pas complète et relue (voir `_meta` dans `wo.json`).
 */
export const languesProposees = ['fr', 'en', 'ar'] as const satisfies readonly Langue[];
export type LangueProposee = (typeof languesProposees)[number];

export function estLangueProposee(code: string | null | undefined): code is LangueProposee {
  return languesProposees.some((l) => l === code);
}
