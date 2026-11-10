import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

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
import { sourateTelechargee, telechargerSourate, useTelechargements, WifiRequis } from '@/features/ecouter/telechargements';
import { sourate, traductionDe, versetsDe } from '@/features/lire/coran';
import { LecteurXassaide } from '@/features/xassaides/LecteurXassaide';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { Logo } from '@/ui/Logo';
import { useToast } from '@/ui/Toast';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Slider } from '@/ui/Slider';

type Repetition = 'non' | 'verset' | 'sourate';

/** Lecteur plein écran : celui des xassaïdes quand une piste est en cours, sinon celui du Coran. */
export default function LecteurPleinEcran() {
  const xassaide = useLecteur((s) => s.piste !== null);
  return xassaide ? <LecteurXassaide /> : <LecteurCoran />;
}

/** Lecteur du Coran : anneau de progression, verset récité avec ses voisins, commandes ; réglages dans la feuille « Écoute ». */
function LecteurCoran() {
  const { t } = useTranslation();
  const { afficher } = useToast();
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
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
  const [feuille, setFeuille] = useState(false);
  // Durée choisie dans la feuille, pour la surligner pendant que le temps restant s'écoule.
  const [dureeChoisie, setDureeChoisie] = useState<number | null>(null);
  // Le temps restant de la minuterie se redessine chaque seconde.
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    if (minuterie.type !== 'duree') return;
    const tic = setInterval(() => setMaintenant(Date.now()), 1000);
    return () => clearInterval(tic);
  }, [minuterie]);
  const reste = resteMinuterie(minuterie, maintenant);

  const s = position ? sourate(position.sourate) : undefined;
  const arabes = position ? versetsDe(position.sourate) : [];
  const traductions = position ? traductionDe(position.sourate) : [];
  const texte = position ? arabes[position.verset - 1] : undefined;
  const avant = position ? arabes[position.verset - 2] : undefined;
  const apres = position ? arabes[position.verset] : undefined;
  const trad = position ? traductions[position.verset - 1] : undefined;

  // Anneau : avancée dans la sourate, par versets (la durée du son n'est pas connue à l'avance).
  const TAILLE_ANNEAU = height < 700 ? 150 : 220;
  const RAYON = TAILLE_ANNEAU / 2 - 8;
  const circonference = 2 * Math.PI * RAYON;
  const avance = position && s ? position.verset / s.versets : 0;

  const repetition: Repetition = repeterSourate ? 'sourate' : repetitionVerset === 1 ? 'non' : 'verset';
  const choisirRepetition = (r: Repetition) => {
    if (r === 'non') {
      definirRepetitionVerset(1);
      definirRepeterSourate(false);
    } else if (r === 'verset') {
      definirRepeterSourate(false);
      if (repetitionVerset === 1) definirRepetitionVerset(3);
    } else {
      definirRepetitionVerset(1);
      definirRepeterSourate(true);
    }
  };

  const etiquetteMinuterie =
    reste !== null
      ? t('ecouter.minuterieSommeilDuree', { duree: formatReste(reste) })
      : minuterie.type === 'finSourate'
        ? t('ecouter.minuterieSommeilDuree', { duree: t('ecouter.minuterieFinSourate') })
        : t('ecouter.minuterieSommeil');

  return (
      <View
        style={[
          styles.ecran,
          { backgroundColor: couleurs.fond, paddingTop: insets.top + espace.espace2, paddingBottom: Math.max(insets.bottom, espace.espace5) },
        ]}>
        <View style={[styles.entete, { paddingHorizontal: espace.espace4 }]}>
          <IconButton icone="chevron-down" label={t('ecouter.reduire')} onPress={() => router.back()} />
          <View style={styles.titres}>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre }]}>
              {s?.nom ?? t('ecouter.titre')}
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.legende, { color: couleurs.encre3 }]}>
              {recitateur(idRecitateur)?.nom}
            </Text>
          </View>
          {position && page === null ? (
            <IconButton
              icone={telechargee ? 'check-circle' : 'download'}
              couleur={telechargee ? couleurs.emeraude : undefined}
              label={telechargee ? t('telechargements.disponible') : t('ecouter.telechargerHorsLigne')}
              onPress={() => {
                if (telechargee || partTelechargee !== undefined) return;
                telechargerSourate(idRecitateur, position.sourate).catch((e: unknown) => {
                  console.warn('Téléchargement interrompu', e);
                  if (e instanceof WifiRequis) afficher({ texte: t('telechargements.wifiRequis'), icone: 'offline' });
                });
              }}
            />
          ) : (
            <View style={{ width: cible.cibleIos }} />
          )}
        </View>

        {position && s ? (
          <>
            <ScrollView
              contentContainerStyle={[styles.centreScroll, { paddingHorizontal: espace.espace6, gap: espace.espace2 }]}>
              <View style={{ width: TAILLE_ANNEAU, height: TAILLE_ANNEAU, alignItems: 'center', justifyContent: 'center' }}>
                <Svg width={TAILLE_ANNEAU} height={TAILLE_ANNEAU} style={StyleSheet.absoluteFill}>
                  <Circle
                    cx={TAILLE_ANNEAU / 2}
                    cy={TAILLE_ANNEAU / 2}
                    r={RAYON}
                    fill="none"
                    stroke={couleurs.surface}
                    strokeWidth={6}
                  />
                  <Circle
                    cx={TAILLE_ANNEAU / 2}
                    cy={TAILLE_ANNEAU / 2}
                    r={RAYON}
                    fill="none"
                    stroke={couleurs.or}
                    strokeWidth={6}
                    strokeLinecap="round"
                    strokeDasharray={circonference}
                    strokeDashoffset={circonference * (1 - avance)}
                    rotation={-90}
                    origin={`${TAILLE_ANNEAU / 2}, ${TAILLE_ANNEAU / 2}`}
                  />
                </Svg>
                <Logo taille={TAILLE_ANNEAU - 30} />
              </View>

              {erreur ? (
                <Banner
                  ton="attention"
                  icone="offline"
                  titre={t('etats.horsLigne')}
                  action={{
                    label: t('etats.voirTelechargements'),
                    onPress: () => router.push('/plus/telechargements'),
                  }}>
                  {t('etats.horsLigneEcouter')}
                </Banner>
              ) : null}

              {/* Le verset en cours, entouré du précédent et du suivant. */}
              {avant ? (
                <Text
                  accessibilityLanguage="ar"
                  numberOfLines={1}
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.arabe, styles.arabe, { color: couleurs.encre3 }]}>
                  {avant}
                </Text>
              ) : null}
              {texte ? (
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.coran, styles.versetCourant, styles.arabe, { color: couleurs.encre }]}>
                  {texte}
                </Text>
              ) : null}
              {trad ? (
                <Text
                  maxFontSizeMultiplier={echelleMax.courant}
                  style={[typographie.lecture, styles.traduction, styles.centre, { color: couleurs.encre2 }]}>
                  {trad}
                </Text>
              ) : null}
              {apres ? (
                <Text
                  accessibilityLanguage="ar"
                  numberOfLines={1}
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.arabe, styles.arabe, { color: couleurs.encre3 }]}>
                  {apres}
                </Text>
              ) : null}
            </ScrollView>

            <View style={{ paddingHorizontal: espace.espace6, gap: espace.espace2 }}>
              <View
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 0, max: s.versets, now: position.verset }}
                style={[styles.piste, { backgroundColor: couleurs.surface }]}>
                <View style={[styles.remplissage, { width: `${Math.round(avance * 100)}%`, backgroundColor: couleurs.or }]} />
              </View>
              <Text
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
                {page !== null
                  ? `${t('lire.pageN', { n: page })} · ${t('ecouter.versetSur', { n: position.verset, total: s.versets })}`
                  : t('ecouter.versetSur', { n: position.verset, total: s.versets })}
              </Text>
            </View>

            <View style={[styles.commandes, { paddingHorizontal: espace.espace6, marginTop: espace.espace4 }]}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('ecouter.vitesseLecture')}
                onPress={() => setFeuille(true)}
                style={styles.commandeSimple}>
                <Text maxFontSizeMultiplier={echelleMax.onglets} style={[typographie.libelle, styles.vitesse, { color: couleurs.encre }]}>
                  {`${String(vitesse).replace('.', ',')}×`}
                </Text>
              </Pressable>
              <IconButton icone="skip-back" label={t('ecouter.precedent')} taille={26} couleur={couleurs.encre} onPress={precedent} />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={enLecture ? t('commun.pause') : t('commun.ecouter')}
                onPress={basculer}
                style={({ pressed }) => [
                  styles.principal,
                  {
                    width: 72,
                    height: 72,
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
              <IconButton icone="skip-forward" label={t('ecouter.suivant')} taille={26} couleur={couleurs.encre} onPress={suivant} />
              <IconButton
                icone="reset"
                label={t('ecouter.repeterLeVerset')}
                taille={24}
                couleur={repetition === 'non' ? couleurs.encre : couleurs.emeraude}
                onPress={() => setFeuille(true)}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={etiquetteMinuterie}
              onPress={() => setFeuille(true)}
              style={[
                styles.minuterie,
                { borderColor: couleurs.ligneForte, borderRadius: rayon.rayonPastille, gap: espace.espace2, marginTop: espace.espace4 },
              ]}>
              <Icon name="moon" size={18} color={couleurs.encre} />
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.texteMinuterie, { color: couleurs.encre }]}>
                {etiquetteMinuterie}
              </Text>
            </Pressable>
          </>
        ) : (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="info">{t('ecouter.rien')}</Banner>
          </View>
        )}

        <BottomSheet ouvert={feuille} titre={t('ecouter.titreFeuille')} onFermer={() => setFeuille(false)}>
          <Slider
            label={t('ecouter.vitesse')}
            valeurs={VITESSES}
            valeur={vitesse}
            onChange={definirVitesse}
            format={(v) => `${String(v).replace('.', ',')} ×`}
          />
          <SegmentedControl
            label={t('ecouter.repeter')}
            options={[
              { id: 'non', label: t('ecouter.repetitionNon') },
              { id: 'verset', label: t('ecouter.repeterVerset') },
              ...(page === null ? [{ id: 'sourate', label: t('ecouter.repeterSourate') }] : []),
            ]}
            valeur={repetition}
            onChange={(id) => {
              if (id === 'non' || id === 'verset' || id === 'sourate') choisirRepetition(id);
            }}
          />
          {repetition === 'verset' ? (
            <View style={[styles.puces, { gap: espace.espace2 }]}>
              {REPETITIONS_VERSET.filter((n) => n !== 1).map((n) => (
                <Chip key={n} selectionne={repetitionVerset === n} onPress={() => definirRepetitionVerset(n)}>
                  {n === 0 ? t('ecouter.sansFin') : t('ecouter.fois', { count: n })}
                </Chip>
              ))}
            </View>
          ) : null}
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('ecouter.minuterie')}
          </Text>
          <View style={[styles.puces, { gap: espace.espace2 }]}>
            <Chip
              selectionne={minuterie.type === 'aucune'}
              onPress={() => {
                setDureeChoisie(null);
                definirMinuterie({ type: 'aucune' });
              }}>
              {t('ecouter.minuterieOff')}
            </Chip>
            {DUREES_MINUTERIE.map((m) => (
              <Chip
                key={m}
                selectionne={minuterie.type === 'duree' && dureeChoisie === m}
                onPress={() => {
                  setDureeChoisie(m);
                  definirMinuterie(minuterieDans(m, Date.now()));
                }}>
                {t('ecouter.minutes', { count: m })}
              </Chip>
            ))}
            <Chip
              selectionne={minuterie.type === 'finSourate'}
              onPress={() => {
                setDureeChoisie(null);
                definirMinuterie({ type: 'finSourate' });
              }}>
              {t('ecouter.minuterieFinSourate')}
            </Chip>
          </View>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.resumeMinuterie, { color: couleurs.encre3 }]}>
            {reste !== null
              ? t('ecouter.minuterieArret', { duree: formatReste(reste) })
              : minuterie.type === 'finSourate'
                ? t('ecouter.minuterieResumeFinSourate')
                : t('ecouter.minuterieResumeAucune')}
          </Text>
          <Button
            variant="discret"
            pleineLargeur
            onPress={() => {
              setFeuille(false);
              arreter();
              router.back();
            }}>
            {t('ecouter.arreter')}
          </Button>
        </BottomSheet>
      </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  entete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  titres: { flex: 1, alignItems: 'center' },
  centreScroll: { alignItems: 'center', flexGrow: 1, justifyContent: 'center' },
  centre: { textAlign: 'center' },
  // Planche : verset en cours 34/64, traduction 16/24, vitesse 16/24, minuterie 14/20.
  versetCourant: { fontSize: 34, lineHeight: 64 },
  traduction: { fontSize: 16, lineHeight: 24 },
  vitesse: { fontSize: 16, lineHeight: 24 },
  texteMinuterie: { fontSize: 14, lineHeight: 20 },
  resumeMinuterie: { fontSize: 14, lineHeight: 20 },
  arabe: { textAlign: 'center', writingDirection: 'rtl', alignSelf: 'stretch' },
  piste: { height: 4, borderRadius: 999, overflow: 'hidden' },
  remplissage: { height: 4, borderRadius: 999 },
  commandes: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  commandeSimple: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  principal: { alignItems: 'center', justifyContent: 'center' },
  minuterie: {
    alignSelf: 'center',
    minHeight: 40,
    paddingHorizontal: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
});
