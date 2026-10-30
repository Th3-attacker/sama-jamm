import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Button } from './Button';
import { Etoile } from './Etoile';
import { Icon } from './Icon';
import type { IconName } from './types';

export type EmptyStateProps = {
  /** Titre wolof court : « Jàmm rekk ». */
  titre: string;
  /** Langue du titre, « wo » par défaut. */
  lang?: string;
  /** Sa traduction, en italique. */
  sousTitre?: string;
  /** Ce qu'il faut faire pour remplir l'écran. */
  texte?: string;
  icone?: IconName;
  action?: { label: string; icone?: IconName; onPress: () => void };
};

const TAILLE_ETOILE = 72;

export function EmptyState({ titre, lang = 'wo', sousTitre, texte, icone = 'book', action }: EmptyStateProps) {
  const { couleurs, espace, typographie } = useTheme();

  return (
    <View style={[styles.vide, { gap: espace.espace3, padding: espace.espace6 }]}>
      <View style={[styles.etoile, { width: TAILLE_ETOILE, height: TAILLE_ETOILE, marginBottom: espace.espace2 }]}>
        <View style={StyleSheet.absoluteFill}>
          <Etoile taille={TAILLE_ETOILE} remplissage={couleurs.orDoux} contour={couleurs.or} />
        </View>
        <Icon name={icone} size={26} color={couleurs.orTexte} />
      </View>
      <Text
        accessibilityRole="header"
        accessibilityLanguage={lang}
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.titre2, styles.centre, { color: couleurs.emeraude }]}>
        {titre}
      </Text>
      {sousTitre ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, styles.centre, { color: couleurs.encre2 }]}>
          {sousTitre}
        </Text>
      ) : null}
      {texte ? (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.centre, { color: couleurs.encre2 }]}>
          {texte}
        </Text>
      ) : null}
      {action ? (
        <View style={{ marginTop: espace.espace2 }}>
          <Button variant="secondaire" icone={action.icone} onPress={action.onPress}>
            {action.label}
          </Button>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  vide: { alignItems: 'center', justifyContent: 'center' },
  etoile: { alignItems: 'center', justifyContent: 'center' },
  centre: { textAlign: 'center', maxWidth: 320 },
});
