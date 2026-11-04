import { Pressable, StyleSheet, Text, View } from 'react-native';

import { referenceVerset } from '@/features/recherche/recherche';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

type Props = { sourate: number; verset: number; texte: string; trad?: string; onPress: () => void };

/** Un verset hors de son contexte (résultat de recherche, favori) : référence, arabe, traduction. Jamais tronqué. */
export function CarteVerset({ sourate, verset, texte, trad, onPress }: Props) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const reference = referenceVerset(sourate, verset);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={reference}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        {
          gap: espace.espace3,
          padding: espace.espace4,
          borderRadius: rayon.rayonCarte,
          borderColor: couleurs.ligne,
          backgroundColor: pressed ? couleurs.emeraudeDoux : couleurs.surface,
        },
      ]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.orTexte }]}>
        {reference}
      </Text>
      <View>
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.coran, styles.arabe, { color: couleurs.encre }]}>
          {texte}
        </Text>
      </View>
      {trad ? (
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.lecture, { color: couleurs.encre2 }]}>
          {trad}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { borderWidth: StyleSheet.hairlineWidth },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
});
