import { Pressable, StyleSheet, Text, type GestureResponderEvent } from 'react-native';

import { vibrerLeger } from '@/lib/haptique';
import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type VarianteBouton = 'principal' | 'secondaire' | 'discret' | 'precieux' | 'danger';

export type ButtonProps = {
  /** principal : émeraude, une fois par écran · secondaire : contour · discret : texte seul · precieux : aplat or, rare · danger : geste destructeur, toujours confirmé. */
  variant?: VarianteBouton;
  /** Libellé : un verbe d'abord. */
  children: string;
  /** Icône à gauche du libellé. */
  icone?: IconName;
  /** Occupe toute la largeur du conteneur (bas d'écran). */
  pleineLargeur?: boolean;
  /** Écrans de bienvenue : 52 de haut (48 pour le discret) et libellé de 16. */
  grand?: boolean;
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  accessibilityHint?: string;
};

function teintes(variant: VarianteBouton, c: Couleurs) {
  switch (variant) {
    case 'principal':
      return { fond: c.emeraudeAplat, texte: c.surEmeraude, contour: c.emeraudeAplat };
    case 'secondaire':
      return { fond: 'transparent', texte: c.emeraude, contour: c.ligneForte };
    case 'discret':
      return { fond: 'transparent', texte: c.emeraude, contour: 'transparent' };
    case 'precieux':
      return { fond: c.or, texte: c.surOr, contour: c.or };
    case 'danger':
      return { fond: c.erreur, texte: c.surErreur, contour: c.erreur };
  }
}

const AVEC_HAPTIQUE: ReadonlySet<VarianteBouton> = new Set(['principal', 'precieux']);

export function Button({
  variant = 'principal',
  children,
  icone,
  pleineLargeur = false,
  grand = false,
  disabled = false,
  onPress,
  accessibilityHint,
}: ButtonProps) {
  const { couleurs, espace, rayon, cible, typographie, ligne } = useTheme();
  const t = teintes(variant, couleurs);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      accessibilityHint={accessibilityHint}
      disabled={disabled}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={(event) => {
        if (AVEC_HAPTIQUE.has(variant)) vibrerLeger();
        onPress?.(event);
      }}
      style={({ pressed }) => [
        styles.bouton,
        {
          minHeight: grand ? (variant === 'discret' ? 48 : 52) : cible.cibleIos,
          gap: espace.espace2,
          paddingHorizontal: variant === 'discret' ? espace.espace3 : espace.espace5,
          borderRadius: rayon.rayonCarte,
          backgroundColor: t.fond,
          borderColor: t.contour,
          alignSelf: pleineLargeur ? 'stretch' : 'flex-start',
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
      ]}>
      {icone ? <Icon name={icone} size={18} color={t.texte} /> : null}
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: t.texte }, grand && ligne(styles.libelleGrand)]}>
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  libelleGrand: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  bouton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
});
