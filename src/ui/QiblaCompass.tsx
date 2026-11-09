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
  /** Phrase d'instruction sous la consigne (planche) : « Tournez le téléphone jusqu'à… ». */
  texte?: string;
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

// Planche « Qibla » : une graduation tous les 30°.
const GRADUATIONS = Array.from({ length: 12 }, (_, i) => i * 30);

// Le repère du haut suit l'axe du téléphone, le cadran tourne, l'étoile (la Kaaba) reste à son relèvement.
export function QiblaCompass({ cap, qibla, tolerance = 3, lieu, texte }: QiblaCompassProps) {
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
    <View style={[styles.boussole, { gap: espace.espace3 }]}>
      <Text
        accessibilityLiveRegion="polite"
        maxFontSizeMultiplier={echelleMax.grand}
        style={[typographie.titre1, styles.centre, { color: couleurs.emeraude, marginTop: espace.espace2 }]}>
        {consigne}
      </Text>
      {texte ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.centre, { color: couleurs.encre2 }]}>
          {texte}
        </Text>
      ) : null}
      <View accessible accessibilityRole="image" accessibilityLabel={`${consigne}. ${detail}`} style={[styles.cadran, { marginTop: espace.espace4 }]}>
        <Svg width="100%" height="100%" viewBox="0 0 300 300">
          <Circle cx={150} cy={150} r={140} fill={aligne ? couleurs.emeraudeDoux : couleurs.surface} stroke={aligne ? couleurs.emeraude : couleurs.ligne} strokeWidth={aligne ? 3 : 1.5} />
          <Circle cx={150} cy={150} r={108} fill="none" stroke={couleurs.surfaceCreux} strokeWidth={1} />
          <G rotation={-cap} origin="150, 150">
            {GRADUATIONS.map((d) => (
              <Line key={d} x1={150} y1={14} x2={150} y2={26} stroke={couleurs.ligneForte} strokeWidth={1.5} strokeLinecap="round" rotation={d} origin="150, 150" />
            ))}
            <SvgText x={150} y={48} fontSize={13} fontFamily="SourceSans3_600SemiBold" fill={couleurs.encre2} textAnchor="middle">
              {t('qibla.nord')}
            </SvgText>
            <G rotation={qibla} origin="150, 150">
              <Line x1={150} y1={150} x2={150} y2={20} stroke={couleurs.or} strokeWidth={2} strokeDasharray="5 5" />
              <Polygon points={etoile(150, 20, 14)} fill={couleurs.or} stroke={couleurs.orTexte} strokeWidth={1} />
            </G>
          </G>
          <Polygon points="150,2 144,14 156,14" fill={couleurs.emeraude} />
          <Circle cx={150} cy={150} r={6} fill={couleurs.emeraude} />
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
  cadran: { width: '100%', maxWidth: 300, aspectRatio: 1 },
  centre: { textAlign: 'center' },
  chiffres: { fontVariant: ['tabular-nums'] },
});
