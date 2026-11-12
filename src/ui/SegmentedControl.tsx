import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type OptionSegment = { id: string; label: string };

export type SegmentedControlProps = {
  label: string;
  /** Deux à quatre options, libellés d'un ou deux mots. */
  options: OptionSegment[];
  valeur: string;
  onChange: (id: string) => void;
  /** Pilule de la bibliothèque (planche) : rayon 999, cases de 36, texte 16. */
  pilule?: boolean;
};

export function SegmentedControl({ label, options, valeur, onChange, pilule = false }: SegmentedControlProps) {
  const { couleurs, ombres, espace, rayon, typographie, ligne } = useTheme();

  return (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      style={[
        styles.groupe,
        { backgroundColor: couleurs.surfaceCreux, borderRadius: pilule ? rayon.rayonPastille : rayon.rayonCarte, padding: espace.espace1 },
        pilule ? styles.groupePilule : null,
      ]}>
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
              { borderRadius: pilule ? rayon.rayonPastille : rayon.rayonCarte - espace.espace1, paddingHorizontal: espace.espace2 },
              pilule ? styles.optionPilule : null,
              on ? { backgroundColor: couleurs.surface } : null,
              on && ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : null,
            ]}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[
                typographie.libelle,
                pilule ? ligne(styles.textePilule) : null,
                pilule
                  ? { color: on ? couleurs.emeraude : couleurs.encre2 }
                  : on
                    ? { color: couleurs.encre }
                    : { fontFamily: 'SourceSans3_400Regular', color: couleurs.encre2 },
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
  groupePilule: { minHeight: 44 },
  optionPilule: { minHeight: 36 },
  textePilule: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  option: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 40 },
});
