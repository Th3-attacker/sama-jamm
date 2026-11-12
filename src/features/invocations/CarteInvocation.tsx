import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { marqueur } from '@/features/lire/PageMushaf';
import { useTaillesLecture } from '@/features/lire/BarreTaille';
import { TranslitVerset } from '@/features/lire/TranslitVerset';
import { sourate, traductionDe, translitDe, versetsDe } from '@/features/lire/coran';
import { useReglages } from '@/stores/reglages';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { Icon } from '@/ui/Icon';

import type { Invocation } from './donnees';

import { interlignes, rayon, tailles } from '@/theme/tokens.generated';
export type Contenu = { n: number; arabe: string; trad: string; translit: string };

export function contenuDe(inv: Invocation): Contenu[] {
  const arabes = versetsDe(inv.sourate);
  const trads = traductionDe(inv.sourate);
  const translits = translitDe(inv.sourate);
  return Array.from({ length: inv.a - inv.de + 1 }, (_, k) => {
    const n = inv.de + k;
    return { n, arabe: arabes[n - 1] ?? '', trad: trads[n - 1] ?? '', translit: translits[n - 1] ?? '' };
  });
}

/** Référence lisible d'une invocation du Coran : « Al-Ikhlas 112:1-4 ». */
export function referenceDe(inv: Invocation): string {
  const nom = sourate(inv.sourate)?.nom ?? '';
  return `${nom} ${inv.sourate}:${inv.de}${inv.a > inv.de ? `-${inv.a}` : ''}`;
}

type CarteProps = {
  /** Texte de la pastille : « Coran · Al-Ikhlas 112:1-4 · 3 fois ». */
  source: string;
  contenu: Contenu[];
  termine: boolean;
  onChoisir: () => void;
  onEcouter: () => void;
  onPartager: () => void;
};

// Planche « Invocations · lecture » : carte surface, pastille de source or-doux, texte, puis Écouter et Partager.
export function CarteInvocation({ source, contenu, termine, onChoisir, onEcouter, onPartager }: CarteProps) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const { tailleArabe, tailleTrad } = useTaillesLecture();
  const affichage = useReglages((s) => s.affichage);
  const translitActive = useReglages((s) => s.translitLecture);

  return (
    <View
      style={{
        backgroundColor: couleurs.surface,
        borderColor: couleurs.ligne,
        borderWidth: 1,
        borderRadius: rayon.rayonCarte,
      }}>
      <Pressable accessibilityRole="button" onPress={onChoisir} style={{ padding: espace.espace5, gap: espace.espace4 }}>
        <View style={styles.sourceLigne}>
          <View style={[styles.pastille, { backgroundColor: couleurs.orDoux, paddingHorizontal: espace.espace3, paddingVertical: espace.espace1 }]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.corps, styles.source, { color: couleurs.orTexte }]}>
              {source}
            </Text>
          </View>
          <View style={styles.espace} />
          {termine ? <Icon name="check-circle" size={20} color={couleurs.emeraude} /> : null}
        </View>
        {affichage !== 'tradSeule' ? (
          <Text
            accessibilityLanguage="ar"
            maxFontSizeMultiplier={echelleMax.grand}
            style={[typographie.coran, tailleArabe, styles.arabe, { color: couleurs.encre }]}>
            {contenu.map((v) => `${v.arabe} ${marqueur(v.n)}`).join(' ')}
          </Text>
        ) : null}
        {affichage !== 'tradSeule' && translitActive
          ? contenu.map((v) => (v.translit ? <TranslitVerset key={v.n} texte={v.translit} taille={tailleTrad} /> : null))
          : null}
        {affichage !== 'arabeSeul' ? (
          <Text maxFontSizeMultiplier={echelleMax.grand} style={[typographie.lecture, tailleTrad, { color: couleurs.encre }]}>
            {contenu.map((v) => v.trad).join(' ')}
          </Text>
        ) : null}
      </Pressable>
      <View style={[styles.actions, { borderTopColor: couleurs.ligne, paddingHorizontal: espace.espace4, paddingVertical: espace.espace2 }]}>
        <Pressable accessibilityRole="button" onPress={onEcouter} style={[styles.ecouter, { gap: espace.espace2 }]}>
          <Icon name="play" size={16} color={couleurs.emeraude} />
          <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.emeraude }]}>
            {t('commun.ecouter')}
          </Text>
        </Pressable>
        <View style={styles.sortie}>
          <Pressable accessibilityRole="button" accessibilityLabel={t('partage.titre')} hitSlop={8} onPress={onPartager} style={styles.icone}>
            <Icon name="share" size={20} color={couleurs.encre2} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sourceLigne: { flexDirection: 'row', alignItems: 'center' },
  pastille: { borderRadius: rayon.rayonPastille, flexShrink: 1 },
  source: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  espace: { flex: 1 },
  arabe: { textAlign: 'right', writingDirection: 'rtl' },
  actions: { flexDirection: 'row', alignItems: 'center', borderTopWidth: StyleSheet.hairlineWidth },
  ecouter: { flexDirection: 'row', alignItems: 'center', minHeight: 44 },
  sortie: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end' },
  icone: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
