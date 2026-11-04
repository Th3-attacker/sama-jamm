import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { ErreurDeRoute } from '@/features/erreur/ErreurDeRoute';
import { TabBar, type Onglet } from '@/ui/TabBar';

/** Un onglet qui plante affiche l'écran d'erreur à sa place, sans fermer l'app. */
export const ErrorBoundary = ErreurDeRoute;

export default function OngletsLayout() {
  const { t } = useTranslation();

  const onglets: Onglet[] = [
    { id: 'accueil', label: t('onglets.accueil'), icone: 'home' },
    { id: 'lire', label: t('onglets.lire'), icone: 'book' },
    { id: 'ecouter', label: t('onglets.ecouter'), icone: 'headphones' },
    { id: 'priere', label: t('onglets.priere'), icone: 'clock' },
    { id: 'budget', label: t('onglets.budget'), icone: 'wallet' },
  ];

  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={({ state, emitter, navigateToTab }) => {
        const routeActive = state.routes[state.index];
        const cle = (id: string) => state.routes.find((r) => r.name === id)?.key;
        return (
          <TabBar
            onglets={onglets}
            actif={routeActive?.name ?? 'accueil'}
            // Même logique que la barre par défaut : l'événement tabPress permet aux écrans de remonter en haut.
            onChange={(id) => {
              const target = cle(id);
              if (!target) return;
              const event = emitter.emit({ type: 'tabPress', target, canPreventDefault: true });
              if (target !== routeActive?.key && !event.defaultPrevented) navigateToTab(target);
            }}
            onAppuiLong={(id) => {
              const target = cle(id);
              if (target) emitter.emit({ type: 'tabLongPress', target });
            }}
          />
        );
      }}>
      <Tabs.Screen name="accueil" options={{ title: t('onglets.accueil') }} />
      <Tabs.Screen name="lire" options={{ title: t('onglets.lire') }} />
      <Tabs.Screen name="ecouter" options={{ title: t('onglets.ecouter') }} />
      <Tabs.Screen name="priere" options={{ title: t('onglets.priere') }} />
      <Tabs.Screen name="budget" options={{ title: t('onglets.budget') }} />
    </Tabs>
  );
}
