// Compteur de dhikr, enregistré à chaque grain et repris où il en était.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { prochainCompte } from '@/features/dhikr/compteur';

import { stockage } from './stockage';

type Donnees = {
  formule: string;
  /** Compte par formule. */
  comptes: Record<string, number>;
  /** Objectif choisi par formule ; null = sans objectif. Absent = objectif de la formule. */
  objectifs: Record<string, number | null>;
};

type Actions = {
  choisirFormule: (id: string) => void;
  /** Ajoute un grain ; à l'objectif atteint, le grain suivant repart à 1 (null = libre, sans fin). */
  compter: (objectif: number | null) => number;
  remettreAZero: () => void;
  definirObjectif: (objectif: number | null) => void;
};

export const useDhikr = create<Donnees & Actions>()(
  persist(
    (set, get) => ({
      formule: 'subhanallah',
      comptes: {},
      objectifs: {},
      choisirFormule: (formule) => set({ formule }),
      compter: (objectif) => {
        const { formule, comptes } = get();
        const n = prochainCompte(comptes[formule] ?? 0, objectif);
        set({ comptes: { ...comptes, [formule]: n } });
        return n;
      },
      remettreAZero: () => set((s) => ({ comptes: { ...s.comptes, [s.formule]: 0 } })),
      definirObjectif: (objectif) => set((s) => ({ objectifs: { ...s.objectifs, [s.formule]: objectif } })),
    }),
    {
      name: 'dhikr',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ formule, comptes, objectifs }) => ({ formule, comptes, objectifs }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Compteur de dhikr illisible : remis à zéro', erreur);
      },
    }
  )
);
