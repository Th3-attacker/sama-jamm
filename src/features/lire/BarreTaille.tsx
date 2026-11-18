import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { useSens } from '@/i18n/useSens';
import { useReglages } from '@/stores/reglages';
import { borneTaille, TAILLE_MAX, TAILLE_MIN } from '@/stores/tailleMigration';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { pageDePosition, positionDeFraction } from './reglette';

import { interlignes, tailles } from '@/theme/tokens.generated';
/** Coefficients de taille du texte, du plus petit au plus grand ; l'échelon 2 (1) est la taille d'origine, le 1 (0,9) le défaut. */
export const ECHELONS_TAILLE = [0.8, 0.9, 1, 1.15, 1.3, 1.5, 1.75] as const;

/** Styles de taille (arabe et translittération) selon l'échelon choisi, à ajouter après la typographie de base. */
export function useTaillesLecture() {
  const { typographie } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);
  const coef = ECHELONS_TAILLE[borneTaille(echelon)] ?? 1;
  const mise = (base: { fontSize?: number; lineHeight?: number }, defaut: number, ligne: number) => ({
    fontSize: (base.fontSize ?? defaut) * coef,
    lineHeight: (base.lineHeight ?? ligne) * coef,
  });
  return {
    tailleArabe: mise(typographie.coran, 28, 56),
    tailleTrad: mise(typographie.lecture, 18, 30),
  };
}

/** Barre pour réduire ou agrandir l'écriture : A−, piste à trois échelons (niveaux 2 à 4), A+. */
export function BarreTaille() {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, cible } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);
  const definir = useReglages((s) => s.definirTailleLecture);

  return (
    <View
      accessibilityRole="adjustable"
      accessibilityLabel={t('lire.tailleArabe')}
      accessibilityValue={{ min: TAILLE_MIN, max: TAILLE_MAX, now: echelon }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => definir(echelon + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={[styles.barre, { gap: espace.espace2 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lire.reduireTexte')}
        disabled={echelon <= TAILLE_MIN}
        hitSlop={8}
        onPress={() => definir(echelon - 1)}
        style={[styles.bouton, { minWidth: cible.cibleIos, opacity: echelon <= TAILLE_MIN ? 0.4 : 1 }]}>
        <Text accessibilityLanguage="ar" style={{ color: couleurs.emeraude, fontSize: tailles.t14 }}>أ</Text>
      </Pressable>

      <View style={styles.piste}>
        {ECHELONS_TAILLE.slice(TAILLE_MIN, TAILLE_MAX + 1).map((_, k) => {
          const i = TAILLE_MIN + k;
          return (
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
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('lire.agrandirTexte')}
        disabled={echelon >= TAILLE_MAX}
        hitSlop={8}
        onPress={() => definir(echelon + 1)}
        style={[styles.bouton, { minWidth: cible.cibleIos, opacity: echelon >= TAILLE_MAX ? 0.4 : 1 }]}>
        <Text accessibilityLanguage="ar" style={{ color: couleurs.emeraude, fontSize: tailles.t24 }}>أ</Text>
      </Pressable>
    </View>
  );
}

/**
 * Piste de taille de la planche « Feuille à mi-hauteur » (iOS) : petit « ا », piste fine à quatre crans, grand « ا »,
 * curseur rond qui se déplace au toucher et au glissement. Mêmes niveaux 2 à 5 que `BarreTaille`.
 */
function CurseurTaille() {
  const { t } = useTranslation();
  const { nom, couleurs, espace, rayon, ombres } = useTheme();
  const rtl = useSens() === 'rtl';
  const echelon = useReglages((s) => s.tailleLecture);
  const definir = useReglages((s) => s.definirTailleLecture);
  const [largeur, setLargeur] = useState(0);
  const crans = TAILLE_MAX - TAILLE_MIN + 1;
  const viser = (x: number) => definir(TAILLE_MIN + pageDePosition(x, largeur, crans, rtl) - 1);
  const fraction = (echelon - TAILLE_MIN) / (crans - 1);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={t('lire.tailleArabe')}
      accessibilityValue={{ min: TAILLE_MIN, max: TAILLE_MAX, now: echelon }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => definir(echelon + (e.nativeEvent.actionName === 'increment' ? 1 : -1))}
      style={[styles.barre, { gap: espace.espace3 }]}>
      <Text accessibilityLanguage="ar" importantForAccessibility="no" style={{ color: couleurs.encre, fontSize: tailles.t14 }}>ا</Text>
      <View
        onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => viser(e.nativeEvent.locationX)}
        onResponderMove={(e) => viser(e.nativeEvent.locationX)}
        style={styles.zoneCurseur}>
        <View pointerEvents="none" style={styles.dessinCurseur}>
          <View style={[styles.pisteVerre, { backgroundColor: couleurs.ligne, borderRadius: rayon.rayonPastille }]} />
          {Array.from({ length: crans - 1 }, (_, k) => (
            <View
              key={k}
              style={[styles.repere, { backgroundColor: couleurs.ligneForte, borderRadius: rayon.rayonPastille, start: ((k + 1) / (crans - 1)) * largeur - 2 }]}
            />
          ))}
          <View
            style={[
              styles.pouce,
              // Jour : rond blanc avec ombre (planche). Nuit : `surface` serait sombre sur une carte sombre et sans ombre, donc invisible.
              { backgroundColor: nom === 'jour' ? couleurs.surface : couleurs.encre, borderRadius: rayon.rayonPastille, start: positionDeFraction(fraction, largeur, rtl) - POUCE / 2 },
              ombres.ombre1 !== 'none' ? { boxShadow: ombres.ombre1 } : null,
            ]}
          />
        </View>
      </View>
      <Text accessibilityLanguage="ar" importantForAccessibility="no" style={{ color: couleurs.encre, fontSize: tailles.t24 }}>ا</Text>
    </View>
  );
}

/**
 * Réglage « Taille de l'écriture » : libellé et niveau, barre, puis l'aide (planche « Réglages de lecture »).
 * Il sert à la lecture verset par verset ; en mode page, l'écriture s'ajuste à l'écran.
 */
export function ReglageTaille({ verre = false }: { verre?: boolean }) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const echelon = useReglages((s) => s.tailleLecture);

  return (
    <View style={{ padding: espace.espace4, gap: espace.espace2 }}>
      <View style={styles.entete}>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre }]}>
          {t('reglages.tailleEcriture')}
        </Text>
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.niveau), { color: couleurs.encre2 }]}>
          {t('reglages.niveau', { n: echelon + 1 })}
        </Text>
      </View>
      {verre ? <CurseurTaille /> : <BarreTaille />}
      {verre ? null : (
        <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.aide), { color: couleurs.encre3 }]}>
          {t('reglages.tailleAide')}
        </Text>
      )}
    </View>
  );
}

const POUCE = 28;
const styles = StyleSheet.create({
  // Planche « Feuille à mi-hauteur » : piste de 6, repères de 4, curseur rond de 28 ; zone touchable de 44.
  zoneCurseur: { flex: 1, height: 44, justifyContent: 'center' },
  dessinCurseur: { height: POUCE },
  pisteVerre: { position: 'absolute', start: 0, end: 0, top: 11, height: 6 },
  repere: { position: 'absolute', top: 12, width: 4, height: 4 },
  pouce: { position: 'absolute', top: 0, width: POUCE, height: POUCE },
  entete: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  niveau: { fontSize: tailles.t14, lineHeight: interlignes.l20, fontVariant: ['tabular-nums'] },
  aide: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  barre: { flexDirection: 'row', alignItems: 'center' },
  bouton: { minHeight: 44, alignItems: 'center', justifyContent: 'center' },
  piste: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  cran: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center' },
});
