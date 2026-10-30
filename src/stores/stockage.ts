// Stockage clé-valeur SQLite du téléphone, partagé par les magasins zustand.
import Storage from 'expo-sqlite/kv-store';
import type { StateStorage } from 'zustand/middleware';

// Accès synchrone : les données sont prêtes dès le premier rendu, sans écran clair au démarrage.
export const stockage: StateStorage = {
  getItem: (cle) => Storage.getItemSync(cle),
  setItem: (cle, valeur) => Storage.setItemSync(cle, valeur),
  removeItem: (cle) => {
    Storage.removeItemSync(cle);
  },
};
