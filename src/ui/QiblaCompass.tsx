import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type QiblaCompassProps = {
  /** Cap du téléphone en degrés depuis le nord. */
  cap: number;
  /** Relèvement de la Kaaba en degrés depuis le nord. */
  qibla: number;
  tolerance?: number;
  lieu: string;
};

/** Écart signé vers la qibla : positif à droite, négatif à gauche. */
export function ecartQibla(cap: number, qibla: number): number {
  const rel = (((qibla - cap) % 360) + 360) % 360;
  return rel <= 180 ? rel : rel - 360;
}

function etoile(cx: number, cy: number, R: number): string {
  const r = (R * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, k) => {
    const a = ((-90 + k * 22.5) * Math.PI) / 180;
    const rad = k % 2 === 0 ? R : r;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

const GRADUATIONS = Array.from({ length: 36 }, (_, i) => i * 10);

// Le repère du haut suit l'axe du téléphone, le cadran tourne, l'étoile (la Kaaba) reste à son relèvement.
export function QiblaCompass({ cap, qibla, tolerance = 3, lieu }: QiblaCompassProps) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const ecart = ecartQibla(cap, qibla);
  const absolu = Math.abs(ecart);
  const aligne = absolu <= tolerance;
  const droite = ecart > 0;

  const consigne = aligne
    ? t('qibla.face')
    : absolu < 30
      ? t(droite ? 'qibla.encoreDroite' : 'qibla.encoreGauche')
      : t(droite ? 'qibla.tournerDroite' : 'qibla.tournerGauche');
  const detail = [t('qibla.degres', { degres: Math.round(qibla), ville: lieu }), aligne ? null : t('qibla.ecart', { degres: Math.round(absolu) })]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={[styles.boussole, { gap: espace.espace4 }]}>
      <Text
        accessibilityLiveRegion="polite"
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.titre2, styles.centre, { color: aligne ? couleurs.emeraude : couleurs.encre }]}>
        {consigne}
      </Text>
      <View accessible accessibilityRole="image" accessibilityLabel={`${consigne}. ${detail}`} style={styles.cadran}>
        <Svg width="100%" height="100%" viewBox="0 0 240 240">
          <Circle cx={120} cy={120} r={108} fill={aligne ? couleurs.emeraudeDoux : couleurs.surface} stroke={aligne ? couleurs.emeraude : couleurs.ligneForte} strokeWidth={aligne ? 3 : 1.5} />
          <G rotation={-cap} origin="120, 120">
            {GRADUATIONS.map((d) => (
              <Line
                key={d}
                x1={120}
                y1={18}
                x2={120}
                y2={d % 90 === 0 ? 30 : 24}
                stroke={d % 90 === 0 ? couleurs.encre2 : couleurs.ligneForte}
                strokeWidth={d % 90 === 0 ? 2 : 1}
                rotation={d}
                origin="120, 120"
              />
            ))}
            <SvgText x={120} y={48} fontSize={14} fontFamily="SourceSans3_600SemiBold" fill={couleurs.encre2} textAnchor="middle">
              {t('qibla.nord')}
            </SvgText>
            <G rotation={qibla} origin="120, 120">
              <Line x1={120} y1={120} x2={120} y2={44} stroke={couleurs.or} strokeWidth={2} strokeLinecap="round" />
              <Polygon points={etoile(120, 36, 13)} fill={couleurs.or} />
            </G>
          </G>
          <Polygon points="120,1 114,11 126,11" fill={couleurs.emeraude} />
          <Circle cx={120} cy={120} r={6} fill={couleurs.emeraude} />
        </Svg>
      </View>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.centre, styles.chiffres, { color: couleurs.encre3 }]}>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  boussole: { alignItems: 'center' },
  cadran: { width: '100%', maxWidth: 320, aspectRatio: 1 },
  centre: { textAlign: 'center' },
  chiffres: { fontVariant: ['tabular-nums'] },
});
