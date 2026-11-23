import { router, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ContenuEcoute } from '@/features/ecouter/ContenuEcoute';
import { arreter } from '@/features/ecouter/lecteur';
import { ACCESSOIRE_NATIF } from '@/theme/layout';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';

/**
 * Feuille « Écoute » iOS, sur le modèle de la feuille « Lecture » : feuille native à deux hauteurs avec poignée, ouverte par
 * le bouton Minuterie du lecteur. En tête : Fermer, titre, Valider. Les réglages s'appliquent tout de suite ; « Arrêter la
 * lecture » ferme la feuille et le lecteur. Android garde la feuille maison.
 */
export default function EcouteFeuille() {
  const { t } = useTranslation();
  const { nom, couleurs, espace, rayon, typographie, cible } = useTheme();
  const insets = useSafeAreaInsets();
  const systeme = useColorScheme();
  // Le verre suit le mode du téléphone, pas le thème de l'app : s'ils diffèrent (thème « Nuit » sur un téléphone clair),
  // le titre et les icônes posés sur le verre seraient illisibles. Alors un aplat aux couleurs du thème.
  const verreLisible = ACCESSOIRE_NATIF && nom === (systeme === 'dark' ? 'nuit' : 'jour');
  const fermer = () => router.back();

  return (
    <View style={styles.ecran}>
      {/* iOS 26 avec un thème qui suit le téléphone : fond transparent, le système dessine le verre ; sinon un aplat. */}
      <Stack.Screen options={{ contentStyle: { backgroundColor: verreLisible ? 'transparent' : couleurs.fond } }} />
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
          verre
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
