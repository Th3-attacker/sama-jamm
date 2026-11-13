// Heures en 24 h, durées « 42 min » ou « 1 h 05 » (section Voix et langues).

import { chiffresAffiches } from './chiffres.ts';

const deux = (n: number) => String(n).padStart(2, '0');

/**
 * Heure et minute d'un instant dans un fuseau IANA (« Africa/Nouakchott »). Sans fuseau, ou si le fuseau est
 * inconnu du moteur, c'est le fuseau du téléphone.
 */
function heureEtMinute(date: Date, fuseau?: string): { heure: number; minute: number } {
  if (!fuseau) return { heure: date.getHours(), minute: date.getMinutes() };
  try {
    const parties = new Intl.DateTimeFormat('en-GB', { timeZone: fuseau, hour: 'numeric', minute: 'numeric', hourCycle: 'h23' }).formatToParts(date);
    const lire = (type: Intl.DateTimeFormatPartTypes) => Number(parties.find((p) => p.type === type)?.value ?? 0);
    return { heure: lire('hour'), minute: lire('minute') };
  } catch (erreur: unknown) {
    console.warn('Fuseau inconnu, heure du téléphone utilisée', fuseau, erreur);
    return { heure: date.getHours(), minute: date.getMinutes() };
  }
}

/** Heure « 19:55 » d'un instant, dans le fuseau de la ville (ou celui du téléphone). */
export function formatHeure(date: Date, fuseau?: string): string {
  const { heure, minute } = heureEtMinute(date, fuseau);
  return chiffresAffiches(`${deux(heure)}:${deux(minute)}`);
}

/** Minutes écoulées depuis minuit, dans le fuseau de la ville (ou celui du téléphone). */
export function minutesDuJour(date: Date, fuseau?: string): number {
  const { heure, minute } = heureEtMinute(date, fuseau);
  return heure * 60 + minute;
}

export function formatDuree(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return chiffresAffiches(`${m} min`);
  return chiffresAffiches(`${Math.floor(m / 60)} h ${deux(m % 60)}`);
}

const LOCALES: Record<string, string> = { fr: 'fr-FR', en: 'en-GB', ar: 'ar', wo: 'fr-SN' };

/** « Jeudi 29 octobre ». Le wolof utilise le français en attendant une version validée. */
export function formatJour(date: Date, langue: string): string {
  const texte = new Intl.DateTimeFormat(LOCALES[langue] ?? 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return chiffresAffiches(texte.charAt(0).toUpperCase() + texte.slice(1));
}

/** Date hégirienne (Umm al-Qura) si le moteur la prend en charge, sinon null. */
export function formatHegirien(date: Date, langue: string): string | null {
  try {
    const format = new Intl.DateTimeFormat(`${LOCALES[langue] ?? 'fr-FR'}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' });
    if (format.resolvedOptions().calendar !== 'islamic-umalqura') return null;
    return chiffresAffiches(format.format(date));
  } catch (erreur: unknown) {
    console.warn('Calendrier hégirien indisponible', erreur);
    return null;
  }
}

/** Clé de jour locale « 2026-10-29 », pour comparer des jours sans fuseau. */
export function cleJour(date: Date, fuseau?: string): string {
  if (!fuseau) return `${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}`;
  try {
    const parties = new Intl.DateTimeFormat('en-GB', { timeZone: fuseau, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
    const lire = (type: Intl.DateTimeFormatPartTypes) => parties.find((p) => p.type === type)?.value ?? '00';
    return `${lire('year')}-${lire('month')}-${lire('day')}`;
  } catch (erreur: unknown) {
    console.warn('Fuseau inconnu, jour du téléphone utilisé', fuseau, erreur);
    return cleJour(date);
  }
}

/** « octobre » : nom du mois dans la langue de l'interface (le wolof utilise le français). */
export function formatMois(date: Date, langue: string): string {
  return new Intl.DateTimeFormat(LOCALES[langue] ?? 'fr-FR', { month: 'long' }).format(date);
}

/** « août 2027 » depuis une clé de mois « 2027-08 ». */
export function formatMoisAnnee(mois: string, langue: string): string {
  const [a, m] = mois.split('-').map(Number);
  return chiffresAffiches(
    new Intl.DateTimeFormat(LOCALES[langue] ?? 'fr-FR', { month: 'long', year: 'numeric' }).format(
      new Date(a ?? 1970, (m ?? 1) - 1, 1),
    ),
  );
}

/** « 25 octobre » depuis une clé de jour « 2026-10-25 » (jour local). */
export function formatJourCle(jour: string, langue: string): string {
  const [a, m, j] = jour.split('-').map(Number);
  return chiffresAffiches(
    new Intl.DateTimeFormat(LOCALES[langue] ?? 'fr-FR', { day: 'numeric', month: 'long' }).format(
      new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1),
    ),
  );
}
