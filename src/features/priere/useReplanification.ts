import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { AppState } from 'react-native';

import { useReglages } from '@/stores/reglages';

import { creerCanaux, enregistrerTacheQuotidienne, replanifier, URL_PRIERE, URL_ZAKAT } from './notifications';
// Notification reçue app ouverte : bannière et son du canal (l'adhan sonne aussi quand l'app est ouverte).
// Notification reçue app ouverte : bannière sans son, l'utilisateur est déjà là.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

const DELAI = 500;

function lancer() {
  replanifier().catch((erreur: unknown) => {
    console.error('Programmation des notifications impossible', erreur);
  });
}

/**
 * Reprogramme les notifications à l'ouverture, au retour au premier plan et après tout changement
 * de lieu, de méthode, de rappel ou de langue. Ouvre l'écran Prière au toucher d'une notification.
 */
export function useReplanification(): void {
  useEffect(() => {
    creerCanaux()
      .then(lancer)
      .catch((erreur: unknown) => console.error('Canaux de notification non créés', erreur));
    enregistrerTacheQuotidienne().catch((erreur: unknown) => {
      console.warn('Tâche quotidienne indisponible (Expo Go ou système)', erreur);
    });

    let minuterie: ReturnType<typeof setTimeout> | undefined;
    const differer = () => {
      if (minuterie) clearTimeout(minuterie);
      minuterie = setTimeout(lancer, DELAI);
    };

    const desabonner = useReglages.subscribe((s, avant) => {
      const change =
        s.lieu !== avant.lieu ||
        s.rappels !== avant.rappels ||
        s.sons !== avant.sons ||
        s.rappelAvant !== avant.rappelAvant ||
        s.methode !== avant.methode ||
        s.ecoleAsr !== avant.ecoleAsr ||
        s.ajustements !== avant.ajustements ||
        s.langue !== avant.langue;
      if (change) differer();
    });
    const premierPlan = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') differer();
    });
    const toucher = Notifications.addNotificationResponseReceivedListener((reponse) => {
      const url = reponse.notification.request.content.data?.url;
      if (url === URL_PRIERE) router.push('/priere');
      // Rappel de zakat (features/budget/rappelZakat) : l'écran reste derrière le verrou du budget.
      else if (url === URL_ZAKAT) router.push('/budget/zakat');
    });

    return () => {
      if (minuterie) clearTimeout(minuterie);
      desabonner();
      premierPlan.remove();
      toucher.remove();
    };
  }, []);
}
