import '@/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';

import { polices } from '@/theme/polices';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync().catch((erreur: unknown) => {
  console.warn("Écran de démarrage non retenu", erreur);
});

export default function RootLayout() {
  const [policesChargees, erreurPolices] = useFonts(polices);
  const pret = policesChargees || erreurPolices !== null;

  useEffect(() => {
    if (erreurPolices) console.error('Polices non chargées : repli sur les polices du système', erreurPolices);
  }, [erreurPolices]);

  useEffect(() => {
    if (pret) SplashScreen.hide();
  }, [pret]);

  if (!pret) return null;

  return (
    <ThemeProvider>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </ThemeProvider>
  );
}
