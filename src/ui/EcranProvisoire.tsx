// Écran temporaire du socle : remplacé écran par écran à partir de l'étape 3.
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

type Props = {
  titre: string;
  texte?: string;
  action?: { libelle: string; onPress: () => void };
};

export function EcranProvisoire({ titre, texte, action }: Props) {
  const { couleurs, espace, rayon, cible, typographie } = useTheme();

  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <View style={[styles.contenu, { paddingHorizontal: espace.espace5, gap: espace.espace4 }]}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre1, { color: couleurs.encre }]}>
          {titre}
        </Text>
        {texte ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {texte}
          </Text>
        ) : null}
        {action ? (
          <Pressable
            accessibilityRole="button"
            onPress={action.onPress}
            style={({ pressed }) => [
              styles.bouton,
              {
                minHeight: cible.cibleAndroid,
                borderRadius: rayon.rayonCarte,
                paddingHorizontal: espace.espace6,
                backgroundColor: couleurs.emeraude,
                opacity: pressed ? 0.85 : 1,
              },
            ]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.surEmeraude }]}>
              {action.libelle}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flex: 1, justifyContent: 'center' },
  bouton: { alignSelf: 'flex-start', alignItems: 'center', justifyContent: 'center' },
});
