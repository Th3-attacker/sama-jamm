import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  arreter,
  basculer,
  chercherSourate,
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
import { tempsSourate } from '@/features/ecouter/durees';
import { dureesDe, VERSETS_PAR_SOURATE } from '@/features/ecouter/dureesDonnees';
import { recitateur } from '@/features/ecouter/recitateurs';
import { sourateTelechargee, telechargerSourate, useTelechargements, WifiRequis } from '@/features/ecouter/telechargements';
import { reperes, sourate, versetsDe } from '@/features/lire/coran';
import { cleVerset, useFavoris } from '@/stores/favoris';
import { formatTemps } from '@/features/ecouter/temps';
import { AnneauProgression } from '@/ui/AnneauProgression';
import { pourcentage } from '@/ui/anneau';
import { BarreTemps } from '@/ui/BarreTemps';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { BottomSheet } from '@/ui/BottomSheet';
import { Button } from '@/ui/Button';
import { Chip } from '@/ui/Chip';
import { Icon } from '@/ui/Icon';
import { IconButton } from '@/ui/IconButton';
import { useToast } from '@/ui/Toast';
import { SegmentedControl } from '@/ui/SegmentedControl';
import { Slider } from '@/ui/Slider';

import { interlignes, tailles } from '@/theme/tokens.generated';
type Repetition = 'non' | 'verset' | 'sourate';

/** Lecteur du Coran : anneau de progression, verset récité avec ses voisins, commandes ; réglages dans la feuille « Écoute ». */
export default function LecteurPleinEcran() {
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
  const favoris = useFavoris((st) => st.versets);
  const basculerFavori = useFavoris((st) => st.basculer);
  const tempsPiste = useLecteur((s) => (s.position ? s.temps : 0));
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
  const texte = position ? arabes[position.verset - 1] : undefined;
  const apres = position ? arabes[position.verset] : undefined;

  // Pochette : plus petite sur un écran bas.
  const COTE_POCHETTE = height < 700 ? 170 : 260;
  // Temps de la sourate d'après la durée des versets du récitateur ; sans durées, on garde « Verset N sur M ».
  const temps = useMemo(
    () => (position ? tempsSourate(dureesDe(idRecitateur), VERSETS_PAR_SOURATE, position.sourate, position.verset, tempsPiste) : null),
    [idRecitateur, position, tempsPiste],
  );

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
              style={[typographie.legende, styles.surtitre, { color: couleurs.encre3 }]}>
              {t('ecouter.enLecture')}
            </Text>
            <Text
              numberOfLines={1}
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre }]}>
              {s && page === null
                ? `${t('lire.sourate')} ${s.n} · ${t('lire.juz', { n: reperes().juzDe(s.n, position?.verset ?? 1) })}`
                : (s?.nom ?? t('ecouter.titre'))}
            </Text>
          </View>
          {position && page === null && partTelechargee !== undefined ? (
            <AnneauProgression part={partTelechargee} label={t('telechargements.progression', { part: pourcentage(partTelechargee) })} />
          ) : position && page === null ? (
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
              contentContainerStyle={[styles.centreScroll, { paddingHorizontal: espace.espace6, paddingTop: espace.espace2 }]}>
              {/* Planche « Lecteur audio » : pochette en vert plein avec le nom arabe, puis titre et récitateur. */}
              <View
                accessible={false}
                style={[
                  styles.pochette,
                  { width: COTE_POCHETTE, height: COTE_POCHETTE, backgroundColor: couleurs.emeraudeAplat, borderRadius: rayon.rayonFeuille },
                ]}>
                <Text
                  accessibilityLanguage="ar"
                  allowFontScaling={false}
                  style={[styles.nomPochette, { color: couleurs.orSurEmeraude }]}>
                  {s.arabe}
                </Text>
              </View>
              {/* Planche : titre et récitateur à gauche, marque-page à droite (favori du verset en cours). */}
              <View style={[styles.titreLigne, { marginTop: espace.espace6 }]}>
                <View style={styles.titres}>
                  <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, { color: couleurs.encre }]}>
                    {s.nom}
                  </Text>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
                    {recitateur(idRecitateur)?.nom}
                  </Text>
                </View>
                <IconButton
                  icone="bookmark"
                  actif={favoris.includes(cleVerset(position.sourate, position.verset))}
                  label={t(favoris.includes(cleVerset(position.sourate, position.verset)) ? 'lire.favoriRetirer' : 'lire.favoriAjouter')}
                  onPress={() => {
                    if (basculerFavori(position.sourate, position.verset)) afficher({ texte: t('lire.favoriAjoute'), icone: 'check' });
                  }}
                />
              </View>

              {erreur ? (
                <View style={[styles.blocBarre, { marginTop: espace.espace4 }]}>
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
                </View>
              ) : null}

              <View style={[styles.blocBarre, { marginTop: espace.espace3 }]}>
                {temps ? (
                  // Glissable en écoute par sourate ; en écoute page par page, la barre s'affiche sans se déplacer.
                  <BarreTemps
                    label={t('ecouter.positionSourate')}
                    temps={temps.ecoule}
                    duree={temps.total}
                    onChercher={page === null ? chercherSourate : undefined}
                    format={formatTemps}
                    pas={15}
                    restant
                  />
                ) : (
                  // Sans durées : « Verset N sur M » comme avant.
                  <Text
                    maxFontSizeMultiplier={echelleMax.courant}
                    style={[typographie.legende, styles.centre, { color: couleurs.encre3 }]}>
                    {page !== null
                      ? `${t('lire.pageN', { n: page })} · ${t('ecouter.versetSur', { n: position.verset, total: s.versets })}`
                      : t('ecouter.versetSur', { n: position.verset, total: s.versets })}
                  </Text>
                )}
              </View>

            <View style={[styles.commandes, { marginTop: espace.espace3 }]}>
              <IconButton
                icone="reset"
                label={t('ecouter.repeterLeVerset')}
                taille={24}
                couleur={repetition === 'non' ? couleurs.encre2 : couleurs.emeraude}
                onPress={() => setFeuille(true)}
              />
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
              <View>
                <IconButton
                  icone="moon"
                  label={etiquetteMinuterie}
                  taille={24}
                  couleur={reste !== null || minuterie.type === 'finSourate' ? couleurs.emeraude : couleurs.encre2}
                  onPress={() => setFeuille(true)}
                />
                {reste !== null || minuterie.type === 'finSourate' ? (
                  <View pointerEvents="none" style={[styles.pointMinuterie, { backgroundColor: couleurs.or, borderRadius: rayon.rayonPastille }]} />
                ) : null}
              </View>
            </View>

              {/* Planche « Lecteur défilé » : sous les commandes, le verset en cours puis la suite. */}
              <View style={{ alignSelf: 'stretch', gap: espace.espace2, marginTop: espace.espace6 }}>
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.surtitre, { color: couleurs.encre3 }]}>
                  {t('ecouter.versetEnCours')}
                </Text>
              {texte ? (
                <Text
                  accessibilityLanguage="ar"
                  maxFontSizeMultiplier={echelleMax.grand}
                  style={[typographie.coran, styles.versetCourant, styles.arabe, { color: couleurs.encre }]}>
                  {texte}
                </Text>
              ) : null}
              {apres ? (
                <>
                  <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, styles.surtitre, { color: couleurs.encre3, marginTop: espace.espace4 }]}>
                    {t('ecouter.aSuivre')}
                  </Text>
                  {/* Texte sacré : jamais tronqué. */}
                  <Text
                    accessibilityLanguage="ar"
                    maxFontSizeMultiplier={echelleMax.grand}
                    style={[typographie.arabe, styles.arabe, { color: couleurs.encre3 }]}>
                    {apres}
                  </Text>
                </>
              ) : null}
              </View>
            </ScrollView>
          </>
        ) : (
          <View style={{ padding: espace.espace5 }}>
            <Banner ton="info">{t('ecouter.rien')}</Banner>
          </View>
        )}

        <BottomSheet ouvert={feuille} titre={t('ecouter.titreFeuille')} onFermer={() => setFeuille(false)}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
            {t('ecouter.arreterLaLecture')}
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
          <Slider
            label={t('ecouter.vitesse')}
            valeurs={VITESSES}
            valeur={vitesse}
            onChange={definirVitesse}
            format={(v) => `${String(v).replace('.', ',')} ×`}
          />
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
  surtitre: { letterSpacing: 0.7, textTransform: 'uppercase' },
  pochette: { alignItems: 'center', justifyContent: 'center' },
  nomPochette: { fontFamily: 'Amiri_700Bold', fontSize: 58, lineHeight: 80 },
  titreLigne: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'flex-start' },
  titres: { flex: 1, alignItems: 'flex-start' },
  centreScroll: { alignItems: 'center', flexGrow: 1, justifyContent: 'flex-start' },
  blocBarre: { alignSelf: 'stretch' },
  pointMinuterie: { position: 'absolute', top: 8, end: 8, width: 8, height: 8 },
  centre: { textAlign: 'center' },
  // Planche : verset en cours 34/64, vitesse 16/24, minuterie 14/20.
  versetCourant: { fontSize: tailles.t34, lineHeight: interlignes.l64 },
  resumeMinuterie: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  arabe: { textAlign: 'center', writingDirection: 'rtl', alignSelf: 'stretch' },
  commandes: { alignSelf: 'stretch', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  principal: { alignItems: 'center', justifyContent: 'center' },
  puces: { flexDirection: 'row', flexWrap: 'wrap' },
});
