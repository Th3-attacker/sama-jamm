import { Pressable, StyleSheet, Text, View } from 'react-native';

import { espace, interlignes, tailles } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
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
  /**
   * Pastille or en haut, côté fin (nombre de khatms en cours sur le bouton Plus). Purement visuelle : le `label`
   * doit déjà dire le nombre aux lecteurs d'écran.
   */
  badge?: string;
};

export function IconButton({ icone, label, actif, taille = 20, couleur, disabled = false, onPress, badge }: IconButtonProps) {
  const { couleurs, cible, rayon, typographie, ligne } = useTheme();
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
      {badge ? (
        <View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          pointerEvents="none"
          style={[styles.badge, { backgroundColor: couleurs.or, borderRadius: rayon.rayonPastille }]}>
          {/* Plafond des grands chiffres : la pastille reste dans la cible de 44 à 200 %. */}
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.libelle, ligne(styles.badgeTexte), { color: couleurs.surOr }]}>
            {badge}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bouton: { alignItems: 'center', justifyContent: 'center' },
  // Pastille comme le badge de l'onglet natif : or, texte 12/16, collée au coin haut côté fin (RTL compris).
  badge: {
    position: 'absolute',
    top: espace.espace1,
    end: espace.espace1,
    minWidth: espace.espace4,
    paddingHorizontal: espace.espace1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeTexte: { fontSize: tailles.t12, lineHeight: interlignes.l16 },
});
