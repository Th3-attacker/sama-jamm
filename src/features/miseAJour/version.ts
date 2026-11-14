// Mise à jour bloquante : lecture de `version.json` et comparaison des versions. Fonctions pures.

export type Plateforme = 'android' | 'ios';
export type ConsigneVersion = { minimum: string; magasin: string };
export type FichierVersion = Partial<Record<Plateforme, ConsigneVersion>>;

const FORMAT_VERSION = /^\d{1,4}(\.\d{1,4}){0,2}$/;

/** Le lien du magasin doit mener au vrai magasin de la plateforme : `version.json` est un fichier distant. */
const MAGASINS: Record<Plateforme, RegExp> = {
  android: /^https:\/\/play\.google\.com\//,
  ios: /^https:\/\/(apps|itunes)\.apple\.com\//,
};

/** Compare « 1.2.0 » et « 1.10 » chiffre à chiffre : négatif si a < b, 0 si égales, positif si a > b. */
export function comparerVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    const ecart = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (ecart !== 0) return ecart;
  }
  return 0;
}

function consigne(valeur: unknown, plateforme: Plateforme): ConsigneVersion | undefined {
  if (!valeur || typeof valeur !== 'object') return undefined;
  const { minimum, magasin } = valeur as Record<string, unknown>;
  if (typeof minimum !== 'string' || !FORMAT_VERSION.test(minimum)) return undefined;
  if (typeof magasin !== 'string' || !MAGASINS[plateforme].test(magasin)) return undefined;
  return { minimum, magasin };
}

/** Contenu de `version.json` validé ; une plateforme mal décrite est ignorée (jamais de blocage par erreur). */
export function lireFichierVersion(brut: unknown): FichierVersion {
  if (!brut || typeof brut !== 'object') return {};
  const o = brut as Record<string, unknown>;
  const fichier: FichierVersion = {};
  const android = consigne(o.android, 'android');
  const ios = consigne(o.ios, 'ios');
  if (android) fichier.android = android;
  if (ios) fichier.ios = ios;
  return fichier;
}

/** Consigne qui bloque cette version, ou null si elle reste utilisable (ou si la version installée est inconnue). */
export function miseAJourExigee(
  installee: string | null,
  fichier: FichierVersion,
  plateforme: Plateforme,
): ConsigneVersion | null {
  const c = fichier[plateforme];
  if (!c || !installee || !FORMAT_VERSION.test(installee)) return null;
  return comparerVersions(installee, c.minimum) < 0 ? c : null;
}
