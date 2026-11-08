import { Platform, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaceBas } from '@/stores/placeBas';
import { usePleinEcran } from '@/stores/pleinEcran';
import { ACCESSOIRE_NATIF, reperesBarre } from '@/theme/layout';
import { calculerPile, type PileBas } from '@/theme/pileBas';

import { useLecteur } from './lecteur';

export { ACCESSOIRE_NATIF };

/** Vrai pendant une écoute, hors page mushaf plein écran (que la pile ait de la place ou non). */
function useEcouteActive(): boolean {
  const enEcoute = useLecteur((s) => s.position !== null);
  const pleinEcran = usePleinEcran((s) => s.actif);
  return enEcoute && !pleinEcran;
}

/**
 * Hauteur de la zone de la barre d'onglets : mesurée par la sonde sur iOS (zone de sécurité comprise), repère de
 * secours tant qu'elle n'a rien mesuré. Sur Android : barre Material + zone de sécurité du bas, lues à l'exécution.
 */
function useHauteurBarre(): number {
  const insets = useSafeAreaInsets();
  const mesuree = usePlaceBas((s) => s.hauteurBarre);
  if (Platform.OS === 'android') return reperesBarre.androidMaterial + insets.bottom;
  if (mesuree > 0) return mesuree;
  return (ACCESSOIRE_NATIF ? reperesBarre.ios26 : reperesBarre.iosClassique) + insets.bottom;
}

/** La pile du bas (design 18) : barre d'onglets, mini-lecteur, compteur ou pilule, avec plafond de 35 %. */
export function useBottomStack(): PileBas {
  const { height } = useWindowDimensions();
  const barre = useHauteurBarre();
  const miniActif = useEcouteActive();
  const miniMesure = usePlaceBas((s) => s.hauteurMini);
  const outil = usePlaceBas((s) => s.outil);
  return calculerPile({ hauteurFenetre: height, hauteurBarre: barre, miniActif, outil, miniMesure });
}

/**
 * Part de la pile que le contenu doit laisser libre : sur Android, expo-router applique déjà la barre d'onglets,
 * on la retire ; sur iOS le contenu passe sous la barre, on la garde.
 */
function sansBarreSurAndroid(pile: PileBas, valeur: number): number {
  return Platform.OS === 'android' ? Math.max(0, valeur - pile.barre) : valeur;
}

/** Vrai quand le mini-lecteur est affiché : une écoute est en cours et le plafond ne l'a pas rangé. */
export function useMiniLecteurVisible(): boolean {
  return useBottomStack().mini > 0;
}

/**
 * Place à laisser en bas du contenu défilant (`paddingBottom`) : pile visible + marge de contenu. La liste défile
 * alors jusque derrière la barre et le dernier élément s'arrête juste au-dessus.
 */
export function useBottomInset(): number {
  const pile = useBottomStack();
  return sansBarreSurAndroid(pile, pile.margeContenu);
}

/** Ancien nom de `useBottomInset`, gardé pour les écrans existants. */
export const useMargeBasse = useBottomInset;

/** Place que le compteur ou la pilule laisse libre sous lui (barre d'onglets et mini-lecteur). */
export function useDessousOutil(): number {
  const pile = useBottomStack();
  return sansBarreSurAndroid(pile, pile.dessousOutil);
}

/** Décalage du bandeau de repli (Android, iOS avant 26) : juste au-dessus de la barre d'onglets. */
export function useDecalageBandeau(): number {
  return useBottomStack().barre;
}
