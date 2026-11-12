import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme/useTheme';

import { Etoile } from './Etoile';
import { Medaillon } from './Medaillon';

export type OrnamentProps = {
  /** separateur (défaut) : étoile entre deux filets or · medaillon : étoile numérotée. */
  variante?: 'separateur' | 'medaillon';
  numero?: number;
  taille?: number;
  /** Lu avant le numéro du médaillon : « Verset », « Sourate ». */
  prefixe?: string;
};

/** Pause solennelle : l'étoile à huit branches, toujours en or. Au plus un séparateur par écran visible. */
export function Ornament({ variante = 'separateur', numero = 1, taille, prefixe = '' }: OrnamentProps) {
  const { couleurs, espace } = useTheme();
  if (variante === 'medaillon') return <Medaillon numero={numero} prefixe={prefixe} taille={taille} />;
  return (
    <View
      accessibilityRole="none"
      accessible={false}
      style={[styles.ligne, { gap: espace.espace2, marginVertical: espace.espace6 }]}>
      <View style={[styles.filet, { backgroundColor: couleurs.or }]} />
      <Etoile taille={taille ?? 16} remplissage={couleurs.or} />
      <View style={[styles.filet, { backgroundColor: couleurs.or }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center' },
  filet: { flex: 1, height: StyleSheet.hairlineWidth },
});
