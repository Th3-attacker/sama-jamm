import { Pressable, StyleSheet, Text, View } from 'react-native';

import { referenceVerset } from '@/features/recherche/recherche';
import { surligner } from '@/features/recherche/surlignage';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

type Props = {
  sourate: number;
  verset: number;
  texte: string;
  trad?: string;
  onPress: () => void;
  /** Ligne à plat de la recherche (planche) : filet en bas, sans carte. */
  plat?: boolean;
  /** Requête dont les mots sont surlignés dans la traduction (avec `plat`). */
  surligner?: string;
};

/** Un verset hors de son contexte (résultat de recherche, favori) : référence, arabe, traduction. Jamais tronqué. */
export function CarteVerset({ sourate, verset, texte, trad, onPress, plat = false, surligner: requete }: Props) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const reference = referenceVerset(sourate, verset);

  if (plat) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={reference}
        android_ripple={{ color: couleurs.emeraudeDoux }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.ligne,
          { gap: espace.espace1, paddingVertical: espace.espace3, borderBottomColor: couleurs.ligne, backgroundColor: pressed ? couleurs.emeraudeDoux : 'transparent' },
        ]}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.orTexte }]}>
          {reference}
        </Text>
        <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.arabe, styles.arabe, { color: couleurs.encre }]}>
          {texte}
        </Text>
        {trad ? (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.lecture, styles.tradPlate, { color: couleurs.encre }]}>
            {(requete ? surligner(trad, requete) : [{ texte: trad, trouve: false }]).map((m, i) =>
              m.trouve ? (
                <Text key={i} style={{ backgroundColor: couleurs.orDoux, color: couleurs.encre }}>
                  {m.texte}
                </Text>
              ) : (
                m.texte
              ),
            )}
          </Text>
        ) : null}
      </Pressable>
    );
  }

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
  ligne: { borderBottomWidth: 1 },
  tradPlate: { fontSize: 16, lineHeight: 24 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
});
