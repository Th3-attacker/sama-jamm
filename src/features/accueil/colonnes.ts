import type { ClasseLargeur } from '@/theme/classesFenetre.ts';

/**
 * Colonnes de la grille de l'Accueil : 2 en classe compacte, 4 dès la moyenne ; texte agrandi à 150 % ou plus :
 * 1 en compacte, 2 sinon, pour qu'aucune carte ne soit tronquée.
 */
export function colonnesGrille(largeur: ClasseLargeur, echelleTexte: number): 1 | 2 | 4 {
  if (echelleTexte >= 1.5) return largeur === 'compacte' ? 1 : 2;
  return largeur === 'compacte' ? 2 : 4;
}
