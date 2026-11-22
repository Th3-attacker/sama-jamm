// Bandeau « Notifications désactivées » de Prière et de Rappels : l'appel à la prière ne sonne pas sans l'autorisation.
// Relu à chaque retour dans l'app : l'utilisateur a pu changer l'autorisation dans les réglages du téléphone.
import * as Notifications from 'expo-notifications';
import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Linking } from 'react-native';

import { Banner } from '@/ui/Banner';

/** Vrai quand les notifications sont refusées pour de bon (le système ne redemandera plus). */
export function useNotificationsRefusees(): boolean {
  const [refusees, setRefusees] = useState(false);

  const relire = useCallback(() => {
    Notifications.getPermissionsAsync()
      .then((p) => setRefusees(!p.granted && !p.canAskAgain))
      .catch((e: unknown) => console.warn('Autorisation des notifications inconnue', e));
  }, []);

  useEffect(() => {
    relire();
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') relire();
    });
    return () => abonnement.remove();
  }, [relire]);

  return refusees;
}

/** `actif` : n'affiche le bandeau que si un appel à la prière est réellement attendu. */
export function BandeauNotifications({ actif = true }: { actif?: boolean }) {
  const { t } = useTranslation();
  const refusees = useNotificationsRefusees();
  if (!refusees || !actif) return null;
  return (
    <Banner
      ton="info"
      titre={t('autorisations.notificationsRefuseesTitre')}
      action={{
        label: t('autorisations.ouvrirReglages'),
        onPress: () => {
          Linking.openSettings().catch((e: unknown) => console.warn('Réglages du téléphone inaccessibles', e));
        },
      }}>
      {t('autorisations.notificationsRefuseesTexte')}
    </Banner>
  );
}
