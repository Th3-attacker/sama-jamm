import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Switch } from '@/ui/Switch';

type Props = {
  titre: string;
  detail: string;
  active: boolean;
  onChange: (active: boolean) => void;
};

// Ligne de réglage à plat de la planche « Bienvenue · rappels » : filet en bas, interrupteur à droite.
export function LigneReglage({ titre, detail, active, onChange }: Props) {
  const { couleurs, espace, typographie } = useTheme();
  return (
    <View style={[styles.ligne, { gap: espace.espace4, paddingVertical: espace.espace4, borderBottomColor: couleurs.ligne }]}>
      <View style={styles.textes}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.titre3, styles.titre, { color: couleurs.encre }]}>
          {titre}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.detail, { color: couleurs.encre2 }]}>
          {detail}
        </Text>
      </View>
      <Switch label={titre} active={active} onChange={onChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1 },
  textes: { flex: 1, minWidth: 0 },
  // Planche : titre 16/24 en gras, détail 14/20 en normal.
  titre: { fontSize: 16, lineHeight: 24 },
  detail: { fontSize: 14, lineHeight: 20 },
});
