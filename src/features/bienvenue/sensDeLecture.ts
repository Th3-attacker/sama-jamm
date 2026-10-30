import * as Updates from 'expo-updates';
import { I18nManager } from 'react-native';

import type { Langue } from '@/i18n/langues';

/** Vrai si la langue demande un autre sens de lecture que celui de l'interface actuelle. */
export function demandeRedemarrage(langue: Langue): boolean {
  return (langue === 'ar') !== I18nManager.isRTL;
}

/**
 * Applique le sens de lecture puis redémarre l'app.
 * Renvoie false si le redémarrage automatique est impossible : l'utilisateur doit rouvrir l'app.
 */
export async function appliquerSensEtRedemarrer(langue: Langue): Promise<boolean> {
  const rtl = langue === 'ar';
  I18nManager.allowRTL(rtl);
  I18nManager.forceRTL(rtl);

  // En développement (Expo Go, build de dev), recharger le code ne change pas le sens de lecture :
  // il faut fermer et rouvrir l'app.
  if (__DEV__) return false;
  try {
    await Updates.reloadAsync();
    return true;
  } catch (erreur: unknown) {
    // expo-updates n'est pas encore configuré (étape Publication) : redémarrage manuel.
    console.warn('Redémarrage automatique impossible', erreur);
    return false;
  }
}
