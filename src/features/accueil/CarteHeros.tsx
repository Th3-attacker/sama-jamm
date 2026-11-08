import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import type { PriereArc } from '@/ui/DayArc';

type Props = {
  /** Nom de la prochaine prière. */
  nom: string;
  /** Heure de la prochaine prière, déjà formatée. */
  heure: string;
  /** Délai déjà formaté (« 42 min », « 1 h 05 »). */
  dans: string;
  prieres: readonly PriereArc[];
};

/** Carte héros de l'Accueil : la prochaine prière, le délai, l'heure et les cinq prières du jour (passées atténuées). */
export function CarteHeros({ nom, heure, dans, prieres }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const surEmeraude = couleurs.surEmeraude;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('accueil.avant', { priere: nom })}, ${t('accueil.a', { heure })}, ${dans}`}
      onPress={() => router.push('/priere')}
      style={[
        styles.carte,
        { gap: espace.espace3, padding: espace.espace4, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.emeraude },
      ]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: surEmeraude }]}>
        {t('accueil.avant', { priere: nom })}
      </Text>
      <View style={[styles.ligne, { gap: espace.espace2 }]}>
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, { color: surEmeraude }]}>
          {dans}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, styles.heure, { color: surEmeraude }]}>
          {heure}
        </Text>
      </View>
      <View style={styles.prieres}>
        {prieres.map((p) => (
          <View key={p.nom} style={styles.priere}>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[
                typographie.legende,
                styles.centre,
                { color: surEmeraude, opacity: p.etat === 'passee' ? 0.6 : 1, fontWeight: p.etat === 'prochaine' ? '700' : '400' },
              ]}>
              {p.nom}
            </Text>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[
                typographie.legende,
                styles.centre,
                { color: surEmeraude, opacity: p.etat === 'passee' ? 0.6 : 1, fontVariant: ['tabular-nums'] },
              ]}>
              {p.heure}
            </Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  carte: {},
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  heure: { marginStart: 'auto', fontVariant: ['tabular-nums'] },
  prieres: { flexDirection: 'row' },
  priere: { flex: 1 },
  centre: { textAlign: 'center' },
});
