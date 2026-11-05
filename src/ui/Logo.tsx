// Marque Sama Jàmm (étoile du hizb et livre ouvert) : émeraude en mode clair, ivoire en mode sombre.
import { Image, useColorScheme } from 'react-native';

import marqueSombre from '../../assets/images/splash-icon-dark.png';
import marqueClaire from '../../assets/images/splash-icon.png';

import { useTheme } from '@/theme/useTheme';

export type LogoProps = {
  taille: number;
  /**
   * `theme` (par défaut) : suit le thème choisi dans l'app.
   * `telephone` : suit le mode du téléphone, comme le démarrage natif (démarrage animé).
   */
  selon?: 'theme' | 'telephone';
};

export function Logo({ taille, selon = 'theme' }: LogoProps) {
  const { nom } = useTheme();
  const telephoneSombre = useColorScheme() === 'dark';
  const sombre = selon === 'telephone' ? telephoneSombre : nom !== 'jour';
  return (
    <Image
      source={sombre ? marqueSombre : marqueClaire}
      accessibilityRole="image"
      accessibilityLabel="Sama Jàmm"
      style={{ width: taille, height: taille }}
      resizeMode="contain"
    />
  );
}
