import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { I18nManager, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import type { PriereArc } from '@/ui/DayArc';

type Props = {
  /** Nom de la prochaine prière. */
  nom: string;
  /** Heure de la prochaine prière, déjà formatée. */
  heure: string;
  /** Délai déjà formaté (« 42 min », « 1 h 05 »). */
  dans: string;
  prieres: readonly PriereArc[];
};

// Frise de la planche : 314 × 20, premier point à 12, dernier à 302, trait pointillé de 4 à 310.
const LARGEUR = 314;
const X_DEBUT = 12;
const X_FIN = 302;

/** « 42 min » → chiffre et unité séparés, comme sur la planche ; « 1 h 05 » reste d'un bloc. */
function separerDelai(dans: string): { valeur: string; unite: string | null } {
  const m = /^(\d+)\s+(min)$/.exec(dans);
  return m ? { valeur: m[1], unite: m[2] } : { valeur: dans, unite: null };
}

/** Carte héros de l'Accueil : la prochaine prière, le délai, l'heure, la frise du jour et les cinq prières (passées atténuées). */
export function CarteHeros({ nom, heure, dans, prieres }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const surEmeraude = couleurs.surEmeraude;
  const { valeur, unite } = separerDelai(dans);

  const premiere = prieres[0]?.minutes ?? 0;
  const derniere = prieres[prieres.length - 1]?.minutes ?? 1;
  const x = (m: number) => X_DEBUT + ((X_FIN - X_DEBUT) * (m - premiere)) / Math.max(1, derniere - premiere);
  const suivante = prieres.find((p) => p.etat === 'prochaine');
  // Trait plein jusqu'à la prochaine prière ; toutes passées : jusqu'au bout.
  const finTrait = suivante ? x(suivante.minutes) : LARGEUR - 4;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${t('accueil.avant', { priere: nom })}, ${t('accueil.a', { heure })}, ${dans}`}
      onPress={() => router.push('/priere')}
      style={[styles.carte, { gap: espace.espace3, padding: espace.espace4, backgroundColor: couleurs.emeraude }]}>
      <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.libelle, { color: surEmeraude }]}>
        {t('accueil.prochaine', { priere: nom })}
      </Text>
      <View style={[styles.ligne, { gap: espace.espace2 }]}>
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, styles.delai, { color: surEmeraude }]}>
          {valeur}
        </Text>
        {unite ? (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.corps, styles.unite, { color: surEmeraude }]}>
            {unite}
          </Text>
        ) : null}
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre1, styles.heure, { color: surEmeraude }]}>
          {heure}
        </Text>
      </View>
      <View importantForAccessibility="no-hide-descendants" accessibilityElementsHidden style={I18nManager.isRTL ? styles.miroir : undefined}>
        <Svg width="100%" height={20} viewBox={`0 0 ${LARGEUR} 20`}>
          <Line x1={4} y1={10} x2={LARGEUR - 4} y2={10} stroke={surEmeraude} strokeWidth={1.5} strokeDasharray="2 5" />
          <Line x1={4} y1={10} x2={finTrait} y2={10} stroke={surEmeraude} strokeWidth={2.5} strokeLinecap="round" />
          {prieres.map((p) => {
            const cx = x(p.minutes);
            if (p.etat === 'prochaine')
              return <Circle key={p.nom} cx={cx} cy={10} r={7} fill={couleurs.emeraude} stroke={surEmeraude} strokeWidth={2.5} />;
            if (p.etat === 'passee') return <Circle key={p.nom} cx={cx} cy={10} r={4.5} fill={surEmeraude} />;
            return <Circle key={p.nom} cx={cx} cy={10} r={4.5} fill={couleurs.emeraude} stroke={surEmeraude} strokeWidth={1.5} />;
          })}
        </Svg>
      </View>
      <View style={styles.prieres}>
        {prieres.map((p) => {
          const style = [
            p.etat === 'prochaine' ? typographie.libelle : typographie.legende,
            styles.nom,
            { color: surEmeraude, opacity: p.etat === 'passee' ? 0.6 : 1 },
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
  libelle: { fontSize: 14, lineHeight: 20 },
  ligne: { flexDirection: 'row', alignItems: 'baseline' },
  // Planche : 56/60 pour le chiffre, 18/24 pour l'unité.
  delai: { fontSize: 56, lineHeight: 60, fontVariant: ['tabular-nums'] },
  unite: { fontSize: 18, lineHeight: 24 },
  heure: { marginStart: 'auto', fontVariant: ['tabular-nums'] },
  miroir: { transform: [{ scaleX: -1 }] },
  prieres: { flexDirection: 'row' },
  priere: { flex: 1 },
  nom: { fontSize: 12, lineHeight: 16, textAlign: 'center', fontVariant: ['tabular-nums'] },
});
