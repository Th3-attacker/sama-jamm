import { StyleSheet, Text, View } from 'react-native';

import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

/** Tons du contrat : emeraude = disponible, téléchargé ; or = nouveau ; alerte = bientôt atteint ; erreur = dépassé. */
export type TonBadge = 'neutre' | 'emeraude' | 'or' | 'alerte' | 'erreur';

export type BadgeProps = {
  /** Un ou deux mots : le sens est porté par le mot, jamais par la couleur seule. */
  children: string;
  ton?: TonBadge;
  /** Icône de 14, avant le mot. */
  icone?: IconName;
};

function teintes(ton: TonBadge, c: Couleurs) {
  switch (ton) {
    case 'emeraude':
      return { fond: c.emeraudeDoux, texte: c.surEmeraudeDoux };
    case 'or':
      return { fond: c.orDoux, texte: c.orTexte };
    case 'alerte':
      return { fond: c.orDoux, texte: c.alerte };
    case 'erreur':
      return { fond: c.surface, texte: c.erreur };
    case 'neutre':
      return { fond: c.surfaceCreux, texte: c.encre2 };
  }
}

/** Étiquette d'état, non interactive (téléchargé, nouveau, bientôt atteint, dépassé). */
export function Badge({ children, ton = 'neutre', icone }: BadgeProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const t = teintes(ton, couleurs);
  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: t.fond,
          borderColor: ton === 'erreur' ? couleurs.erreur : t.fond,
          borderRadius: rayon.rayonPuce,
          paddingHorizontal: espace.espace2,
          gap: espace.espace1,
        },
      ]}>
      {icone ? <Icon name={icone} size={14} color={t.texte} /> : null}
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.texte, { color: t.texte }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingVertical: 2 },
  texte: { fontWeight: '600' },
});
