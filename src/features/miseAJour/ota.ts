// Mises à jour OTA : règle de fréquence des vérifications. Fonction pure, testée.

/** Intervalle minimal entre deux vérifications (évite de solliciter le serveur à chaque retour au premier plan). */
export const INTERVALLE_VERIFICATION_MS = 30 * 60 * 1000;

/** Vrai si une vérification est permise : jamais faite, ou assez ancienne. Une horloge reculée autorise la vérification. */
export function doitVerifier(derniere: number | null, maintenant: number, intervalle = INTERVALLE_VERIFICATION_MS): boolean {
  if (derniere === null) return true;
  const ecoule = maintenant - derniere;
  return ecoule < 0 || ecoule >= intervalle;
}
