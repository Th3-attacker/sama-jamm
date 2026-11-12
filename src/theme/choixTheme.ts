import type { ColorSchemeName } from 'react-native';

import type { NomTheme } from './tokens.generated';

export type ChoixTheme = 'auto' | NomTheme;

type Contexte = {
  choix: ChoixTheme;
  systeme: ColorSchemeName | null;
};

/** Jour ou nuit : le choix de l'utilisateur, sinon le mode du téléphone. */
export function themeCourant({ choix, systeme }: Contexte): NomTheme {
  if (choix !== 'auto') return choix;
  return systeme === 'dark' ? 'nuit' : 'jour';
}
