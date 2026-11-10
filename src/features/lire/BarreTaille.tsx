import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

/** Coefficients de taille du texte, du plus petit au plus grand ; l'échelon 2 (1) est la taille d'origine, le 1 (0,9) le défaut. */
export const ECHELONS_TAILLE = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75] as const;
const MAX = ECHELONS_TAILLE.length - 1;

/** Styles de taille (arabe et traduction) selon l'échelon choisi, à ajouter après la typographie de base. */
export function useTaillesLecture() {
  const { typographie } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);
  const coef = ECHELONS_TAILLE[Math.max(0, Math.min(MAX, echelon))] ?? 1;
  const mise = (base: { fontSize?: number; lineHeight?: number }, defaut: number, ligne: number) => ({
    fontSize: (base.fontSize ?? defaut) * coef,
    lineHeight: (base.lineHeight ?? ligne) * coef,
  });
  return {
    tailleArabe: mise(typographie.coran, 28, 56),
    tailleTrad: mise(typographie.lecture, 18, 30),
  };
}

/** Barre pour réduire ou agrandir l'écriture : A−, piste à sept échelons, A+. */
export function BarreTaille() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);
  const definir = useReglages((s) => s.definirTailleLecture);

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={t('lire.tailleArabe')}
      accessibilityValue={{ min: 0, max: MAX, now: echelon }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => definir(echelon + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={[styles.barre, { gap: espace.espace2 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lire.reduireTexte')}
        disabled={echelon <= 0}
        hitSlop={8}
        onPress={() => definir(echelon - 1)}
        style={[styles.bouton, { minWidth: cible.cibleIos, opacity: echelon <= 0 ? 0.4 : 1 }]}>
        <Text accessibilityLanguage="ar" style={{ color: couleurs.emeraude, fontSize: 14 }}>أ</Text>
      </Pressable>

      <View style={styles.piste}>
        {ECHELONS_TAILLE.map((_, i) => (
          <Pressable key={i} accessible={false} onPress={() => definir(i)} style={styles.cran}>
            <View
              style={{
                width: i === echelon ? 16 : 8,
                height: i === echelon ? 16 : 8,
                borderRadius: rayon.rayonPastille,
                backgroundColor: i <= echelon ? couleurs.emeraudeAplat : couleurs.ligne,
              }}
            />
          </Pressable>
        ))}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lire.agrandirTexte')}
        disabled={echelon >= MAX}
        hitSlop={8}
        onPress={() => definir(echelon + 1)}
        style={[styles.bouton, { minWidth: cible.cibleIos, opacity: echelon >= MAX ? 0.4 : 1 }]}>
        <Text accessibilityLanguage="ar" style={{ color: couleurs.emeraude, fontSize: 24 }}>أ</Text>
      </Pressable>
    </View>
  );
}

/**
 * Réglage « Taille de l'écriture » : libellé et niveau, barre, puis l'aide (planche « Réglages de lecture »).
 * Il sert à la lecture verset par verset ; en mode page, l'écriture s'ajuste à l'écran.
 */
export function ReglageTaille() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);

  return (
    <View style={{ padding: espace.espace4, gap: espace.espace2 }}>
      <View style={styles.entete}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
          {t('reglages.tailleEcriture')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.niveau, { color: couleurs.encre2 }]}>
          {t('reglages.niveau', { n: echelon + 1 })}
        </Text>
      </View>
      <BarreTaille />
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.aide, { color: couleurs.encre3 }]}>
        {t('reglages.tailleAide')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  entete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  niveau: { fontSize: 14, lineHeight: 20, fontVariant: ['tabular-nums'] },
  aide: { fontSize: 14, lineHeight: 20 },
  barre: { flexDirection: 'row', alignItems: 'center' },
  bouton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  piste: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cran: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
