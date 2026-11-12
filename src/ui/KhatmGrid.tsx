import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';

export type EtatJuz = 'lu' | 'en-cours' | 'vous' | 'libre';
export type Juz = { n: number; etat: EtatJuz; /** Prénom de qui le lit. */ qui?: string };

export type KhatmGridProps = {
  /** Les 30 juz. */
  juz: readonly Juz[];
  /** Rend les juz libres touchables pour les prendre. */
  onChoisir?: (n: number) => void;
  /** Légende sous la grille. */
  legende?: Record<EtatJuz, string>;
  /** Phrase lue par juz : reçoit le numéro et l'état affiché. */
  libelleJuz: (n: number, etat: EtatJuz, qui?: string) => string;
};

const COLONNES = 6;

/** Les 30 juz d'un khatm : grille de 6 × 5, cases carrées. « Vous » est le seul aplat vif, même la nuit. */
export function KhatmGrid({ juz, onChoisir, legende, libelleJuz }: KhatmGridProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const [largeur, cote] = useState(0);
  const caseLargeur = largeur > 0 ? Math.floor((largeur - espace.espace2 * (COLONNES - 1)) / COLONNES) : undefined;

  const style = (etat: EtatJuz) => {
    switch (etat) {
      case 'lu':
        return { fond: couleurs.emeraudeDoux, texte: couleurs.surEmeraudeDoux, bord: couleurs.emeraudeDoux, anneau: 1 };
      case 'en-cours':
        return { fond: couleurs.orDoux, texte: couleurs.orTexte, bord: couleurs.or, anneau: 1 };
      case 'vous':
        return { fond: couleurs.emeraudeAplat, texte: couleurs.surEmeraude, bord: couleurs.emeraude, anneau: 2 };
      case 'libre':
        return { fond: 'transparent', texte: couleurs.encre, bord: couleurs.ligneForte, anneau: 1 };
    }
  };

  return (
    <View style={{ gap: espace.espace3 }}>
      <View style={[styles.grille, { gap: espace.espace2 }]} onLayout={(e) => cote(e.nativeEvent.layout.width)}>
        {juz.map((j) => {
          const s = style(j.etat);
          const touchable = j.etat === 'libre' && onChoisir !== undefined;
          return (
            <Pressable
              key={j.n}
              accessibilityRole="button"
              accessibilityLabel={libelleJuz(j.n, j.etat, j.qui)}
              accessibilityState={{ disabled: !touchable }}
              disabled={!touchable}
              onPress={() => onChoisir?.(j.n)}
              style={({ pressed }) => [
                styles.case,
                {
                  width: caseLargeur,
                  aspectRatio: 1,
                  minHeight: espace.espace8,
                  borderRadius: rayon.rayonCarte,
                  borderWidth: s.anneau,
                  borderColor: s.bord,
                  backgroundColor: s.fond,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.libelle, styles.chiffre, { color: s.texte }]}>
                {j.n}
              </Text>
              {j.etat === 'lu' ? <Icon name="check" size={12} color={s.texte} /> : null}
            </Pressable>
          );
        })}
      </View>
      {legende ? (
        <View style={[styles.legende, { gap: espace.espace4 }]}>
          {(['lu', 'en-cours', 'vous', 'libre'] as const).map((etat) => (
            <View key={etat} style={[styles.legendeLigne, { gap: espace.espace2 }]}>
              <View
                style={[
                  styles.pastille,
                  { backgroundColor: style(etat).fond, borderColor: style(etat).bord, borderWidth: style(etat).anneau, borderRadius: rayon.rayonPuce },
                ]}
              />
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre2 }]}>
                {legende[etat]}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grille: { flexDirection: 'row', flexWrap: 'wrap' },
  case: { alignItems: 'center', justifyContent: 'center' },
  chiffre: { fontVariant: ['tabular-nums'] },
  legende: { flexDirection: 'row', flexWrap: 'wrap' },
  legendeLigne: { flexDirection: 'row', alignItems: 'center' },
  pastille: { width: 12, height: 12 },
});
