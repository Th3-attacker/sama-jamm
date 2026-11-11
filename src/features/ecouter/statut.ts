// Lecture du statut natif de la liste de lecture (expo-audio) : règles pures.

/**
 * Message d'erreur porté par un statut de la liste, ou null.
 * Android envoie un champ `error` ({ message, code }) quand un fichier ne se charge pas ; il n'est pas déclaré dans
 * le type `AudioPlaylistStatus`, d'où la lecture d'une valeur inconnue.
 */
export function erreurDuStatut(statut: unknown): string | null {
  if (typeof statut !== 'object' || statut === null || !('error' in statut)) return null;
  const erreur: unknown = statut.error;
  if (erreur === null || erreur === undefined || erreur === false) return null;
  if (typeof erreur === 'string') return erreur || 'Erreur de lecture';
  if (typeof erreur === 'object' && 'message' in erreur && typeof erreur.message === 'string' && erreur.message) {
    return erreur.message;
  }
  return 'Erreur de lecture';
}

/** Index de piste fourni par le statut s'il est valide, sinon `parDefaut`. */
export function indexDuStatut(statut: unknown, parDefaut: number): number {
  if (typeof statut !== 'object' || statut === null || !('currentIndex' in statut)) return parDefaut;
  const index: unknown = statut.currentIndex;
  return typeof index === 'number' && Number.isInteger(index) && index >= 0 ? index : parDefaut;
}
