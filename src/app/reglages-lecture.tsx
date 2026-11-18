import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { ContenuReglagesLecture } from '@/features/lire/ReglagesLecture';
import { ACCESSOIRE_NATIF } from '@/theme/layout';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';

/**
 * Feuille « Lecture » iOS (planche « 1.1 iOS · A3 · Feuille à mi-hauteur sur le lecteur ») : feuille native à deux
 * hauteurs avec poignée, ouverte par le bouton « Aa » et l'outil Affichage du lecteur. En tête : Fermer, titre,
 * Valider. Les réglages s'appliquent tout de suite ; Valider ferme comme Fermer. Android garde la feuille maison.
 */
export default function ReglagesLectureFeuille() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, cible } = useTheme();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const fermer = () => router.back();

  return (
    <View style={styles.ecran}>
      {/* iOS 26 : fond transparent, le système dessine le verre ; avant, un aplat aux couleurs du thème. */}
      <Stack.Screen options={{ contentStyle: { backgroundColor: ACCESSOIRE_NATIF ? 'transparent' : couleurs.fond } }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingTop: espace.espace3, paddingBottom: espace.espace8, gap: espace.espace3 }}>
        <View style={styles.entete}>
          <IconButton icone="close" label={t('commun.fermer')} onPress={fermer} />
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('lire.reglagesLecture')}
          </Text>
          <View style={{ width: cible.cibleIos, height: cible.cibleIos, borderRadius: rayon.rayonPastille, backgroundColor: couleurs.emeraudeAplat }}>
            <IconButton icone="check" label={t('commun.valider')} couleur={couleurs.surEmeraude} onPress={fermer} />
          </View>
        </View>
        <ContenuReglagesLecture modePage={mode === 'page'} verre />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
