// Lectures d'invocations comptées aujourd'hui : partagées entre la liste d'un moment et l'écran de lecture.
// La liste repart de zéro chaque jour.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { cleJour } from '@/lib/dates';

import { stockage } from './stockage';

type Donnees = {
  /** Jour auquel les compteurs appartiennent (clé de jour). */
  jour: string;
  /** Nombre de lectures par invocation. */
  comptes: Record<string, number>;
};

type Actions = {
  definir: (id: string, lectures: number) => void;
};

export const useInvocationsJour = create<Donnees & Actions>()(
  persist(
    (set) => ({
      jour: cleJour(new Date()),
      comptes: {},
      definir: (id, lectures) =>
        set((s) => {
          const aujourdhui = cleJour(new Date());
          const base = s.jour === aujourdhui ? s.comptes : {};
          return { jour: aujourdhui, comptes: { ...base, [id]: lectures } };
        }),
    }),
    {
      name: 'invocations-jour',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ jour, comptes }) => ({ jour, comptes }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Compteurs d’invocations illisibles : remis à zéro', erreur);
      },
    },
  ),
);

/** Compteurs du jour : vides si ceux enregistrés datent d'un autre jour. */
export function useComptesDuJour(): Record<string, number> {
  const jour = useInvocationsJour((s) => s.jour);
  const comptes = useInvocationsJour((s) => s.comptes);
  return jour === cleJour(new Date()) ? comptes : VIDE;
}

const VIDE: Record<string, number> = {};
