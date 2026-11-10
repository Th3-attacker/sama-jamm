import { useTranslation } from 'react-i18next';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import { IconButton } from './IconButton';

export type SearchFieldProps = {
  /** Lu par les lecteurs d'écran ; « Rechercher » par défaut. */
  label?: string;
  placeholder?: string;
  valeur: string;
  onChange: (texte: string) => void;
  autoFocus?: boolean;
};

export function SearchField({ label, placeholder, valeur, onChange, autoFocus }: SearchFieldProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();

  return (
    <View
      style={[
        styles.champ,
        {
          minHeight: cible.cibleAndroid,
          gap: espace.espace2,
          paddingStart: espace.espace4,
          borderRadius: rayon.rayonCarte,
          backgroundColor: couleurs.surfaceCreux,
          borderColor: couleurs.ligneForte,
        },
      ]}>
      <Icon name="search" size={20} color={couleurs.encre3} />
      <TextInput
        accessibilityLabel={label ?? t('commun.rechercher')}
        placeholder={placeholder}
        placeholderTextColor={couleurs.encre3}
        cursorColor={couleurs.emeraude}
        selectionColor={couleurs.emeraude}
        underlineColorAndroid="transparent"
        value={valeur}
        onChangeText={onChange}
        autoFocus={autoFocus}
        autoCorrect={false}
        returnKeyType="search"
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.corps, styles.saisie, { color: couleurs.encre }]}
      />
      {valeur ? (
        <IconButton icone="close" label={t('commun.fermer')} onPress={() => onChange('')} />
      ) : (
        <View style={{ width: espace.espace3 }} />
      )}
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
