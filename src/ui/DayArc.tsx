import { I18nManager, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Path, Polygon } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

export type PriereArc = {
  nom: string;
  /** « 16:35 ». */
  heure: string;
  /** Minutes depuis minuit. */
  minutes: number;
  etat: 'passee' | 'prochaine' | 'a-venir';
};

export type DayArcProps = {
  /** Minutes depuis minuit. */
  lever: number;
  coucher: number;
  maintenant: number;
  prieres: PriereArc[];
  /** « 42 min ». */
  dans: string;
  /** « avant Asr » et « à 16:35 », déjà traduits. */
  avant: string;
  a: string;
  /** Pour les lecteurs d'écran. */
  description: string;
};

// Géométrie du design system (bundle.js).
const W = 342;
const HZ = 104;
const X0 = 24;
const X1 = 318;
const CX = 171;
const RX = 147;
const RY = 84;
const NUIT_Y = 146;

function etoile(cx: number, cy: number, R: number): string {
  const r = (R * Math.cos(Math.PI / 4)) / Math.cos(Math.PI / 8);
  return Array.from({ length: 16 }, (_, k) => {
    const a = ((-90 + k * 22.5) * Math.PI) / 180;
    const rad = k % 2 === 0 ? R : r;
    return `${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
}

export function DayArc({ lever, coucher, maintenant, prieres, dans, avant, a, description }: DayArcProps) {
  const { couleurs, espace, typographie } = useTheme();

  const pos = (m: number): [number, number] => {
    if (m >= lever && m <= coucher) {
      const angle = Math.PI * (1 - (m - lever) / (coucher - lever));
      return [CX + RX * Math.cos(angle), HZ - RY * Math.sin(angle)];
    }
    const t = ((m - coucher + 1440) % 1440) / (1440 - (coucher - lever));
    const u = 1 - t;
    return [u * u * X1 + 2 * u * t * CX + t * t * X0, u * u * HZ + 2 * u * t * NUIT_Y + t * t * HZ];
  };

  const soleil = pos(maintenant);
  const jour = maintenant >= lever && maintenant <= coucher;

  return (
    <View style={{ gap: espace.espace1 }}>
      <View style={styles.tete}>
        <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.chiffre, { color: couleurs.encre }]}>
          {dans}
        </Text>
        <View style={styles.prochaine}>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {avant}
          </Text>
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { color: couleurs.encre2 }]}>
            {a}
          </Text>
        </View>
      </View>

      {/* En interface arabe, l'arc se retourne : Fajr à droite. */}
      <View accessible accessibilityRole="image" accessibilityLabel={description} style={I18nManager.isRTL ? styles.miroir : undefined}>
        <Svg width="100%" height={124} viewBox={`0 0 ${W} 124`}>
          <Line x1={0} y1={HZ} x2={W} y2={HZ} stroke={couleurs.ligne} strokeWidth={1.5} />
          <Path d={`M ${X0} ${HZ} A ${RX} ${RY} 0 0 1 ${X1} ${HZ}`} fill="none" stroke={couleurs.ligne} strokeWidth={2} />
          {jour ? (
            <Path
              d={`M ${X0} ${HZ} A ${RX} ${RY} 0 0 1 ${soleil[0].toFixed(1)} ${soleil[1].toFixed(1)}`}
              fill="none"
              stroke={couleurs.emeraude}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
          ) : null}
          <Path d={`M ${X1} ${HZ} Q ${CX} ${NUIT_Y} ${X0} ${HZ}`} fill="none" stroke={couleurs.ligneForte} strokeWidth={1.5} strokeDasharray="4 5" />
          {prieres.map((p) => {
            const [x, y] = pos(p.minutes);
            if (p.etat === 'prochaine') {
              return <Circle key={p.nom} cx={x} cy={y} r={7} fill={couleurs.fond} stroke={couleurs.emeraude} strokeWidth={2.5} />;
            }
            if (p.etat === 'passee') return <Circle key={p.nom} cx={x} cy={y} r={4.5} fill={couleurs.emeraude} />;
            return <Circle key={p.nom} cx={x} cy={y} r={4.5} fill={couleurs.fond} stroke={couleurs.ligneForte} strokeWidth={1.5} />;
          })}
          <Polygon points={etoile(soleil[0], soleil[1], 9)} fill={couleurs.or} opacity={jour ? 1 : 0.55} />
        </Svg>
      </View>

      <View style={styles.noms}>
        {prieres.map((p) => {
          const on = p.etat === 'prochaine';
          const style = [typographie.legende, styles.nom, on ? { fontFamily: 'SourceSans3_600SemiBold' as const, color: couleurs.emeraude } : { color: couleurs.encre3 }];
          return (
            <View key={p.nom} style={styles.colonne}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  tete: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  prochaine: { alignItems: 'flex-end' },
  miroir: { transform: [{ scaleX: -1 }] },
  noms: { flexDirection: 'row' },
  colonne: { flex: 1, alignItems: 'center' },
  nom: { fontVariant: ['tabular-nums'], textAlign: 'center' },
});
