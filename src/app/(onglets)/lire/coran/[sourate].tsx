import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Lien profond `samajamm://lire/coran/18?verset=46` (voir « Structure et navigation ») : le lecteur vit à la racine
 * (`/coran/[sourate]`) pour s'ouvrir par-dessus les onglets ; ce relais y renvoie avec les mêmes paramètres.
 */
export default function RelaisCoran() {
  const { sourate, verset, mode } = useLocalSearchParams<{
    sourate: string;
    verset?: string;
    mode?: string;
  }>();
  return <Redirect href={{ pathname: '/coran/[sourate]', params: { sourate, ...(verset ? { verset } : {}), ...(mode ? { mode } : {}) } }} />;
}
