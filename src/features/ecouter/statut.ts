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

/**
 * Vrai si ce statut prouve que la piste en cours a été chargée ou est en train d'être lue.
 * Un fichier injoignable n'atteint aucun de ces deux états.
 */
export function pisteSaine(statut: unknown): boolean {
  if (typeof statut !== 'object' || statut === null) return false;
  if ('isLoaded' in statut && statut.isLoaded === true) return true;
  if (!('playing' in statut) || statut.playing !== true || !('currentTime' in statut)) return false;
  const temps: unknown = statut.currentTime;
  return typeof temps === 'number' && temps > 0;
}

type Passage = {
  previousIndex: number;
  currentIndex: number;
  /** Index visé par un saut demandé (suivant, précédent, nouvelle écoute), ou null. */
  sautVers: number | null;
  /** La piste quittée a été chargée ou lue (`pisteSaine`). */
  saine: boolean;
};

/**
 * Passage à la piste suivante sans que la piste quittée ait été chargée ni lue. Sur iPhone, la file native saute
 * sans erreur un fichier injoignable : ce n'est pas la fin d'un verset mais un échec de chargement.
 */
export function sauteSansLecture({ previousIndex, currentIndex, sautVers, saine }: Passage): boolean {
  return !saine && sautVers !== currentIndex && currentIndex === previousIndex + 1;
}
