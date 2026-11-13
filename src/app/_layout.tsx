import i18n from '@/i18n';

import { useFonts } from 'expo-font';
import { Stack, type ErrorBoundaryProps } from 'expo-router';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Modal, View } from 'react-native';

import { useReplanification } from '@/features/priere/useReplanification';
import { useSurveillanceVerrou } from '@/features/budget/verrou';
import { DemarrageAnime } from '@/features/demarrage/DemarrageAnime';
import { ErreurDeRoute } from '@/features/erreur/ErreurDeRoute';
import { installerJournalGlobal } from '@/features/erreur/journal';
import { EcranMiseAJour } from '@/features/miseAJour/EcranMiseAJour';
import { useMiseAJour } from '@/features/miseAJour/useMiseAJour';
import { sensDeLangue } from '@/i18n/sens';
import { useReglages } from '@/stores/reglages';
import { polices } from '@/theme/polices';
import { ThemeProvider } from '@/theme/ThemeProvider';
import { ToastProvider } from '@/ui/Toast';

/** Dernier filet : rendu hors du layout, il reprend lui-même le thème choisi. */
export function ErrorBoundary(props: ErrorBoundaryProps) {
  const theme = useReglages((s) => s.theme);
  return (
    <ThemeProvider choix={theme} interfaceArabe={i18n.language === 'ar'}>
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
  const { i18n } = useTranslation();
  useReplanification();
  useSurveillanceVerrou();
  const miseAJour = useMiseAJour();
  // À chaque ouverture à froid, et à chaque retour de l'arrière-plan : l'état vit avec la racine, pas sur le disque.
  // Ouverte depuis une notification : pas d'animation, on va droit à l'écran visé.
  const [demarrage, setDemarrage] = useState(() => Notifications.getLastNotificationResponse() === null);
  const finDemarrage = useCallback(() => setDemarrage(false), []);
  const pret = policesChargees || erreurPolices !== null;
  const racine = { flex: 1, direction: sensDeLangue(i18n.language) } as const;

  useEffect(() => {
    if (erreurPolices) console.error('Polices non chargées : repli sur les polices du système', erreurPolices);
  }, [erreurPolices]);

  useEffect(() => {
    if (pret) SplashScreen.hide();
  }, [pret]);

  useEffect(() => {
    // Retour de l'arrière-plan : l'animation se rejoue par-dessus l'écran en cours, sans le changer. Les passages par
    // « inactive » (centre de contrôle, bandeau de notification, appel) ne comptent pas.
    let avant = AppState.currentState;
    const surEtat = AppState.addEventListener('change', (etat) => {
      if (etat === 'active' && avant === 'background') setDemarrage(true);
      avant = etat;
    });
    // Retour provoqué par un toucher sur une notification : on va droit à l'écran visé, sans animation.
    const surNotification = Notifications.addNotificationResponseReceivedListener(() => setDemarrage(false));
    return () => {
      surEtat.remove();
      surNotification.remove();
    };
  }, []);

  if (!pret) return null;

  return (
    <ThemeProvider choix={theme} interfaceArabe={i18n.language === 'ar'}>
      {/* Sens de lecture : il suit la langue (i18n) sans recharger l'app. Les fenêtres modales le reprennent seules. */}
      <View style={racine}>
      <ToastProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Ajout de dépense : page ouverte en modale, fermée par la flèche de retour. */}
          <Stack.Screen name="budget-ajout" options={{ presentation: 'modal' }} />
          {/* Lecteur audio : modale plein écran ouverte depuis le mini-lecteur ou une lecture. */}
          <Stack.Screen name="lecteur" options={{ presentation: 'modal' }} />
        </Stack>
      </ToastProvider>
      {demarrage ? <DemarrageAnime onFin={finDemarrage} /> : null}
      </View>
      {/* Version trop ancienne : fenêtre bloquante au-dessus de la navigation (le retour Android ne la ferme pas). */}
      <Modal visible={miseAJour !== null} animationType="none" onRequestClose={() => undefined}>
        {miseAJour ? <View style={racine}><EcranMiseAJour consigne={miseAJour} /></View> : null}
      </Modal>
    </ThemeProvider>
  );
}
