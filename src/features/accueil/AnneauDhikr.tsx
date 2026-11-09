import { StyleSheet, View } from 'react-native';
import Svg, { Circle, Text as SvgTexte } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';

type Props = { compte: number; objectif: number };

const R = 21;
const TOUR = 2 * Math.PI * R;

/** Anneau de 52 de la carte Dhikr (planche) : l'avancée vers l'objectif, le compte au centre. */
export function AnneauDhikr({ compte, objectif }: Props) {
  const { couleurs } = useTheme();
  const part = objectif > 0 ? Math.min(1, compte / objectif) : 0;
  return (
    <View style={styles.anneau} accessible={false} importantForAccessibility="no-hide-descendants">
      <Svg width={52} height={52} viewBox="0 0 52 52">
        <Circle cx={26} cy={26} r={R} fill="none" stroke={couleurs.surfaceCreux} strokeWidth={5} />
        <Circle
          cx={26}
          cy={26}
          r={R}
          fill="none"
          stroke={couleurs.or}
          strokeWidth={5}
          strokeLinecap="round"
          strokeDasharray={TOUR}
          strokeDashoffset={TOUR * (1 - part)}
          transform="rotate(-90 26 26)"
        />
        <SvgTexte x={26} y={31} textAnchor="middle" fontSize={14} fill={couleurs.encre} fontFamily="SourceSans3_600SemiBold">
          {String(compte)}
        </SvgTexte>
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  anneau: { width: 52, height: 52 },
});
