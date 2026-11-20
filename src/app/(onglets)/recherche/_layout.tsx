import { Stack } from 'expo-router';

import { useTheme } from '@/theme/useTheme';

/**
 * Onglet Recherche (iPhone seulement, `role="search"` dans la barre d'onglets) : une pile autour de l'écran pour que
 * le champ natif (`Stack.SearchBar`) trouve sa place, sur iOS 26 en bas. Comme Prière, l'en-tête de la pile est caché :
 * le titre « Recherche » est dessiné par l'écran (`TopBar grand`), fixe avec les filtres.
 */
export default function RechercheLayout() {
  const { couleurs } = useTheme();
  return <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: couleurs.fond } }} />;
}
