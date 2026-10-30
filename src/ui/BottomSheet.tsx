import { BottomSheet as FeuilleNative } from '@expo/ui';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from './IconButton';

export type BottomSheetProps = {
  ouvert: boolean;
  titre: string;
  /** Appelé au glissement vers le bas, au toucher du voile, au retour Android et au « × ». */
  onFermer: () => void;
  children?: ReactNode;
};

const HAUTEUR_MAX = 0.9;

// Feuille native d'@expo/ui (SwiftUI sur iOS, Material 3 sur Android) : poignée et arrondi du système.
export function BottomSheet({ ouvert, titre, onFermer, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const { couleurs, espace, typographie } = useTheme();

  return (
    <FeuilleNative
      isPresented={ouvert}
      onDismiss={onFermer}
      containerColor={couleurs.surface}
      scrimColor={couleurs.voile}
      contentPadding={{ left: espace.espace5, right: espace.espace5, bottom: espace.espace6 }}>
      <View accessibilityViewIsModal style={{ maxHeight: height * HAUTEUR_MAX, gap: espace.espace3 }}>
        <View style={styles.entete}>
          <Text
            accessibilityRole="header"
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
            {titre}
          </Text>
          <IconButton icone="close" label={t('commun.fermer')} onPress={onFermer} />
        </View>
        {children}
      </View>
    </FeuilleNative>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1 },
});
