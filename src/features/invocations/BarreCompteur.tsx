import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useDessousOutil } from '@/features/ecouter/placeMiniLecteur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaceBas } from '@/stores/placeBas';
import { usePleinEcran } from '@/stores/pleinEcran';
import { espace, miseEnPage, rayon } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

type Props = {
  /** Titre (français) de l'invocation en cours : le texte arabe n'est jamais abrégé ici. */
  titre: string;
  /** Écriture du titre : en arabe, il se lit de droite à gauche. */
  arabe?: boolean;
  n: number;
  total: number;
  onCompter: () => void;
  /** Avec les deux : disposition de la planche « Invocations · lecture » (flèches de chaque côté du bouton). */
  onPrecedent?: () => void;
  onSuivant?: () => void;
  /** Désactive la flèche correspondante (première ou dernière invocation). */
  sansPrecedent?: boolean;
  sansSuivant?: boolean;
};

/** Compteur fixé au-dessus des onglets : l'invocation en cours et un grand bouton rond. */
export function BarreCompteur({ titre, arabe = false, n, total, onCompter, onPrecedent, onSuivant, sansPrecedent = false, sansSuivant = false }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const marge = useDessousOutil();
  // En plein écran (lecture d'une invocation) la barre d'onglets est retirée : le compteur colle au bas, zone de sécurité comprise.
  const plein = usePleinEcran((s) => s.actif);
  const insets = useSafeAreaInsets();
  const bas = plein ? 0 : marge + miseEnPage.ecartCouches;
  const dedans = plein ? insets.bottom : 0;
  // Le compteur est l'outil fixe du bas : le mini-lecteur passe en version mince et la pile compte sa hauteur.
  useEffect(() => {
    usePlaceBas.setState({ outil: 'compteur' });
    return () => usePlaceBas.setState({ outil: 'aucun' });
  }, []);
  const valeur = t('invocations.compteur', { n, total });
  if (onPrecedent && onSuivant) {
    // Planche : 72 de haut (12 + 48 + 12), marges 24, flèches rondes de 48 et bouton émeraude au centre.
    const fleche = (libelle: string, onPress: () => void, desactive: boolean, retourner: boolean) => (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={libelle}
        disabled={desactive}
        onPress={onPress}
        style={[styles.nav, { borderColor: couleurs.ligneForte, opacity: desactive ? 0.4 : 1 }]}>
        {/* L'icône se retourne déjà en arabe : « précédente » la retourne encore pour pointer à l'opposé de « suivante ». */}
        <View style={retourner ? styles.retourne : undefined}>
          <Icon name="chevron-right" size={22} color={couleurs.encre} />
        </View>
      </Pressable>
    );
    return (
      <View
        style={[
          styles.barre,
          {
            backgroundColor: couleurs.surface,
            borderTopColor: couleurs.ligne,
            paddingHorizontal: espace.espace6,
            paddingTop: espace.espace3,
            paddingBottom: espace.espace3 + dedans,
            marginBottom: bas,
            gap: espace.espace3,
          },
        ]}>
        {fleche(t('invocations.precedente'), onPrecedent, sansPrecedent, true)}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${t('invocations.compterBouton', { n, total })}. ${t('invocations.compterAide')}`}
          onPress={onCompter}
          style={[styles.compter, { backgroundColor: couleurs.emeraudeAplat, borderRadius: rayon.rayonPastille }]}>
          <Text maxFontSizeMultiplier={echelleMax.onglets} style={[typographie.titre3, styles.chiffres, { color: couleurs.surEmeraude }]}>
            {t('invocations.compterBouton', { n, total })}
          </Text>
        </Pressable>
        {fleche(t('invocations.suivante'), onSuivant, sansSuivant, false)}
      </View>
    );
  }
  return (
    <View
      style={[
        styles.barre,
        {
          backgroundColor: couleurs.surface,
          borderTopColor: couleurs.ligne,
          paddingHorizontal: espace.espace5,
          paddingTop: espace.espace3,
          paddingBottom: espace.espace3 + dedans,
          // Au-dessus de la barre d'onglets, à 8 de la couche du dessous : le fond s'arrête à la hauteur du compteur.
          marginBottom: bas,
          gap: espace.espace3,
        },
      ]}>
      <View style={styles.titre}>
        <Text
          numberOfLines={1}
          accessibilityLanguage={arabe ? 'ar' : undefined}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.titre3, { color: couleurs.encre, textAlign: arabe ? 'right' : 'left', writingDirection: arabe ? 'rtl' : 'ltr' }]}>
          {titre}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {t('invocations.compterAide')}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${valeur}. ${t('invocations.compterAide')}`}
        onPress={onCompter}
        style={[styles.bouton, { backgroundColor: couleurs.emeraudeAplat, borderRadius: rayon.rayonPastille }]}>
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
  bouton: { minWidth: 88, height: 48, paddingHorizontal: espace.espace4, alignItems: 'center', justifyContent: 'center' },
  chiffres: { fontVariant: ['tabular-nums'], textAlignVertical: 'center', includeFontPadding: false },
  nav: { width: 48, height: 48, borderRadius: rayon.rayonPastille, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  compter: { flex: 1, height: 48, alignItems: 'center', justifyContent: 'center' },
  retourne: { transform: [{ scaleX: -1 }] },
});
