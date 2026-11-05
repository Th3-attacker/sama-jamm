import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

/** Bas d'écran fixe des dons : l'action principale et une phrase de confiance, au-dessus de la zone système. */
export function PiedDon({ children, note }: { children: ReactNode; note: string }) {
  const { couleurs, espace, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.pied,
        {
          gap: espace.espace2,
          paddingTop: espace.espace3,
          paddingHorizontal: espace.espace5,
          paddingBottom: Math.max(insets.bottom, espace.espace4),
          backgroundColor: couleurs.surface,
          borderTopColor: couleurs.ligne,
        },
      ]}>
      {children}
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
        {note}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pied: { borderTopWidth: StyleSheet.hairlineWidth },
  centre: { textAlign: 'center' },
});
