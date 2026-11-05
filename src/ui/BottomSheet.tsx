import { BottomSheet as FeuilleNative, RNHostView } from '@expo/ui';
import { preferredColorScheme } from '@expo/ui/swift-ui/modifiers';
import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Platform, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
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
/** Poignée native de la feuille (environ), en plus de l'en-tête mesuré. */
const POIGNEE = 32;

/** Hauteur du clavier ouvert, 0 s'il est fermé (iOS et Android). */
function useHauteurClavier(): number {
  const [hauteur, setHauteur] = useState(0);
  useEffect(() => {
    const ouvre = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setHauteur(e.endCoordinates.height),
    );
    const ferme = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHauteur(0),
    );
    return () => {
      ouvre.remove();
      ferme.remove();
    };
  }, []);
  return hauteur;
}

// Feuille native d'@expo/ui (SwiftUI sur iOS, Material 3 sur Android) : poignée et arrondi du système.
export function BottomSheet({ ouvert, titre, onFermer, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { nom, couleurs, espace, typographie } = useTheme();
  const clavier = useHauteurClavier();
  const [entete, setEntete] = useState(48);
  // Place laissée au contenu : 90 % de l'écran utile, moins la poignée, l'en-tête mesuré et le clavier ouvert.
  const hauteurContenu = Math.max(
    120,
    (height - insets.top - insets.bottom) * HAUTEUR_MAX - POIGNEE - entete - clavier,
  );

  return (
    <FeuilleNative
      isPresented={ouvert}
      onDismiss={onFermer}
      containerColor={couleurs.surface}
      scrimColor={couleurs.voile}
      // iOS : la feuille suit le thème de l'app, pas le mode du téléphone.
      modifiers={Platform.OS === 'ios' ? [preferredColorScheme(nom === 'jour' ? 'light' : 'dark')] : undefined}
      // Bas : marge et zone des gestes du téléphone, pour que le dernier bouton reste au-dessus.
      contentPadding={{
        top: espace.espace2,
        left: espace.espace5,
        right: espace.espace5,
        bottom: espace.espace6 + insets.bottom,
      }}>
      {/* Sans RNHostView, le contenu prend sa largeur naturelle, collé à gauche : largeur de la feuille, hauteur du contenu. */}
      <RNHostView matchContents={{ vertical: true }}>
        <View accessibilityViewIsModal style={{ gap: espace.espace2 }}>
          <View style={styles.entete} onLayout={(e) => setEntete(e.nativeEvent.layout.height)}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
              {titre}
            </Text>
            <IconButton icone="close" label={t('commun.fermer')} onPress={onFermer} />
          </View>
          {/* Contenu court : hauteur naturelle ; contenu long : défilement dans la feuille. */}
          <ScrollView
            style={{ maxHeight: hauteurContenu }}
            contentContainerStyle={{ gap: espace.espace5 }}
            // Un toucher sur un bouton agit, même clavier ouvert ; iOS garde le champ actif visible.
            keyboardShouldPersistTaps="handled"
            automaticallyAdjustKeyboardInsets
            keyboardDismissMode="interactive">
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
