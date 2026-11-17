import { Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/useTheme';

/**
 * Onglet Recherche (iPhone seulement, `role="search"` dans la barre d'onglets) : une pile autour de l'écran pour que
 * le champ natif (`Stack.SearchBar`) trouve sa place dans la barre de navigation ou, sur iOS 26, en bas.
 */
export default function RechercheLayout() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        title: t('recherche.titre'),
        headerShadowVisible: false,
        headerStyle: { backgroundColor: couleurs.fond },
        headerTintColor: couleurs.emeraude,
        headerTitleStyle: { color: couleurs.encre },
        contentStyle: { backgroundColor: couleurs.fond },
      }}
    />
  );
}
