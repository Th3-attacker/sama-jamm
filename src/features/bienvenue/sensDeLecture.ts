import { I18nManager } from 'react-native';

import type { Langue } from '@/i18n/langues';

/**
 * Enregistre le sens de lecture pour le prochain lancement de l'app : la mise en page native (barre d'onglets, geste de
 * retour) le prend alors du système. Pendant la session, le sens du contenu suit la langue (i18n) par le style
 * `direction` posé à la racine : aucun rechargement.
 */
export function appliquerSensLecture(langue: Langue): void {
  const rtl = langue === 'ar';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);
}
