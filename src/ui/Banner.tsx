import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import { IconButton } from './IconButton';
import type { Action, IconName } from './types';

type TonBanniere = 'info' | 'attention' | 'erreur' | 'succes';

export type BannerProps = {
  /** info · attention (hors ligne) · erreur · succes. */
  ton?: TonBanniere;
  titre?: string;
  /** Ce qui marche encore et quoi faire. */
  children?: string;
  icone?: IconName;
  action?: Action;
  onFermer?: () => void;
};

const ICONES: Record<TonBanniere, IconName> = { info: 'info', attention: 'offline', erreur: 'alert', succes: 'check' };

function teintes(ton: TonBanniere, c: Couleurs) {
  switch (ton) {
    case 'attention':
      return { fond: c.orDoux, contour: c.orDoux, icone: c.orTexte };
    case 'info':
      return { fond: c.emeraudeDoux, contour: c.emeraudeDoux, icone: c.surEmeraudeDoux };
    case 'erreur':
      return { fond: c.surface, contour: c.erreur, icone: c.erreur };
    case 'succes':
      return { fond: c.surface, contour: c.succes, icone: c.succes };
  }
}

// Bandeau qui reste sous la barre du haut tant que la situation dure. Un seul à la fois.
export function Banner({ ton = 'info', titre, children, icone, action, onFermer }: BannerProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const c = teintes(ton, couleurs);

  return (
    <View
      accessibilityRole={ton === 'erreur' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      style={[
        styles.bandeau,
        {
          backgroundColor: c.fond,
          borderColor: c.contour,
          borderRadius: rayon.rayonCarte,
          paddingVertical: espace.espace3,
          paddingHorizontal: espace.espace3,
          gap: espace.espace3,
        },
      ]}>
      <Icon name={icone ?? ICONES[ton]} size={20} color={c.icone} />
      <View style={[styles.textes, { gap: espace.espace1 }]}>
        {titre ? (
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.libelle, { color: couleurs.encre }]}>
            {titre}
          </Text>
        ) : null}
        {children ? (
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.corps, { color: couleurs.encre2 }]}>
            {children}
          </Text>
        ) : null}
        {action ? (
          <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8} style={styles.action}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
              {action.label}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {onFermer ? <IconButton icone="close" label={t('commun.fermer')} onPress={onFermer} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bandeau: { flexDirection: 'row', alignItems: 'flex-start', borderWidth: 1 },
  textes: { flex: 1 },
  action: { alignSelf: 'flex-start', minHeight: 32, justifyContent: 'center' },
});
