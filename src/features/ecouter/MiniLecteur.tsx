import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { usePleinEcran } from '@/stores/pleinEcran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';

import { arreter, basculer, useLecteur } from './lecteur';
import { recitateur } from './recitateurs';

/** Barre au-dessus des onglets pendant une écoute : sourate et verset, lecture ou pause, arrêt. */
export function MiniLecteur() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const position = useLecteur((s) => s.position);
  const enLecture = useLecteur((s) => s.enLecture);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const page = useLecteur((s) => s.page);
  const pleinEcran = usePleinEcran((s) => s.actif);
  if (!position || pleinEcran) return null;

  return (
    <View
      style={[
        styles.barre,
        { backgroundColor: couleurs.surface, borderTopColor: couleurs.ligne, paddingHorizontal: espace.espace4 },
      ]}>
      <Logo taille={28} />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ecouter.ouvrirLecteur')}
        onPress={() => router.push('/ecouter/lecteur')}
        style={styles.texte}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, { color: couleurs.encre }]}>
          {`${sourate(position.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: position.verset })}${page !== null ? ` · ${t('lire.pageN', { n: page })}` : ''}`}
        </Text>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.legende, { color: couleurs.encre2 }]}>
          {recitateur(idRecitateur)?.nom ?? ''}
        </Text>
      </Pressable>
      <IconButton
        icone={enLecture ? 'pause' : 'play'}
        label={enLecture ? t('commun.pause') : t('commun.ecouter')}
        onPress={basculer}
      />
      <IconButton icone="close" label={t('ecouter.arreter')} onPress={arreter} />
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  texte: { flex: 1, marginStart: 10 },
});
