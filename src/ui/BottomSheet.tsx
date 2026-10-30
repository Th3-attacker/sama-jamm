import { BottomSheet as FeuilleNative, RNHostView } from '@expo/ui';
import { preferredColorScheme } from '@expo/ui/swift-ui/modifiers';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
// Poignée native et en-tête de la feuille, retirés de la hauteur laissée au contenu.
const ENTETE = 96;

// Feuille native d'@expo/ui (SwiftUI sur iOS, Material 3 sur Android) : poignée et arrondi du système.
export function BottomSheet({ ouvert, titre, onFermer, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { nom, couleurs, espace, typographie } = useTheme();
  const hauteurContenu = (height - insets.top - insets.bottom) * HAUTEUR_MAX - ENTETE;

  return (
    <FeuilleNative
      isPresented={ouvert}
      onDismiss={onFermer}
      containerColor={couleurs.surface}
      scrimColor={couleurs.voile}
      // iOS : la feuille suit le thème de l'app, pas le mode du téléphone.
      modifiers={Platform.OS === 'ios' ? [preferredColorScheme(nom === 'jour' ? 'light' : 'dark')] : undefined}
      contentPadding={{ top: espace.espace2, left: espace.espace5, right: espace.espace5, bottom: espace.espace6 }}>
      {/* Sans RNHostView, le contenu prend sa largeur naturelle, collé à gauche : largeur de la feuille, hauteur du contenu. */}
      <RNHostView matchContents={{ vertical: true }}>
        <View accessibilityViewIsModal style={{ gap: espace.espace2 }}>
          <View style={styles.entete}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
              {titre}
            </Text>
            <IconButton icone="close" label={t('commun.fermer')} onPress={onFermer} />
          </View>
          {/* Contenu court : hauteur naturelle ; contenu long : défilement dans la feuille. */}
          <ScrollView style={{ maxHeight: hauteurContenu }} contentContainerStyle={{ gap: espace.espace5 }}>
            {children}
          </ScrollView>
        </View>
      </RNHostView>
    </FeuilleNative>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1 },
});
