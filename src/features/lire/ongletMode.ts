// Onglets de la bibliothèque : chaque mode (Lire, Écouter) n'en montre que certains.

export type ModeBibliotheque = 'lire' | 'ecouter';
export type OngletBibliotheque = 'coran' | 'recitateurs' | 'invocations';

/**
 * Onglet à afficher après un changement de mode. Écouter s'ouvre toujours sur les récitants ; Lire garde son onglet
 * (Coran ou Invocations), et revient au Coran si on y arrive depuis les récitants.
 */
export function ongletPourMode(mode: ModeBibliotheque, onglet: OngletBibliotheque): OngletBibliotheque {
  if (mode === 'ecouter') return 'recitateurs';
  return onglet === 'recitateurs' ? 'coran' : onglet;
}
