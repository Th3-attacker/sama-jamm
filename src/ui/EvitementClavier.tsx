import { KeyboardAvoidingView, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

type Props = { style?: StyleProp<ViewStyle>; children: ReactNode };

/**
 * Remonte le contenu quand le clavier s'ouvre, sur iOS comme sur Android. Avec l'affichage bord à bord d'Android,
 * le système ne redimensionne plus la fenêtre : sans ce rembourrage, le clavier recouvre le champ en cours de saisie.
 */
export function EvitementClavier({ style, children }: Props) {
  return (
    <KeyboardAvoidingView style={style} behavior="padding">
      {children}
    </KeyboardAvoidingView>
  );
}
