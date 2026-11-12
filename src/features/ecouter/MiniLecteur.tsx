import { router } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { usePlaceBas } from '@/stores/placeBas';
import { usePleinEcran } from '@/stores/pleinEcran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';

import { arreter, basculer, useLecteur } from './lecteur';
import { recitateur } from './recitateurs';
import { espace } from '@/theme/tokens.generated';

/**
 * Mini-lecteur de l'accessoire natif iOS 26 : le système en rend deux copies (placement `regular` au-dessus de la
 * barre, `inline` dans la barre réduite) qui ne partagent pas leur état. La copie `inline` est compacte.
 */
export function MiniLecteurAccessoire() {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  return <MiniLecteur natif compact={placement === 'inline'} />;
}

/**
 * Barre au-dessus des onglets pendant une écoute : sourate et verset, lecture ou pause, arrêt.
 * `natif` : dans l'accessoire iOS 26, le système donne la taille et le fond (verre) ; la barre ne mesure rien.
 */
export function MiniLecteur({ natif = false, compact = false }: { natif?: boolean; compact?: boolean }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const position = useLecteur((s) => s.position);
  const enLecture = useLecteur((s) => s.enLecture);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const page = useLecteur((s) => s.page);
  const pleinEcran = usePleinEcran((s) => s.actif);
  // Mince quand le compteur fixe est visible : titre et lecture seulement (design 18).
  const mince = usePlaceBas((s) => s.outil) === 'compteur' || compact;
  const visible = position !== null && !pleinEcran;
  // Hauteur réelle (texte agrandi compris) pour que le contenu lui laisse exactement sa place.
  useEffect(() => {
    if (!visible && !natif) usePlaceBas.setState({ hauteurMini: 0 });
  }, [visible, natif]);
  if (!visible) return null;
  // Sourate, verset et récitateur.
  const titre = position
    ? `${sourate(position.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: position.verset })}${page !== null ? ` · ${t('lire.pageN', { n: page })}` : ''}`
    : '';
  const auteur = recitateur(idRecitateur)?.nom ?? '';

  return (
    <View
      onLayout={
        natif
          ? undefined
          : (e) => {
              const h = Math.round(e.nativeEvent.layout.height);
              if (h !== usePlaceBas.getState().hauteurMini) usePlaceBas.setState({ hauteurMini: h });
            }
      }
      style={[
        styles.barre,
        natif
          ? { flex: 1, paddingHorizontal: espace.espace4 }
          : { backgroundColor: couleurs.surface, borderTopColor: couleurs.ligne, borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: espace.espace4 },
      ]}>
      {compact ? null : <Logo taille={28} />}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('ecouter.ouvrirLecteur')}
        onPress={() => router.navigate('/lecteur')}
        style={styles.texte}>
        <Text
          numberOfLines={1}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, { color: couleurs.encre }]}>
          {titre}
        </Text>
        {mince ? null : (
          <Text
            numberOfLines={1}
            maxFontSizeMultiplier={echelleMax.courant}
            style={[typographie.legende, { color: couleurs.encre2 }]}>
            {auteur}
          </Text>
        )}
      </Pressable>
      <IconButton
        icone={enLecture ? 'pause' : 'play'}
        label={enLecture ? t('commun.pause') : t('commun.ecouter')}
        onPress={basculer}
      />
      {mince ? null : <IconButton icone="close" label={t('ecouter.arreter')} onPress={arreter} />}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', paddingVertical: 6 },
  texte: { flex: 1, marginStart: espace.espace2 },
});
