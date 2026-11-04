// Rappel local le jour où la zakat est due. Son identifiant ne commence ni par « priere- » ni par « rappel- » :
// la replanification des prières ne l'efface jamais (voir `estDePriere` dans priere/notifications).
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';

import { CANAL_RAPPELS, creerCanaux, URL_ZAKAT } from '@/features/priere/notifications';
import i18n from '@/i18n';

import type { Jour } from './cycle';

const ID_RAPPEL_ZAKAT = 'zakat-echeance';

/**
 * Programme (ou reprogramme) le rappel à 9 h le jour de l'échéance. Demande l'autorisation si elle n'a jamais été
 * refusée ; rend « refuse » sinon, « passe » si l'échéance est déjà là.
 */
export async function programmerRappelZakat(echeance: Jour): Promise<'programme' | 'refuse' | 'passe'> {
  const [a, m, j] = echeance.split('-').map(Number);
  const date = new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1, 9, 0);
  if (date.getTime() <= Date.now()) return 'passe';
  await creerCanaux();
  const actuel = await Notifications.getPermissionsAsync();
  const accorde = actuel.granted || (actuel.canAskAgain && (await Notifications.requestPermissionsAsync()).granted);
  if (!accorde) return 'refuse';
  await Notifications.scheduleNotificationAsync({
    identifier: ID_RAPPEL_ZAKAT,
    content: {
      title: i18n.t('notifications.zakatTitre'),
      body: i18n.t('notifications.zakatTexte'),
      data: { url: URL_ZAKAT },
    },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date, channelId: CANAL_RAPPELS },
  });
  return 'programme';
}

/** Retire le rappel (zakat versée : une nouvelle année lunaire commence). */
export async function annulerRappelZakat(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(ID_RAPPEL_ZAKAT);
}
