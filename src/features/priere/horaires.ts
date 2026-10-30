// Horaires calculés sur le téléphone avec adhan, sans serveur.
// Réglages par défaut du design system, à faire valider par le référent religieux avant publication.
import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Rounding } from 'adhan';

import type { NomPriere } from '@/stores/reglages';

export type Horaires = Record<NomPriere, Date> & { lever: Date; coucher: Date };

type Point = { latitude: number; longitude: number };

function parametres() {
  const p = CalculationMethod.MuslimWorldLeague();
  p.madhab = Madhab.Shafi;
  p.rounding = Rounding.Nearest;
  return p;
}

export function calculerHoraires(lieu: Point, jour: Date): Horaires {
  const t = new PrayerTimes(new Coordinates(lieu.latitude, lieu.longitude), jour, parametres());
  return { fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha, lever: t.sunrise, coucher: t.sunset };
}

const ORDRE: readonly NomPriere[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/** Prochaine prière : celle du jour, ou Fajr du lendemain après Isha. */
export function prochainePriere(lieu: Point, maintenant: Date): { nom: NomPriere; heure: Date } {
  const aujourdhui = calculerHoraires(lieu, maintenant);
  const nom = ORDRE.find((p) => aujourdhui[p] > maintenant);
  if (nom) return { nom, heure: aujourdhui[nom] };
  const demain = new Date(maintenant);
  demain.setDate(demain.getDate() + 1);
  return { nom: 'fajr', heure: calculerHoraires(lieu, demain).fajr };
}
