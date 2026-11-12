import { useEffect, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Animated,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { IconButton } from './IconButton';

import { espace } from '@/theme/tokens.generated';
export type BottomSheetProps = {
  ouvert: boolean;
  titre: string;
  /** Appelé au toucher du voile, au retour Android et au « × ». */
  onFermer: () => void;
  children?: ReactNode;
};

/** Part de l'écran utile que la feuille peut occuper ; au-delà, le contenu défile. */
const HAUTEUR_MAX = 0.9;
const DUREE = 220;

/** Hauteur du clavier ouvert, 0 s'il est fermé (iOS et Android). */
function useHauteurClavier(): number {
  const [hauteur, setHauteur] = useState(0);
  useEffect(() => {
    const ouvre = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow', (e) =>
      setHauteur(e.endCoordinates.height),
    );
    const ferme = Keyboard.addListener(Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide', () =>
      setHauteur(0),
    );
    return () => {
      ouvre.remove();
      ferme.remove();
    };
  }, []);
  return hauteur;
}

// Feuille du bas identique sur iOS et Android : un `Modal` transparent, un voile et une carte qui prend la hauteur de
// son contenu (90 % de l'écran utile au plus). Le clavier est compté une seule fois : la carte remonte de sa hauteur
// (le `Modal` ne se redimensionne pas toujours avec le clavier, surtout sur Android bord à bord) et se raccourcit
// d'autant, de sorte que le champ actif reste visible.
export function BottomSheet({ ouvert, titre, onFermer, children }: BottomSheetProps) {
  const { t } = useTranslation();
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const clavier = useHauteurClavier();
  // La fenêtre reste montée le temps de l'animation de fermeture.
  const [monte, setMonte] = useState(ouvert);
  const [progres] = useState(() => new Animated.Value(ouvert ? 1 : 0));

  // Ajustement pendant le rendu (et non dans un effet) : la fenêtre se monte dès que la feuille s'ouvre.
  if (ouvert && !monte) setMonte(true);

  useEffect(() => {
    const anim = Animated.timing(progres, {
      toValue: ouvert ? 1 : 0,
      duration: DUREE,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    anim.start(({ finished }) => {
      if (finished && !ouvert) setMonte(false);
    });
    return () => anim.stop();
  }, [ouvert, progres]);

  if (!monte) return null;

  const espaceUtile = height - insets.top;
  const hauteurMax = Math.min(espaceUtile * HAUTEUR_MAX, espaceUtile - clavier);
  const bas = clavier > 0 ? clavier : insets.bottom;
  const translation = progres.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });

  return (
    <Modal transparent statusBarTranslucent animationType="none" visible onRequestClose={onFermer}>
      <View style={styles.fenetre}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: progres, backgroundColor: couleurs.voile }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('commun.fermer')}
            onPress={onFermer}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.carte,
            {
              maxHeight: hauteurMax,
              marginBottom: clavier > 0 ? clavier : 0,
              backgroundColor: couleurs.surface,
              borderTopLeftRadius: rayon.rayonFeuille,
              borderTopRightRadius: rayon.rayonFeuille,
              transform: [{ translateY: translation }],
            },
          ]}>
          <View style={[styles.poignee, { backgroundColor: couleurs.ligneForte }]} />
          <ScrollView
            // Un toucher sur un bouton agit, même clavier ouvert.
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: espace.espace5,
              paddingBottom: (clavier > 0 ? 0 : bas) + espace.espace6,
              gap: espace.espace5,
            }}>
            <View style={styles.entete}>
              <Text
                accessibilityRole="header"
                maxFontSizeMultiplier={echelleMax.courant}
                style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
                {titre}
              </Text>
              <IconButton icone="close" label={t('commun.fermer')} onPress={onFermer} />
            </View>
            {children}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fenetre: { flex: 1, justifyContent: 'flex-end' },
  carte: { overflow: 'hidden' },
  poignee: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, marginTop: espace.espace2, marginBottom: espace.espace2 },
  entete: { flexDirection: 'row', alignItems: 'center' },
  titre: { flex: 1 },
});
