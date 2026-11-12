import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { enChiffresArabes } from '@/lib/chiffres';
import { basmalaDe, reperes, segmentsDePage, sourate } from '@/features/lire/coran';
import { useTheme } from '@/theme/useTheme';

import { interlignes, tailles } from '@/theme/tokens.generated';

/** Marqueur de verset style mushaf : chiffres arabo-indiens entre crochets ornés, ﴿٥﴾. */
export function marqueur(n: number): string {
  return `﴿${enChiffresArabes(n)}﴾`;
}

/** Taille de départ du texte coranique en mode page ; ajustée ensuite pour remplir l'écran. */
const POLICE_DE_BASE = 28;
const INTERLIGNE = 2;
const COEF_MIN = 0.35;
const COEF_MAX = 1.4;
/** La page est « remplie » entre 92 % et 98 % de la hauteur disponible : la marge absorbe les écarts de mesure. */
const REMPLI = 0.92;
const LIMITE = 0.98;
const ESSAIS_MAX = 8;

/** Taille trouvée pour chaque page et chaque dimension d'écran : une page revue s'affiche tout de suite. */
const coefsConnus = new Map<string, number>();

type Props = {
  page: number;
  largeur: number;
  hauteur: number;
  /** Marge du haut (barre d'état) : la ligne « page · sourate » passe dessous. */
  hautSur: number;
  /** Marge du bas (zone des gestes du téléphone), la barre des onglets étant masquée. */
  basSur?: number;
  onToucher: () => void;
};

/**
 * Une page du mushaf qui tient dans l'écran, sans défilement : la taille du texte s'ajuste à la hauteur
 * disponible. Pendant les mesures (deux ou trois passes), la page reste invisible pour ne pas « sauter ».
 */
export const PageMushaf = memo(function PageMushaf({ page, largeur, hauteur, hautSur, basSur = 0, onToucher }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const segments = useMemo(() => segmentsDePage(page), [page]);
  const cle = `${page}:${Math.round(largeur)}x${Math.round(hauteur)}:${Math.round(hautSur + basSur)}`;
  const connu = coefsConnus.get(cle);
  const [coef, setCoef] = useState(connu ?? 0.7);
  const [pret, setPret] = useState(connu !== undefined);
  const essais = useRef(0);
  // Plus petite taille connue qui déborde : on ne la retente jamais.
  const trop = useRef(COEF_MAX + 0.01);

  // Hauteurs mesurées : le cadre (place disponible) et le texte de la page à la taille en cours.
  const hCadre = useRef(0);
  const hTexte = useRef(0);

  // Une page peut porter deux sourates et deux juz : l'en-tête les affiche tous les deux.
  const nomsPage = [...new Set(segments.map((s) => sourate(s.sourate)?.nom ?? '').filter(Boolean))].join(' · ');
  const dernierSegment = segments[segments.length - 1];
  const juzDebut = segments[0] ? reperes().juzDe(segments[0].sourate, segments[0].versets[0]?.verset ?? 1) : null;
  const juzFin = dernierSegment
    ? reperes().juzDe(dernierSegment.sourate, dernierSegment.versets[dernierSegment.versets.length - 1]?.verset ?? 1)
    : null;
  const libelleJuz =
    juzDebut === null
      ? ''
      : juzFin !== null && juzFin !== juzDebut
        ? `${t('lire.juz', { n: juzDebut })} · ${t('lire.juz', { n: juzFin })}`
        : t('lire.juz', { n: juzDebut });
  const enTete = espace.espace6;

  const mesurerCadre = (e: LayoutChangeEvent) => {
    hCadre.current = e.nativeEvent.layout.height;
    evaluer();
  };
  const mesurerTexte = (e: LayoutChangeEvent) => {
    hTexte.current = e.nativeEvent.layout.height;
    evaluer();
  };

  const evaluer = () => {
    const disponible = hCadre.current;
    const h = hTexte.current;
    if (h <= 0 || disponible <= 0) return;
    if (pret) {
      // Page déjà ajustée mais le cadre a rétréci depuis (mesure tardive, police) : la dernière ligne serait coupée.
      if (h <= disponible) return;
      coefsConnus.delete(cle);
      essais.current = 0;
      trop.current = Math.min(trop.current, coef);
      setPret(false);
      setCoef(Math.max(COEF_MIN, Math.min(coef * Math.sqrt((disponible * LIMITE) / h), coef - 0.01)));
      return;
    }
    const tient = h <= disponible * LIMITE;
    const fin = (c: number) => {
      coefsConnus.set(cle, c);
      setPret(true);
    };
    if (tient && (h >= disponible * REMPLI || coef >= COEF_MAX)) return fin(coef);
    if (!tient) trop.current = Math.min(trop.current, coef);
    essais.current += 1;
    if (essais.current > ESSAIS_MAX) {
      // Dernier recours : on garantit que la page tient, quitte à être un peu moins remplie.
      if (tient) return fin(coef);
      setCoef((c) => Math.max(COEF_MIN, c * 0.92));
      return;
    }
    // La hauteur suit à peu près le carré de la taille (lignes plus hautes et plus nombreuses).
    const estime = coef * Math.sqrt((disponible * LIMITE) / h) * (tient ? 1 : 0.98);
    const suivant = Math.max(COEF_MIN, Math.min(COEF_MAX, estime, trop.current - 0.01));
    if (Math.abs(suivant - coef) < 0.005) return tient ? fin(coef) : setCoef(Math.max(COEF_MIN, coef - 0.02));
    setCoef(suivant);
  };

  const police = POLICE_DE_BASE * coef;
  const texte = { fontSize: police, lineHeight: police * INTERLIGNE };

  return (
    <Pressable
      accessibilityHint={t('lire.toucherPage')}
      onPress={onToucher}
      style={{
        width: largeur,
        height: hauteur,
        paddingTop: hautSur,
        paddingBottom: basSur,
        paddingHorizontal: espace.espace3,
      }}>
      {/* En-tête : juz à gauche, numéro de page au centre, sourate à droite. */}
      <View style={[styles.ligne, { height: enTete, paddingHorizontal: espace.espace2 }]}>
        <Text numberOfLines={1} allowFontScaling={false} style={[typographie.legende, styles.cote, { color: couleurs.encre3 }]}>
          {libelleJuz}
        </Text>
        <Text allowFontScaling={false} style={[typographie.libelle, styles.numeroPage, { color: couleurs.emeraude }]}>
          {page}
        </Text>
        <Text numberOfLines={1} allowFontScaling={false} style={[typographie.legende, styles.cote, styles.droite, { color: couleurs.encre3 }]}>
          {nomsPage}
        </Text>
      </View>
      {/* Cadre à double filet, comme une page de mushaf ; le numéro de page en chiffres arabes en bas. */}
      <View
        style={[
          styles.cadreExterieur,
          // Planche : fond surface, filet or de 1, 4 d'espace, second filet de 1.
          { borderColor: couleurs.or, backgroundColor: couleurs.surface, borderRadius: rayon.rayonCarte, padding: espace.espace1, marginTop: espace.espace2, marginBottom: espace.espace2 },
        ]}>
        <View style={[styles.cadreInterieur, { borderColor: couleurs.or, borderRadius: rayon.rayonCarte - espace.espace1 - 1, paddingHorizontal: espace.espace3 }]}>
      <View
        onLayout={mesurerCadre}
        style={[styles.cadre, { opacity: pret ? 1 : 0 }]}>
        <View onLayout={mesurerTexte} style={{ gap: espace.espace2 }}>
          {segments.map((seg) => {
            const meta = sourate(seg.sourate);
            const commence = seg.versets[0]?.verset === 1;
            const basmala = commence ? basmalaDe(seg.sourate) : undefined;
            return (
              <View key={`${seg.sourate}-${seg.versets[0]?.verset ?? 0}`} style={{ gap: espace.espace2 }}>
                {commence && meta ? (
                  <View
                    style={[
                      styles.bandeau,
                      // Planche : fond or-doux, rayon 6, sans bordure, nom en Amiri.
                      { backgroundColor: couleurs.orDoux, borderRadius: rayon.rayonPuce, paddingVertical: espace.espace1 },
                    ]}>
                    <Text
                      accessibilityRole="header"
                      accessibilityLanguage="ar"
                      allowFontScaling={false}
                      style={[typographie.arabe, texte, { lineHeight: police * 1.34 }, styles.centre, { color: couleurs.orTexte }]}>
                      {`سورة ${meta.arabe}`}
                    </Text>
                  </View>
                ) : null}
                {basmala ? (
                  <Text
                    accessibilityLanguage="ar"
                    allowFontScaling={false}
                    style={[typographie.coran, texte, styles.centre, { color: couleurs.encre }]}>
                    {basmala.arabe}
                  </Text>
                ) : null}
                {/* Texte continu et justifié, comme une page de mushaf : les versets s'enchaînent. */}
                <Text
                  accessibilityLanguage="ar"
                  allowFontScaling={false}
                  style={[typographie.coran, texte, styles.justifie, { color: couleurs.encre }]}>
                  {seg.versets.map((v) => (
                    <Text key={v.verset}>
                      {`${v.texte} `}
                      <Text style={{ color: couleurs.orTexte }}>{marqueur(v.verset)}</Text>
                      {' '}
                    </Text>
                  ))}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
          <Text
            allowFontScaling={false}
            style={[typographie.arabe, styles.numeroBas, styles.centre, { color: couleurs.encre3, paddingVertical: espace.espace1 }]}>
            {enChiffresArabes(page)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  ligne: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cote: { flex: 1 },
  droite: { textAlign: 'right' },
  cadreExterieur: { flex: 1, borderWidth: 1 },
  cadreInterieur: { flex: 1, borderWidth: 1 },
  cadre: { flex: 1, overflow: 'hidden', justifyContent: 'center' },
  centre: { textAlign: 'center', writingDirection: 'rtl' },
  numeroPage: { fontSize: tailles.t12, lineHeight: interlignes.l16 },
  numeroBas: { fontSize: tailles.t14, lineHeight: interlignes.l20 },
  bandeau: { alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  justifie: { textAlign: 'justify', writingDirection: 'rtl' },
});
