import { useEffect, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

export type SkeletonProps = {
  forme?: 'liste' | 'carte';
  lignes?: number;
  /** Lu par les lecteurs d'écran. */
  label?: string;
};

/** Silhouettes qui tiennent la place du contenu au-delà de 300 ms. Immobiles si « Réduire les animations » est actif. */
export function Skeleton({ forme = 'liste', lignes = 3, label }: SkeletonProps) {
  const { couleurs, espace, rayon } = useTheme();
  const [opacite] = useState(() => new Animated.Value(1));
  const [reduit, setReduit] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled()
      .then(setReduit)
      .catch((e: unknown) => console.warn('Préférence de mouvement illisible', e));
  }, []);

  useEffect(() => {
    if (reduit) {
      opacite.setValue(1);
      return;
    }
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacite, { toValue: 0.55, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacite, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [reduit, opacite]);

  const bloc = { backgroundColor: couleurs.surfaceCreux, borderRadius: rayon.rayonPuce };
  return (
    <Animated.View
      accessible
      accessibilityLabel={label}
      accessibilityRole="progressbar"
      style={{ opacity: opacite, gap: espace.espace3 }}>
      {forme === 'carte' ? (
        <View style={[styles.carte, bloc, { borderRadius: rayon.rayonCarte }]} />
      ) : (
        Array.from({ length: lignes }, (_, i) => (
          <View key={i} style={[styles.ligne, { gap: espace.espace3 }]}>
            <View style={[styles.pastille, bloc, { borderRadius: rayon.rayonPastille }]} />
            <View style={styles.textes}>
              <View style={[styles.trait, bloc, { width: '70%' }]} />
              <View style={[styles.trait, bloc, { width: '45%' }]} />
            </View>
          </View>
        ))
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  carte: { height: 120 },
  ligne: { flexDirection: 'row', alignItems: 'center' },
  pastille: { width: 40, height: 40 },
  textes: { flex: 1, gap: 8 },
  trait: { height: 12 },
});
