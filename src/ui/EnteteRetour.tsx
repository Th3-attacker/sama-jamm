import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from './IconButton';

export type EnteteRetourProps = {
  titre: string;
  /** Une ligne sous le titre (14/20 `encre3`). */
  sousTitre?: string;
  /** Sous-titre en serif italique 16/24 `encre2` (planches avec phrase d'intro). */
  italique?: boolean;
  /** Croix « Fermer » à la place de la flèche (écrans ouverts en modale). */
  fermer?: boolean;
  /** Retour personnalisé ; par défaut, écran précédent. */
  onRetour?: () => void;
  /** Mot arabe en bout de ligne (Amiri 22, `orTexte`) : « الزكاة ». */
  droite?: string;
};

/**
 * En-tête des écrans secondaires du budget (planches) : flèche de retour et titre Cormorant 30 émeraude sur la
 * même ligne, sous-titre discret dessous. À placer en tête du contenu défilant ; il gère la zone de sécurité du haut.
 */
export function EnteteRetour({ titre, sousTitre, italique = false, fermer = false, onRetour, droite }: EnteteRetourProps) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.ligne, { paddingTop: insets.top + espace.espace2, gap: espace.espace1 }]}>
      <View style={styles.retour}>
        <IconButton
          icone={fermer ? 'close' : 'arrow-left'}
          taille={22}
          couleur={couleurs.encre}
          label={fermer ? t('commun.fermer') : t('commun.retour')}
          onPress={onRetour ?? (() => router.back())}
        />
      </View>
      <View style={styles.textes}>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre1, { color: couleurs.emeraude }]}>
          {titre}
        </Text>
        {sousTitre ? (
          <Text
            maxFontSizeMultiplier={echelleMax.courant}
            style={
              italique
                ? [typographie.translitteration, styles.sousTitreItalique, { color: couleurs.encre2 }]
                : [typographie.corps, styles.sousTitre, { color: couleurs.encre3 }]
            }>
            {sousTitre}
          </Text>
        ) : null}
      </View>
      {droite ? (
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.arabe, { color: couleurs.orTexte }]}>
          {droite}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center' },
  retour: { marginStart: -12 },
  textes: { flex: 1 },
  sousTitre: { fontSize: 14, lineHeight: 20 },
  sousTitreItalique: { fontSize: 16 },
});
