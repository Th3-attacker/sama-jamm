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
import { espace, tailles, themes } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';
import { Logo } from '@/ui/Logo';

/** Même image et même largeur que le démarrage natif (plugin expo-splash-screen, `imageWidth`). */
const LARGEUR_IMAGE = 120;
const RELAIS_MS = 150;
const SIGNATURE_MS = 500;
/** Pause marque et signature en place, avant le fondu : assez pour les lire (total d'environ 1,4 s). */
const PAUSE_MS = 500;
/** « Réduire les animations » : pas de mouvement, la marque reste en place un peu plus longtemps. */
const PAUSE_REDUITE_MS = 600;
const FONDU_MS = 250;
const COURBE = Easing.bezier(0.2, 0.8, 0.2, 1);

export function DemarrageAnime({ onFin }: { onFin: () => void }) {
  const { t, i18n } = useTranslation();
  const { typographie, latin, ligne } = useTheme();
  const reduit = useReducedMotion();
  const arabe = i18n.language === 'ar';
  // Même image que le démarrage natif, qui suit le mode du téléphone (pas le thème choisi dans l'app).
  const sombre = useColorScheme() === 'dark';
  // Mêmes couleurs que le démarrage natif (mode du téléphone), même si l'app a un autre thème : aucun saut.
  const couleurs = (sombre ? themes.nuit : themes.jour).couleurs;
  const marque = useSharedValue(0);
  const filet = useSharedValue(0);
  const signature = useSharedValue(0);
  const ecran = useSharedValue(1);

  useEffect(() => {
    // 0 à 150 ms : relais ; 150 à 650 ms : signature ; 650 à 1150 ms : pause ; 1150 à 1400 ms : fondu vers l'app.
    // « Réduire les animations » : pas de mouvement, la marque reste en place, pause puis fondu.
    const anim = (duree: number) => ({ duration: duree, easing: COURBE });
    const signatureMs = reduit ? 0 : SIGNATURE_MS;
    if (!reduit) {
      marque.value = withDelay(RELAIS_MS, withTiming(1, anim(SIGNATURE_MS)));
      filet.value = withDelay(RELAIS_MS + 100, withTiming(1, anim(SIGNATURE_MS - 100)));
      signature.value = withDelay(RELAIS_MS + 50, withTiming(1, anim(SIGNATURE_MS - 50)));
    }
    const debutFondu = RELAIS_MS + signatureMs + (reduit ? PAUSE_REDUITE_MS : PAUSE_MS);
    ecran.value = withDelay(debutFondu, withTiming(0, { duration: FONDU_MS }));
    const fin = setTimeout(onFin, debutFondu + FONDU_MS);
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
      accessibilityLabel={`Sama Jàmm. ${t('demarrage.traduction')}`}
      style={[StyleSheet.absoluteFill, styles.centre, { backgroundColor: couleurs.fond }, styleEcran]}>
      <Animated.View style={styleMarque}>
        <Logo taille={LARGEUR_IMAGE} selon="telephone" />
      </Animated.View>
      <Animated.View style={[styles.bas, { gap: espace.espace2 }, styleSignature]}>
        <Animated.View style={[styles.filet, { backgroundColor: couleurs.or }, styleFilet]} />
        <Text
          accessibilityLanguage="wo"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[
            latin.titre1,
            ligne(styles.signature),
            { color: sombre ? couleurs.encre : couleurs.emeraude, writingDirection: 'ltr' },
          ]}>
          {t('demarrage.signature')}
        </Text>
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[arabe ? ligne(styles.sousTitreAr) : typographie.translitteration, { color: couleurs.encre2 }]}>
          {t('demarrage.traduction')}
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centre: { alignItems: 'center', justifyContent: 'center' },
  // La signature prend la place laissée par la marque qui monte.
  bas: { position: 'absolute', top: '50%', marginTop: espace.espace2, alignItems: 'center' },
  filet: { height: 1.5, borderRadius: 1 },
  // Planche : Cormorant 600, 28 sur 32, centré.
  signature: { fontSize: tailles.t28, lineHeight: 32, textAlign: 'center' },
  // Interface en arabe : sous-titre en Amiri 17.
  sousTitreAr: { fontFamily: 'Amiri_400Regular', fontSize: 17, lineHeight: 26, textAlign: 'center', includeFontPadding: false, textAlignVertical: 'center' },
});
