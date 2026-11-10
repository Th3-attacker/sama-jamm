import { router } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { pisteXassaides, sourceXassaides } from '@/features/xassaides/catalogue';
import { usePlaceBas } from '@/stores/placeBas';
import { usePleinEcran } from '@/stores/pleinEcran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';

import { arreter, basculer, useLecteur } from './lecteur';
import { recitateur } from './recitateurs';

/** Barre au-dessus des onglets pendant une écoute : sourate et verset, lecture ou pause, arrêt. */
export function MiniLecteur() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const position = useLecteur((s) => s.position);
  const enLecture = useLecteur((s) => s.enLecture);
  const idRecitateur = useLecteur((s) => s.recitateur);
  const page = useLecteur((s) => s.page);
  const piste = useLecteur((s) => s.piste);
  const pleinEcran = usePleinEcran((s) => s.actif);
  // Mince quand le compteur fixe est visible : titre et lecture seulement (design 18).
  const mince = usePlaceBas((s) => s.outil) === 'compteur';
  const visible = (position !== null || piste !== null) && !pleinEcran;
  // Hauteur réelle (texte agrandi compris) pour que le contenu lui laisse exactement sa place.
  useEffect(() => {
    if (!visible) usePlaceBas.setState({ hauteurMini: 0 });
  }, [visible]);
  if (!visible) return null;
  // Xassaïde : titre de la piste et nom de la source ; Coran : sourate, verset et récitateur.
  const titre = piste
    ? (pisteXassaides(piste.source, piste.id)?.titre ?? '')
    : position
      ? `${sourate(position.sourate)?.nom ?? ''} · ${t('ecouter.versetN', { n: position.verset })}${page !== null ? ` · ${t('lire.pageN', { n: page })}` : ''}`
      : '';
  const auteur = piste ? (sourceXassaides(piste.source)?.nom ?? '') : (recitateur(idRecitateur)?.nom ?? '');

  return (
    <View
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        if (h !== usePlaceBas.getState().hauteurMini) usePlaceBas.setState({ hauteurMini: h });
      }}
      style={[
        styles.barre,
        { backgroundColor: couleurs.surface, borderTopColor: couleurs.ligne, paddingHorizontal: espace.espace4 },
      ]}>
      <Logo taille={28} />
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
  barre: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 6 },
  texte: { flex: 1, marginStart: 10 },
});
