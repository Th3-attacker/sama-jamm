// Session Supabase dans le trousseau du téléphone (Keychain, Keystore) : les jetons ne sont plus lisibles dans
// un fichier de l'app. La session d'une version précédente, rangée en clair, est déplacée à la première lecture.
import * as SecureStore from 'expo-secure-store';

import { stockage } from '@/stores/stockage';

import { creerStockageSession } from './morceaux';

// Lisible après le premier déverrouillage du téléphone ; jamais copiée vers un autre appareil.
const OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

export const stockageSession = creerStockageSession(
  {
    lire: (cle) => SecureStore.getItemAsync(cle, OPTIONS),
    ecrire: (cle, valeur) => SecureStore.setItemAsync(cle, valeur, OPTIONS),
    effacer: (cle) => SecureStore.deleteItemAsync(cle, OPTIONS),
  },
  {
    lire: (cle) => {
      const valeur = stockage.getItem(cle);
      return typeof valeur === 'string' ? valeur : null;
    },
    effacer: (cle) => void stockage.removeItem(cle),
  },
  // Jamais la valeur elle-même dans les messages : seulement ce qui s'est passé.
  (message, erreur) => console.warn(message, erreur ?? ''),
);
