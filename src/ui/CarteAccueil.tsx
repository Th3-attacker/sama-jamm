import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type CarteAccueilProps = {
  icone: IconName;
  titre: string;
  /** Lu par les lecteurs d'écran à la place du contenu visuel, quand il ne se lit pas en mots. */
  label?: string;
  onPress: () => void;
  children?: ReactNode;
  /** Pied collé en bas de la carte (filet de progression, texte de bilan). */
  pied?: ReactNode;
  /** Écart entre le titre et le contenu : 4 par défaut, 8 pour une carte à grille. */
  ecart?: number;
};

/** Carte de la grille de l'Accueil : un titre avec son icône, un contenu court, un toucher qui ouvre l'écran. */
export function CarteAccueil({ icone, titre, label, onPress, children, pied, ecart }: CarteAccueilProps) {
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        {
          gap: ecart ?? espace.espace1,
          padding: espace.espace4,
          borderRadius: rayon.rayonFeuille,
          backgroundColor: pressed ? couleurs.surfaceCreux : couleurs.surface,
          borderColor: couleurs.ligne,
        },
      ]}>
      <View style={[styles.entete, { gap: espace.espace2 }]}>
        <Icon name={icone} size={18} color={couleurs.encre3} />
        <Text
          numberOfLines={2}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corps, ligne(styles.titre), { color: couleurs.encre3 }]}>
          {titre}
        </Text>
      </View>
      {children}
      {pied ? <View style={styles.pied}>{pied}</View> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Planche : rayon 20 (rayonFeuille), hauteur minimale 128 (valeur de l'échelle d'espace, sans jeton nommé),
  // icône 18 ; libellé en 15 ramené à 14/20, écart de 6 sous l'en-tête ramené à 4.
  carte: { flex: 1, borderWidth: 1, minHeight: 128 },
  pied: { marginTop: 'auto' },
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1, fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
