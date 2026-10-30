// Fenêtre glissante des notifications de prière : calcul pur, sans dépendance native.
import type { NomPriere, OptionsCalcul, Son } from '@/stores/reglages';

import { calculerHoraires } from './horaires';

/** iOS garde 64 notifications programmées par app ; 4 places restent pour le khatm, la zakat et la régularité. */
export const PLACES = 60;
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
  const jours = Math.min(JOURS_MAX, Math.floor(PLACES / parJour)) + 1;

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
