import '@/i18n';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { useReplanification } from '@/features/priere/useReplanification';
import { useSurveillanceVerrou } from '@/features/budget/verrou';
import { useNuitDePriere } from '@/features/priere/veille';
import { useReglages } from '@/stores/reglages';
import { polices } from '@/theme/polices';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

SplashScreen.preventAutoHideAsync().catch((erreur: unknown) => {
  console.warn("Écran de démarrage non retenu", erreur);
});

export default function RootLayout() {
  const [policesChargees, erreurPolices] = useFonts(polices);
  const theme = useReglages((s) => s.theme);
  const veilleAuto = useReglages((s) => s.veilleAuto);
  const nuit = useNuitDePriere();
  const { i18n } = useTranslation();
  useReplanification();
  useSurveillanceVerrou();
  const pret = policesChargees || erreurPolices !== null;

  useEffect(() => {
    if (erreurPolices) console.error('Polices non chargées : repli sur les polices du système', erreurPolices);
  }, [erreurPolices]);

  useEffect(() => {
    if (pret) SplashScreen.hide();
  }, [pret]);

  if (!pret) return null;

  return (
    <ThemeProvider choix={theme} veilleAuto={veilleAuto} nuitDePriere={nuit?.active ?? false} interfaceArabe={i18n.language === 'ar'}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Ajout de dépense : feuille modale, fermée par « × » ou le geste vers le bas (section Navigation). */}
          <Stack.Screen name="budget-ajout" options={{ presentation: 'formSheet', sheetGrabberVisible: true }} />
        </Stack>
      </ToastProvider>
    </ThemeProvider>
  );
}
