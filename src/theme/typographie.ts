// Styles de texte du design system (section « Jetons en React Native »).
// Ne jamais ajouter fontWeight : la graisse est portée par la famille.
import type { TextStyle } from 'react-native';

import type { NomPolice } from './polices';

type StyleTexte = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontVariant' | 'includeFontPadding' | 'textAlignVertical'> & {
  fontFamily: NomPolice;
};

export const typographie = {
  display: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 40, lineHeight: 44, letterSpacing: -0.4, includeFontPadding: false, textAlignVertical: 'center' },
  titre1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 30, lineHeight: 36, includeFontPadding: false, textAlignVertical: 'center' },
  titre2: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 24, lineHeight: 30, includeFontPadding: false, textAlignVertical: 'center' },
  chiffre: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'], includeFontPadding: false, textAlignVertical: 'center' },
  titre3: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 18, lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  corps: { fontFamily: 'SourceSans3_400Regular', fontSize: 16, lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  libelle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' },
  legende: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, lineHeight: 16, includeFontPadding: false, textAlignVertical: 'center' },
  lecture: { fontFamily: 'SourceSerif4_400Regular', fontSize: 18, lineHeight: 30, includeFontPadding: false, textAlignVertical: 'center' },
  translitteration: { fontFamily: 'SourceSerif4_400Regular_Italic', fontSize: 15, lineHeight: 24, includeFontPadding: false, textAlignVertical: 'center' },
  coran: { fontFamily: 'AmiriQuran_400Regular', fontSize: 28, lineHeight: 56, includeFontPadding: false, textAlignVertical: 'center' },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: 22, lineHeight: 40, includeFontPadding: false, textAlignVertical: 'center' },
  // Interface en arabe : remplacent display et les styles d'interface.
  titreAr: { fontFamily: 'Amiri_700Bold', fontSize: 30, lineHeight: 44, includeFontPadding: false, textAlignVertical: 'center' },
  corpsAr: { fontFamily: 'NotoSansArabic_400Regular', fontSize: 16, lineHeight: 26, includeFontPadding: false, textAlignVertical: 'center' },
  titre3Ar: { fontFamily: 'NotoSansArabic_600SemiBold', fontSize: 18, lineHeight: 28, includeFontPadding: false, textAlignVertical: 'center' },
  libelleAr: { fontFamily: 'NotoSansArabic_600SemiBold', fontSize: 14, lineHeight: 22, includeFontPadding: false, textAlignVertical: 'center' },
  legendeAr: { fontFamily: 'NotoSansArabic_400Regular', fontSize: 13, lineHeight: 20, includeFontPadding: false, textAlignVertical: 'center' },
} as const satisfies Record<string, StyleTexte>;

export type NomStyleTexte = keyof typeof typographie;
export type Typographie = { [K in NomStyleTexte]: StyleTexte };

/**
 * Interface en arabe : Cormorant et Source Sans n'ont pas de lettres arabes.
 * Titres en Amiri gras, interface en Noto Sans Arabic ; chiffres, lecture, translittération,
 * Coran et arabe inchangés. Les formules wolof gardent la typographie latine (voir `latin` du thème).
 */
export const typographieArabe: Typographie = {
  ...typographie,
  display: typographie.titreAr,
  titre1: { fontFamily: 'Amiri_700Bold', fontSize: 28, lineHeight: 42, includeFontPadding: false, textAlignVertical: 'center' },
  titre2: { fontFamily: 'Amiri_700Bold', fontSize: 24, lineHeight: 36, includeFontPadding: false, textAlignVertical: 'center' },
  titre3: typographie.titre3Ar,
  corps: typographie.corpsAr,
  libelle: typographie.libelleAr,
  legende: typographie.legendeAr,
  // Les traductions des formules wolof sont en arabe : pas d'italique, police arabe.
  translitteration: typographie.corpsAr,
};

// Plafonds de maxFontSizeMultiplier : 2 pour le texte courant, 1.3 pour les grands chiffres, 1.5 pour les onglets.
export const echelleMax = { courant: 2, grand: 1.3, onglets: 1.5 } as const;
