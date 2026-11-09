import { Pressable, StyleSheet, Text } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type ChipProps = {
  /** Un ou deux mots. */
  children: string;
  selectionne: boolean;
  onPress: () => void;
  /** Puce ronde de 44 : actif en émeraude plein (planche « Invocations · moment »). */
  pilule?: boolean;
  /** Puce de 36 (filtres de la recherche) : texte actif en émeraude. */
  compacte?: boolean;
  /** Nombre d'éléments derrière le filtre : « Versets 8 » (planche « Favoris »). */
  compte?: number;
};

// Filtre ou choix en un geste ; l'état actif change le fond, le contour et le texte.
export function Chip({ children, selectionne, onPress, pilule = false, compacte = false, compte }: ChipProps) {
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
          borderRadius: pilule ? rayon.rayonPastille : rayon.rayonPuce,
          backgroundColor: selectionne ? (pilule ? couleurs.emeraude : couleurs.emeraudeDoux) : couleurs.surface,
          borderColor: selectionne ? couleurs.emeraude : couleurs.ligneForte,
        },
        pilule ? styles.pilule : null,
        compacte ? styles.compacte : null,
        pilule ? { paddingHorizontal: espace.espace4 } : null,
      ]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: selectionne ? (pilule ? couleurs.surEmeraude : compacte ? couleurs.emeraude : couleurs.surEmeraudeDoux) : couleurs.encre }]}>
        {compte === undefined ? children : `${children} ${compte}`}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: { minHeight: 40, justifyContent: 'center', borderWidth: 1 },
  pilule: { minHeight: 44 },
  compacte: { minHeight: 36 },
});
