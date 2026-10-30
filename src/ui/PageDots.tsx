import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

export type PageDotsProps = {
  total: number;
  /** Index commençant à 0. */
  actif: number;
};

// Étape des écrans de bienvenue ; ce n'est pas un bouton.
export function PageDots({ total, actif }: PageDotsProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon } = useTheme();

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel={t('bienvenue.etape', { n: actif + 1, total })}
      style={[styles.points, { gap: espace.espace2 }]}>
      {Array.from({ length: total }, (_, i) => (
        <View
          key={i}
          style={{
            height: 8,
            width: i === actif ? 24 : 8,
            borderRadius: rayon.rayonPastille,
            backgroundColor: i === actif ? couleurs.emeraude : i < actif ? couleurs.or : couleurs.ligneForte,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  points: { flexDirection: 'row', alignItems: 'center' },
});
