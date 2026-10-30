import { Pressable, StyleSheet } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

export type IconButtonProps = {
  icone: IconName;
  /** Obligatoire : lu par les lecteurs d'écran. */
  label: string;
  /** Icône pleine et émeraude (favori actif). */
  actif?: boolean;
  /** Taille de l'icône, 20 par défaut ; la zone tactile reste 44. */
  taille?: number;
  /** Couleur de l'icône au repos, `encre-2` par défaut. */
  couleur?: string;
  disabled?: boolean;
  onPress?: () => void;
};

export function IconButton({ icone, label, actif, taille = 20, couleur, disabled = false, onPress }: IconButtonProps) {
  const { couleurs, cible, rayon } = useTheme();
  const teinte = actif ? couleurs.emeraude : (couleur ?? couleurs.encre2);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: actif }}
      disabled={disabled}
      hitSlop={4}
      android_ripple={{ color: couleurs.emeraudeDoux, borderless: true, radius: cible.cibleIos / 2 }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.bouton,
        {
          width: cible.cibleIos,
          height: cible.cibleIos,
          borderRadius: rayon.rayonPastille,
          opacity: disabled ? 0.5 : pressed ? 0.7 : 1,
        },
      ]}>
      <Icon name={icone} size={taille} color={teinte} filled={actif} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { alignItems: 'center', justifyContent: 'center' },
});
