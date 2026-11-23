// Position enregistrée : relue au retour au premier plan, recalculée si le téléphone a bougé de plus de 25 km.
import * as Location from 'expo-location';

import { useReglages } from '@/stores/reglages';

import { aDeplace } from './deplacement';

/** Au plus une relecture toutes les 30 minutes : le retour au premier plan est fréquent. */
const INTERVALLE_MS = 30 * 60_000;
let derniere = 0;

/**
 * Si le lieu est « ma position » et que l'autorisation est déjà accordée, relit la position (précision basse, peu
 * coûteuse) et met le lieu à jour au-delà de 25 km. Ne demande jamais l'autorisation ; un lieu choisi dans la liste
 * des villes n'est jamais changé. Le changement de lieu relance la programmation des notifications.
 */
export async function actualiserPosition(maintenant = Date.now()): Promise<void> {
  const { lieu, definirLieu } = useReglages.getState();
  if (lieu?.type !== 'position' || maintenant - derniere < INTERVALLE_MS) return;
  try {
    const permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted) return;
    derniere = maintenant;
    const p = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
    const nouvelle = { latitude: p.coords.latitude, longitude: p.coords.longitude };
    // Le lieu a pu être changé à la main pendant la lecture.
    const actuel = useReglages.getState().lieu;
    if (actuel?.type === 'position' && aDeplace(actuel, nouvelle)) definirLieu({ type: 'position', ...nouvelle });
  } catch (erreur: unknown) {
    // Position indisponible (GPS coupé, hors couverture) : le lieu enregistré reste, les appels continuent.
    console.warn('Position non actualisée', erreur);
  }
}
