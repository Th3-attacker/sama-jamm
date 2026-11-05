import { StyleSheet, Text, View } from 'react-native';

import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type TonBadge = 'neutre' | 'succes' | 'alerte' | 'erreur';

export type BadgeProps = {
  /** Deux ou trois mots : « En attente de vérification ». */
  children: string;
  ton?: TonBadge;
};

function teintes(ton: TonBadge, c: Couleurs) {
  switch (ton) {
    case 'succes':
      return { fond: c.emeraudeDoux, texte: c.succes };
    case 'alerte':
      return { fond: c.orDoux, texte: c.alerte };
    case 'erreur':
      return { fond: c.surface, texte: c.erreur };
    case 'neutre':
      return { fond: c.surfaceCreux, texte: c.encre2 };
  }
}

/** Étiquette d'état, non interactive (statut d'un don, d'un téléchargement). */
export function Badge({ children, ton = 'neutre' }: BadgeProps) {
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
        },
      ]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.texte, { color: t.texte }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderWidth: 1, paddingVertical: 2 },
  texte: { fontWeight: '600' },
});
