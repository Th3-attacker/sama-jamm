// Écran plein d'erreur ou de blocage (maquettes « Erreur de chargement » et « Mise à jour nécessaire »).
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Icon } from './Icon';
import type { IconName } from './types';

export type EcranErreurProps = {
  titre: string;
  texte: string;
  icone?: IconName;
  /** Phrase rassurante sous le texte : « Votre budget… est conservé. » */
  note?: string;
  /** Petite ligne en bas : code pour le support, versions. */
  detail?: string;
  action?: { libelle: string; onPress: () => void };
};

export function EcranErreur({ titre, texte, icone = 'alert', note, detail, action }: EcranErreurProps) {
  const { couleurs, espace, typographie } = useTheme();
  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <View style={[styles.contenu, { paddingHorizontal: espace.espace5, gap: espace.espace4 }]}>
        <Icon name={icone} size={32} color={couleurs.emeraude} />
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre1, { color: couleurs.encre }]}>
          {titre}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
          {texte}
        </Text>
        {note ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
            {note}
          </Text>
        ) : null}
        {action ? (
          <Button pleineLargeur onPress={action.onPress}>
            {action.libelle}
          </Button>
        ) : null}
      </View>
      {detail ? (
        <Text
          selectable
          maxFontSizeMultiplier={echelleMax.courant}
          style={[
            typographie.legende,
            {
              color: couleurs.encre3,
              textAlign: 'center',
              paddingHorizontal: espace.espace5,
              paddingBottom: espace.espace5,
            },
          ]}>
          {detail}
        </Text>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flex: 1, justifyContent: 'center' },
});
