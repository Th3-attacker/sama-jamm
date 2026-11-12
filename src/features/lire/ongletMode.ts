// Onglets de la bibliothèque : chaque mode (Lire, Écouter) n'en montre que certains.

export type ModeBibliotheque = 'lire' | 'ecouter';
export type OngletBibliotheque = 'coran' | 'recitateurs' | 'invocations';

const ONGLETS: Record<ModeBibliotheque, readonly OngletBibliotheque[]> = {
  lire: ['coran', 'invocations'],
  ecouter: ['coran', 'recitateurs'],
};

/** Onglet à afficher après un changement de mode : le même s'il existe dans ce mode, sinon le Coran. */
export function ongletPourMode(mode: ModeBibliotheque, onglet: OngletBibliotheque): OngletBibliotheque {
  return ONGLETS[mode].includes(onglet) ? onglet : 'coran';
}
