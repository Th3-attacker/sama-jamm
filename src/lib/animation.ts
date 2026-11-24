// Durée d'une animation selon le réglage « Réduire les animations » du téléphone : aucune animation quand il est actif.

/** `base` en millisecondes, ou 0 si l'utilisateur a demandé de réduire les animations. */
export function dureeAnimation(base: number, reduit: boolean): number {
  return reduit ? 0 : base;
}
