import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTaillesLecture } from '@/features/lire/BarreTaille';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

import type { Invocation } from './donnees';

import { interlignes, rayon, tailles } from '@/theme/tokens.generated';

type CarteProps = {
  invocation: Invocation;
  /** Texte de la pastille : « Sahih Muslim 2723 · 3 fois ». */
  source: string;
  termine: boolean;
  onChoisir: () => void;
  onPartager: () => void;
};

// Planche « Invocations · lecture » : carte surface, pastille de source or-doux, arabe, translittération
// (si activée), sens en français (absent pour un texte du Coran), puis Partager.
export function CarteInvocation({ invocation, source, termine, onChoisir, onPartager }: CarteProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie, ligne } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const translitActive = useReglages((s) => s.translitLecture);

  return (
    <View
      style={{
        backgroundColor: couleurs.surface,
        borderColor: couleurs.ligne,
        borderWidth: 1,
        borderRadius: rayon.rayonCarte,
      }}>
      <Pressable accessibilityRole="button" onPress={onChoisir} style={{ padding: espace.espace5, gap: espace.espace4 }}>
        <View style={styles.sourceLigne}>
          <View style={[styles.pastille, { backgroundColor: couleurs.orDoux, paddingHorizontal: espace.espace3, paddingVertical: espace.espace1 }]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.source), { color: couleurs.orTexte }]}>
              {source}
            </Text>
          </View>
          <View style={styles.espace} />
          {termine ? <Icon name="check-circle" size={20} color={couleurs.emeraude} /> : null}
        </View>
        {/* Texte sacré : jamais tronqué. */}
        <Text
          accessibilityLanguage="ar"
          maxFontSizeMultiplier={echelleMax.grand}
          style={[typographie.coran, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
          {invocation.arabe}
        </Text>
        {translitActive ? (
          <Text accessibilityLanguage="en" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.translitteration, tailleTrad, { color: couleurs.encre2 }]}>
            {invocation.translit}
          </Text>
        ) : null}
        {invocation.sens ? (
          <Text accessibilityLanguage="fr" maxFontSizeMultiplier={echelleMax.grand} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {invocation.sens}
          </Text>
        ) : null}
      </Pressable>
      <View style={[styles.actions, { borderTopColor: couleurs.ligne, paddingHorizontal: espace.espace4, paddingVertical: espace.espace2 }]}>
        <View style={styles.sortie}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('partage.titre')} hitSlop={8} onPress={onPartager} style={styles.icone}>
            <Icon name="share" size={20} color={couleurs.encre2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sourceLigne: { flexDirection: 'row', alignItems: 'center' },
  pastille: { borderRadius: rayon.rayonPastille, flexShrink: 1 },
  source: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  espace: { flex: 1 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  sortie: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  icone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
