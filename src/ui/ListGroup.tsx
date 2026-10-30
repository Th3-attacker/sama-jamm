import { Children, Fragment, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type ListGroupProps = { titre?: string; note?: string; children: ReactNode };

// Carte `surface` qui regroupe des ListItem, filets `ligne` entre les lignes.
export function ListGroup({ titre, note, children }: ListGroupProps) {
  const { couleurs, espace, rayon, typographie } = useTheme();
  const lignes = Children.toArray(children);

  return (
    <View style={{ gap: espace.espace2 }}>
      {titre ? (
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, { color: couleurs.encre2, paddingHorizontal: espace.espace1 }]}>
          {titre}
        </Text>
      ) : null}
      <View
        style={[
          styles.carte,
          { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonCarte },
        ]}>
        {lignes.map((ligne, i) => (
          <Fragment key={i}>
            {i > 0 ? <View style={[styles.filet, { backgroundColor: couleurs.ligne }]} /> : null}
            {ligne}
          </Fragment>
        ))}
      </View>
      {note ? (
        <Text
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.legende, { color: couleurs.encre3, paddingHorizontal: espace.espace1 }]}>
          {note}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  carte: { borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  filet: { height: StyleSheet.hairlineWidth },
});
