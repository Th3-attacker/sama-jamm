// Réglages de l'utilisateur, gardés sur le téléphone (SQLite, clé-valeur). Rien n'est envoyé.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { migrerSonsAnciens } from './sonsMigration';
import { retirerTraduction } from './traductionMigration';
import { retirerVeille } from './veilleMigration';

import type { Langue } from '@/i18n/langues';
import type { ChoixTheme } from '@/theme/choixTheme';

import { stockage } from './stockage';

export const prieres = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;
export type NomPriere = (typeof prieres)[number];

export const methodes = ['mwl', 'egypte', 'ummalqura', 'uoif', 'isna'] as const;
export type Methode = (typeof methodes)[number];
export type EcoleAsr = 'standard' | 'hanafite';

export const sons = ['complet', 'court', 'doux', 'vibration', 'silencieux'] as const;
export type Son = (typeof sons)[number];

export type Lieu =
  | { type: 'position'; latitude: number; longitude: number }
  | { type: 'ville'; id: string; nom: string; latitude: number; longitude: number };

export const heuresRappelKhatm = [8, 12, 18, 20] as const;
export type HeureRappelKhatm = (typeof heuresRappelKhatm)[number];

type ParPriere<T> = Record<NomPriere, T>;

type Donnees = {
  /** null tant que la bienvenue n'a pas été faite : la langue du téléphone s'applique. */
  langue: Langue | null;
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
  /** Vibrations légères (grains du dhikr, boutons principaux). */
  haptique: boolean;
  /** Télécharger les récitations seulement en Wi-Fi, pour ne pas consommer les données mobiles. */
  wifiSeulement: boolean;
  theme: ChoixTheme;
  bienvenueTerminee: boolean;
  /** Échelon de taille du texte de lecture, de 0 à 6 (voir `features/lire/BarreTaille`). */
  tailleLecture: number;
  /** Translittération sous le texte arabe (Tanzil, en caractères latins). Désactivée par défaut. */
  translitLecture: boolean;
  /** Numéros de verset en chiffres arabes (١٢٣) au lieu de 123. */
  chiffresArabes: boolean;
  /** Budget protégé par l'empreinte, le visage ou le code du téléphone. */
  verrouBudget: boolean;
  /** Montants du budget remplacés par « ••• » à l'ouverture de l'app. */
  masquerMontants: boolean;
  /** Rappel quotidien du khatm : désactivé par défaut, une seule notification pour tous les khatms. */
  khatmRappel: boolean;
  khatmRappelHeure: HeureRappelKhatm;
  /** Dernier nombre connu de khatms avec un juz non lu (null : inconnu). Gardé pour décider hors ligne. */
  khatmEnCours: number | null;
};

type Actions = {
  definirLangue: (langue: Langue) => void;
  definirLieu: (lieu: Lieu) => void;
  definirRappel: (priere: NomPriere, actif: boolean) => void;
  definirSon: (priere: NomPriere, son: Son) => void;
  definirRappelAvant: (priere: NomPriere, minutes: number | null) => void;
  definirMethode: (methode: Methode) => void;
  definirEcoleAsr: (ecole: EcoleAsr) => void;
  ajuster: (priere: NomPriere, delta: number) => void;
  definirHaptique: (actif: boolean) => void;
  definirTheme: (theme: ChoixTheme) => void;
  terminerBienvenue: () => void;
  definirTailleLecture: (echelon: number) => void;
  definirTranslitLecture: (actif: boolean) => void;
  definirChiffresArabes: (actif: boolean) => void;
  definirWifiSeulement: (actif: boolean) => void;
  definirVerrouBudget: (actif: boolean) => void;
  definirMasquerMontants: (actif: boolean) => void;
  definirKhatmRappel: (actif: boolean) => void;
  definirKhatmRappelHeure: (heure: HeureRappelKhatm) => void;
  definirKhatmEnCours: (nombre: number | null) => void;
};

export const AJUSTEMENT_MAX = 15;

const tout = <T,>(valeur: T): ParPriere<T> => ({ fajr: valeur, dhuhr: valeur, asr: valeur, maghrib: valeur, isha: valeur });

const parDefaut: Donnees = {
  langue: null,
  lieu: null,
  rappels: tout(true),
  sons: tout<Son>('court'),
  rappelAvant: tout<number | null>(null),
  methode: 'mwl',
  ecoleAsr: 'standard',
  ajustements: tout(0),
  haptique: true,
  wifiSeulement: false,
  theme: 'auto',
  bienvenueTerminee: false,
  tailleLecture: 1,
  translitLecture: false,
  chiffresArabes: false,
  verrouBudget: false,
  masquerMontants: false,
  khatmRappel: false,
  khatmRappelHeure: 20,
  khatmEnCours: null,
};

export const useReglages = create<Donnees & Actions>()(
  persist(
    (set) => ({
      ...parDefaut,
      definirLangue: (langue) => set({ langue }),
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
      definirHaptique: (haptique) => set({ haptique }),
      definirWifiSeulement: (wifiSeulement) => set({ wifiSeulement }),
      definirTheme: (theme) => set({ theme }),
      terminerBienvenue: () => set({ bienvenueTerminee: true }),
      definirTailleLecture: (echelon) => set({ tailleLecture: Math.max(0, Math.min(6, Math.round(echelon))) }),
      definirTranslitLecture: (translitLecture) => set({ translitLecture }),
      definirChiffresArabes: (chiffresArabes) => set({ chiffresArabes }),
      definirVerrouBudget: (verrouBudget) => set({ verrouBudget }),
      definirMasquerMontants: (masquerMontants) => set({ masquerMontants }),
      definirKhatmRappel: (khatmRappel) => set({ khatmRappel }),
      definirKhatmRappelHeure: (khatmRappelHeure) => set({ khatmRappelHeure }),
      definirKhatmEnCours: (khatmEnCours) => set({ khatmEnCours }),
    }),
    {
      name: 'reglages',
      version: 9,
      storage: createJSONStorage(() => stockage),
      // v1 → v2 : réglages de prière ; v2 → v3 : vibrations. Valeurs par défaut pour les clés absentes.
      // v3 → v4 : la taille de lecture par défaut passe du 3e au 2e cran ; une autre taille choisie est gardée.
      // v4 → v5 : translittération (absente des anciens réglages : la valeur par défaut, désactivée, s'applique).
      // v5 → v6 : le wolof n'est plus proposé pour l'interface ; un ancien choix repasse au français.
      migrate: (etat, version) => {
        if (!etat || typeof etat !== 'object') return etat;
        const migre: Record<string, unknown> = version < 3 ? { ...parDefaut, ...etat } : { ...etat };
        if (version < 4 && migre.tailleLecture === 2) migre.tailleLecture = 1;
        if (version < 6) {
          if (migre.langue === 'wo') migre.langue = 'fr';
        }
        if (version < 7) migre.sons = migrerSonsAnciens(migre.sons);
        // v7 → v8 : le Coran est en arabe seul ; la traduction et le choix d'affichage enregistrés sont effacés.
        if (version < 8) retirerTraduction(migre);
        // v8 → v9 : plus de Veille ; le thème « veille » enregistré passe à « nuit », ses réglages sont effacés.
        if (version < 9) retirerVeille(migre);
        return migre;
      },
      partialize: (s) => ({
        langue: s.langue,
        lieu: s.lieu,
        rappels: s.rappels,
        sons: s.sons,
        rappelAvant: s.rappelAvant,
        methode: s.methode,
        ecoleAsr: s.ecoleAsr,
        ajustements: s.ajustements,
        haptique: s.haptique,
        wifiSeulement: s.wifiSeulement,
        verrouBudget: s.verrouBudget,
        masquerMontants: s.masquerMontants,
        theme: s.theme,
        bienvenueTerminee: s.bienvenueTerminee,
        tailleLecture: s.tailleLecture,
        translitLecture: s.translitLecture,
        chiffresArabes: s.chiffresArabes,
        khatmRappel: s.khatmRappel,
        khatmRappelHeure: s.khatmRappelHeure,
        khatmEnCours: s.khatmEnCours,
      }),
      onRehydrateStorage: () => (_etat, erreur) => {
        if (erreur) console.error('Réglages illisibles : valeurs par défaut', erreur);
      },
    }
  )
);

export type OptionsCalcul = Pick<Donnees, 'methode' | 'ecoleAsr' | 'ajustements'>;
