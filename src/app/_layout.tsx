import i18n from '@/i18n';

import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from 'react-native';

import { useReplanification } from '@/features/priere/useReplanification';
import { useSurveillanceVerrou } from '@/features/budget/verrou';
import { DemarrageAnime } from '@/features/demarrage/DemarrageAnime';
import { ErreurDeRoute } from '@/features/erreur/ErreurDeRoute';
import { installerJournalGlobal } from '@/features/erreur/journal';
import { EcranMiseAJour } from '@/features/miseAJour/EcranMiseAJour';
import { useMiseAJour } from '@/features/miseAJour/useMiseAJour';
import { useNuitDePriere } from '@/features/priere/veille';
import { useReglages } from '@/stores/reglages';
import { polices } from '@/theme/polices';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

/** Dernier filet : rendu hors du layout, il reprend lui-même le thème choisi. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const theme = useReglages((s) => s.theme);
  return (
    <ThemeProvider choix={theme} veilleAuto={false} nuitDePriere={false} interfaceArabe={i18n.language === 'ar'}>
      <ErreurDeRoute {...props} />
    </ThemeProvider>
  );
}

installerJournalGlobal();

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
  const miseAJour = useMiseAJour();
  // Une seule fois par ouverture à froid : l'état vit avec la racine, pas sur le disque.
  const [demarrage, setDemarrage] = useState(true);
  const finDemarrage = useCallback(() => setDemarrage(false), []);
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
          <Stack.Screen name="budget-ajout" options={{ presentation: 'formSheet', sheetGrabberVisible: true, sheetExpandsWhenScrolledToEdge: false }} />
        </Stack>
      </ToastProvider>
      {demarrage ? <DemarrageAnime onFin={finDemarrage} /> : null}
      {/* Version trop ancienne : fenêtre bloquante au-dessus de la navigation (le retour Android ne la ferme pas). */}
      <Modal visible={miseAJour !== null} animationType="none" onRequestClose={() => undefined}>
        {miseAJour ? <EcranMiseAJour consigne={miseAJour} /> : null}
      </Modal>
    </ThemeProvider>
  );
}
