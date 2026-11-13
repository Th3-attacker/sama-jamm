// Enchaînement des sourates : en écoute par sourate, la suivante entre dans la file avant la fin de la dernière.
import type { Minuterie } from './minuterie.ts';

/** Nombre de sourates du Coran. */
export const DERNIERE_SOURATE = 114;

type Entree = {
  /** Pistes de la file, dans l'ordre ; seule leur sourate compte ici. */
  pistes: readonly { sourate: number }[];
  /** Piste en cours dans la file. */
  index: number;
  /** « Répéter la sourate » : la file boucle sur elle-même, rien n'est ajouté. */
  repeterSourate: boolean;
  minuterie: Minuterie;
};

/**
 * Numéro de la sourate à ajouter à la file, ou null. On ajoute quand la lecture est sur l'une des deux dernières
 * pistes, sauf avec « Répéter la sourate », avec la minuterie « fin de la sourate » (l'écoute doit s'y arrêter),
 * ou après la sourate 114.
 */
export function sourateSuivante({ pistes, index, repeterSourate, minuterie }: Entree): number | null {
  if (repeterSourate || minuterie.type === 'finSourate') return null;
  const derniere = pistes[pistes.length - 1];
  if (!derniere || derniere.sourate >= DERNIERE_SOURATE) return null;
  return index >= pistes.length - 2 ? derniere.sourate + 1 : null;
}
