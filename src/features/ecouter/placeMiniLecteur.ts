import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlaceBas } from '@/stores/placeBas';
import { usePleinEcran } from '@/stores/pleinEcran';

import { useLecteur } from './lecteur';

/** Hauteur réservée au mini-lecteur sous le contenu des onglets (ligne de 40 + marges). */
export const HAUTEUR_MINI_LECTEUR = 56;

/**
 * `NativeTabs.BottomAccessory` n'existe que sur iOS 26 et plus. Ailleurs (Android, iOS plus ancien) le mini-lecteur
 * est un bandeau posé au-dessus de la barre d'onglets.
 */
export const ACCESSOIRE_NATIF = Platform.OS === 'ios' && Number.parseInt(String(Platform.Version), 10) >= 26;

/** Hauteur de la barre d'onglets système hors zone de sécurité : repère pour le bandeau de repli. */
export const HAUTEUR_BARRE_ONGLETS = Platform.OS === 'ios' ? 49 : 80;

/**
 * Hauteur que le contenu doit laisser libre sous lui pour la barre d'onglets, hors zone de sécurité. Seulement sur iOS :
 * sur Android, expo-router applique déjà cette marge. Barre en verre flottante d'iOS 26 : valeur estimée, à ajuster ici.
 */
export const MARGE_BARRE_IOS = ACCESSOIRE_NATIF ? 60 : 42;

/** Vrai pendant une écoute, hors page mushaf plein écran. */
export function useMiniLecteurVisible(): boolean {
  const enEcoute = useLecteur((s) => s.position !== null);
  const pleinEcran = usePleinEcran((s) => s.actif);
  return enEcoute && !pleinEcran;
}

/**
 * Place de la barre d'onglets sous le contenu : mesurée par la sonde sur iOS (zone de sécurité du bas comprise),
 * valeur de secours tant qu'elle n'a rien mesuré. 0 sur Android, où expo-router applique déjà cette marge.
 */
export function usePlaceBarre(): number {
  const insets = useSafeAreaInsets();
  const mesuree = usePlaceBas((s) => s.hauteurBarre);
  if (Platform.OS !== 'ios') return 0;
  return mesuree > 0 ? mesuree : MARGE_BARRE_IOS + insets.bottom;
}

/** Hauteur du mini-lecteur : mesurée, ou valeur de secours avant sa première mesure. */
export function useHauteurMini(): number {
  const mesuree = usePlaceBas((s) => s.hauteurMini);
  return mesuree > 0 ? mesuree : HAUTEUR_MINI_LECTEUR;
}

/**
 * Place à laisser en bas du contenu défilant : la barre d'onglets et le mini-lecteur pendant une écoute. À ajouter
 * au `paddingBottom` de la liste : elle défile alors jusque derrière la barre et le dernier élément s'arrête
 * juste au-dessus.
 */
export function useMargeBasse(): number {
  const barre = usePlaceBarre();
  const miniVisible = useMiniLecteurVisible();
  const mini = useHauteurMini();
  return barre + (miniVisible ? mini : 0);
}

/** Décalage du bandeau de repli (Android, iOS avant 26) : juste au-dessus de la barre d'onglets. */
export function useDecalageBandeau(): number {
  const insets = useSafeAreaInsets();
  const barre = usePlaceBarre();
  return Platform.OS === 'ios' ? barre : HAUTEUR_BARRE_ONGLETS + insets.bottom;
}
