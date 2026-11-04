import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { pageDe, type Sourate } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';
import { Medaillon } from '@/ui/Medaillon';

type Props = { sourate: Sourate; onPress: () => void };

/** Carte d'une sourate dans la liste : médaillon, nom arabe, page, lieu de révélation, nombre de versets. */
export function CarteSourate({ sourate, onPress }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const page = pageDe(sourate.n, 1);
  const lieu = t(sourate.mecquoise ? 'lire.mecquoise' : 'lire.medinoise');
  const meta = [page ? `${t('lire.modePage')} ${page}` : null, lieu, t('lire.versets', { count: sourate.versets })]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('lire.sourate')} ${sourate.n}, ${sourate.nom}`}
      accessibilityHint={meta}
      android_ripple={{ color: couleurs.emeraudeDoux }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.carte,
        {
          gap: espace.espace3,
          paddingHorizontal: espace.espace4,
          paddingVertical: espace.espace3,
          borderRadius: rayon.rayonCarte,
          borderColor: couleurs.ligne,
          backgroundColor: pressed ? couleurs.emeraudeDoux : couleurs.surface,
        },
      ]}>
      <Medaillon numero={sourate.n} prefixe={t('lire.sourate')} />
      <View style={styles.textes}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
          {sourate.nom}
        </Text>
        <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {meta}
        </Text>
      </View>
      <Text accessibilityLanguage="ar" maxFontSizeMultiplier={echelleMax.courant} style={[styles.arabe, { color: couleurs.emeraude }]}>
        {sourate.arabe}
      </Text>
      <Icon name="chevron-right" size={18} color={couleurs.encre3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: { flexDirection: 'row', alignItems: 'center', minHeight: 64, borderWidth: StyleSheet.hairlineWidth },
  textes: { flex: 1 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: 24, lineHeight: 40, writingDirection: 'rtl', textAlign: 'right' },
});
