import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useTheme } from '@/theme/useTheme';

// Barre provisoire sans icônes : remplacée par le TabBar du design system (étape 2).
export default function OngletsLayout() {
  const { t } = useTranslation();
  const { couleurs, typographie } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: couleurs.emeraude,
        tabBarInactiveTintColor: couleurs.encre2,
        tabBarStyle: { backgroundColor: couleurs.surface, borderTopColor: couleurs.ligne },
        tabBarLabelStyle: typographie.libelle,
        tabBarIconStyle: { display: 'none' },
      }}>
      <Tabs.Screen name="accueil" options={{ title: t('onglets.accueil') }} />
      <Tabs.Screen name="lire" options={{ title: t('onglets.lire') }} />
      <Tabs.Screen name="ecouter" options={{ title: t('onglets.ecouter') }} />
      <Tabs.Screen name="priere" options={{ title: t('onglets.priere') }} />
      <Tabs.Screen name="budget" options={{ title: t('onglets.budget') }} />
    </Tabs>
  );
}
