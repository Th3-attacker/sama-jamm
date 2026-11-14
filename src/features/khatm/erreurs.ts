// Lecture des erreurs renvoyées par les fonctions serveur du khatm. Pur : testable sans Supabase.

/** Message exact levé par `noter_tentative_code` (migration 010) au-delà de 30 essais de code par heure. */
export const MESSAGE_TROP_DE_TENTATIVES = 'trop de tentatives, réessayez plus tard';

/**
 * Vrai si l'erreur vient de la limite d'essais de code. Le code P0001 seul ne suffit pas : c'est aussi celui
 * de « non connecté » ; le message seul non plus, d'où les deux contrôles.
 */
export function estTropDeTentatives(erreur: unknown): boolean {
  if (typeof erreur !== 'object' || erreur === null) return false;
  const code = 'code' in erreur ? erreur.code : undefined;
  const message = 'message' in erreur ? erreur.message : undefined;
  return code === 'P0001' && typeof message === 'string' && message.trim() === MESSAGE_TROP_DE_TENTATIVES;
}
