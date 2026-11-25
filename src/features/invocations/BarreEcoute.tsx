import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { mettreEnPause, useLecteur } from '@/features/ecouter/lecteur';
import { formatTemps } from '@/features/ecouter/temps';
import { cible, espace as espaces, interlignes, rayon as rayons, tailles } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

import { partEcoutee } from './audio';
import { garderAudio, reseauDisponible, sourceAudio } from './audioLocal';

type Props = { idInvocation: string };

/** Au-delà, le chargement est abandonné avec un message (réseau très lent ou fichier introuvable). */
const DELAI_CHARGEMENT_MS = 15000;

// Planche « Invocations · lecture » : bouton lecture rond, « Écouter », barre d'avancement et temps écoulé.
// Une seule invocation à la fois : l'écran la monte avec `key` = identifiant, donc le lecteur est libéré (écoute arrêtée)
// quand on change d'invocation ou qu'on quitte l'écran.
export function BarreEcoute({ idInvocation }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const lecteur = useAudioPlayer(null);
  const statut = useAudioPlayerStatus(lecteur);
  const [charge, setCharge] = useState<string | null>(null);
  const [horsLigne, setHorsLigne] = useState(false);
  const [echec, setEchec] = useState(false);
  const [demande, setDemande] = useState(false);
  // Chargement : de l'appui jusqu'à ce que le fichier soit prêt dans le lecteur.
  const enChargement = demande && !statut.isLoaded;
  const coranEnLecture = useLecteur((s) => s.enLecture);

  // Le Coran démarre pendant l'invocation : l'invocation se met en pause.
  useEffect(() => {
    if (coranEnLecture && lecteur.playing) lecteur.pause();
  }, [coranEnLecture, lecteur]);

  useEffect(() => {
    if (!enChargement) return undefined;
    const minuteur = setTimeout(() => {
      lecteur.pause();
      setCharge(null);
      setDemande(false);
      setEchec(true);
    }, DELAI_CHARGEMENT_MS);
    return () => clearTimeout(minuteur);
  }, [enChargement, lecteur]);

  const basculer = async () => {
    if (demande && enChargement) return;
    if (statut.playing) {
      lecteur.pause();
      return;
    }
    if (charge !== idInvocation) {
      const source = sourceAudio(idInvocation);
      if (!source) return;
      setEchec(false);
      setDemande(true);
      if (!source.local && !(await reseauDisponible())) {
        setDemande(false);
        setHorsLigne(true);
        return;
      }
      setHorsLigne(false);
      setAudioModeAsync({ playsInSilentMode: true }).catch((erreur: unknown) => console.warn('Mode audio non appliqué', erreur));
      lecteur.replace(source.uri);
      setCharge(idInvocation);
      // Première écoute en ligne : le fichier est gardé sur le téléphone pour les fois suivantes.
      if (!source.local) void garderAudio(idInvocation);
    } else if (statut.duration > 0 && statut.currentTime >= statut.duration - 0.1) {
      await lecteur.seekTo(0);
    }
    // Une seule voix à la fois : le Coran se met en pause pendant l'invocation.
    mettreEnPause();
    lecteur.play();
  };

  const enLecture = statut.playing && charge === idInvocation;
  const part = charge === idInvocation ? partEcoutee(statut.currentTime, statut.duration) : 0;
  const temps = charge === idInvocation ? statut.currentTime : 0;

  return (
    <View style={{ gap: espace.espace2 }}>
      <View
        style={[
          styles.barre,
          { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte, padding: espace.espace3, gap: espace.espace3 },
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={enChargement ? t('invocations.chargementAudio') : enLecture ? t('invocations.pauseEcoute') : t('invocations.ecouterInvocation')}
          accessibilityState={{ busy: enChargement }}
          onPress={() => void basculer()}
          style={[styles.lecture, { backgroundColor: couleurs.emeraudeAplat }]}>
          {enChargement ? <ActivityIndicator color={couleurs.surEmeraude} /> : <Icon name={enLecture ? 'pause' : 'play'} size={22} color={couleurs.surEmeraude} />}
        </Pressable>
        <View style={styles.milieu}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, ligne(styles.titre), { color: couleurs.encre }]}>
            {t('invocations.ecouter')}
          </Text>
          <View
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={t('invocations.avancementEcoute')}
            accessibilityValue={{ min: 0, max: 100, now: Math.round(part * 100) }}
            style={[styles.piste, { backgroundColor: couleurs.ligneForte }]}>
            <View style={[styles.remplie, { backgroundColor: couleurs.or, width: `${part * 100}%` }]} />
          </View>
        </View>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.temps), { color: couleurs.encre2 }]}>
          {formatTemps(temps)}
        </Text>
      </View>
      {horsLigne || echec ? (
        <Text
          accessibilityRole="alert"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.corps, ligne(styles.message), { color: couleurs.encre2 }]}>
          {horsLigne ? t('invocations.audioHorsLigne') : t('invocations.audioIndisponible')}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  barre: { flexDirection: 'row', alignItems: 'center', borderWidth: StyleSheet.hairlineWidth },
  lecture: { width: cible.cibleAndroid, height: cible.cibleAndroid, borderRadius: rayons.rayonPastille, alignItems: 'center', justifyContent: 'center' },
  milieu: { flex: 1, gap: espaces.espace2 },
  titre: { fontSize: tailles.t16, lineHeight: interlignes.l24 },
  piste: { height: 4, borderRadius: 2, overflow: 'hidden' },
  remplie: { height: 4, borderRadius: 2 },
  temps: { fontSize: tailles.t14, lineHeight: interlignes.l20, fontVariant: ['tabular-nums'] },
  message: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
});
