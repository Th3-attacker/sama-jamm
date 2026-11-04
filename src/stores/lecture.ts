// Où l'utilisateur en est dans le Coran, et les jours où il a lu. Gardé sur le téléphone, jamais envoyé.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { stockage } from './stockage';

export type ModeLecture = 'page' | 'verset';
export type Position = { sourate: number; verset: number; mode: ModeLecture };

/** Jours gardés : de quoi remplir le mois en cours et le précédent, sans croissance sans fin. */
const JOURS_GARDES = 62;

type Donnees = {
  /** null tant que rien n'a été lu. */
  position: Position | null;
  /** Clés de jour « 2026-10-29 », dans l'ordre. */
  jours: string[];
};

type Actions = {
  enregistrerPosition: (position: Position) => void;
  /** Marque un jour de lecture ; sans effet s'il l'est déjà. */
  marquerJour: (jour: string) => void;
};

export const useLecture = create<Donnees & Actions>()(
  persist(
    (set) => ({
      position: null,
      jours: [],
      enregistrerPosition: (position) => set({ position }),
      marquerJour: (jour) =>
        set((s) => (s.jours.includes(jour) ? s : { jours: [...s.jours, jour].slice(-JOURS_GARDES) })),
    }),
    {
      name: 'lecture',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ position, jours }) => ({ position, jours }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Suivi de lecture illisible : remis à zéro', erreur);
      },
    },
  ),
);
