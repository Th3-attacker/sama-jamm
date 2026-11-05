import { memo, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';

import { basmalaDe, reperes, segmentsDePage, sourate } from '@/features/lire/coran';
import { useTheme } from '@/theme/useTheme';

const CHIFFRES_ARABES = '٠١٢٣٤٥٦٧٨٩';

/** Marqueur de verset style mushaf : chiffres arabo-indiens entre crochets ornés, ﴿٥﴾. */
export function marqueur(n: number): string {
  return `﴿${String(n).replace(/\d/g, (d) => CHIFFRES_ARABES[Number(d)])}﴾`;
}

/** Taille de départ du texte coranique en mode page ; ajustée ensuite pour remplir l'écran. */
const POLICE_DE_BASE = 28;
const INTERLIGNE = 2;
const COEF_MIN = 0.35;
const COEF_MAX = 1.4;
/** La page est « remplie » entre 94 % et 100 % de la hauteur disponible. */
const REMPLI = 0.94;
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

  const nomPage = segments[0] ? (sourate(segments[0].sourate)?.nom ?? '') : '';
  const juz = segments[0] ? reperes().juzDe(segments[0].sourate, segments[0].versets[0]?.verset ?? 1) : null;
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
    if (pret || h <= 0 || disponible <= 0) return;
    const tient = h <= disponible;
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
    const estime = coef * Math.sqrt(disponible / h) * (tient ? 1 : 0.98);
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
        paddingHorizontal: espace.espace4,
      }}>
      {/* En-tête : juz à gauche, numéro de page au centre, sourate à droite. */}
      <View style={[styles.ligne, { height: enTete }]}>
        <Text allowFontScaling={false} style={[typographie.legende, styles.cote, { color: couleurs.encre3 }]}>
          {juz !== null ? t('lire.juz', { n: juz }) : ''}
        </Text>
        <Text allowFontScaling={false} style={[typographie.libelle, { color: couleurs.emeraude }]}>
          {page}
        </Text>
        <Text allowFontScaling={false} style={[typographie.legende, styles.cote, styles.droite, { color: couleurs.encre3 }]}>
          {nomPage}
        </Text>
      </View>
      {/* Cadre à double filet, comme une page de mushaf ; le numéro de page en chiffres arabes en bas. */}
      <View
        style={[
          styles.cadreExterieur,
          { borderColor: couleurs.or, borderRadius: rayon.rayonCarte, padding: 3, marginTop: espace.espace2, marginBottom: espace.espace2 },
        ]}>
        <View style={[styles.cadreInterieur, { borderColor: couleurs.or, borderRadius: rayon.rayonCarte - 2, paddingHorizontal: espace.espace2 }]}>
      <View
        onLayout={mesurerCadre}
        style={[styles.cadre, { opacity: pret ? 1 : 0, marginTop: espace.espace2 }]}>
        <View onLayout={mesurerTexte} style={{ gap: espace.espace2 * coef }}>
          {segments.map((seg) => {
            const meta = sourate(seg.sourate);
            const commence = seg.versets[0]?.verset === 1;
            const basmala = commence ? basmalaDe(seg.sourate) : undefined;
            return (
              <View key={`${seg.sourate}-${seg.versets[0]?.verset ?? 0}`} style={{ gap: espace.espace1 * coef }}>
                {commence && meta ? (
                  <View
                    style={[
                      styles.bandeau,
                      {
                        borderColor: couleurs.or,
                        backgroundColor: couleurs.orDoux,
                        borderRadius: rayon.rayonCarte,
                      },
                    ]}>
                    <Text
                      accessibilityRole="header"
                      accessibilityLanguage="ar"
                      allowFontScaling={false}
                      style={[typographie.coran, texte, styles.centre, { color: couleurs.orTexte }]}>
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
                  {seg.versets.map((v) => `${v.texte} ${marqueur(v.verset)} `).join('')}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
          <Text
            allowFontScaling={false}
            style={[typographie.libelle, styles.centre, { color: couleurs.orTexte, paddingVertical: espace.espace1 }]}>
            {String(page).replace(/\d/g, (d) => CHIFFRES_ARABES[Number(d)] ?? d)}
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
  bandeau: { borderWidth: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 2 },
  justifie: { textAlign: 'justify', writingDirection: 'rtl' },
});
