// Heures en 24 h, durées « 42 min » ou « 1 h 05 » (section Voix et langues).

const deux = (n: number) => String(n).padStart(2, '0');

export function formatHeure(date: Date): string {
  return `${deux(date.getHours())}:${deux(date.getMinutes())}`;
}

/** Minutes écoulées depuis minuit, heure locale. */
export function minutesDuJour(date: Date): number {
  return date.getHours() * 60 + date.getMinutes();
}

export function formatDuree(minutes: number): string {
  const m = Math.max(0, Math.round(minutes));
  if (m < 60) return `${m} min`;
  return `${Math.floor(m / 60)} h ${deux(m % 60)}`;
}

const LOCALES: Record<string, string> = { fr: 'fr-FR', ar: 'ar', wo: 'fr-SN' };

/** « Jeudi 29 octobre ». Le wolof utilise le français en attendant une version validée. */
export function formatJour(date: Date, langue: string): string {
  const texte = new Intl.DateTimeFormat(LOCALES[langue] ?? 'fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(date);
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Date hégirienne (Umm al-Qura) si le moteur la prend en charge, sinon null. */
export function formatHegirien(date: Date, langue: string): string | null {
  try {
    const format = new Intl.DateTimeFormat(`${LOCALES[langue] ?? 'fr-FR'}-u-ca-islamic-umalqura`, { day: 'numeric', month: 'long', year: 'numeric' });
    if (format.resolvedOptions().calendar !== 'islamic-umalqura') return null;
    return format.format(date);
  } catch (erreur: unknown) {
    console.warn('Calendrier hégirien indisponible', erreur);
    return null;
  }
}
