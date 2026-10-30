import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

export type Onglet = { id: string; label: string; icone: IconName };

export type TabBarProps = {
  /** Cinq onglets au plus. */
  onglets: Onglet[];
  actif: string;
  onChange: (id: string) => void;
  onAppuiLong?: (id: string) => void;
};

export function TabBar({ onglets, actif, onChange, onAppuiLong }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { couleurs, ombres, espace, rayon, cible, typographie } = useTheme();

  return (
    <View
      accessibilityRole="tablist"
      style={[
        styles.barre,
        {
          paddingBottom: Math.max(insets.bottom, espace.espace2),
          paddingTop: espace.espace2,
          backgroundColor: couleurs.surface,
          borderTopColor: couleurs.ligne,
        },
        // Ombre le jour seulement : la nuit et en Veille, le jeton vaut « none ».
        ombres.ombre2 !== 'none' ? { boxShadow: ombres.ombre2 } : null,
      ]}>
      {onglets.slice(0, 5).map((o) => {
        const on = o.id === actif;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="tab"
            accessibilityLabel={o.label}
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.id)}
            onLongPress={onAppuiLong ? () => onAppuiLong(o.id) : undefined}
            style={[styles.onglet, { minHeight: cible.cibleAndroid, gap: espace.espace1 }]}>
            <View
              style={[
                styles.pastille,
                {
                  borderRadius: rayon.rayonPastille,
                  paddingHorizontal: espace.espace4,
                  paddingVertical: espace.espace1,
                  backgroundColor: on ? couleurs.emeraudeDoux : 'transparent',
                },
              ]}>
              <Icon name={o.icone} size={22} color={on ? couleurs.surEmeraudeDoux : couleurs.encre2} />
            </View>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.onglets}
              style={[
                typographie.legende,
                on ? { fontFamily: 'SourceSans3_600SemiBold', color: couleurs.emeraude } : { color: couleurs.encre2 },
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
  barre: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth },
  onglet: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pastille: { alignItems: 'center', justifyContent: 'center' },
});
