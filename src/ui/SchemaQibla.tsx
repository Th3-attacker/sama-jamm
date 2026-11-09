import { useTranslation } from 'react-i18next';
import Svg, { Circle, Path, Polygon, Text as SvgText } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

export type SchemaQiblaProps = {
  /** Relèvement de la qibla en degrés depuis le nord (0 à 360). */
  qibla: number;
  /** Description pour les lecteurs d'écran. */
  description: string;
};

const C = 110;

function etoile(cx: number, cy: number, R: number): string {
  const r = (R * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, k) => {
    const a = ((-90 + k * 22.5) * Math.PI) / 180;
    const rad = k % 2 === 0 ? R : r;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

/** Point à `rayon` du centre, à `degres` du nord (sens des aiguilles d'une montre). */
function point(degres: number, rayon: number): [number, number] {
  const a = (degres * Math.PI) / 180;
  return [C + rayon * Math.sin(a), C - rayon * Math.cos(a)];
}

/** Schéma fixe de la planche « Qibla sans boussole » : le nord, la direction de la qibla et l'arc qui les relie. */
export function SchemaQibla({ qibla, description }: SchemaQiblaProps) {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const degres = ((qibla % 360) + 360) % 360;
  // L'arc prend le côté court : à droite jusqu'à 180°, à gauche au-delà.
  const droite = degres <= 180;
  const [ax, ay] = point(degres, 80);
  const [sx, sy] = point(degres, 89);

  return (
    <Svg width={220} height={220} viewBox="0 0 220 220" accessible accessibilityRole="image" accessibilityLabel={description}>
      <Circle cx={C} cy={C} r={100} fill={couleurs.surface} stroke={couleurs.ligne} strokeWidth={1.5} />
      <Path d="M110 110 L110 22" stroke={couleurs.encre2} strokeWidth={2} strokeLinecap="round" />
      <Polygon points="110,12 104,24 116,24" fill={couleurs.encre2} />
      <SvgText x={C} y={44} fontSize={13} fontFamily="SourceSans3_600SemiBold" fill={couleurs.encre2} textAnchor="middle">
        {t('qibla.nord')}
      </SvgText>
      <Path
        d={`M110 30 A 80 80 0 0 ${droite ? 1 : 0} ${ax.toFixed(1)} ${ay.toFixed(1)}`}
        fill="none"
        stroke={couleurs.or}
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <Path d={`M110 110 L${sx.toFixed(1)} ${sy.toFixed(1)}`} stroke={couleurs.emeraude} strokeWidth={2.5} strokeLinecap="round" />
      <Polygon points={etoile(sx, sy, 12)} fill={couleurs.or} stroke={couleurs.orTexte} strokeWidth={1} />
      <Circle cx={C} cy={C} r={5} fill={couleurs.emeraude} />
    </Svg>
  );
}
