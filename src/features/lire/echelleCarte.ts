// Carte de partage d'un verset : réduction de la taille du texte quand il ne tient pas dans la carte.
// Le texte n'est jamais tronqué ni abrégé (contenu sacré) : il devient seulement plus petit.

/** Taille la plus petite admise, en part de la taille d'origine. */
export const PLANCHER = 0.35;

/**
 * Échelle suivante du texte pour que `contenu` (hauteur mesurée) tienne dans `disponible`.
 * Renvoie `echelle` inchangée quand ça tient (ou quand les mesures ne sont pas encore connues), sinon une échelle
 * plus petite, jamais en dessous du plancher. La hauteur du texte varie à peu près comme sa taille : on réduit
 * du rapport des hauteurs, avec une petite marge pour que la mesure suivante tienne.
 */
export function echelleSuivante(contenu: number, disponible: number, echelle: number): number {
  if (!(contenu > 0) || !(disponible > 0) || !(echelle > 0)) return echelle;
  if (contenu <= disponible) return echelle;
  return Math.max(PLANCHER, echelle * Math.min(0.95, (disponible / contenu) * 0.97));
}
