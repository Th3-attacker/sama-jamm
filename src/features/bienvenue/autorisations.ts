// Demandes d'autorisation du parcours de bienvenue (position, notifications), partagées par les écrans d'explication.
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';

import { creerCanaux } from '@/features/priere/notifications';

import { decisionPermission, type Decision } from './etapes';

export const decisionPosition = async (): Promise<Decision> =>
  decisionPermission(await Location.getForegroundPermissionsAsync());

export const decisionNotifications = async (): Promise<Decision> =>
  decisionPermission(await Notifications.getPermissionsAsync());

export type ResultatPosition =
  | { ok: true; latitude: number; longitude: number }
  | { ok: false; raison: 'refus' | 'introuvable' };

/** Demande l'autorisation du téléphone si besoin, puis lit la position. Jamais de nouvelle demande après un refus définitif. */
export async function obtenirPosition(): Promise<ResultatPosition> {
  try {
    const statut = await Location.getForegroundPermissionsAsync();
    const accordee = statut.granted || (statut.canAskAgain && (await Location.requestForegroundPermissionsAsync()).granted);
    if (!accordee) return { ok: false, raison: 'refus' };
    const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    return { ok: true, latitude: position.coords.latitude, longitude: position.coords.longitude };
  } catch (erreur: unknown) {
    console.warn('Position indisponible', erreur);
    return { ok: false, raison: 'introuvable' };
  }
}

/** Demande l'autorisation des notifications ; vrai si elle est accordée. Android 13+ : les canaux existent avant la demande. */
export async function demanderNotifications(): Promise<boolean> {
  try {
    await creerCanaux();
    const actuel = await Notifications.getPermissionsAsync();
    if (actuel.granted) return true;
    if (!actuel.canAskAgain) return false;
    return (await Notifications.requestPermissionsAsync()).granted;
  } catch (erreur: unknown) {
    console.warn('Autorisation des notifications impossible', erreur);
    return false;
  }
}
