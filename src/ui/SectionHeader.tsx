import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type SectionHeaderProps = {
  titre: string;
  /** « wo » quand le titre est en wolof. */
  lang?: string;
  /** Traduction ou précision, en italique. */
  sousTitre?: string;
  action?: { label: string; onPress?: () => void };
};

/** Titre de section bilingue : le mot wolof en Cormorant, sa traduction en italique dessous. Jamais en majuscules. */
export function SectionHeader({ titre, lang, sousTitre, action }: SectionHeaderProps) {
  const { couleurs, espace, latin, typographie } = useTheme();
  return (
    <View style={[styles.ligne, { marginTop: espace.espace2, marginBottom: espace.espace3, gap: espace.espace3 }]}>
      <View style={styles.textes}>
        <Text
          accessibilityRole="header"
          accessibilityLanguage={lang}
          maxFontSizeMultiplier={echelleMax.courant}
          style={[lang === 'wo' ? latin.titre2 : typographie.titre2, { color: couleurs.encre }]}>
          {titre}
        </Text>
        {sousTitre ? (
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.translitteration, { color: couleurs.encre2 }]}>
            {sousTitre}
          </Text>
        ) : null}
      </View>
      {action ? (
        <Pressable accessibilityRole="button" accessibilityLabel={action.label} hitSlop={espace.espace2} onPress={action.onPress}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  textes: { flex: 1 },
});
