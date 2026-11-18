import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Onglet Recherche (iPhone seulement, `role="search"` dans la barre d'onglets) : une pile autour de l'écran pour que
 * le champ natif (`Stack.SearchBar`) trouve sa place dans la barre de navigation ou, sur iOS 26, en bas.
 */
export default function RechercheLayout() {
  const { couleurs } = useTheme();
  return (
    <Stack
      // Pas d'en-tête natif : le titre et la marge du haut viennent de TopBar (EcranRecherche). Le champ du système reste.
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }}
    />
  );
}
