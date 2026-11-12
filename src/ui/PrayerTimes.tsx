import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';

import { Icon } from './Icon';

import { tailles } from '@/theme/tokens.generated';
export type LignePriere = {
  id: string;
  nom: string;
  nomLocal: string;
  nomArabe: string;
  /** « 16:35 ». */
  heure: string;
  etat: 'passee' | 'prochaine' | 'a-venir';
  /** « dans 42 min », pour la prochaine. */
  dans?: string;
  appelActif: boolean;
  /** Libellé de la cloche : « Appel d'Asr activé ». */
  libelleAppel: string;
};

export type PrayerTimesProps = {
  prieres: LignePriere[];
  onBasculerAppel: (id: string) => void;
};

// Cloche barrée : appel désactivé (Lucide n'a pas d'équivalent au trait du design system).
function ClocheBarree({ couleur }: { couleur: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={couleur} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z" />
      <Path d="M10 20.5a2 2 0 0 0 4 0" />
      <Path d="M4 4l16 16" />
    </Svg>
  );
}

// Les cinq prières du jour, la prochaine mise en avant (fond, graisse et texte, pas la couleur seule).
export function PrayerTimes({ prieres, onBasculerAppel }: PrayerTimesProps) {
  const { couleurs, espace, rayon, cible, typographie, ligne } = useTheme();

  return (
    <View style={{ gap: espace.espace1 }}>
      {prieres.map((p) => {
        const prochaine = p.etat === 'prochaine';
        const passee = p.etat === 'passee';
        const teinte = prochaine ? couleurs.emeraude : passee ? couleurs.encre3 : couleurs.encre;
        const gras = passee ? 'SourceSans3_400Regular' : 'SourceSans3_600SemiBold';
        return (
          <View
            key={p.id}
            accessibilityState={prochaine ? { selected: true } : undefined}
            style={[
              styles.ligne,
              {
                minHeight: prochaine ? 60 : 56,
                gap: espace.espace3,
                paddingStart: espace.espace3,
                borderRadius: rayon.rayonCarte,
                backgroundColor: prochaine ? couleurs.emeraudeDoux : 'transparent',
              },
            ]}>
            <View style={styles.noms}>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, { fontFamily: gras, color: teinte }]}>
                {prochaine && p.dans ? `${p.nom} · ${p.dans}` : p.nom}
              </Text>
              <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.legende, { color: prochaine ? couleurs.encre2 : couleurs.encre3 }]}>
                {p.nomLocal}
              </Text>
            </View>
            <Text
              accessibilityLanguage="ar"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[ligne(styles.arabe), { color: passee ? couleurs.encre3 : couleurs.encre2 }]}>
              {p.nomArabe}
            </Text>
            <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.titre3, styles.heure, { fontFamily: gras, color: teinte }]}>
              {p.heure}
            </Text>
            <Pressable
              accessibilityRole="switch"
              accessibilityLabel={p.libelleAppel}
              accessibilityState={{ checked: p.appelActif }}
              onPress={() => onBasculerAppel(p.id)}
              style={[styles.cloche, { width: cible.cibleIos, height: cible.cibleIos }]}>
              {p.appelActif ? <Icon name="bell" size={20} color={prochaine ? couleurs.emeraude : passee ? couleurs.encre3 : couleurs.encre2} /> : <ClocheBarree couleur={couleurs.encre3} />}
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center' },
  noms: { flex: 1 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: tailles.t22, lineHeight: 32, writingDirection: 'rtl', includeFontPadding: false, textAlignVertical: 'center' },
  heure: { fontVariant: ['tabular-nums'] },
  cloche: { alignItems: 'center', justifyContent: 'center' },
});
