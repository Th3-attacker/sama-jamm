import type { ColorSchemeName } from 'react-native';

import type { NomTheme } from './tokens.generated';

export type ChoixTheme = 'auto' | NomTheme;

type Contexte = {
  choix: ChoixTheme;
  systeme: ColorSchemeName | null;
  veilleAuto: boolean;
  // Vrai entre Isha et Fajr ; fourni par les horaires de prière (étape Prière).
  nuitDePriere: boolean;
};

export function themeCourant({ choix, systeme, veilleAuto, nuitDePriere }: Contexte): NomTheme {
  if (choix !== 'auto') return choix;
  if (veilleAuto && nuitDePriere) return 'veille';
  return systeme === 'dark' ? 'nuit' : 'jour';
}
