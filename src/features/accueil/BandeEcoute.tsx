import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { recitateur } from '@/features/ecouter/recitateurs';
import { useLecteur } from '@/features/ecouter/lecteur';
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
      onPress={() => router.navigate('/lecteur')}
      style={[
        styles.bande,
        { gap: espace.espace3, paddingHorizontal: espace.espace4, paddingVertical: espace.espace3, borderRadius: 16, backgroundColor: couleurs.surfaceCreux },
      ]}>
      <View style={[styles.lecture, { width: 40, height: 40, backgroundColor: couleurs.emeraude, borderRadius: rayon.rayonPastille }]}>
        <Icon name="play" size={18} color={couleurs.surEmeraude} />
      </View>
      <View style={styles.texte}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.titre, { color: couleurs.encre }]}>
          {t('accueil.ecoute')}
        </Text>
        <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
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
  // Planche : titre 16/24 en gras, détail 14/20.
  titre: { fontSize: 16, lineHeight: 24 },
  detail: { fontSize: 14, lineHeight: 20 },
});
