import { Pressable, StyleSheet, Text, View } from 'react-native';

import { referenceVerset } from '@/features/recherche/recherche';
import { surligner } from '@/features/recherche/surlignage';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { interlignes, tailles } from '@/theme/tokens.generated';
type Props = {
  sourate: number;
  verset: number;
  texte: string;
  /** Translittération (sans balises), seulement si l'utilisateur l'a activée ou si elle a servi à trouver le verset. */
  translit?: string;
  onPress: () => void;
  /** Ligne à plat de la recherche (planche) : filet en bas, sans carte. */
  plat?: boolean;
  /** Requête dont les mots sont surlignés dans la translittération (avec `plat`). */
  surligner?: string;
};

/** Un verset hors de son contexte (résultat de recherche, favori) : référence, arabe, translittération si elle est active. Jamais tronqué. */
export function CarteVerset({ sourate, verset, texte, translit, onPress, plat = false, surligner: requete }: Props) {
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
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
        {translit ? (
          <Text accessibilityLanguage="en" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.translitteration, ligne(styles.translitPlate), { color: couleurs.encre }]}>
            {(requete ? surligner(translit, requete) : [{ texte: translit, trouve: false }]).map((m, i) =>
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
      {translit ? (
        <Text accessibilityLanguage="en" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
          {translit}
        </Text>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { borderWidth: StyleSheet.hairlineWidth },
  ligne: { borderBottomWidth: 1 },
  translitPlate: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
});
