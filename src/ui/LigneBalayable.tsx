// Ligne de liste qu'on balaie vers la fin de ligne (gauche en français, droite en arabe) pour faire apparaître des actions.
// Balayage complet : la dernière action est lancée. Les mêmes actions sont proposées aux lecteurs d'écran
// (`accessibilityActions`), sans geste. Fait avec les seules API de React Native (planche « MajGesteBudget »).
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, I18nManager, PanResponder, type PanResponderInstance, Pressable, StyleSheet, Text, View } from 'react-native';

import { useMouvementReduit } from '@/hooks/useMouvementReduit';
import { dureeAnimation } from '@/lib/animation';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';
import type { IconName } from './types';

export type ActionBalayage = {
  /** Identifiant de l'action pour les lecteurs d'écran. */
  nom: string;
  label: string;
  icone: IconName;
  ton: 'alerte' | 'erreur';
  onPress: () => void;
};

export type LigneBalayableProps = {
  actions: readonly ActionBalayage[];
  /** Le balayage complet lance la dernière action. */
  children: ReactNode;
};

const LARGEUR_ACTION = 80;
// Part de la largeur de l'écran au-delà de laquelle le balayage vaut « tout le chemin ».
const SEUIL_COMPLET = 0.6;

export function LigneBalayable({ actions, children }: LigneBalayableProps) {
  const { couleurs, typographie } = useTheme();
  const sens = I18nManager.isRTL ? 1 : -1;
  const largeurActions = LARGEUR_ACTION * actions.length;
  const [x] = useState(() => new Animated.Value(0));
  const reduit = useMouvementReduit();
  const [largeur, setLargeur] = useState(0);
  const [ouverte, setOuverte] = useState(false);
  // Le geste lit toujours les valeurs courantes, sans recréer le PanResponder.
  const etat = useRef({ debut: 0, largeur: 0, ouverte: false, actions });
  useEffect(() => {
    etat.current = { ...etat.current, largeur, ouverte, actions };
  });

  const placer = (vers: number, fin?: () => void) =>
    Animated.timing(x, { toValue: vers, duration: dureeAnimation(180, reduit), useNativeDriver: true }).start(fin);

  const fermer = () => {
    setOuverte(false);
    placer(0);
  };

  // Créé après le premier rendu : les gestes lisent `etat`, mis à jour à chaque rendu.
  const [pan, setPan] = useState<PanResponderInstance | null>(null);
  useEffect(() => {
    setPan(
    PanResponder.create({
      // Seulement un geste franchement horizontal : le défilement vertical de la liste reste libre.
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 10 && Math.abs(g.dx) > Math.abs(g.dy) * 2,
      onPanResponderGrant: () => x.stopAnimation((v) => (etat.current.debut = v)),
      onPanResponderMove: (_, g) => {
        const brut = etat.current.debut + g.dx;
        // Vers la fin de ligne seulement ; un léger rebond au-delà des actions.
        const vers = sens * brut;
        x.setValue(sens * Math.max(0, Math.min(vers, etat.current.largeur || largeurActions)));
      },
      onPanResponderRelease: (_, g) => {
        const brut = etat.current.debut + g.dx;
        const distance = sens * brut;
        const total = etat.current.largeur;
        const liste = etat.current.actions;
        if (total > 0 && distance > total * SEUIL_COMPLET && liste.length > 0) {
          // Balayage complet : la ligne sort, l'action destructive part (annulable par l'écran).
          placer(sens * total, () => {
            liste[liste.length - 1].onPress();
            x.setValue(0);
            setOuverte(false);
          });
          return;
        }
        if (distance > (LARGEUR_ACTION * liste.length) / 2) {
          setOuverte(true);
          placer(sens * LARGEUR_ACTION * liste.length);
        } else {
          setOuverte(false);
          placer(0);
        }
      },
      onPanResponderTerminate: () => {
        setOuverte(false);
        placer(0);
      },
    }),
    );
  }, [sens, largeurActions, x]);

  return (
    <View
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      style={styles.rangee}>
      {/* Actions derrière la ligne, côté fin. */}
      <View style={[styles.actions, { width: largeurActions }]}>
        {actions.map((a) => (
          <Pressable
            key={a.nom}
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            onPress={() => {
              fermer();
              a.onPress();
            }}
            style={[styles.action, { width: LARGEUR_ACTION, backgroundColor: a.ton === 'erreur' ? couleurs.erreur : couleurs.alerte }]}>
            <Icon name={a.icone} size={20} color={couleurs.surErreur} />
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.surErreur }]}>
              {a.label}
            </Text>
          </Pressable>
        ))}
      </View>
      <Animated.View
        {...pan?.panHandlers}
        style={{ backgroundColor: couleurs.surface, transform: [{ translateX: x }] }}
        // Ligne ouverte : un toucher la referme au lieu d'ouvrir l'opération.
        pointerEvents={ouverte ? 'box-only' : 'auto'}>
        {children}
        {ouverte ? <Pressable accessibilityElementsHidden style={StyleSheet.absoluteFill} onPress={fermer} /> : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { overflow: 'hidden' },
  actions: { position: 'absolute', top: 0, bottom: 0, end: 0, flexDirection: 'row' },
  action: { alignItems: 'center', justifyContent: 'center', gap: 2 },
});
