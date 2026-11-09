import { useTranslation } from 'react-i18next';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

// Illustration de la planche « Bienvenue · position » : les prières posées sur la course du soleil.
// Dessin décoratif fixe (aucune heure) ; la géométrie est celle de la planche, sur 342 × 170.
export function ArcIllustration() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  return (
    <Svg
      width="100%"
      height={170}
      viewBox="0 0 342 170"
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('bienvenue.arcExemple')}>
      <Line x1={0} y1={120} x2={342} y2={120} stroke={couleurs.ligne} strokeWidth={1.5} />
      <Path d="M 24 120 A 147 96 0 0 1 318 120" fill="none" stroke={couleurs.ligne} strokeWidth={2} />
      <Path d="M 24 120 A 147 96 0 0 1 266 47" fill="none" stroke={couleurs.emeraude} strokeWidth={2.5} strokeLinecap="round" />
      <Path d="M 318 120 Q 171 176 24 120" fill="none" stroke={couleurs.ligneForte} strokeWidth={1.5} strokeDasharray="4 5" />
      <Circle cx={44} cy={131} r={5} fill={couleurs.fond} stroke={couleurs.ligneForte} strokeWidth={1.5} />
      <Circle cx={174} cy={24} r={5} fill={couleurs.emeraude} />
      <Circle cx={285} cy={59} r={5} fill={couleurs.fond} stroke={couleurs.emeraude} strokeWidth={2} />
      <Circle cx={318} cy={120} r={5} fill={couleurs.fond} stroke={couleurs.ligneForte} strokeWidth={1.5} />
      <Circle cx={298} cy={131} r={5} fill={couleurs.fond} stroke={couleurs.ligneForte} strokeWidth={1.5} />
      <Polygon
        points="266,37 268.93,39.93 273.07,39.93 273.07,44.07 276,47 273.07,49.93 273.07,54.07 268.93,54.07 266,57 263.07,54.07 258.93,54.07 258.93,49.93 256,47 258.93,44.07 258.93,39.93 263.07,39.93"
        fill={couleurs.or}
      />
    </Svg>
  );
}
