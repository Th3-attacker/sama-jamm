import { NetworkStateType, useNetworkState } from 'expo-network';

/** État du réseau : `enLigne` vaut null tant que le téléphone ne l'a pas dit ; `wifi` est vrai sur un Wi-Fi. */
export function useReseau(): { enLigne: boolean | null; wifi: boolean } {
  const etat = useNetworkState();
  const enLigne =
    etat.isConnected === undefined ? null : etat.isConnected === true && etat.isInternetReachable !== false;
  return { enLigne, wifi: etat.type === NetworkStateType.WIFI };
}
