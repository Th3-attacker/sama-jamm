import type { ClasseLargeur } from '@/theme/classesFenetre.ts';

/** Largeur utile (dp) sous laquelle quatre cartes ne tiennent plus sur une ligne (iPad avec barre latérale ouverte). */
export const LARGEUR_QUATRE_COLONNES = 640;

/**
 * Colonnes de la grille de l'Accueil : 2 en classe compacte, 4 dès la moyenne ; texte agrandi à 150 % ou plus :
 * 1 en compacte, 2 sinon, pour qu'aucune carte ne soit tronquée. `largeurUtile` : largeur mesurée de la grille ;
 * quand la barre latérale de l'iPad en prend une part, elle passe à 2 colonnes sous `LARGEUR_QUATRE_COLONNES`.
 */
export function colonnesGrille(largeur: ClasseLargeur, echelleTexte: number, largeurUtile?: number): 1 | 2 | 4 {
  if (echelleTexte >= 1.5) return largeur === 'compacte' ? 1 : 2;
  if (largeur === 'compacte') return 2;
  return largeurUtile !== undefined && largeurUtile < LARGEUR_QUATRE_COLONNES ? 2 : 4;
}
