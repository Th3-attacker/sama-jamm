import { I18nManager } from 'react-native';

import type { Langue } from '@/i18n/langues';

/**
 * Vrai si la langue demande un autre sens de lecture que celui de l'interface en cours.
 * React Native n'inverse la mise en page qu'au lancement suivant : l'app affiche alors un message, sans redémarrer.
 */
export function sensChange(langue: Langue): boolean {
  return (langue === 'ar') !== I18nManager.isRTL;
}

/** Enregistre le sens de lecture voulu ; il prend effet à la prochaine ouverture de l'app. */
export function appliquerSensLecture(langue: Langue): void {
  const rtl = langue === 'ar';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}
