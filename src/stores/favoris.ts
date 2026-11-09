// Versets et chapitres de la Citadelle gardés en favoris, lisibles sans réseau. Les chants viendront avec leurs écrans.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { basculerCle, migrerFavoris, type DonneesFavoris } from './favorisMigration';
import { stockage } from './stockage';

/** Clé d'un verset : « 18:46 ». */
export const cleVerset = (sourate: number, verset: number) => `${sourate}:${verset}`;

type Donnees = DonneesFavoris;

type Actions = {
  /** Ajoute ou retire un verset ; renvoie true s'il est désormais en favori. */
  basculer: (sourate: number, verset: number) => boolean;
  /** Ajoute ou retire un chapitre de la Citadelle (numéro) ; renvoie true s'il est désormais en favori. */
  basculerInvocation: (chapitre: number) => boolean;
};

export const useFavoris = create<Donnees & Actions>()(
  persist(
    (set, get) => ({
      versets: [],
      invocations: [],
      basculer: (sourate, verset) => {
        const cle = cleVerset(sourate, verset);
        const present = get().versets.includes(cle);
        set((s) => ({ versets: present ? s.versets.filter((v) => v !== cle) : [cle, ...s.versets] }));
        return !present;
      },
      basculerInvocation: (chapitre) => {
        const { liste, present } = basculerCle(get().invocations, String(chapitre));
        set({ invocations: liste });
        return present;
      },
    }),
    {
      name: 'favoris',
      version: 2,
      migrate: (ancien) => migrerFavoris(ancien),
      storage: createJSONStorage(() => stockage),
      partialize: ({ versets, invocations }) => ({ versets, invocations }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Favoris illisibles : liste vide', erreur);
      },
    },
  ),
);
