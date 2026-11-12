// Ouverture de la lecture sur un verset (ex. début d'un juz) : la liste ne connaît pas la hauteur des versets
// loin du début, donc le défilement est rattrapé en quelques essais plutôt qu'en un seul.

/** Nombre d'essais avant d'abandonner et d'afficher la liste là où elle est. */
export const ESSAIS_MAX = 8;
/** Délai entre deux essais, en ms : le temps que la liste mesure les versets rendus. */
export const DELAI_ESSAI_MS = 60;
/** Durée maximale du chargement, en ms : au-delà, la liste s'affiche là où elle est, jamais de blocage. */
export const DUREE_MAX_MS = 1200;
/** Durée minimale d'affichage du chargement, en ms : assez longue pour être vu, même si la liste est prête avant. */
export const DUREE_MIN_MS = 350;

/** Délai restant avant de pouvoir masquer le chargement, d'après le temps déjà écoulé depuis son affichage. */
export function resteAvantMasquage(ecoule: number): number {
  return Math.max(0, DUREE_MIN_MS - Math.max(0, ecoule));
}

/** Délai sans échec signalé après lequel le positionnement est considéré réussi, en ms. */
export const DELAI_SUCCES_MS = 150;

/** Suite après un échec de défilement : réessayer (et dans combien de temps) ou s'arrêter. */
export function apresEchec(essai: number): { reessayer: boolean; delai: number } {
  return essai >= ESSAIS_MAX ? { reessayer: false, delai: 0 } : { reessayer: true, delai: DELAI_ESSAI_MS };
}

/** Position estimée du verset `index` (hauteur moyenne mesurée), jamais négative, pour s'en approcher avant de réessayer. */
export function decalageEstime(index: number, hauteurMoyenne: number): number {
  if (!(index > 0) || !(hauteurMoyenne > 0)) return 0;
  return Math.round(index * hauteurMoyenne);
}
