import { useState } from 'react';
import { StyleSheet, View, type LayoutChangeEvent } from 'react-native';

import { cible } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';

export type RegletteProps = {
  /** Lu par les lecteurs d'écran : « Page ». */
  label: string;
  min: number;
  max: number;
  valeur: number;
  /** Pendant le glissement. */
  onChange: (valeur: number) => void;
  /** Au relâchement ou à un geste d'accessibilité : c'est là qu'on se déplace vraiment. */
  onTerminer: (valeur: number) => void;
  /** Texte lu : « Page 262 sur 604 ». */
  texte: string;
};

const GRADUATIONS = 9;

/** Réglette continue (planche « Mode page, réglette ») : piste fine, graduations tous les 10 %, poignée glissée au doigt (gestes de réponse de React Native). */
export function Reglette({ label, min, max, valeur, onChange, onTerminer, texte }: RegletteProps) {
  const { couleurs, espace } = useTheme();
  const [largeur, setLargeur] = useState(0);
  const versValeur = (x: number) => {
    if (largeur <= 0) return min;
    return Math.round(min + Math.max(0, Math.min(1, x / largeur)) * (max - min));
  };

  const part = max > min ? (valeur - min) / (max - min) : 0;
  const pas = (delta: number) => onTerminer(Math.max(min, Math.min(max, valeur + delta)));

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min, max, now: valeur, text: texte }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => pas(e.nativeEvent.actionName === 'increment' ? 1 : -1)}
      onLayout={(e: LayoutChangeEvent) => setLargeur(e.nativeEvent.layout.width)}
      style={[styles.zone, { minHeight: cible.cibleIos }]}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => onChange(versValeur(e.nativeEvent.locationX))}
      onResponderMove={(e) => onChange(versValeur(e.nativeEvent.locationX))}
      onResponderRelease={(e) => onTerminer(versValeur(e.nativeEvent.locationX))}
      onResponderTerminationRequest={() => false}>
      <View pointerEvents="none" style={[styles.piste, { backgroundColor: couleurs.ligne }]} />
      <View pointerEvents="none" style={[styles.piste, { width: `${part * 100}%`, backgroundColor: couleurs.emeraude }]} />
      {Array.from({ length: GRADUATIONS }, (_, i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[styles.graduation, { start: `${(i + 1) * 10}%`, backgroundColor: couleurs.ligneForte }]}
        />
      ))}
      <View
        pointerEvents="none"
        style={[
          styles.poignee,
          { start: `${part * 100}%`, marginStart: -espace.espace2, backgroundColor: couleurs.surface, borderColor: couleurs.emeraude },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  zone: { justifyContent: 'center' },
  piste: { position: 'absolute', start: 0, end: 0, height: 2, borderRadius: 2 },
  graduation: { position: 'absolute', width: 1, height: 8 },
  poignee: { position: 'absolute', width: 16, height: 16, borderRadius: 999, borderWidth: 2 },
});
