// Horaires calculés sur le téléphone avec adhan, sans serveur.
// Réglages par défaut du design system, à faire valider par le référent religieux avant publication.
import { CalculationMethod, Coordinates, Madhab, PrayerTimes, Qibla, Rounding, type CalculationParameters } from 'adhan';

import type { Methode, NomPriere, OptionsCalcul } from '@/stores/reglages';

export type Horaires = Record<NomPriere, Date> & { lever: Date; coucher: Date };

type Point = { latitude: number; longitude: number };

const METHODES: Record<Methode, () => CalculationParameters> = {
  mwl: () => CalculationMethod.MuslimWorldLeague(),
  egypte: () => CalculationMethod.Egyptian(),
  ummalqura: () => CalculationMethod.UmmAlQura(),
  // UOIF : Fajr et Isha à 12°.
  uoif: () => {
    const p = CalculationMethod.Other();
    p.fajrAngle = 12;
    p.ishaAngle = 12;
    return p;
  },
  isna: () => CalculationMethod.NorthAmerica(),
};

export const OPTIONS_PAR_DEFAUT: OptionsCalcul = {
  methode: 'mwl',
  ecoleAsr: 'standard',
  ajustements: { fajr: 0, dhuhr: 0, asr: 0, maghrib: 0, isha: 0 },
};

function parametres({ methode, ecoleAsr, ajustements }: OptionsCalcul): CalculationParameters {
  const p = METHODES[methode]();
  // Standard = ombre simple (shafiite, malikite, hanbalite).
  p.madhab = ecoleAsr === 'hanafite' ? Madhab.Hanafi : Madhab.Shafi;
  p.rounding = Rounding.Nearest;
  p.adjustments = { ...p.adjustments, ...ajustements };
  return p;
}

export function calculerHoraires(lieu: Point, jour: Date, options: OptionsCalcul = OPTIONS_PAR_DEFAUT): Horaires {
  const t = new PrayerTimes(new Coordinates(lieu.latitude, lieu.longitude), jour, parametres(options));
  return { fajr: t.fajr, dhuhr: t.dhuhr, asr: t.asr, maghrib: t.maghrib, isha: t.isha, lever: t.sunrise, coucher: t.sunset };
}

const ORDRE: readonly NomPriere[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

function lendemain(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + 1);
  return d;
}

/** Prochaine prière : celle du jour, ou Fajr du lendemain après Isha. */
export function prochainePriere(lieu: Point, maintenant: Date, options?: OptionsCalcul): { nom: NomPriere; heure: Date } {
  const aujourdhui = calculerHoraires(lieu, maintenant, options);
  const nom = ORDRE.find((p) => aujourdhui[p] > maintenant);
  if (nom) return { nom, heure: aujourdhui[nom] };
  return { nom: 'fajr', heure: calculerHoraires(lieu, lendemain(maintenant), options).fajr };
}

/**
 * Nuit de prière, d'Isha à Fajr : sert à la Veille automatique.
 * `cle` identifie la nuit par la date de son Isha (« 2026-10-29 »).
 */
export function nuitDePriere(lieu: Point, maintenant: Date, options?: OptionsCalcul): { active: boolean; cle: string; fin: Date } {
  const h = calculerHoraires(lieu, maintenant, options);
  const cleDe = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  if (maintenant < h.fajr) {
    const veille = new Date(maintenant);
    veille.setDate(veille.getDate() - 1);
    return { active: true, cle: cleDe(veille), fin: h.fajr };
  }
  if (maintenant >= h.isha) return { active: true, cle: cleDe(maintenant), fin: calculerHoraires(lieu, lendemain(maintenant), options).fajr };
  return { active: false, cle: cleDe(maintenant), fin: h.isha };
}

/** Relèvement de la Kaaba en degrés depuis le nord vrai. */
export function relevementQibla(lieu: Point): number {
  return Qibla(new Coordinates(lieu.latitude, lieu.longitude));
}
