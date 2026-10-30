import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type OptionSegment = { id: string; label: string };

export type SegmentedControlProps = {
  label: string;
  /** Deux à quatre options, libellés d'un ou deux mots. */
  options: OptionSegment[];
  valeur: string;
  onChange: (id: string) => void;
};

export function SegmentedControl({ label, options, valeur, onChange }: SegmentedControlProps) {
  const { couleurs, ombres, espace, rayon, typographie } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[styles.groupe, { backgroundColor: couleurs.surfaceCreux, borderRadius: rayon.rayonCarte, padding: espace.espace1 }]}>
      {options.slice(0, 4).map((o) => {
        const on = o.id === valeur;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.id)}
            style={[
              styles.option,
              { borderRadius: rayon.rayonCarte - espace.espace1, paddingHorizontal: espace.espace2 },
              on ? { backgroundColor: couleurs.surface } : null,
              on && ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : null,
            ]}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[
                typographie.libelle,
                on ? { color: couleurs.encre } : { fontFamily: 'SourceSans3_400Regular', color: couleurs.encre2 },
              ]}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  groupe: { flexDirection: 'row', minHeight: 48 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
});
