import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import { Medaillon } from './Medaillon';
import type { IconName } from './types';

import { interlignes } from '@/theme/tokens.generated';
type Ton = 'emeraude' | 'or' | 'neutre';

export type ListItemProps = {
  titre: string;
  sousTitre?: string;
  /** Icône dans une pastille ; ou bien `numero` pour un médaillon étoilé. */
  icone?: IconName;
  /** Couleur de la pastille d'icône. */
  ton?: Ton;
  numero?: number;
  /** Lu avant le numéro par les lecteurs d'écran : « Sourate », « Juz ». */
  prefixe?: string;
  /** Nom arabe affiché à droite (sens RTL). */
  arabe?: string;
  /** Valeur courante d'un réglage : « Wolof », « 28 ». */
  valeur?: string;
  /** Élément à droite : Switch, Badge, bouton de téléchargement. */
  droite?: ReactNode;
  /** chevron : ouvre un écran · coche : choix courant d'une liste. Par défaut chevron si onPress. */
  fin?: 'chevron' | 'coche';
  danger?: boolean;
  /** Absent quand la ligne porte un Switch : c'est l'interrupteur qui agit. */
  onPress?: () => void;
};

function pastille(ton: Ton, c: Couleurs) {
  if (ton === 'emeraude') return { fond: c.emeraudeDoux, icone: c.surEmeraudeDoux };
  if (ton === 'or') return { fond: c.orDoux, icone: c.orTexte };
  return { fond: c.surfaceCreux, icone: c.encre2 };
}

export function ListItem({
  titre,
  sousTitre,
  icone,
  ton = 'neutre',
  numero,
  prefixe = '',
  arabe,
  valeur,
  droite,
  fin,
  danger = false,
  onPress,
}: ListItemProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const finEffective = fin ?? (onPress ? 'chevron' : undefined);
  const p = pastille(ton, couleurs);

  const contenu = (
    <>
      {icone ? (
        <View style={[styles.pastille, { backgroundColor: p.fond, borderRadius: rayon.rayonPastille }]}>
          <Icon name={icone} size={20} color={p.icone} />
        </View>
      ) : numero !== undefined ? (
        <Medaillon numero={numero} prefixe={prefixe} />
      ) : null}
      <View style={styles.textes}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: danger ? couleurs.erreur : couleurs.encre }]}>
          {titre}
        </Text>
        {sousTitre ? (
          <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {sousTitre}
          </Text>
        ) : null}
      </View>
      {arabe ? (
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[styles.arabe, { color: couleurs.encre }]}>
          {arabe}
        </Text>
      ) : null}
      {valeur !== undefined ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.valeur, { color: couleurs.encre2 }]}>
          {valeur}
        </Text>
      ) : null}
      {/* L'élément de droite ne rétrécit jamais : c'est le texte qui se raccourcit. */}
      {droite ? <View style={styles.droite}>{droite}</View> : null}
      {finEffective === 'chevron' ? <Icon name="chevron-right" size={18} color={couleurs.encre3} /> : null}
      {finEffective === 'coche' ? <Icon name="check" size={20} color={couleurs.emeraude} /> : null}
    </>
  );

  const style = [styles.ligne, { gap: espace.espace3, paddingHorizontal: espace.espace4, paddingVertical: espace.espace2 }];

  if (!onPress) return <View style={style}>{contenu}</View>;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={finEffective === 'coche' ? { selected: true } : undefined}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={onPress}
      style={({ pressed }) => [style, pressed ? { backgroundColor: couleurs.surfaceCreux } : null]}>
      {contenu}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  pastille: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  textes: { flex: 1, minWidth: 0 },
  droite: { flexShrink: 0 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: 20, lineHeight: interlignes.l36, writingDirection: 'rtl', textAlign: 'right' },
  valeur: { fontVariant: ['tabular-nums'] },
});
