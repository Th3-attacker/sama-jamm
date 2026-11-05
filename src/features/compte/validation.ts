// Saisies de la connexion et du compte : règles pures.

export const PRENOM_MAX = 40;
export const LONGUEUR_CODE = 6;

/** Adresse e-mail plausible (un « @ », un domaine avec un point) ; nettoyée et en minuscules. */
export function emailPropre(saisie: string): string | null {
  const e = saisie.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254 ? e : null;
}

/** Code reçu par e-mail : exactement 6 chiffres, espaces ignorés. */
export function codePropre(saisie: string): string | null {
  const c = saisie.replace(/\s/g, '');
  return new RegExp(`^\\d{${LONGUEUR_CODE}}$`).test(c) ? c : null;
}

/** Prénom facultatif : null si vide, sinon nettoyé (40 caractères au plus). */
export function prenomPropre(saisie: string): string | null | undefined {
  const p = saisie.trim().replace(/\s+/g, ' ');
  if (p === '') return null;
  return p.length <= PRENOM_MAX ? p : undefined;
}
