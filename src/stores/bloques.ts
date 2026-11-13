// Membres de khatm bloqués par l'utilisateur : identifiants gardés sur ce téléphone seulement.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { basculerBloque, lireBloques } from '@/features/khatm/bloques';

import { stockage } from './stockage';

type Donnees = { membres: string[] };
type Actions = {
  /** Bloque ou débloque un membre ; renvoie true s'il est désormais bloqué. */
  basculer: (identifiant: string) => boolean;
};

export const useBloques = create<Donnees & Actions>()(
  persist(
    (set, get) => ({
      membres: [],
      basculer: (identifiant) => {
        const suivant = basculerBloque(get().membres, identifiant);
        set({ membres: suivant });
        return suivant.includes(identifiant);
      },
    }),
    {
      name: 'khatm-bloques',
      version: 1,
      migrate: (ancien) => ({ membres: lireBloques((ancien as { membres?: unknown } | null)?.membres) }),
      storage: createJSONStorage(() => stockage),
      partialize: ({ membres }) => ({ membres }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Membres bloqués illisibles : liste vide', erreur);
      },
    },
  ),
);
