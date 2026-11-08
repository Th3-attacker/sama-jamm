import { useWindowDimensions } from 'react-native';

import { classeHauteur, classeLargeur } from './classesFenetre';

/** Classes de largeur et de hauteur de la fenêtre courante (suit rotation, Split View, pliants). */
export function useWindowClass() {
  const { width, height } = useWindowDimensions();
  return { largeur: classeLargeur(width), hauteur: classeHauteur(height) };
}
