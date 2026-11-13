// Fenêtre glissante des notifications de prière : calcul pur, sans dépendance native.
import type { NomPriere, OptionsCalcul, Son } from '@/stores/reglages';

import { calculerHoraires } from './horaires.ts';

/** iOS garde 64 notifications programmées par app ; 5 places restent pour la relance, le khatm, la zakat et la régularité. */
export const PLACES = 59;
export const JOURS_MAX = 12;

const ORDRE: readonly NomPriere[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

export type Planifiee = {
  /** Identifiant stable : « priere-2026-10-29-asr », « rappel-2026-10-29-asr ». */
  id: string;
  type: 'appel' | 'rappel';
  priere: NomPriere;
  date: Date;
  son: Son;
  /** Minutes avant la prière, pour un rappel. */
  minutes?: number;
};

type Entree = {
  lieu: { latitude: number; longitude: number };
  options: OptionsCalcul;
  rappels: Record<NomPriere, boolean>;
  sons: Record<NomPriere, Son>;
  rappelAvant: Record<NomPriere, number | null>;
  depuis: Date;
};

const cleJour = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Notifications à programmer, dans l'ordre chronologique, sans dépasser PLACES. */
export function construireFenetre({ lieu, options, rappels, sons, rappelAvant, depuis }: Entree): Planifiee[] {
  const parJour = ORDRE.reduce((n, p) => n + (rappels[p] ? 1 + (rappelAvant[p] ? 1 : 0) : 0), 0);
  if (parJour === 0) return [];
  // Un jour de plus que nécessaire : le premier jour est souvent entamé.
  const jours = Math.min(JOURS_MAX, Math.ceil(PLACES / parJour)) + 1;

  const liste: Planifiee[] = [];
  for (let i = 0; i < jours; i++) {
    const jour = new Date(depuis);
    jour.setDate(jour.getDate() + i);
    const h = calculerHoraires(lieu, jour, options);
    const cle = cleJour(jour);
    for (const p of ORDRE) {
      if (!rappels[p]) continue;
      const avant = rappelAvant[p];
      if (avant) {
        const date = new Date(h[p].getTime() - avant * 60_000);
        liste.push({ id: `rappel-${cle}-${p}`, type: 'rappel', priere: p, date, son: sons[p], minutes: avant });
      }
      liste.push({ id: `priere-${cle}-${p}`, type: 'appel', priere: p, date: h[p], son: sons[p] });
    }
  }
  return liste
    .filter((n) => n.date > depuis)
    .sort((a, b) => a.date.getTime() - b.date.getTime())
    .slice(0, PLACES);
}

const HEURE_RELANCE_DEBUT = 8;
const HEURE_RELANCE_FIN = 21;
const HEURE_RELANCE_DEFAUT = 9;
const AVANT_FIN_MS = 24 * 3_600_000;
const MARGE_MS = 3_600_000;

/**
 * Quand rappeler d'ouvrir l'app : 24 h avant la dernière notification de la fenêtre, car passé cette date plus rien
 * ne sonne tant que l'app n'est pas rouverte. Ramenée à 9 h si elle tombe la nuit (avant 8 h ou à partir de 21 h).
 * Null sans fenêtre, ou si la date est dans moins d'une heure.
 */
export function dateRelance(fenetre: readonly Planifiee[], maintenant: Date): Date | null {
  const derniere = fenetre[fenetre.length - 1];
  if (!derniere) return null;
  const date = new Date(derniere.date.getTime() - AVANT_FIN_MS);
  const heure = date.getHours();
  if (heure < HEURE_RELANCE_DEBUT || heure >= HEURE_RELANCE_FIN) {
    if (heure >= HEURE_RELANCE_FIN) date.setDate(date.getDate() + 1);
    date.setHours(HEURE_RELANCE_DEFAUT, 0, 0, 0);
  }
  return date.getTime() > maintenant.getTime() + MARGE_MS ? date : null;
}
