import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';

import { segmentMaintenant } from './positionsFrise';
import { useTheme } from '@/theme/useTheme';
import type { PriereArc } from '@/ui/DayArc';

import { interlignes, tailles } from '@/theme/tokens.generated';
type Props = {
  /** Nom de la prochaine prière. */
  nom: string;
  /** Heure de la prochaine prière, déjà formatée. */
  heure: string;
  /** Délai déjà formaté (« 42 min », « 1 h 05 »). */
  dans: string;
  prieres: readonly PriereArc[];
  /** Heure actuelle en minutes depuis minuit : le petit cercle « maintenant » entre deux prières. */
  maintenant?: number;
};

// Frise : 314 × 20. Les cinq points sont répartis régulièrement, chacun juste au-dessus du nom de sa prière (cinq
// colonnes égales) ; le petit cercle « maintenant » se place entre deux points selon l'heure réelle. Les points à
// l'heure réelle (planche) tombaient sous le nom d'une autre prière : décision notée dans ECARTS.md.
const LARGEUR = 314;
const COLONNE = LARGEUR / 5;
const xPriere = (i: number) => (i + 0.5) * COLONNE;

/** « 42 min » → chiffre et unité séparés, comme sur la planche ; « 1 h 05 » reste d'un bloc. */
function separerDelai(dans: string): { valeur: string; unite: string | null } {
  const m = /^([\d٠-٩]+)\s+(min)$/.exec(dans);
  return m ? { valeur: m[1], unite: m[2] } : { valeur: dans, unite: null };
}

/** Carte héros de l'Accueil : la prochaine prière, le délai, l'heure, la frise du jour et les cinq prières (passées atténuées). */
export function CarteHeros({ nom, heure, dans, prieres, maintenant }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie, ligne } = useTheme();
  const surEmeraude = couleurs.surEmeraude;
  const { valeur, unite } = separerDelai(dans);

  const indiceSuivante = prieres.findIndex((p) => p.etat === 'prochaine');
  // Trait plein jusqu'à la prochaine prière ; toutes passées : jusqu'au dernier point.
  const finTrait = xPriere(indiceSuivante >= 0 ? indiceSuivante : prieres.length - 1);
  const segment = maintenant === undefined ? null : segmentMaintenant(maintenant, prieres.map((p) => p.minutes));
  const xMaintenant = segment ? xPriere(segment.indice) + (xPriere(segment.indice + 1) - xPriere(segment.indice)) * segment.fraction : null;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('accueil.avant', { priere: nom })}, ${t('accueil.a', { heure })}, ${dans}`}
      onPress={() => router.push('/priere')}
      style={[styles.carte, { gap: espace.espace3, padding: espace.espace4, backgroundColor: couleurs.emeraudeAplat }]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, ligne(styles.libelle), { color: surEmeraude }]}>
        {t('accueil.prochaine', { priere: nom })}
      </Text>
      <View style={[styles.ligne, { gap: espace.espace2 }]}>
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, ligne(styles.delai), { color: surEmeraude }]}>
          {valeur}
        </Text>
        {unite ? (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.corps, ligne(styles.unite), { color: surEmeraude }]}>
            {unite}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, styles.heure, { color: surEmeraude }]}>
          {heure}
        </Text>
      </View>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={I18nManager.isRTL ? styles.miroir : undefined}>
        <Svg width="100%" height={20} viewBox={`0 0 ${LARGEUR} 20`}>
          <Line x1={xPriere(0)} y1={10} x2={xPriere(4)} y2={10} stroke={surEmeraude} strokeWidth={1.5} strokeDasharray="2 5" />
          <Line x1={xPriere(0)} y1={10} x2={finTrait} y2={10} stroke={surEmeraude} strokeWidth={2.5} strokeLinecap="round" />
          {prieres.map((p, i) => {
            const cx = xPriere(i);
            // Fond de la carte = émeraude : la prochaine prière est un grand cercle creux, les passées sont pleines.
            if (p.etat === 'prochaine')
              return <Circle key={p.nom} cx={cx} cy={10} r={7} fill={couleurs.emeraudeAplat} stroke={surEmeraude} strokeWidth={2.5} />;
            if (p.etat === 'passee') return <Circle key={p.nom} cx={cx} cy={10} r={4.5} fill={surEmeraude} />;
            return <Circle key={p.nom} cx={cx} cy={10} r={4.5} fill={couleurs.emeraudeAplat} stroke={surEmeraude} strokeWidth={1.5} />;
          })}
          {xMaintenant !== null ? (
            <Circle cx={xMaintenant} cy={10} r={3} fill={couleurs.orSurEmeraude} stroke={couleurs.emeraudeAplat} strokeWidth={1.5} />
          ) : null}
        </Svg>
      </View>
      <View style={styles.prieres}>
        {prieres.map((p) => {
          const style = [
            p.etat === 'prochaine' ? typographie.libelle : typographie.legende,
            ligne(styles.nom),
            { color: surEmeraude },
          ];
          return (
            <View key={p.nom} style={styles.priere}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={style}>
                {p.nom}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={style}>
                {p.heure}
              </Text>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Planche : rayon 24.
  carte: { borderRadius: 24 },
  libelle: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  // Planche : 56/60 pour le chiffre, 18/24 pour l'unité.
  delai: { fontSize: tailles.t56, lineHeight: interlignes.l60, fontVariant: ['tabular-nums'] },
  unite: { fontSize: tailles.t18, lineHeight: interlignes.l24 },
  heure: { marginStart: 'auto', fontVariant: ['tabular-nums'] },
  miroir: { transform: [{ scaleX: -1 }] },
  prieres: { flexDirection: 'row' },
  priere: { flex: 1 },
  nom: { fontSize: tailles.t12, lineHeight: interlignes.l16, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
