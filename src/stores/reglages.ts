// Réglages de l'utilisateur, gardés sur le téléphone (SQLite, clé-valeur). Rien n'est envoyé.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { Langue } from '@/i18n/langues';
import type { ChoixTheme } from '@/theme/veille';

import { stockage } from './stockage';

export const prieres = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type NomPriere = (typeof prieres)[number];

export const methodes = ['mwl', 'egypte', 'ummalqura', 'uoif', 'isna'] as const;
export type Methode = (typeof methodes)[number];
export type EcoleAsr = 'standard' | 'hanafite';

export const sons = ['complet', 'court', 'doux', 'vibration', 'silencieux'] as const;
export type Son = (typeof sons)[number];

export const affichagesLecture = ['arabeSeul', 'arabeTrad', 'tradSeule'] as const;
export type AffichageLecture = (typeof affichagesLecture)[number];

export type Lieu =
  | { type: 'position'; latitude: number; longitude: number }
  | { type: 'ville'; id: string; nom: string; latitude: number; longitude: number };

type ParPriere<T> = Record<NomPriere, T>;

type Donnees = {
  /** null tant que la bienvenue n'a pas été faite : la langue du téléphone s'applique. */
  langue: Langue | null;
  traduction: Langue;
  lieu: Lieu | null;
  /** Notification à l'heure de la prière. */
  rappels: ParPriere<boolean>;
  sons: ParPriere<Son>;
  /** Minutes avant la prière, ou null sans rappel. */
  rappelAvant: ParPriere<number | null>;
  methode: Methode;
  ecoleAsr: EcoleAsr;
  /** Ajustement en minutes, de −15 à +15. */
  ajustements: ParPriere<number>;
  veilleAuto: boolean;
  /** Vibrations légères (grains du dhikr, boutons principaux). */
  haptique: boolean;
  /** Nuit pour laquelle le bandeau « Veille activée » a été fermé (« 2026-10-29 »). */
  veilleVue: string | null;
  theme: ChoixTheme;
  bienvenueTerminee: boolean;
  /** Échelon de taille du texte de lecture, de 0 à 6 (voir `features/lire/BarreTaille`). */
  tailleLecture: number;
  /** Ce que la lecture affiche : arabe seul, arabe et traduction, ou traduction seule. */
  affichage: AffichageLecture;
  /** Budget protégé par l'empreinte, le visage ou le code du téléphone. */
  verrouBudget: boolean;
  /** Montants du budget remplacés par « ••• » à l'ouverture de l'app. */
  masquerMontants: boolean;
};

type Actions = {
  definirLangue: (langue: Langue) => void;
  definirTraduction: (langue: Langue) => void;
  definirLieu: (lieu: Lieu) => void;
  definirRappel: (priere: NomPriere, actif: boolean) => void;
  definirSon: (priere: NomPriere, son: Son) => void;
  definirRappelAvant: (priere: NomPriere, minutes: number | null) => void;
  definirMethode: (methode: Methode) => void;
  definirEcoleAsr: (ecole: EcoleAsr) => void;
  ajuster: (priere: NomPriere, delta: number) => void;
  definirVeilleAuto: (actif: boolean) => void;
  definirHaptique: (actif: boolean) => void;
  marquerVeilleVue: (nuit: string) => void;
  definirTheme: (theme: ChoixTheme) => void;
  terminerBienvenue: () => void;
  definirTailleLecture: (echelon: number) => void;
  definirAffichage: (affichage: AffichageLecture) => void;
  definirVerrouBudget: (actif: boolean) => void;
  definirMasquerMontants: (actif: boolean) => void;
};

export const AJUSTEMENT_MAX = 15;

const tout = <T,>(valeur: T): ParPriere<T> => ({ fajr: valeur, dhuhr: valeur, asr: valeur, maghrib: valeur, isha: valeur });

const parDefaut: Donnees = {
  langue: null,
  traduction: 'fr',
  lieu: null,
  rappels: tout(true),
  sons: tout<Son>('doux'),
  rappelAvant: tout<number | null>(null),
  methode: 'mwl',
  ecoleAsr: 'standard',
  ajustements: tout(0),
  veilleAuto: true,
  haptique: true,
  veilleVue: null,
  theme: 'auto',
  bienvenueTerminee: false,
  tailleLecture: 2,
  affichage: 'arabeTrad',
  verrouBudget: false,
  masquerMontants: false,
};

export const useReglages = create<Donnees & Actions>()(
  persist(
    (set) => ({
      ...parDefaut,
      definirLangue: (langue) => set({ langue }),
      definirTraduction: (traduction) => set({ traduction }),
      definirLieu: (lieu) => set({ lieu }),
      definirRappel: (priere, actif) => set((s) => ({ rappels: { ...s.rappels, [priere]: actif } })),
      definirSon: (priere, son) => set((s) => ({ sons: { ...s.sons, [priere]: son } })),
      definirRappelAvant: (priere, minutes) => set((s) => ({ rappelAvant: { ...s.rappelAvant, [priere]: minutes } })),
      definirMethode: (methode) => set({ methode }),
      definirEcoleAsr: (ecoleAsr) => set({ ecoleAsr }),
      ajuster: (priere, delta) =>
        set((s) => ({
          ajustements: {
            ...s.ajustements,
            [priere]: Math.max(-AJUSTEMENT_MAX, Math.min(AJUSTEMENT_MAX, s.ajustements[priere] + delta)),
          },
        })),
      definirVeilleAuto: (veilleAuto) => set({ veilleAuto }),
      definirHaptique: (haptique) => set({ haptique }),
      marquerVeilleVue: (veilleVue) => set({ veilleVue }),
      definirTheme: (theme) => set({ theme }),
      terminerBienvenue: () => set({ bienvenueTerminee: true }),
      definirTailleLecture: (echelon) => set({ tailleLecture: Math.max(0, Math.min(6, Math.round(echelon))) }),
      definirAffichage: (affichage) => set({ affichage }),
      definirVerrouBudget: (verrouBudget) => set({ verrouBudget }),
      definirMasquerMontants: (masquerMontants) => set({ masquerMontants }),
    }),
    {
      name: 'reglages',
      version: 3,
      storage: createJSONStorage(() => stockage),
      // v1 → v2 : réglages de prière ; v2 → v3 : vibrations. Valeurs par défaut pour les clés absentes.
      migrate: (etat, version) => {
        if (version < 3 && etat && typeof etat === 'object') return { ...parDefaut, ...etat };
        return etat;
      },
      partialize: (s) => ({
        langue: s.langue,
        traduction: s.traduction,
        lieu: s.lieu,
        rappels: s.rappels,
        sons: s.sons,
        rappelAvant: s.rappelAvant,
        methode: s.methode,
        ecoleAsr: s.ecoleAsr,
        ajustements: s.ajustements,
        veilleAuto: s.veilleAuto,
        haptique: s.haptique,
        veilleVue: s.veilleVue,
        verrouBudget: s.verrouBudget,
        masquerMontants: s.masquerMontants,
        theme: s.theme,
        bienvenueTerminee: s.bienvenueTerminee,
        tailleLecture: s.tailleLecture,
        affichage: s.affichage,
      }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Réglages illisibles : valeurs par défaut', erreur);
      },
    }
  )
);

export type OptionsCalcul = Pick<Donnees, 'methode' | 'ecoleAsr' | 'ajustements'>;
