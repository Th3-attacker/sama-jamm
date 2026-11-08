import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

export type CarteAccueilProps = {
  icone: IconName;
  titre: string;
  /** Lu par les lecteurs d'écran à la place du contenu visuel, quand il ne se lit pas en mots. */
  label?: string;
  onPress: () => void;
  children?: ReactNode;
};

/** Carte de la grille de l'Accueil : un titre avec son icône, un contenu court, un toucher qui ouvre l'écran. */
export function CarteAccueil({ icone, titre, label, onPress, children }: CarteAccueilProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        {
          gap: espace.espace1,
          padding: espace.espace4,
          borderRadius: rayon.rayonCarte,
          backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
          borderColor: couleurs.ligne,
        },
      ]}>
      <View style={[styles.entete, { gap: espace.espace2 }]}>
        <Icon name={icone} size={16} color={couleurs.encre3} />
        <Text
          numberOfLines={2}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, styles.titre, { color: couleurs.encre3 }]}>
          {titre}
        </Text>
      </View>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { flex: 1, borderWidth: 1 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1 },
});
