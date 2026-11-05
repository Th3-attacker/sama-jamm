import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Etoile } from './Etoile';

type Props = {
  numero: number;
  /** Lu avant le numéro : « Verset », « Sourate », « Juz ». */
  prefixe: string;
  taille?: number;
  /** Numéro affiché autrement (chiffres arabes ١٢٣) ; le lecteur d'écran lit toujours `numero`. */
  affiche?: string;
  /** Verset en cours de récitation : étoile pleine émeraude. */
  actif?: boolean;
};

// Numéro dans une étoile `or-doux` cerclée d'`or`, chiffre en `or-texte`.
export function Medaillon({ numero, prefixe, taille = 36, affiche, actif = false }: Props) {
  const { couleurs, typographie } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`${prefixe} ${numero}`}
      style={[styles.medaillon, { width: taille, height: taille }]}>
      <View style={StyleSheet.absoluteFill}>
        <Etoile
          taille={taille}
          remplissage={actif ? couleurs.emeraude : couleurs.orDoux}
          contour={actif ? couleurs.emeraude : couleurs.or}
        />
      </View>
      <Text
        maxFontSizeMultiplier={echelleMax.grand}
        style={[
          typographie.libelle,
          styles.chiffre,
          { color: actif ? couleurs.surEmeraude : couleurs.orTexte, fontSize: taille * 0.33, lineHeight: taille * 0.42 },
        ]}>
        {affiche ?? numero}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  medaillon: { alignItems: 'center', justifyContent: 'center' },
  chiffre: { fontVariant: ['tabular-nums'] },
});
