import { I18nManager, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { useTheme } from '@/theme/useTheme';
import { segmentMaintenant } from '@/features/accueil/positionsFrise';

import type { PriereArc } from './DayArc';

export type PrieresCentraleProps = {
  /** Titre au-dessus, déjà traduit : « Prochaine prière · Dhuhr ». */
  titre: string;
  /** Nom et heure de la prochaine prière, déjà formatés : « Asr · 16:35 ». */
  nomEtHeure: string;
  /** Délai déjà formaté : « dans 42 min ». */
  dans: string;
  prieres: readonly PriereArc[];
  /** Heure actuelle en minutes depuis minuit : le petit cercle « maintenant » entre deux prières. */
  maintenant?: number;
  /** Pour les lecteurs d'écran. */
  description: string;
};

// Frise : 300 × 28. Les cinq points sont répartis régulièrement (comme sur la carte de l'Accueil) ; le petit cercle
// « maintenant » se place entre deux points selon l'heure.
const LARGEUR = 300;
const HAUTEUR = 28;
const COLONNE = LARGEUR / 5;
const xPriere = (i: number) => (i + 0.5) * COLONNE;
const Y = 14;

/**
 * Écran Prière, variante « typographie seule » : la prochaine prière au centre, puis la frise du jour
 * (cinq points, trait plein jusqu'à la prochaine prière). Remplace l'arc du jour.
 */
export function PrieresCentrale({ titre, nomEtHeure, dans, prieres, maintenant, description }: PrieresCentraleProps) {
  const { couleurs, espace, typographie } = useTheme();

  const indiceSuivante = prieres.findIndex((p) => p.etat === 'prochaine');
  // Trait plein jusqu'à la prochaine prière ; toutes passées : jusqu'au dernier point.
  const finTrait = xPriere(indiceSuivante >= 0 ? indiceSuivante : prieres.length - 1);
  const segment = maintenant === undefined ? null : segmentMaintenant(maintenant, prieres.map((p) => p.minutes));
  const xMaintenant = segment ? xPriere(segment.indice) + (xPriere(segment.indice + 1) - xPriere(segment.indice)) * segment.fraction : null;

  return (
    <View accessible accessibilityRole="summary" accessibilityLabel={description} style={[styles.bloc, { gap: espace.espace2 }]}>
      <Text style={[typographie.libelle, styles.centre, { color: couleurs.encre2 }]}>{titre}</Text>
      <Text style={[typographie.titre1, styles.centre, { color: couleurs.emeraude }]}>{nomEtHeure}</Text>
      <Text style={[typographie.corps, styles.centre, { color: couleurs.encre2 }]}>{dans}</Text>

      <View
        importantForAccessibility="no-hide-descendants"
        accessibilityElementsHidden
        style={[styles.frise, I18nManager.isRTL ? styles.miroir : undefined]}>
        <Svg width="100%" height={HAUTEUR} viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`}>
          <Line x1={0} y1={Y} x2={LARGEUR} y2={Y} stroke={couleurs.ligne} strokeWidth={2} />
          <Line x1={xPriere(0)} y1={Y} x2={finTrait} y2={Y} stroke={couleurs.emeraude} strokeWidth={3} strokeLinecap="round" />
          {prieres.map((p, i) => {
            const cx = xPriere(i);
            if (p.etat === 'prochaine') return <Circle key={p.nom} cx={cx} cy={Y} r={7} fill={couleurs.or} />;
            if (p.etat === 'passee') return <Circle key={p.nom} cx={cx} cy={Y} r={4.5} fill={couleurs.emeraude} />;
            return <Circle key={p.nom} cx={cx} cy={Y} r={4.5} fill={couleurs.fond} stroke={couleurs.ligneForte} strokeWidth={1.5} />;
          })}
          {xMaintenant !== null ? <Circle cx={xMaintenant} cy={Y} r={3} fill={couleurs.or} stroke={couleurs.fond} strokeWidth={1.5} /> : null}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { alignItems: 'stretch' },
  centre: { textAlign: 'center' },
  frise: { width: '100%' },
  miroir: { transform: [{ scaleX: -1 }] },
});
