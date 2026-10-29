// Styles de texte du design system (section « Jetons en React Native »).
// Ne jamais ajouter fontWeight : la graisse est portée par la famille.
import type { TextStyle } from 'react-native';

import type { NomPolice } from './polices';

type StyleTexte = Pick<TextStyle, 'fontSize' | 'lineHeight' | 'letterSpacing' | 'fontVariant'> & {
  fontFamily: NomPolice;
};

export const typographie = {
  display: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 40, lineHeight: 44, letterSpacing: -0.4 },
  titre1: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 30, lineHeight: 36 },
  titre2: { fontFamily: 'CormorantGaramond_600SemiBold', fontSize: 24, lineHeight: 30 },
  chiffre: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 44, lineHeight: 48, fontVariant: ['tabular-nums'] },
  titre3: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 18, lineHeight: 24 },
  corps: { fontFamily: 'SourceSans3_400Regular', fontSize: 16, lineHeight: 24 },
  libelle: { fontFamily: 'SourceSans3_600SemiBold', fontSize: 14, lineHeight: 20 },
  legende: { fontFamily: 'SourceSans3_400Regular', fontSize: 12, lineHeight: 16 },
  lecture: { fontFamily: 'SourceSerif4_400Regular', fontSize: 18, lineHeight: 30 },
  translitteration: { fontFamily: 'SourceSerif4_400Regular_Italic', fontSize: 15, lineHeight: 24 },
  coran: { fontFamily: 'AmiriQuran_400Regular', fontSize: 28, lineHeight: 56 },
  arabe: { fontFamily: 'Amiri_400Regular', fontSize: 22, lineHeight: 40 },
  // Interface en arabe : remplacent display et les styles d'interface.
  titreAr: { fontFamily: 'Amiri_700Bold', fontSize: 30, lineHeight: 44 },
  corpsAr: { fontFamily: 'NotoSansArabic_400Regular', fontSize: 16, lineHeight: 26 },
  titre3Ar: { fontFamily: 'NotoSansArabic_600SemiBold', fontSize: 18, lineHeight: 28 },
  libelleAr: { fontFamily: 'NotoSansArabic_600SemiBold', fontSize: 14, lineHeight: 22 },
  legendeAr: { fontFamily: 'NotoSansArabic_400Regular', fontSize: 13, lineHeight: 20 },
} as const satisfies Record<string, StyleTexte>;

export type NomStyleTexte = keyof typeof typographie;

// Plafonds de maxFontSizeMultiplier : 2 pour le texte courant, 1.3 pour les grands chiffres, 1.5 pour les onglets.
export const echelleMax = { courant: 2, grand: 1.3, onglets: 1.5 } as const;
