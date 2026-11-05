import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  arreter,
  basculer,
  definirMinuterie,
  definirRepetitionVerset,
  definirRepeterSourate,
  definirVitesse,
  precedent,
  suivant,
  useLecteur,
  VITESSES,
} from '@/features/ecouter/lecteur';
import {
  DUREES_MINUTERIE,
  formatReste,
  minuterieDans,
  REPETITIONS_VERSET,
  resteMinuterie,
} from '@/features/ecouter/minuterie';
import { recitateur } from '@/features/ecouter/recitateurs';
import { sourateTelechargee, telechargerSourate, useTelechargements } from '@/features/ecouter/telechargements';
import { sourate, versetsDe } from '@/features/lire/coran';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Switch } from '@/ui/Switch';
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
  const versionTelechargements = useTelechargements((s) => s.version);
  const partTelechargee = useTelechargements((s) =>
    position ? s.enCours[`${idRecitateur}:${position.sourate}`] : undefined,
  );
  const telechargee = useMemo(
    () => versionTelechargements >= 0 && !!position && sourateTelechargee(idRecitateur, position.sourate),
    [versionTelechargements, position, idRecitateur],
  );
  const minuterie = useLecteur((s) => s.minuterie);
  const repetitionVerset = useLecteur((s) => s.repetitionVerset);
  const repeterSourate = useLecteur((s) => s.repeterSourate);
  // Le temps restant de la minuterie se redessine chaque seconde.
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (minuterie.type !== 'duree') return;
    const tic = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(tic);
  }, [minuterie]);
  const reste = resteMinuterie(minuterie, maintenant);

  const s = position ? sourate(position.sourate) : undefined;
  const texte = position ? versetsDe(position.sourate)[position.verset - 1] : undefined;

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        retour={t('ecouter.reduire')}
        titre={s?.nom ?? t('ecouter.titre')}
        sousTitre={recitateur(idRecitateur)?.nom}
        actions={
          position && page === null
            ? [
                {
                  icone: telechargee ? 'check' : 'download',
                  actif: telechargee,
                  label: telechargee ? t('telechargements.disponible') : t('ecouter.telechargerHorsLigne'),
                  onPress: () => {
                    if (telechargee || partTelechargee !== undefined) return;
                    telechargerSourate(idRecitateur, position.sourate).catch((e: unknown) =>
                      console.warn('Téléchargement interrompu', e),
                    );
                  },
                },
              ]
            : undefined
        }
      />
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
            {erreur ? (
              <Banner
                ton="attention"
                icone="offline"
                titre={t('etats.horsLigne')}
                action={{
                  label: t('etats.voirTelechargements'),
                  onPress: () => router.push('/ecouter/telechargements'),
                }}>
                {t('etats.horsLigneEcouter')}
              </Banner>
            ) : null}

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
              label={t('ecouter.vitesseLecture')}
              options={VITESSES.map((v) => ({ id: String(v), label: `${String(v).replace('.', ',')}×` }))}
              valeur={String(vitesse)}
              onChange={(id) => definirVitesse(Number(id))}
            />
            <SegmentedControl
              label={t('ecouter.repeterLeVerset')}
              options={REPETITIONS_VERSET.map((n) => ({
                id: String(n),
                label: n === 0 ? t('ecouter.sansFin') : t('ecouter.fois', { count: n }),
              }))}
              valeur={String(repetitionVerset)}
              onChange={(id) => {
                const choix = REPETITIONS_VERSET.find((n) => String(n) === id);
                if (choix !== undefined) definirRepetitionVerset(choix);
              }}
            />
            {page === null ? (
              <ListGroup>
                <ListItem
                  icone="repeat"
                  titre={t('ecouter.repeterSourate')}
                  droite={
                    <Switch
                      label={t('ecouter.repeterSourate')}
                      active={repeterSourate}
                      onChange={definirRepeterSourate}
                    />
                  }
                />
              </ListGroup>
            ) : null}
            <View style={{ gap: espace.espace2 }}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
                {reste !== null
                  ? t('ecouter.minuterieArret', { duree: formatReste(reste) })
                  : minuterie.type === 'finSourate'
                    ? t('ecouter.minuterieFinSourate')
                    : t('ecouter.minuterie')}
              </Text>
              <View style={[styles.puces, { gap: espace.espace2 }]}>
                <Chip selectionne={minuterie.type === 'aucune'} onPress={() => definirMinuterie({ type: 'aucune' })}>
                  {t('ecouter.minuterieOff')}
                </Chip>
                {DUREES_MINUTERIE.map((m) => (
                  <Chip key={m} selectionne={false} onPress={() => definirMinuterie(minuterieDans(m, Date.now()))}>
                    {t('ecouter.minutes', { count: m })}
                  </Chip>
                ))}
                <Chip
                  selectionne={minuterie.type === 'finSourate'}
                  onPress={() => definirMinuterie({ type: 'finSourate' })}>
                  {t('ecouter.minuterieFinSourate')}
                </Chip>
              </View>
            </View>
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
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
});
