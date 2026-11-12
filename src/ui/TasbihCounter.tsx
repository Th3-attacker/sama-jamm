import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { chiffresAffiches } from '@/lib/chiffres';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type TasbihCounterProps = {
  compte: number;
  /** null : sans objectif, l'anneau reste vide. */
  objectif: number | null;
  onCompter: () => void;
};

const TAILLE = 248;
const RAYON = 110;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

// Le grand grain : toute la pastille est la zone tactile, un toucher = un grain.
export function TasbihCounter({ compte, objectif, onCompter }: TasbihCounterProps) {
  const { t } = useTranslation();
  const { couleurs, ombres, typographie } = useTheme();
  const fini = objectif !== null && compte >= objectif;
  const part = objectif ? Math.min(compte / objectif, 1) : 0;
  const libelle = objectif
    ? t('dhikr.compter', { n: compte, objectif })
    : String(compte);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={fini ? t('dhikr.objectifAtteint') : undefined}
      onPress={onCompter}
      style={({ pressed }) => [
        styles.grain,
        { backgroundColor: couleurs.surface, opacity: pressed ? 0.9 : 1 },
        ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : { borderWidth: 1, borderColor: couleurs.ligne },
      ]}>
      <Svg width={TAILLE} height={TAILLE} viewBox={`0 0 ${TAILLE} ${TAILLE}`} style={StyleSheet.absoluteFill}>
        <Circle cx={TAILLE / 2} cy={TAILLE / 2} r={RAYON} fill="none" stroke={couleurs.surfaceCreux} strokeWidth={10} />
        {part > 0 ? (
          <Circle
            cx={TAILLE / 2}
            cy={TAILLE / 2}
            r={RAYON}
            fill="none"
            stroke={fini ? couleurs.emeraude : couleurs.or}
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray={`${CIRCONFERENCE} ${CIRCONFERENCE}`}
            strokeDashoffset={CIRCONFERENCE * (1 - part)}
            rotation={-90}
            origin={`${TAILLE / 2}, ${TAILLE / 2}`}
          />
        ) : null}
      </Svg>
      <Text accessibilityLiveRegion="polite" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, styles.compte, { color: couleurs.encre }]}>
        {chiffresAffiches(String(compte))}
      </Text>
      {objectif ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { fontFamily: 'SourceSans3_400Regular', color: couleurs.encre3 }]}>
          {fini ? t('dhikr.objectifAtteint') : t('dhikr.sur', { objectif })}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  grain: { width: TAILLE, height: TAILLE, borderRadius: TAILLE / 2, alignItems: 'center', justifyContent: 'center' },
  compte: { fontSize: tailles.t56, lineHeight: interlignes.l60 },
});
