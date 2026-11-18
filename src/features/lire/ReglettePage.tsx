import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useSens } from '@/i18n/useSens';
import { useTheme } from '@/theme/useTheme';

import { fractionDePage, pageDePosition, positionDeFraction } from './reglette';

type Props = {
  /** Lu par les lecteurs d'écran (« Page »). */
  label: string;
  /** Page affichée, de 1 à `total`. */
  page: number;
  total: number;
  /** Appelée à chaque changement de page, pendant le glissement et au toucher. */
  onChange: (page: number) => void;
};

/** Pages sautées par un geste « augmenter / diminuer » des lecteurs d'écran (604 pages : un cran de 1 serait trop lent). */
const SAUT_ACCESSIBLE = 10;
/** Graduations tous les 10 % de la piste (planche « Mode page, réglette »), sans les deux extrémités. */
const GRADUATIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

/**
 * Réglette des pages du mushaf : piste fine, graduations tous les 10 %, curseur rond. Se règle au doigt (toucher ou
 * glissement) et par les gestes d'accessibilité. En interface de droite à gauche, la page 1 est à droite.
 */
export function ReglettePage({ label, page, total, onChange }: Props) {
  const { couleurs, rayon } = useTheme();
  const rtl = useSens() === 'rtl';
  const [largeur, setLargeur] = useState(0);
  // Page pendant le glissement : la page de l'écran ne suit qu'après le défilement, la réglette ne saute pas.
  const [enCours, setEnCours] = useState<number | null>(null);
  const affichee = enCours ?? page;
  const fraction = fractionDePage(affichee, total);

  // Départ du geste : position du doigt dans la zone et sur l'écran, pour suivre le glissement.
  const depart = useRef({ x: 0, pageX: 0, derniere: page });
  const viser = (x: number) => {
    const p = pageDePosition(x, largeur, total, rtl);
    if (p === depart.current.derniere) return;
    depart.current.derniere = p;
    setEnCours(p);
    onChange(p);
  };

  const aller = (p: number) => onChange(Math.min(total, Math.max(1, p)));
  const x = positionDeFraction(fraction, largeur, rtl);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ min: 1, max: total, now: affichee }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(e) => aller(page + (e.nativeEvent.actionName === 'increment' ? SAUT_ACCESSIBLE : -SAUT_ACCESSIBLE))}
      onLayout={(e) => setLargeur(e.nativeEvent.layout.width)}
      style={styles.zone}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      // Le défilement horizontal des pages ne doit pas voler le geste.
      onResponderTerminationRequest={() => false}
      onResponderGrant={(e) => {
        depart.current = { x: e.nativeEvent.locationX, pageX: e.nativeEvent.pageX, derniere: page };
        viser(e.nativeEvent.locationX);
      }}
      onResponderMove={(e) => viser(depart.current.x + e.nativeEvent.pageX - depart.current.pageX)}
      onResponderRelease={() => setEnCours(null)}
      onResponderTerminate={() => setEnCours(null)}>
      {/* Les enfants ne reçoivent pas le toucher : sa position est toujours relative à la zone entière. */}
      <View pointerEvents="none" style={styles.dessin}>
        <View style={[styles.piste, { backgroundColor: couleurs.ligne, borderRadius: rayon.rayonPastille }]} />
        <View
          style={[
            styles.remplie,
            { backgroundColor: couleurs.emeraude, borderRadius: rayon.rayonPastille, width: Math.abs(x - (rtl ? largeur : 0)) },
            rtl ? { end: 0 } : { start: 0 },
          ]}
        />
        {GRADUATIONS.map((g) => (
          <View key={g} style={[styles.graduation, { backgroundColor: couleurs.ligneForte, start: (g / 10) * largeur }]} />
        ))}
        <View
          style={[
            styles.curseur,
            { backgroundColor: couleurs.surface, borderColor: couleurs.emeraude, borderRadius: rayon.rayonPastille, start: x - CURSEUR / 2 },
          ]}
        />
      </View>
    </View>
  );
}

const CURSEUR = 16;
const styles = StyleSheet.create({
  // Zone touchable de 44 de haut autour du dessin de 22 de la planche.
  zone: { height: 44, justifyContent: 'center' },
  dessin: { height: 22 },
  piste: { position: 'absolute', start: 0, end: 0, top: 10, height: 2 },
  remplie: { position: 'absolute', top: 10, height: 2 },
  graduation: { position: 'absolute', top: 7, width: 1, height: 8 },
  curseur: { position: 'absolute', top: 3, width: CURSEUR, height: CURSEUR, borderWidth: 2 },
});
