import { useState } from 'react';
import { StyleSheet, Text, View, type GestureResponderEvent } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { partEcoulee, tempsAuPoint } from './barreTemps';

export type BarreTempsProps = {
  /** Lu par les lecteurs d'écran. */
  label: string;
  /** Temps écoulé et durée, en secondes. */
  temps: number;
  duree: number;
  /** Appelé au relâchement du doigt (ou par les gestes d'accessibilité) avec le temps visé, en secondes. */
  onChercher: (secondes: number) => void;
  /** Affichage d'un temps : « 3:05 ». */
  format: (secondes: number) => string;
  /** Pas des gestes d'accessibilité, en secondes. */
  pas?: number;
};

/** Barre de temps du lecteur : toucher ou glisser pour se placer, temps écoulé à gauche et durée à droite. */
export function BarreTemps({ label, temps, duree, onChercher, format, pas = 15 }: BarreTempsProps) {
  const { couleurs, espace, rayon, cible, typographie } = useTheme();
  const [largeur, setLargeur] = useState(0);
  // Temps sous le doigt pendant le glissement ; la lecture n'est déplacée qu'au relâchement.
  const [glisse, setGlisse] = useState<number | null>(null);
  const actif = duree > 0;
  const affiche = glisse ?? temps;
  const part = partEcoulee(affiche, duree);
  const pouce = espace.espace3 + (glisse === null ? 0 : espace.espace1);
  const aPoint = (e: GestureResponderEvent) => tempsAuPoint(e.nativeEvent.locationX, largeur, duree);

  return (
    <View style={{ gap: espace.espace1 }}>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={label}
        accessibilityState={{ disabled: !actif }}
        accessibilityValue={{ min: 0, max: Math.round(duree), now: Math.round(affiche), text: format(affiche) }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(e) => {
          if (!actif) return;
          onChercher(affiche + (e.nativeEvent.actionName === 'increment' ? pas : -pas));
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
          onChercher(cibleTemps);
        }}
        onResponderTerminate={() => setGlisse(null)}
        style={[styles.zone, { height: cible.cibleIos }]}>
        {/* Les éléments dessinés ne captent pas le toucher : locationX reste mesuré sur toute la barre. */}
        <View pointerEvents="none" style={[styles.piste, { height: espace.espace1, backgroundColor: couleurs.surface, borderRadius: rayon.rayonPastille }]}>
          <View style={{ height: espace.espace1, width: `${part * 100}%`, backgroundColor: couleurs.or, borderRadius: rayon.rayonPastille }} />
        </View>
        {actif ? (
          <View
            pointerEvents="none"
            style={[
              styles.pouce,
              {
                width: pouce,
                height: pouce,
                borderRadius: rayon.rayonPastille,
                backgroundColor: couleurs.or,
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
          {actif ? format(duree) : '–'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { justifyContent: 'center' },
  piste: { overflow: 'hidden' },
  pouce: { position: 'absolute' },
  temps: { flexDirection: 'row', justifyContent: 'space-between' },
});
