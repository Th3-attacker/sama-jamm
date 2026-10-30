// Réglages de l'utilisateur, gardés sur le téléphone (SQLite, clé-valeur). Rien n'est envoyé.
import Storage from 'expo-sqlite/kv-store';
import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';

import type { Langue } from '@/i18n/langues';
import type { ChoixTheme } from '@/theme/veille';

export const prieres = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type NomPriere = (typeof prieres)[number];

export type Lieu =
  | { type: 'position'; latitude: number; longitude: number }
  | { type: 'ville'; id: string; nom: string; latitude: number; longitude: number };

type Donnees = {
  /** null tant que la bienvenue n'a pas été faite : la langue du téléphone s'applique. */
  langue: Langue | null;
  traduction: Langue;
  lieu: Lieu | null;
  rappels: Record<NomPriere, boolean>;
  veilleAuto: boolean;
  theme: ChoixTheme;
  bienvenueTerminee: boolean;
};

type Actions = {
  definirLangue: (langue: Langue) => void;
  definirTraduction: (langue: Langue) => void;
  definirLieu: (lieu: Lieu) => void;
  definirRappel: (priere: NomPriere, actif: boolean) => void;
  definirVeilleAuto: (actif: boolean) => void;
  definirTheme: (theme: ChoixTheme) => void;
  terminerBienvenue: () => void;
};

const parDefaut: Donnees = {
  langue: null,
  traduction: 'fr',
  lieu: null,
  rappels: { fajr: true, dhuhr: true, asr: true, maghrib: true, isha: true },
  veilleAuto: true,
  theme: 'auto',
  bienvenueTerminee: false,
};

// Accès synchrone : les réglages sont prêts dès le premier rendu, sans écran clair au démarrage.
const stockage: StateStorage = {
  getItem: (cle) => Storage.getItemSync(cle),
  setItem: (cle, valeur) => Storage.setItemSync(cle, valeur),
  removeItem: (cle) => {
    Storage.removeItemSync(cle);
  },
};

export const useReglages = create<Donnees & Actions>()(
  persist(
    (set) => ({
      ...parDefaut,
      definirLangue: (langue) => set({ langue }),
      definirTraduction: (traduction) => set({ traduction }),
      definirLieu: (lieu) => set({ lieu }),
      definirRappel: (priere, actif) => set((s) => ({ rappels: { ...s.rappels, [priere]: actif } })),
      definirVeilleAuto: (veilleAuto) => set({ veilleAuto }),
      definirTheme: (theme) => set({ theme }),
      terminerBienvenue: () => set({ bienvenueTerminee: true }),
    }),
    {
      name: 'reglages',
      version: 1,
      storage: createJSONStorage(() => stockage),
      partialize: ({ langue, traduction, lieu, rappels, veilleAuto, theme, bienvenueTerminee }) => ({
        langue, traduction, lieu, rappels, veilleAuto, theme, bienvenueTerminee,
      }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Réglages illisibles : valeurs par défaut', erreur);
      },
    }
  )
);
