/** Classes de taille de fenêtre (Google, « Window size classes »). Fonctions pures, sans React Native. */

export type ClasseLargeur = 'compacte' | 'moyenne' | 'etendue' | 'grande' | 'tresGrande';
export type ClasseHauteur = 'compacte' | 'moyenne' | 'etendue';

/** Largeur en dp : < 600 compacte, 600–839 moyenne, 840–1199 étendue, 1200–1599 grande, ≥ 1600 très grande. */
export function classeLargeur(largeur: number): ClasseLargeur {
  if (largeur < 600) return 'compacte';
  if (largeur < 840) return 'moyenne';
  if (largeur < 1200) return 'etendue';
  if (largeur < 1600) return 'grande';
  return 'tresGrande';
}

/** Hauteur en dp : < 480 compacte, 480–899 moyenne, ≥ 900 étendue. */
export function classeHauteur(hauteur: number): ClasseHauteur {
  if (hauteur < 480) return 'compacte';
  if (hauteur < 900) return 'moyenne';
  return 'etendue';
}
