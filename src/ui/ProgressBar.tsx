import { StyleSheet, Text, View } from 'react-native';

import type { Couleurs } from '@/theme/tokens.generated';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type TonProgression = 'emeraude' | 'or' | 'alerte' | 'erreur';

export type ProgressBarProps = {
  /** 0 à 1 ; au-delà de 1, la barre est pleine et passe en `erreur`. */
  valeur: number;
  /** Lu par les lecteurs d'écran : « Dépense quotidienne ». */
  label: string;
  /** La valeur en mots, obligatoire : l'or sur la piste claire est sous 3:1. */
  detail: string;
  ton?: TonProgression;
  /** Piste de 4 au lieu de 8. */
  fine?: boolean;
  /** Résumé en 14/20 au lieu de 12/16 (planche « Khatm »). */
  detailCorps?: boolean;
};

function couleur(ton: TonProgression, c: Couleurs): string {
  if (ton === 'or') return c.or;
  if (ton === 'alerte') return c.alerte;
  if (ton === 'erreur') return c.erreur;
  return c.emeraude;
}

/** Barre de progression, sa valeur toujours écrite à côté. */
export function ProgressBar({ valeur, label, detail, ton = 'emeraude', fine = false, detailCorps = false }: ProgressBarProps) {
  const { couleurs, espace, typographie } = useTheme();
  const borne = Number.isFinite(valeur) ? Math.max(0, valeur) : 0;
  const tonEffectif = borne > 1 ? 'erreur' : ton;
  const hauteur = fine ? 4 : 8;

  return (
    <View
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      accessibilityValue={{ min: 0, max: 100, now: Math.round(Math.min(borne, 1) * 100), text: detail }}
      style={{ gap: espace.espace1 }}>
      <View style={[styles.piste, { height: hauteur, backgroundColor: couleurs.surfaceCreux }]}>
        <View
          style={{
            width: `${Math.min(borne, 1) * 100}%`,
            height: hauteur,
            backgroundColor: couleur(tonEffectif, couleurs),
          }}
        />
      </View>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[detailCorps ? typographie.libelle : typographie.legende, detailCorps ? styles.corps : null, { color: couleurs.encre2 }]}>
        {detail}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  corps: { fontFamily: 'SourceSans3_400Regular' },
  piste: { borderRadius: 999, overflow: 'hidden' },
});
