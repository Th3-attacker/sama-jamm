// Écran plein d'erreur ou de blocage (maquettes « Erreur de chargement » et « Mise à jour nécessaire »).
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Banner } from './Banner';
import { Button } from './Button';
import { EmptyState } from './EmptyState';
import { Logo } from './Logo';
import type { IconName } from './types';

export type EcranErreurProps = {
  titre: string;
  texte: string;
  icone?: IconName;
  /** Traduction du titre wolof, en italique (écran d'erreur). */
  sousTitre?: string;
  /** Phrase rassurante dans un bandeau « succès » : « Votre budget… est conservé. » */
  note?: string;
  /** Petite ligne en bas : code pour le support, versions. */
  detail?: string;
  action?: { libelle: string; icone?: IconName; onPress: () => void };
  /** Mise en page centrée avec la marque (mise à jour) ; sinon état vide centré (erreur). */
  logo?: boolean;
};

export function EcranErreur({ titre, texte, icone = 'alert', sousTitre, note, detail, action, logo = false }: EcranErreurProps) {
  const { couleurs, espace, typographie } = useTheme();
  const ligneDetail = detail ? (
    <Text
      selectable
      maxFontSizeMultiplier={echelleMax.courant}
      style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
      {detail}
    </Text>
  ) : null;

  if (logo) {
    // Planche « Mise à jour nécessaire » : marque 88, texte centré, bandeau rassurant, bouton en bas.
    return (
      <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
        <View style={[styles.logo, { paddingHorizontal: espace.espace5, paddingTop: espace.espace8, paddingBottom: espace.espace6, gap: espace.espace4 }]}>
          <Logo taille={88} />
          <View style={{ gap: espace.espace2 }}>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.grand}
              style={[typographie.titre1, styles.centre, { color: couleurs.emeraude }]}>
              {titre}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.centre, { color: couleurs.encre2 }]}>
              {texte}
            </Text>
          </View>
          {note ? (
            <Banner ton="succes" icone="lock">
              {note}
            </Banner>
          ) : null}
          <View style={[styles.pied, { gap: espace.espace2 }]}>
            {action ? (
              <Button icone={action.icone} pleineLargeur onPress={action.onPress}>
                {action.libelle}
              </Button>
            ) : null}
            {ligneDetail}
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <View style={styles.vide}>
        <EmptyState
          icone={icone}
          titre={titre}
          sousTitre={sousTitre}
          texte={texte}
          action={action ? { label: action.libelle, icone: action.icone, onPress: action.onPress } : undefined}
        />
      </View>
      {ligneDetail ? <View style={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace5 }}>{ligneDetail}</View> : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  vide: { flex: 1, justifyContent: 'center' },
  logo: { flex: 1, alignItems: 'center' },
  pied: { marginTop: 'auto', alignSelf: 'stretch' },
  centre: { textAlign: 'center' },
});
