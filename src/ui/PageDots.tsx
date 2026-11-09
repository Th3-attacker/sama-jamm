import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';

import { themes } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';

export type PageDotsProps = {
  total: number;
  /** Index commençant à 0. */
  actif: number;
  /** Sur fond émeraude (bienvenue, langue) : couleurs du thème jour, le fond ne change pas avec le thème. */
  surEmeraude?: boolean;
};

// Étape des écrans de bienvenue (planches Bienvenue 1 à 3) : trait or de 20×6, autres points de 6×6 en `ligneForte`.
// Ce n'est pas un bouton.
export function PageDots({ total, actif, surEmeraude = false }: PageDotsProps) {
  const { t } = useTranslation();
  const theme = useTheme();
  const { espace, rayon } = theme;
  // Le fond émeraude ne change pas avec le thème : mêmes couleurs que le thème jour.
  const couleurs = surEmeraude ? themes.jour.couleurs : theme.couleurs;

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
            height: 6,
            width: i === actif ? 20 : 6,
            borderRadius: rayon.rayonPastille,
            backgroundColor: i === actif ? couleurs.or : couleurs.ligneForte,
          }}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  points: { flexDirection: 'row', alignItems: 'center' },
});
