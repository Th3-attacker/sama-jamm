// Démarrage animé (maquettes « Démarrage animé » et « étape par étape ») : relais du démarrage natif, signature,
// puis fondu vers l'app. Moins d'une seconde ; l'app se charge dessous, l'animation ne la retarde jamais.
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, useColorScheme } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { echelleMax } from '@/theme/typographie';
import { themes } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';
import { Logo } from '@/ui/Logo';

/** Même image et même largeur que le démarrage natif (plugin expo-splash-screen, `imageWidth`). */
const LARGEUR_IMAGE = 76;
const RELAIS_MS = 150;
const SIGNATURE_MS = 500;
const FONDU_MS = 200;
/** Signature tenue avant le fondu, le temps de la lire (1,2 s au total). */
const TENUE_MS = 400;
const COURBE = Easing.bezier(0.2, 0.8, 0.2, 1);

export function DemarrageAnime({ onFin }: { onFin: () => void }) {
  const { t } = useTranslation();
  const { espace, typographie, latin } = useTheme();
  const reduit = useReducedMotion();
  // Même image que le démarrage natif, qui suit le mode du téléphone (pas le thème choisi dans l'app).
  const sombre = useColorScheme() === 'dark';
  // Mêmes couleurs que le démarrage natif (mode du téléphone), même si l'app a un autre thème : aucun saut.
  const couleurs = (sombre ? themes.nuit : themes.jour).couleurs;
  const marque = useSharedValue(0);
  const filet = useSharedValue(0);
  const signature = useSharedValue(0);
  const ecran = useSharedValue(1);

  useEffect(() => {
    const anim = (duree: number) => ({ duration: reduit ? 0 : duree, easing: COURBE });
    const signatureMs = reduit ? 0 : SIGNATURE_MS + TENUE_MS;
    marque.value = withDelay(RELAIS_MS, withTiming(1, anim(SIGNATURE_MS)));
    filet.value = withDelay(RELAIS_MS + 100, withTiming(1, anim(SIGNATURE_MS - 100)));
    signature.value = withDelay(RELAIS_MS + 50, withTiming(1, anim(SIGNATURE_MS - 50)));
    ecran.value = withDelay(RELAIS_MS + signatureMs, withTiming(0, { duration: FONDU_MS }));
    const fin = setTimeout(onFin, RELAIS_MS + signatureMs + FONDU_MS);
    return () => clearTimeout(fin);
  }, [reduit, marque, filet, signature, ecran, onFin]);

  const styleEcran = useAnimatedStyle(() => ({ opacity: ecran.value }));
  const styleMarque = useAnimatedStyle(() => ({
    transform: [{ translateY: -56 * marque.value }, { scale: 1 - 0.25 * marque.value }],
  }));
  const styleFilet = useAnimatedStyle(() => ({ width: 64 * filet.value }));
  const styleSignature = useAnimatedStyle(() => ({
    opacity: signature.value,
    transform: [{ translateY: 10 * (1 - signature.value) }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityLabel={t('demarrage.traduction')}
      style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: couleurs.fond }, styleEcran]}>
      <Animated.View style={styleMarque}>
        <Logo taille={LARGEUR_IMAGE} selon="telephone" />
      </Animated.View>
      <Animated.View style={[styles.bas, { gap: espace.espace2 }, styleSignature]}>
        <Animated.View style={[styles.filet, { backgroundColor: couleurs.or }, styleFilet]} />
        <Text
          accessibilityLanguage="wo"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[latin.titre3, { color: couleurs.emeraude, writingDirection: 'ltr' }]}>
          {t('demarrage.signature')}
        </Text>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.translitteration, { color: couleurs.encre2 }]}>
          {t('demarrage.traduction')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  // La signature prend la place laissée par la marque qui monte.
  bas: { position: 'absolute', top: '50%', marginTop: 8, alignItems: 'center' },
  filet: { height: 1.5, borderRadius: 1 },
});
