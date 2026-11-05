import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  arreter,
  basculer,
  definirVitesse,
  precedent,
  suivant,
  useLecteur,
  VITESSES,
} from '@/features/ecouter/lecteur';
import { recitateur } from '@/features/ecouter/recitateurs';
import { sourate, versetsDe } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { TopBar } from '@/ui/TopBar';

/** Lecteur plein écran : sourate et récitateur, verset en cours affiché, commandes et vitesse. */
export default function LecteurPleinEcran() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const position = useLecteur((s) => s.position ?? s.derniere);
  const enLecture = useLecteur((s) => s.enLecture);
  const chargement = useLecteur((s) => s.chargement);
  const erreur = useLecteur((s) => s.erreur);
  const vitesse = useLecteur((s) => s.vitesse);
  const page = useLecteur((s) => s.page);
  const idRecitateur = useLecteur((s) => s.recitateur);

  const s = position ? sourate(position.sourate) : undefined;
  const texte = position ? versetsDe(position.sourate)[position.verset - 1] : undefined;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={s?.nom ?? t('ecouter.titre')} sousTitre={recitateur(idRecitateur)?.nom} />
      <ScrollView contentContainerStyle={{ padding: espace.espace5, gap: espace.espace5, flexGrow: 1 }}>
        {position && s ? (
          <>
            <Text
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, styles.centre, { color: couleurs.orTexte }]}>
              {page !== null
                ? `${t('lire.pageN', { n: page })} · ${t('ecouter.versetSur', { n: position.verset, total: s.versets })}`
                : t('ecouter.versetSur', { n: position.verset, total: s.versets })}
            </Text>
            {texte ? (
              <Text
                accessibilityLanguage="ar"
                maxFontSizeMultiplier={echelleMax.grand}
                style={[typographie.coran, styles.arabe, { color: couleurs.encre }]}>
                {texte}
              </Text>
            ) : null}
            {erreur ? <Banner ton="erreur">{t('ecouter.erreurLecture')}</Banner> : null}

            <View style={[styles.commandes, { gap: espace.espace5 }]}>
              <IconButton icone="skip-back" label={t('ecouter.precedent')} taille={28} onPress={precedent} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={enLecture ? t('commun.pause') : t('commun.ecouter')}
                onPress={basculer}
                style={({ pressed }) => [
                  styles.principal,
                  {
                    width: cible.cibleAndroid * 1.6,
                    height: cible.cibleAndroid * 1.6,
                    borderRadius: rayon.rayonPastille,
                    backgroundColor: couleurs.emeraude,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}>
                {chargement && !enLecture ? (
                  <ActivityIndicator color={couleurs.surEmeraude} />
                ) : (
                  <Icon name={enLecture ? 'pause' : 'play'} size={32} color={couleurs.surEmeraude} />
                )}
              </Pressable>
              <IconButton icone="skip-forward" label={t('ecouter.suivant')} taille={28} onPress={suivant} />
            </View>

            <SegmentedControl
              label={t('ecouter.vitesse')}
              options={VITESSES.map((v) => ({ id: String(v), label: `${String(v).replace('.', ',')}×` }))}
              valeur={String(vitesse)}
              onChange={(id) => definirVitesse(Number(id))}
            />
            <Button
              variant="discret"
              pleineLargeur
              onPress={() => {
                arreter();
                router.back();
              }}>
              {t('ecouter.arreter')}
            </Button>
          </>
        ) : (
          <Banner ton="info">{t('ecouter.rien')}</Banner>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  centre: { textAlign: 'center' },
  arabe: { textAlign: 'center', writingDirection: 'rtl' },
  commandes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  principal: { alignItems: 'center', justifyContent: 'center' },
});
