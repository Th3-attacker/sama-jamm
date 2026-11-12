import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type JourFil = { fait: boolean; aujourdhui: boolean };

export type BeadThreadProps = {
  titre: string;
  jours: JourFil[];
  /** Ce qui a été fait, jamais ce qui manque ; absent tant que rien n'est fait. */
  resume?: string;
};

// Un grain par jour du mois, doré les jours de lecture, sans série à perdre.
export function BeadThread({ titre, jours, resume }: BeadThreadProps) {
  const { couleurs, espace, typographie } = useTheme();

  return (
    <View style={{ gap: espace.espace2 }}>
      <View style={styles.tete}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
          {titre}
        </Text>
        {resume ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { fontFamily: 'SourceSans3_400Regular', color: couleurs.encre2 }]}>
            {resume}
          </Text>
        ) : null}
      </View>
      <View accessible accessibilityRole="image" accessibilityLabel={resume ?? titre} style={[styles.fil, { gap: espace.espace1 }]}>
        {jours.map((j, i) => (
          <View
            key={i}
            style={[
              styles.grain,
              { backgroundColor: j.fait ? couleurs.or : j.aujourdhui ? couleurs.fond : couleurs.surfaceCreux },
              j.aujourdhui ? { borderWidth: 2, borderColor: couleurs.emeraude } : null,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tete: { flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' },
  fil: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  grain: { width: 8, height: 8, borderRadius: 4 },
});
