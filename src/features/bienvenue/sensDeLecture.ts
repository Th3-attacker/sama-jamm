import * as Updates from 'expo-updates';
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

/**
 * Enregistre le sens voulu puis recharge l'app pour qu'il s'applique tout de suite. Renvoie `true` si le
 * rechargement est lancé ; `false` s'il n'était pas nécessaire ou impossible (Expo Go, développement) : l'appelant
 * garde alors l'avertissement « s'applique à la prochaine ouverture ».
 */
export async function appliquerSensEtRecharger(langue: Langue): Promise<boolean> {
  const aChanger = sensChange(langue);
  appliquerSensLecture(langue);
  if (!aChanger) return false;
  try {
    // Laisse au réglage de langue le temps d'être écrit sur le téléphone avant de relancer.
    await new Promise((fin) => setTimeout(fin, 300));
    await Updates.reloadAsync();
    return true;
  } catch {
    return false;
  }
}
