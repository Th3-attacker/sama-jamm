import { Pressable, StyleSheet, Text } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type ChipProps = {
  /** Un ou deux mots. */
  children: string;
  selectionne: boolean;
  onPress: () => void;
};

// Filtre ou choix en un geste ; l'état actif change le fond, le contour et le texte.
export function Chip({ children, selectionne, onPress }: ChipProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: selectionne }}
      hitSlop={{ top: 4, bottom: 4 }}
      onPress={onPress}
      style={[
        styles.puce,
        {
          paddingHorizontal: espace.espace3,
          borderRadius: rayon.rayonPuce,
          backgroundColor: selectionne ? couleurs.emeraudeDoux : couleurs.surface,
          borderColor: selectionne ? couleurs.emeraude : couleurs.ligneForte,
        },
      ]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: selectionne ? couleurs.surEmeraudeDoux : couleurs.encre }]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: { minHeight: 40, justifyContent: 'center', borderWidth: 1 },
});
