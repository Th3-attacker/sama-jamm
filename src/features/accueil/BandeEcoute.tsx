import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { recitateur } from '@/features/ecouter/recitateurs';
import { useLecteur } from '@/features/ecouter/lecteur';
import { cible } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

/** Bande « Continuer l'écoute » : rouvre le lecteur sur la sourate et le récitateur en cours. */
export function BandeEcoute() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const position = useLecteur((s) => s.position);
  const idRecitateur = useLecteur((s) => s.recitateur);
  if (!position) return null;
  const detail = `${sourate(position.sourate)?.nom ?? ''} · ${recitateur(idRecitateur)?.nom ?? ''}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('accueil.ecoute')}. ${detail}`}
      onPress={() => router.push('/lecteur')}
      style={[
        styles.bande,
        { gap: espace.espace3, paddingHorizontal: espace.espace4, paddingVertical: espace.espace3, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.surfaceCreux },
      ]}>
      <View style={[styles.lecture, { width: cible.cibleIos, height: cible.cibleIos, backgroundColor: couleurs.emeraude, borderRadius: rayon.rayonPastille }]}>
        <Icon name="play" size={18} color={couleurs.surEmeraude} />
      </View>
      <View style={styles.texte}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
          {t('accueil.ecoute')}
        </Text>
        <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
          {detail}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bande: { flexDirection: 'row', alignItems: 'center' },
  lecture: { alignItems: 'center', justifyContent: 'center' },
  texte: { flex: 1 },
});
