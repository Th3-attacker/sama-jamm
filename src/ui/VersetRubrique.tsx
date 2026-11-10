import { StyleSheet, Text, View } from 'react-native';

import type { VersetAffiche } from '@/features/rubriques/versetsRubriques';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

/** Verset du Coran d'une rubrique : référence et texte arabe, lus dans les données de l'app. */
export function VersetRubrique({ verset }: { verset: VersetAffiche }) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  return (
    <View
      accessible
      accessibilityLabel={`Coran ${verset.reference}`}
      style={[styles.bloc, { gap: espace.espace2, padding: espace.espace4, borderRadius: rayon.rayonCarte, backgroundColor: couleurs.surfaceCreux }]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, styles.reference, { color: couleurs.orTexte }]}>
        {`Coran · ${verset.reference}`}
      </Text>
      <Text
        maxFontSizeMultiplier={echelleMax.courant}
        style={[typographie.arabe, styles.arabe, { color: couleurs.encre }]}
        accessibilityLanguage="ar">
        {verset.arabe}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { alignItems: 'stretch' },
  reference: { textAlign: 'left', fontVariant: ['tabular-nums'] },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
});
