import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

type Props = {
  /** 0 à 1. */
  valeur: number;
  ton: 'or' | 'emeraude';
  /** Lu par les lecteurs d'écran, avec la valeur en mots. */
  label: string;
  detail: string;
};

/** Filet de 3 collé en bas d'une carte de l'Accueil (planche) : la valeur est écrite dans la carte. */
export function FiletProgres({ valeur, ton, label, detail }: Props) {
  const { couleurs } = useTheme();
  const borne = Number.isFinite(valeur) ? Math.min(1, Math.max(0, valeur)) : 0;
  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(borne * 100), text: detail }}
      style={[styles.piste, { backgroundColor: couleurs.surfaceCreux }]}>
      <View style={[styles.rempli, { width: `${borne * 100}%`, backgroundColor: ton === 'or' ? couleurs.or : couleurs.emeraudeAplat }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { height: 3, borderRadius: 999, overflow: 'hidden' },
  rempli: { height: 3, borderRadius: 999 },
});
