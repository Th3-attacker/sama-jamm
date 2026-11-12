// Géométrie de l'arc du jour (design system, bundle.js) : fonctions pures, sans React Native.

export const W = 342;
export const HZ = 104;
export const X0 = 24;
export const X1 = 318;
export const CX = 171;
export const RX = 147;
export const RY = 84;
export const NUIT_Y = 146;

/** Hauteur de la zone de dessin : la courbe de nuit et les points de Fajr et d'Isha y tiennent entièrement. */
export const HAUTEUR_VUE = 132;
/** Largeur maximale de l'arc sur un grand écran : au-delà il garde ses proportions, centré. */
export const LARGEUR_MAX = 480;

/** Point le plus bas de la courbe de nuit (courbe de Bézier quadratique, au milieu du tracé). */
export const yBasNuit = (): number => 0.25 * HZ + 0.5 * NUIT_Y + 0.25 * HZ;
