import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { cransDe } from './slider';

import { interlignes, tailles } from '@/theme/tokens.generated';
export type SliderProps = {
  /** Lu par les lecteurs d'écran. */
  label: string;
  /** Bornes et pas du contrat du design system : un cran par pas, de `min` à `max`. */
  min: number;
  max: number;
  pas: number;
  valeur: number;
  onChange: (valeur: number) => void;
  /** Valeur affichée à droite du libellé : « 1 × ». */
  format: (valeur: number) => string;
  /** Repères aux extrémités (petit A, grand A). */
  gauche?: ReactNode;
  droite?: ReactNode;
};

/** Curseur à crans (planche « Minuterie et répétition ») : libellé, valeur, piste à crans réglable au doigt et par gestes. */
export function Slider({ label, min, max, pas, valeur, onChange, format, gauche, droite }: SliderProps) {
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const valeurs = cransDe(min, max, pas);
  const index = Math.max(0, valeurs.indexOf(valeur));
  const aller = (i: number) => {
    const v = valeurs[Math.max(0, Math.min(valeurs.length - 1, i))];
    if (v !== undefined) onChange(v);
  };

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: valeurs.length - 1, now: index, text: format(valeur) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => aller(index + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={{ gap: espace.espace2 }}>
      <View style={styles.entete}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
          {label}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.valeur), { color: couleurs.encre2 }]}>
          {format(valeur)}
        </Text>
      </View>
      <View style={styles.piste}>
        {gauche}
        {valeurs.map((v, i) => (
          <Pressable key={v} accessible={false} onPress={() => aller(i)} style={styles.cran}>
            <View
              style={{
                width: i === index ? 16 : 8,
                height: i === index ? 16 : 8,
                borderRadius: rayon.rayonPastille,
                backgroundColor: i <= index ? couleurs.emeraudeAplat : couleurs.ligneForte,
              }}
            />
          </Pressable>
        ))}
        {droite}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  valeur: { fontSize: tailles.t14, lineHeight: interlignes.l20, fontVariant: ['tabular-nums'] },
  piste: { flexDirection: 'row', alignItems: 'center' },
  cran: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
