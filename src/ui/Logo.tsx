// Marque Sama Jàmm (étoile du hizb et livre ouvert) : émeraude en mode clair, ivoire en mode sombre dans l'app,
// or sur le démarrage sombre (même image que le démarrage natif).
import { Image, useColorScheme } from 'react-native';

import marqueIvoire from '../../assets/images/marque-ivoire.png';
import marqueOr from '../../assets/images/splash-icon-dark.png';
import marqueClaire from '../../assets/images/splash-icon.png';

import { useTheme } from '@/theme/useTheme';

export type LogoProps = {
  taille: number;
  /**
   * `theme` (par défaut) : suit le thème choisi dans l'app.
   * `telephone` : suit le mode du téléphone, comme le démarrage natif (démarrage animé).
   */
  selon?: 'theme' | 'telephone';
  /** `or` : marque or fixe, pour un fond émeraude (bienvenue). */
  variante?: 'or';
};

export function Logo({ taille, selon = 'theme', variante }: LogoProps) {
  const { nom } = useTheme();
  const telephoneSombre = useColorScheme() === 'dark';
  const sombre = selon === 'telephone' ? telephoneSombre : nom !== 'jour';
  return (
    <Image
      source={variante === 'or' ? marqueOr : sombre ? (selon === 'telephone' ? marqueOr : marqueIvoire) : marqueClaire}
      accessibilityRole="image"
      accessibilityLabel="Sama Jàmm"
      style={{ width: taille, height: taille }}
      resizeMode="contain"
    />
  );
}
