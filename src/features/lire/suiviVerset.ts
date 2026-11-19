// Suivi du verset récité en lecture verset par verset : la liste ne bouge que si le verset récité n'est plus visible,
// et pas pendant que le lecteur défile lui-même. Chaque verset est un fichier audio : on suit de verset en verset
// (pas d'horaire par verset). Fonction pure.

/** Pause du suivi après le dernier geste du lecteur sur la liste, en ms. */
export const PAUSE_SUIVI_MS = 8000;

export type EntreeSuivi = {
  /** Verset en cours de récitation dans cette sourate, ou null. */
  recite: number | null;
  /** Premier et dernier versets visibles (au moins à moitié), ou null si la liste n'a rien mesuré. */
  plage: { premier: number; dernier: number } | null;
  /** Instant du dernier geste du lecteur sur la liste (ms), 0 s'il n'y en a pas eu. */
  dernierGeste: number;
  maintenant: number;
};

/** Verset vers lequel faire défiler, ou null : verset visible, pause en cours, rien à suivre ou plage inconnue. */
export function versetASuivre({ recite, plage, dernierGeste, maintenant }: EntreeSuivi): number | null {
  if (recite === null || plage === null) return null;
  if (maintenant - dernierGeste < PAUSE_SUIVI_MS) return null;
  return recite < plage.premier || recite > plage.dernier ? recite : null;
}
