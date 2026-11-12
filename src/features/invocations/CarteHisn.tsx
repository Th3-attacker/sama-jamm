import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTaillesLecture } from '@/features/lire/BarreTaille';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

import type { ItemHisn } from './hisn';

import { rayon } from '@/theme/tokens.generated';
type Props = {
  item: ItemHisn;
  /** L'invocation que le compteur suit. */
  actif: boolean;
  /** Toutes les lectures demandées sont faites. */
  termine: boolean;
  onChoisir: () => void;
};

/** Une invocation de la Citadelle du musulman : source et nombre de lectures, puis le texte arabe. */
export function CarteHisn({ item, actif, termine, onChoisir }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const { tailleArabe } = useTaillesLecture();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onChoisir}
      style={{
        backgroundColor: couleurs.surface,
        borderColor: actif ? couleurs.emeraude : couleurs.ligne,
        borderWidth: actif ? 2 : 1,
        borderRadius: rayon.rayonCarte,
        padding: espace.espace4,
        gap: espace.espace3,
      }}>
      <View style={styles.sourceLigne}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3, flex: 1 }]}>
          {t('invocations.sourceHisn', { fois: t('invocations.fois', { count: item.repetitions }) })}
        </Text>
        {termine ? <Icon name="check-circle" size={20} color={couleurs.emeraude} /> : null}
      </View>
      <Text
        accessibilityLanguage="ar"
        maxFontSizeMultiplier={echelleMax.grand}
        style={[typographie.arabe, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
        {item.texte}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sourceLigne: { flexDirection: 'row', alignItems: 'center' },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
});
