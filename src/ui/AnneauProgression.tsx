import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { cible, tailles } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { pourcentage } from './anneau';

export type AnneauProgressionProps = {
  /** 0 à 1. */
  part: number;
  /** Lu par les lecteurs d'écran : « Téléchargement, 45 % ». */
  label: string;
};

const DIAMETRE = 36;
const TRAIT = 3;

/** Cercle de progression avec le pourcentage au centre (téléchargements). Zone de 44 × 44, sans action. */
export function AnneauProgression({ part, label }: AnneauProgressionProps) {
  const { couleurs, typographie } = useTheme();
  const pct = pourcentage(part);
  const rayon = (DIAMETRE - TRAIT) / 2;
  const circonference = 2 * Math.PI * rayon;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: pct }}
      style={[styles.zone, { width: cible.cibleIos, height: cible.cibleIos }]}>
      <Svg width={DIAMETRE} height={DIAMETRE} viewBox={`0 0 ${DIAMETRE} ${DIAMETRE}`} style={styles.arc}>
        <Circle cx={DIAMETRE / 2} cy={DIAMETRE / 2} r={rayon} stroke={couleurs.ligneForte} strokeWidth={TRAIT} fill="none" />
        <Circle
          cx={DIAMETRE / 2}
          cy={DIAMETRE / 2}
          r={rayon}
          stroke={couleurs.emeraude}
          strokeWidth={TRAIT}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circonference}`}
          strokeDashoffset={circonference * (1 - pct / 100)}
        />
      </Svg>
      <Text
        allowFontScaling={false}
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.legende, styles.texte, { color: couleurs.encre, fontSize: tailles.t12 }]}>
        {pct}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { alignItems: 'center', justifyContent: 'center' },
  // L'arc part du haut : on tourne le cercle SVG d'un quart de tour.
  arc: { position: 'absolute', transform: [{ rotate: '-90deg' }] },
  texte: { textAlign: 'center' },
});
