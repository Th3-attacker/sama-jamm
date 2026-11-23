import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { DELAI_CIBLE_MS, cibleAtteinte, partEcoulee, tempsAuPoint, tempsAvance, type CibleBarre } from './barreTemps';

/** Largeur de la bulle d'heure, assez pour « 1:32:05 ». */
const BULLE = 80;

/** Rythme (ms) de l'avance continue de la barre entre deux mises à jour du lecteur. */
const PAS_AVANCE_MS = 100;

/** Avance maximale (ms) sans nouveau temps du lecteur : au-delà, la barre attend le lecteur. */
const ECOULE_MAX_MS = 1500;

export type BarreTempsProps = {
  /** Lu par les lecteurs d'écran. */
  label: string;
  /** Temps écoulé et durée, en secondes. */
  temps: number;
  duree: number;
  /** Appelé au relâchement du doigt (ou par les gestes d'accessibilité) avec le temps visé, en secondes. */
  onChercher?: (secondes: number) => void;
  /** Affichage d'un temps : « 3:05 ». */
  format: (secondes: number) => string;
  /** Pas des gestes d'accessibilité, en secondes. */
  pas?: number;
  /** Affiche à droite le temps restant (« −25:25 ») au lieu de la durée. */
  restant?: boolean;
  /** Lecture en cours : la barre avance sans attendre la prochaine mise à jour du lecteur. */
  enLecture?: boolean;
  /** Vitesse de lecture, pour l'avance continue. */
  vitesse?: number;
  /** Chargement en cours : une bande grise parcourt la barre, à la place d'un indicateur sur le bouton. */
  chargement?: boolean;
  /** Lu par les lecteurs d'écran pendant le chargement. */
  labelChargement?: string;
};

/** Bande grise qui parcourt la piste pendant le chargement ; fixe et plus claire si « Réduire les animations » est actif. */
function BandeChargement({ largeur }: { largeur: number }) {
  const { couleurs, rayon } = useTheme();
  const [x] = useState(() => new Animated.Value(0));
  const [reduit, setReduit] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduit)
      .catch((e: unknown) => console.warn('Préférence de mouvement illisible', e));
  }, []);
  const bande = Math.max(40, largeur * 0.3);
  useEffect(() => {
    if (reduit || largeur <= 0) return;
    x.setValue(-bande);
    const boucle = Animated.loop(
      Animated.timing(x, { toValue: largeur, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    );
    boucle.start();
    return () => boucle.stop();
  }, [reduit, largeur, bande, x]);
  if (reduit) {
    return <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: couleurs.encre3, opacity: 0.25 }]} />;
  }
  return (
    <Animated.View
      pointerEvents="none"
      style={{ position: 'absolute', top: 0, bottom: 0, width: bande, backgroundColor: couleurs.encre3, opacity: 0.45, borderRadius: rayon.rayonPastille, transform: [{ translateX: x }] }}
    />
  );
}

/** Barre de temps du lecteur : toucher ou glisser pour se placer, temps écoulé à gauche et durée à droite. */
export function BarreTemps({
  label,
  temps,
  duree,
  onChercher,
  format,
  pas = 15,
  restant = false,
  enLecture = false,
  vitesse = 1,
  chargement = false,
  labelChargement,
}: BarreTempsProps) {
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const [largeur, setLargeur] = useState(0);
  // Temps sous le doigt pendant le glissement ; la lecture n'est déplacée qu'au relâchement.
  const [glisse, setGlisse] = useState<number | null>(null);
  const actif = duree > 0 && onChercher !== undefined;
  const couleurProgres = couleurs.emeraude;
  const epaisseur = 2;
  // Après un relâchement, la barre reste sur le temps posé jusqu'à ce que la lecture l'ait rejoint (pas de retour en arrière).
  const [cibleGardee, setCibleGardee] = useState<CibleBarre | null>(null);
  // Entre deux mises à jour du lecteur, la barre avance seule : `ecoule` compte les millisecondes (à la vitesse de
  // lecture) depuis le dernier temps reçu, et repart de zéro à chaque nouveau temps.
  const [ecoule, setEcoule] = useState(0);
  const [dernierTemps, setDernierTemps] = useState(temps);
  if (temps !== dernierTemps) {
    setDernierTemps(temps);
    setEcoule(0);
    if (cibleGardee !== null && cibleAtteinte(cibleGardee, temps)) setCibleGardee(null);
  }
  const avance = enLecture && !chargement && glisse === null && cibleGardee === null && duree > 0;
  useEffect(() => {
    if (!cibleGardee) return;
    const delai = setTimeout(() => setCibleGardee(null), DELAI_CIBLE_MS);
    return () => clearTimeout(delai);
  }, [cibleGardee]);
  useEffect(() => {
    if (!avance) return;
    const tic = setInterval(() => setEcoule((e) => Math.min(e + PAS_AVANCE_MS * vitesse, ECOULE_MAX_MS)), PAS_AVANCE_MS);
    return () => clearInterval(tic);
  }, [avance, vitesse]);
  const affiche = glisse ?? cibleGardee?.valeur ?? tempsAvance(temps, ecoule, duree, avance);
  const part = partEcoulee(affiche, duree);
  const pouce = espace.espace3 + (glisse === null ? 0 : espace.espace1);
  const aPoint = (e: GestureResponderEvent) => tempsAuPoint(e.nativeEvent.locationX, largeur, duree);

  return (
    <View style={{ gap: espace.espace1 }}>
      {/* Bulle d'heure au-dessus du doigt pendant le glissement ; la lecture ne bouge qu'au relâchement. */}
      {glisse !== null && largeur > 0 ? (
        <View pointerEvents="none" style={{ height: 0 }}>
          <View
            style={[
              styles.bulle,
              {
                backgroundColor: couleurs.encre,
                borderRadius: rayon.rayonPastille,
                paddingHorizontal: espace.espace3,
                left: Math.min(Math.max(0, part * largeur - BULLE / 2), Math.max(0, largeur - BULLE)),
                width: BULLE,
              },
            ]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.fond, textAlign: 'center' }]}>
              {format(glisse)}
            </Text>
          </View>
        </View>
      ) : null}
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !actif }}
        accessibilityValue={{ min: 0, max: Math.round(duree), now: Math.round(affiche), text: format(affiche) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (!actif) return;
          onChercher?.(affiche + (e.nativeEvent.actionName === 'increment' ? pas : -pas));
        }}
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => actif}
        onMoveShouldSetResponder={() => actif}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => setGlisse(aPoint(e))}
        onResponderMove={(e) => setGlisse(aPoint(e))}
        onResponderRelease={(e) => {
          const cibleTemps = aPoint(e);
          setGlisse(null);
          setCibleGardee({ valeur: cibleTemps });
          onChercher?.(cibleTemps);
        }}
        onResponderTerminate={() => setGlisse(null)}
        style={[styles.zone, { height: cible.cibleIos }]}>
        {/* Les éléments dessinés ne captent pas le toucher : locationX reste mesuré sur toute la barre. */}
        <View
          pointerEvents="none"
          accessibilityLabel={chargement ? labelChargement : undefined}
          style={[styles.piste, { height: epaisseur, backgroundColor: couleurs.ligneForte, borderRadius: rayon.rayonPastille }]}>
          {chargement ? <BandeChargement largeur={largeur} /> : null}
          <View style={{ height: epaisseur, width: `${part * 100}%`, backgroundColor: couleurProgres, borderRadius: rayon.rayonPastille }} />
        </View>
        {duree > 0 ? (
          <View
            pointerEvents="none"
            style={[
              styles.pouce,
              {
                width: pouce,
                height: pouce,
                borderRadius: rayon.rayonPastille,
                backgroundColor: couleurProgres,
                left: part * largeur - pouce / 2,
                top: (cible.cibleIos - pouce) / 2,
              },
            ]}
          />
        ) : null}
      </View>
      <View style={styles.temps}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {format(affiche)}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
          {duree > 0 ? (restant ? `−${format(Math.max(0, duree - affiche))}` : format(duree)) : '–'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { justifyContent: 'center' },
  piste: { overflow: 'hidden' },
  pouce: { position: 'absolute' },
  bulle: { position: 'absolute', bottom: 4, paddingVertical: 4 },
  temps: { flexDirection: 'row', justifyContent: 'space-between' },
});
