import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import type { IconName } from '@/ui/types';

type Props = {
  icone: IconName;
  titre: string;
  /** Valeur courante à droite : « 12 », « 240 Mo ». */
  valeur?: string;
  /** Première ligne de la carte : pas de filet au-dessus. */
  premiere?: boolean;
  onPress: () => void;
};

/** Ligne de la carte de l'onglet Plus (planche) : pastille neutre de 32, titre, valeur, chevron. */
export function LigneHub({ icone, titre, valeur, premiere = false, onPress }: Props) {
  const { couleurs, espace, typographie } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={valeur ? `${titre}, ${valeur}` : titre}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.ligne,
        {
          gap: espace.espace3,
          paddingHorizontal: espace.espace4,
          borderTopWidth: premiere ? 0 : 1,
          borderTopColor: couleurs.ligne,
          backgroundColor: pressed ? couleurs.surfaceCreux : 'transparent',
        },
      ]}>
      <View style={[styles.pastille, { backgroundColor: couleurs.surfaceCreux }]}>
        <Icon name={icone} size={18} color={couleurs.encre2} />
      </View>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.titre, { color: couleurs.encre }]}>
        {titre}
      </Text>
      {valeur ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.valeur, { color: couleurs.encre3 }]}>
          {valeur}
        </Text>
      ) : null}
      <Icon name="chevron-right" size={18} color={couleurs.encre3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  pastille: { width: 32, height: 32, borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  titre: { flex: 1 },
  valeur: { fontSize: 14, lineHeight: 20 },
});
