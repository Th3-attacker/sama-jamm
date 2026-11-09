import { useEffect } from 'react';
import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaceBas } from '@/stores/placeBas';

import { useBottomStack } from './placeMiniLecteur';

/**
 * Sonde de développement (`__DEV__` seulement) : journalise la hauteur réelle de la barre d'onglets, des zones de
 * sécurité et de la pile du bas, à comparer aux cibles du design 18 (barre 70 à 128, pile 198 à 232 avec mini 40
 * et compteur). Les écarts se rapportent, ils ne se masquent pas. N'affiche rien.
 */
export function SondeDev() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const pile = useBottomStack();
  const mesuree = usePlaceBas((s) => s.hauteurBarre);
  useEffect(() => {
    if (!__DEV__) return;
    console.log(
      '[sonde-onglets]',
      JSON.stringify({ os: Platform.OS, version: Platform.Version, fenetre: { width, height }, insets, barreMesuree: mesuree, pile })
    );
  }, [width, height, insets, mesuree, pile]);
  return null;
}
