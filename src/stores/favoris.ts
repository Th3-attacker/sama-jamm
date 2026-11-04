// Versets gardés en favoris, lisibles sans réseau. Les chants et invocations viendront avec leurs écrans.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { stockage } from './stockage';

/** Clé d'un verset : « 18:46 ». */
export const cleVerset = (sourate: number, verset: number) => `${sourate}:${verset}`;

type Donnees = {
  /** Clés de verset, le plus récent en premier. */
  versets: string[];
};

type Actions = {
  /** Ajoute ou retire un verset ; renvoie true s'il est désormais en favori. */
  basculer: (sourate: number, verset: number) => boolean;
};

export const useFavoris = create<Donnees & Actions>()(
  persist(
    (set, get) => ({
      versets: [],
      basculer: (sourate, verset) => {
        const cle = cleVerset(sourate, verset);
        const present = get().versets.includes(cle);
        set((s) => ({ versets: present ? s.versets.filter((v) => v !== cle) : [cle, ...s.versets] }));
        return !present;
      },
    }),
    {
      name: 'favoris',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ versets }) => ({ versets }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Favoris illisibles : liste vide', erreur);
      },
    },
  ),
);
