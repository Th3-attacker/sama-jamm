import { router } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  arreter,
  basculer,
  definirVitesse,
  precedent,
  sauter,
  suivant,
  useLecteur,
  VITESSES,
} from '@/features/ecouter/lecteur';
import { useTelechargements, WifiRequis } from '@/features/ecouter/telechargements';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';
import { useToast } from '@/ui/Toast';

import { pisteXassaides, sourceXassaides } from './catalogue';
import { formatTemps } from './pistes';
import { clePiste, pisteTelechargee, telechargerPiste, useTelechargementsXassaides } from './telechargements';

/** Pas du saut avant ou arrière, en secondes. */
const PAS = 15;

/** Lecteur plein écran d'un xassaïde : titre, source, barre de temps, saut de 15 secondes, piste suivante. */
export function LecteurXassaide() {
  const { t } = useTranslation();
  const { afficher } = useToast();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  const enCours = useLecteur((s) => s.piste);
  const enLecture = useLecteur((s) => s.enLecture);
  const chargement = useLecteur((s) => s.chargement);
  const erreur = useLecteur((s) => s.erreur);
  const temps = useLecteur((s) => s.temps);
  const duree = useLecteur((s) => s.duree);
  const vitesse = useLecteur((s) => s.vitesse);
  const version = useTelechargements((s) => s.version);
  const reception = useTelechargementsXassaides((s) =>
    enCours ? s.enCours[clePiste(enCours.source, enCours.id)] === true : false,
  );
  const telechargee = useMemo(
    () => version >= 0 && !!enCours && pisteTelechargee(enCours.source, enCours.id),
    [version, enCours],
  );
  const piste = enCours ? pisteXassaides(enCours.source, enCours.id) : undefined;
  const source = enCours ? sourceXassaides(enCours.source) : undefined;
  const avance = duree > 0 ? Math.min(1, temps / duree) : 0;

  const vitesseSuivante = () => {
    const i = VITESSES.findIndex((v) => v === vitesse);
    definirVitesse(VITESSES[(i + 1) % VITESSES.length] ?? 1);
  };

  return (
    <View
      style={[
        styles.ecran,
        { backgroundColor: couleurs.fond, paddingTop: insets.top + espace.espace2, paddingBottom: Math.max(insets.bottom, espace.espace5) },
      ]}>
      <View style={[styles.entete, { paddingHorizontal: espace.espace4 }]}>
        <IconButton icone="chevron-down" label={t('ecouter.reduire')} onPress={() => router.back()} />
        <View style={styles.titres}>
          <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('xassaides.titre')}
          </Text>
          <Text numberOfLines={1} maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
            {source?.nom ?? ''}
          </Text>
        </View>
        {enCours && reception ? (
          <View style={[styles.attente, { width: cible.cibleIos, height: cible.cibleIos }]}>
            <ActivityIndicator accessibilityLabel={t('telechargements.enCours')} color={couleurs.emeraude} />
          </View>
        ) : enCours ? (
          <IconButton
            icone={telechargee ? 'check-circle' : 'download'}
            couleur={telechargee ? couleurs.emeraude : undefined}
            label={telechargee ? t('telechargements.disponible') : t('ecouter.telechargerHorsLigne')}
            onPress={() => {
              if (telechargee) return;
              telechargerPiste(enCours.source, enCours.id).catch((e: unknown) => {
                console.warn('Téléchargement interrompu', e);
                afficher({
                  texte: e instanceof WifiRequis ? t('telechargements.wifiRequis') : t('xassaides.echec'),
                  icone: 'offline',
                });
              });
            }}
          />
        ) : (
          <View style={{ width: cible.cibleIos }} />
        )}
      </View>

      {piste ? (
        <>
          <View style={[styles.centre, { paddingHorizontal: espace.espace6, gap: espace.espace4 }]}>
            <Logo taille={160} />
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.grand}
              style={[typographie.titre1, styles.texteCentre, { color: couleurs.emeraude }]}>
              {piste.titre}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.texteCentre, { color: couleurs.encre2 }]}>
              {source?.nom ?? ''}
            </Text>
            {erreur ? (
              <Banner
                ton="attention"
                icone="offline"
                titre={t('etats.horsLigne')}
                action={{ label: t('etats.voirTelechargements'), onPress: () => router.push('/plus/telechargements') }}>
                {t('etats.horsLigneEcouter')}
              </Banner>
            ) : null}
          </View>

          <View style={{ paddingHorizontal: espace.espace6, gap: espace.espace2 }}>
            <View
              accessibilityRole="progressbar"
              accessibilityValue={{ min: 0, max: duree, now: temps }}
              style={[styles.barre, { height: espace.espace1, backgroundColor: couleurs.surface, borderRadius: rayon.rayonPastille }]}>
              <View
                style={{
                  height: espace.espace1,
                  width: `${Math.round(avance * 100)}%`,
                  backgroundColor: couleurs.or,
                  borderRadius: rayon.rayonPastille,
                }}
              />
            </View>
            <View style={styles.temps}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {formatTemps(temps)}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                {duree > 0 ? formatTemps(duree) : '–'}
              </Text>
            </View>
          </View>

          <View style={[styles.commandes, { paddingHorizontal: espace.espace6, marginTop: espace.espace4 }]}>
            <IconButton icone="skip-back" label={t('ecouter.precedent')} taille={26} couleur={couleurs.encre} onPress={precedent} />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('xassaides.reculer', { n: PAS })}
              onPress={() => sauter(-PAS)}
              style={[styles.saut, { minWidth: cible.cibleIos, minHeight: cible.cibleIos }]}>
              <Text maxFontSizeMultiplier={echelleMax.onglets} style={[typographie.libelle, { color: couleurs.encre }]}>
                {`−${PAS} s`}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={enLecture ? t('commun.pause') : t('commun.ecouter')}
              onPress={basculer}
              style={({ pressed }) => [
                styles.principal,
                {
                  width: cible.cibleIos + espace.espace6,
                  height: cible.cibleIos + espace.espace6,
                  borderRadius: rayon.rayonPastille,
                  backgroundColor: couleurs.emeraudeAplat,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              {chargement && !enLecture ? (
                <ActivityIndicator color={couleurs.surEmeraude} />
              ) : (
                <Icon name={enLecture ? 'pause' : 'play'} size={28} color={couleurs.surEmeraude} />
              )}
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('xassaides.avancer', { n: PAS })}
              onPress={() => sauter(PAS)}
              style={[styles.saut, { minWidth: cible.cibleIos, minHeight: cible.cibleIos }]}>
              <Text maxFontSizeMultiplier={echelleMax.onglets} style={[typographie.libelle, { color: couleurs.encre }]}>
                {`+${PAS} s`}
              </Text>
            </Pressable>
            <IconButton icone="skip-forward" label={t('ecouter.suivant')} taille={26} couleur={couleurs.encre} onPress={suivant} />
          </View>

          <View style={[styles.bas, { paddingHorizontal: espace.espace6, marginTop: espace.espace4, gap: espace.espace3 }]}>
            <View style={styles.bouton}>
              <Button variant="secondaire" pleineLargeur onPress={vitesseSuivante}>
                {`${t('ecouter.vitesse')} ${String(vitesse).replace('.', ',')} ×`}
              </Button>
            </View>
            <View style={styles.bouton}>
              <Button
                variant="discret"
                pleineLargeur
                onPress={() => {
                  arreter();
                  router.back();
                }}>
                {t('ecouter.arreter')}
              </Button>
            </View>
          </View>
        </>
      ) : (
        <View style={{ padding: espace.espace5 }}>
          <Banner ton="info">{t('ecouter.rien')}</Banner>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titres: { flex: 1, alignItems: 'center' },
  attente: { alignItems: 'center', justifyContent: 'center' },
  centre: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  texteCentre: { textAlign: 'center' },
  barre: { overflow: 'hidden' },
  temps: { flexDirection: 'row', justifyContent: 'space-between' },
  commandes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  saut: { alignItems: 'center', justifyContent: 'center' },
  principal: { alignItems: 'center', justifyContent: 'center' },
  bas: { flexDirection: 'row' },
  bouton: { flex: 1 },
});
