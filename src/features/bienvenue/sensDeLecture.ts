import * as Updates from 'expo-updates';
import { DevSettings, I18nManager } from 'react-native';

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

  if (__DEV__) {
    DevSettings.reload();
    return true;
  }
  try {
    await Updates.reloadAsync();
    return true;
  } catch (erreur: unknown) {
    // expo-updates n'est pas encore configuré (étape Publication) : redémarrage manuel.
    console.warn('Redémarrage automatique impossible', erreur);
    return false;
  }
}
