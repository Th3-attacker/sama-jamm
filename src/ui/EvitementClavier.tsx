import { KeyboardAvoidingView, Platform, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';

type Props = {
  style?: StyleProp<ViewStyle>;
  /**
   * Android seulement : sur iPhone, le défilement s'en charge déjà (`automaticallyAdjustKeyboardInsets` du ScrollView,
   * qui amène aussi le champ actif au-dessus du clavier). Sans cela, l'écart serait compté deux fois.
   */
  androidSeulement?: boolean;
  children: ReactNode;
};

/**
 * Remonte le contenu quand le clavier s'ouvre, sur iOS comme sur Android. Avec l'affichage bord à bord d'Android,
 * le système ne redimensionne plus la fenêtre : sans ce rembourrage, le clavier recouvre le champ en cours de saisie.
 */
export function EvitementClavier({ style, androidSeulement = false, children }: Props) {
  return (
    <KeyboardAvoidingView style={style} behavior="padding" enabled={!androidSeulement || Platform.OS === 'android'}>
      {children}
    </KeyboardAvoidingView>
  );
}
