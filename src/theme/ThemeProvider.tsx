import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { createContext, useEffect, useMemo, type ReactNode } from 'react';
import { useColorScheme, type TextStyle } from 'react-native';

import { cible, espace, rayon, themes, type Couleurs, type NomTheme, type Ombres } from './tokens.generated';
import { interligneAdapte } from '@/lib/interligne';
import { typographie, typographieArabe, type Typographie } from './typographie';
import { themeCourant, type ChoixTheme } from './choixTheme';

export type Theme = {
  nom: NomTheme;
  couleurs: Couleurs;
  ombres: Ombres;
  espace: typeof espace;
  rayon: typeof rayon;
  cible: typeof cible;
  /** Styles de texte de la langue de l'interface. */
  typographie: Typographie;
  /** Styles latins, pour les formules wolof et les noms propres en interface arabe. */
  latin: typeof typographie;
  /** Interface en arabe. */
  arabe: boolean;
  /** Style local `{ fontSize, lineHeight }` dont l'interligne est élargi en interface arabe. */
  ligne: <T extends TextStyle>(style: T) => T;
};

export const ThemeContext = createContext<Theme | null>(null);

type Props = {
  children: ReactNode;
  // Réglages persistés plus tard dans utilisateur.db ; valeurs par défaut du design system.
  choix?: ChoixTheme;
  interfaceArabe?: boolean;
};

export function ThemeProvider({ children, choix = 'auto', interfaceArabe = false }: Props) {
  const systeme = useColorScheme();
  const nom = themeCourant({ choix, systeme });

  const theme = useMemo<Theme>(
    () => ({ nom, ...themes[nom], espace, rayon, cible, typographie: interfaceArabe ? typographieArabe : typographie,
      latin: typographie,
      arabe: interfaceArabe,
      ligne: (st) =>
        st.fontSize !== undefined && st.lineHeight !== undefined
          ? { ...st, lineHeight: interligneAdapte(st.fontSize, st.lineHeight, interfaceArabe) }
          : st,
    }),
    [nom, interfaceArabe]
  );

  // Fond racine natif : évite le flash blanc entre deux écrans.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(theme.couleurs.fond).catch((erreur: unknown) => {
      console.warn('Fond système non appliqué', erreur);
    });
  }, [theme.couleurs.fond]);

  return (
    <ThemeContext value={theme}>
      <StatusBar style={nom === 'jour' ? 'dark' : 'light'} />
      {children}
    </ThemeContext>
  );
}
