import { Platform } from 'react-native';
import { SafeAreaView } from 'react-native-screens/experimental';

import { usePlaceBas } from '@/stores/placeBas';

/**
 * Sonde invisible collée en bas d'un onglet (iOS) : sa hauteur est la marge de sécurité du bas de la vue, qui
 * inclut la barre d'onglets quand elle est affichée. Elle donne la vraie hauteur à laisser libre, sur tout iPhone.
 * Sur Android, expo-router applique déjà cette marge : rien à mesurer.
 */
export function SondeBarre() {
  if (Platform.OS !== 'ios') return null;
  return (
    <SafeAreaView
      edges={{ bottom: true }}
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 0, flex: 0 }}
      onLayout={(e) => {
        const h = Math.round(e.nativeEvent.layout.height);
        // Un onglet caché ou la barre masquée renvoie 0 : on garde la dernière vraie mesure.
        if (h > 0 && h !== usePlaceBas.getState().hauteurBarre) usePlaceBas.setState({ hauteurBarre: h });
      }}
    />
  );
}
