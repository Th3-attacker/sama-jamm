import { Pressable, StyleSheet, Text, View } from 'react-native';

import { cible } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';

export type CheckboxProps = {
  coche: boolean;
  onChange: (coche: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
};

/** Case à cocher pour des choix qui s'additionnent. Toute la ligne se touche (48 au moins). */
export function Checkbox({ coche, onChange, label, description, disabled = false }: CheckboxProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: coche, disabled }}
      disabled={disabled}
      onPress={() => onChange(!coche)}
      style={[styles.ligne, { minHeight: cible.cibleAndroid, gap: espace.espace3, opacity: disabled ? 0.5 : 1 }]}>
      <View
        style={[
          styles.case,
          {
            width: espace.espace6,
            height: espace.espace6,
            borderRadius: rayon.rayonPuce,
            borderColor: coche ? couleurs.emeraude : couleurs.ligneForte,
            backgroundColor: coche ? couleurs.emeraude : 'transparent',
          },
        ]}>
        {coche ? <Icon name="check" size={16} color={couleurs.surEmeraude} /> : null}
      </View>
      <View style={styles.textes}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
          {label}
        </Text>
        {description ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
            {description}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center' },
  case: { borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  textes: { flex: 1 },
});
