import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContenuEcoute } from '@/features/ecouter/ContenuEcoute';
import { arreter } from '@/features/ecouter/lecteur';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';

/**
 * Feuille « Écoute » iOS : feuille native à deux hauteurs avec poignée, comme « Lecture », mais sur un fond plein (pas de
 * verre). Ouverte par le bouton Minuterie du lecteur. En tête : Fermer, titre, Valider. Les réglages s'appliquent tout de
 * suite ; « Arrêter » ferme la feuille et le lecteur. Android garde la feuille maison.
 */
export default function EcouteFeuille() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, cible } = useTheme();
  const insets = useSafeAreaInsets();
  const fermer = () => router.back();

  return (
    <View style={styles.ecran}>
      {/* Fond plein aux couleurs du thème : pas de verre (« Liquid Glass ») sur cette feuille. */}
      <Stack.Screen options={{ contentStyle: { backgroundColor: couleurs.fond } }} />
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingTop: espace.espace3, paddingBottom: espace.espace8 + insets.bottom, gap: espace.espace3 }}>
        <View style={styles.entete}>
          <IconButton icone="close" label={t('commun.fermer')} onPress={fermer} />
          <Text accessibilityRole="header" maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('ecouter.titreFeuille')}
          </Text>
          <View style={{ width: cible.cibleIos, height: cible.cibleIos, borderRadius: rayon.rayonPastille, backgroundColor: couleurs.emeraudeAplat }}>
            <IconButton icone="check" label={t('commun.valider')} couleur={couleurs.surEmeraude} onPress={fermer} />
          </View>
        </View>
        <ContenuEcoute
          onArreter={() => {
            arreter();
            // La feuille puis le lecteur (modale) : deux écrans à fermer.
            router.dismiss(2);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
});
