import { Pressable, StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type RadioOption = {
  id: string;
  label: string;
  description?: string;
  /** Texte court à droite : symbole, taille. */
  fin?: string;
};

export type RadioGroupProps = {
  label: string;
  /** Sept options au plus ; au-delà, une liste avec recherche. */
  options: RadioOption[];
  valeur: string | null;
  onChange: (id: string) => void;
  /** false : simples lignes séparées par un filet, pour une feuille ou une carte déjà encadrée. */
  encadre?: boolean;
};

export function RadioGroup({ label, options, valeur, onChange, encadre = true }: RadioGroupProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();

  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={{ gap: encadre ? espace.espace2 : 0 }}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
        {label}
      </Text>
      {options.map((o) => {
        const on = o.id === valeur;
        return (
          <Pressable
            key={o.id}
            accessibilityRole="radio"
            accessibilityState={{ checked: on }}
            onPress={() => onChange(o.id)}
            style={[
              styles.option,
              { gap: espace.espace3 },
              encadre
                ? {
                    padding: espace.espace4,
                    borderWidth: 1,
                    borderRadius: rayon.rayonCarte,
                    backgroundColor: couleurs.surface,
                    borderColor: on ? couleurs.emeraude : couleurs.ligne,
                  }
                : { paddingVertical: espace.espace3, borderBottomWidth: StyleSheet.hairlineWidth, borderColor: couleurs.ligne },
            ]}>
            <View style={[styles.cercle, { borderColor: on ? couleurs.emeraude : couleurs.ligneForte }]}>
              {on ? <View style={[styles.point, { backgroundColor: couleurs.emeraude }]} /> : null}
            </View>
            <View style={styles.textes}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre }]}>
                {o.label}
              </Text>
              {o.description ? (
                <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: couleurs.encre3 }]}>
                  {o.description}
                </Text>
              ) : null}
            </View>
            {o.fin ? (
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre2 }]}>
                {o.fin}
              </Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  option: { flexDirection: 'row', alignItems: 'center', minHeight: 56 },
  cercle: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  point: { width: 12, height: 12, borderRadius: 6 },
  textes: { flex: 1 },
});
