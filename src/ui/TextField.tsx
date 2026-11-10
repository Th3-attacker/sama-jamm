import { Platform, StyleSheet, Text, TextInput, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type TextFieldProps = {
  label: string;
  valeur: string;
  onChange: (texte: string) => void;
  placeholder?: string;
  /** Une phrase d'aide sous le champ. */
  aide?: string;
  /** Message d'erreur : remplace l'aide, dit quoi faire. */
  erreur?: string;
  /** Unité après la valeur : « F CFA ». */
  suffixe?: string;
  clavier?: 'default' | 'number-pad' | 'decimal-pad';
  maxLength?: number;
  /** Saisie masquée (mot de passe), sans correction ni suggestion. */
  secret?: boolean;
  /** Saisie en capitales, sans correction : références de transaction. */
  majuscules?: boolean;
};

/** Champ de saisie avec son libellé visible au-dessus, l'aide ou l'erreur en dessous. */
export function TextField({
  label,
  valeur,
  onChange,
  placeholder,
  aide,
  erreur,
  suffixe,
  clavier = 'default',
  maxLength,
  secret = false,
  majuscules = false,
}: TextFieldProps) {
  const { couleurs, espace, rayon, cible, typographie } = useTheme();

  return (
    <View style={{ gap: espace.espace1 }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
        {label}
      </Text>
      <View
        style={[
          styles.champ,
          {
            minHeight: cible.cibleAndroid,
            paddingHorizontal: espace.espace4,
            gap: espace.espace2,
            borderRadius: rayon.rayonCarte,
            backgroundColor: couleurs.surfaceCreux,
            borderColor: erreur ? couleurs.erreur : couleurs.ligneForte,
          },
        ]}>
        <TextInput
          accessibilityLabel={label}
          accessibilityHint={erreur ?? aide}
          value={valeur}
          onChangeText={onChange}
          placeholder={placeholder}
          placeholderTextColor={couleurs.encre3}
          // Props Android de la documentation React Native : curseur, sélection, sans soulignement natif.
          cursorColor={couleurs.emeraude}
          selectionColor={couleurs.emeraude}
          underlineColorAndroid="transparent"
          keyboardType={clavier}
          maxLength={maxLength}
          secureTextEntry={secret}
          autoCorrect={secret || majuscules ? false : undefined}
          autoCapitalize={secret ? 'none' : majuscules ? 'characters' : undefined}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corps, styles.saisie, { color: couleurs.encre }]}
        />
        {suffixe ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {suffixe}
          </Text>
        ) : null}
      </View>
      {erreur || aide ? (
        <Text
          accessibilityLiveRegion={erreur ? 'polite' : 'none'}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.legende, { color: erreur ? couleurs.erreur : couleurs.encre3 }]}>
          {erreur ?? aide}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  champ: { flexDirection: 'row', alignItems: 'center', borderWidth: 1 },
  saisie: {
    flex: 1,
    paddingVertical: 10,
    // iPhone seulement : sans lineHeight, le texte d'un champ d'une ligne reste centré (surtout en arabe).
    // Sur Android, un lineHeight forcé à undefined fait disparaître le texte tapé.
    ...Platform.select({ ios: { lineHeight: undefined } }),
  },
});
