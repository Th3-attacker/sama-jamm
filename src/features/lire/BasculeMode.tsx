import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

type Option = { id: string; label: string };

type Props = {
  label: string;
  options: [Option, Option];
  valeur: string;
  onChange: (id: string) => void;
};

// Interrupteur compact de la pilule d'outils du lecteur (planche « Lecteur ») :
// piste `surface-creux`, case active émeraude pleine, texte `fond` 14 en gras.
export function BasculeMode({ label, options, valeur, onChange }: Props) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.piste, { backgroundColor: couleurs.surfaceCreux, borderRadius: rayon.rayonPastille, padding: espace.espace1 }]}>
      {options.map((o) => {
        const on = o.id === valeur;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.id)}
            style={[
              styles.option,
              { borderRadius: rayon.rayonPastille, paddingHorizontal: espace.espace3 },
              on ? { backgroundColor: couleurs.emeraude } : null,
            ]}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: on ? couleurs.surEmeraude : couleurs.encre2 }]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  piste: { flexDirection: 'row', alignSelf: 'flex-start' },
  option: { minHeight: 36, alignItems: 'center', justifyContent: 'center' },
});
