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

function veille(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - 1);
  return d;
}

/**
 * Prochaine prière : la première prière strictement à venir, parmi celles de la veille, d'aujourd'hui et de demain.
 * Le jour de calcul d'`adhan` est celui du téléphone ; quand le lieu est dans un autre fuseau, la date du lieu peut
 * différer d'un jour : regarder les trois jours évite de sauter une prière.
 */
export function prochainePriere(lieu: Point, maintenant: Date, options?: OptionsCalcul): { nom: NomPriere; heure: Date } {
  let meilleure: { nom: NomPriere; heure: Date } | undefined;
  for (const jour of [veille(maintenant), maintenant, lendemain(maintenant)]) {
    const h = calculerHoraires(lieu, jour, options);
    for (const nom of ORDRE) {
      if (h[nom] > maintenant && (!meilleure || h[nom] < meilleure.heure)) meilleure = { nom, heure: h[nom] };
    }
  }
  // Toujours trouvé : le lendemain a au moins un Fajr futur.
  return meilleure ?? { nom: 'fajr', heure: calculerHoraires(lieu, lendemain(maintenant), options).fajr };
}

/** Relèvement de la Kaaba en degrés depuis le nord vrai. */
export function relevementQibla(lieu: Point): number {
  return Qibla(new Coordinates(lieu.latitude, lieu.longitude));
}
