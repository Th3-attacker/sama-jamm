import { Platform } from 'react-native';

/**
 * Repère pour la barre d'onglets Android, hors jetons du design (qui la veut mesurée à l'exécution) : hauteur
 * Material 3 par défaut (80 dp : valeur à vérifier dans la documentation officielle). Comparés à la mesure réelle par la sonde de dev.
 */
export const reperesBarre = {
  /** Android : hauteur de la barre Material 3, zone de sécurité du bas en plus. */
  androidMaterial: 80,
} as const;

/** `NativeTabs.BottomAccessory` n'existe que sur iOS 26 et plus. */
export const ACCESSOIRE_NATIF = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;
