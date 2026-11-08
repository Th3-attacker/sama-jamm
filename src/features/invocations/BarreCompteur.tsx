import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useMargeBasse } from '@/features/ecouter/placeMiniLecteur';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

type Props = {
  /** Début de l'invocation en cours. */
  titre: string;
  /** Écriture du titre : en arabe, il se lit de droite à gauche. */
  arabe?: boolean;
  n: number;
  total: number;
  onCompter: () => void;
};

/** Compteur fixé au-dessus des onglets : l'invocation en cours et un grand bouton rond. */
export function BarreCompteur({ titre, arabe = false, n, total, onCompter }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useMargeBasse();
  const valeur = t('invocations.compteur', { n, total });
  return (
    <View
      style={[
        styles.barre,
        {
          backgroundColor: couleurs.surface,
          borderTopColor: couleurs.ligne,
          paddingHorizontal: espace.espace5,
          paddingVertical: espace.espace3,
          // Au-dessus de la barre d'onglets : le fond de la barre passe derrière elle.
          paddingBottom: espace.espace3 + marge,
          gap: espace.espace3,
        },
      ]}>
      <View style={styles.titre}>
        <Text
          numberOfLines={1}
          accessibilityLanguage={arabe ? 'ar' : undefined}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre3, { color: couleurs.encre, textAlign: arabe ? 'right' : 'left', writingDirection: arabe ? 'rtl' : 'ltr' }]}>
          {`${titre}…`}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {t('invocations.compterAide')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${valeur}. ${t('invocations.compterAide')}`}
        onPress={onCompter}
        style={[styles.bouton, { backgroundColor: couleurs.emeraude, borderRadius: rayon.rayonPastille }]}>
        <Text maxFontSizeMultiplier={echelleMax.onglets} style={[typographie.titre3, styles.chiffres, { color: couleurs.surEmeraude }]}>
          {valeur}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  titre: { flex: 1 },
  bouton: { minWidth: 88, height: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center' },
  chiffres: { fontVariant: ['tabular-nums'] },
});
