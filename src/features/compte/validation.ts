// Saisies de la connexion et du compte : règles pures.

export const PRENOM_MAX = 40;
export const LONGUEUR_CODE = 6;

/** Adresse e-mail plausible (un « @ », un domaine avec un point) ; nettoyée et en minuscules. */
export function emailPropre(saisie: string): string | null {
  const e = saisie.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 254 ? e : null;
}

/** Saisie du code reçu par e-mail : chiffres seulement, 6 au plus (le reste est retiré à la frappe et au collage). */
export function saisieCode(saisie: string): string {
  return saisie.replace(/\D/g, '').slice(0, LONGUEUR_CODE);
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

/** Chemin de retour de la connexion Google (samajamm://auth?code=…) : géré par l'écran de connexion. */
export function estRetourConnexion(chemin: string): boolean {
  return /^(?:[a-z][a-z0-9+.-]*:\/\/[^/?#]*)?\/?(?:--\/)?auth(?:[/?#]|$)/i.test(chemin);
}

export type RetourOAuth = { code: string } | { erreur: string };

/** Lit le code (flux PKCE) ou l'erreur dans l'adresse de retour du fournisseur ; null si l'adresse est vide. */
export function lireRetourOAuth(adresse: string): RetourOAuth | null {
  const params = new Map<string, string>();
  for (const partie of adresse.split(/[?#]/).slice(1)) {
    for (const paire of partie.split('&')) {
      const [cle, valeur = ''] = paire.split('=');
      if (!cle) continue;
      try {
        params.set(cle, decodeURIComponent(valeur.replace(/\+/g, ' ')));
      } catch {
        params.set(cle, valeur);
      }
    }
  }
  const code = params.get('code');
  if (code) return { code };
  const erreur = params.get('error_description') ?? params.get('error');
  return erreur ? { erreur } : null;
}

/** Échec d'une connexion par fournisseur : l'étape (jamais un message) et, si connue, l'erreur d'origine. */
export class ErreurConnexion extends Error {
  readonly etape: 'demarrage' | 'retour_sans_code' | 'retour_erreur' | 'echange';
  readonly origine: unknown;
  constructor(etape: ErreurConnexion['etape'], origine?: unknown) {
    super(`connexion : ${etape}`);
    this.name = 'ErreurConnexion';
    this.etape = etape;
    this.origine = origine;
  }
}

/** Détail court pour le journal : « echange:bad_oauth_callback » ou « demarrage:400 ». Jamais de texte libre. */
export function detailConnexion(erreur: unknown): string | undefined {
  if (!(erreur instanceof ErreurConnexion)) return undefined;
  const o = erreur.origine;
  let suite = '';
  if (o && typeof o === 'object') {
    const { code, status } = o as { code?: unknown; status?: unknown };
    if (typeof code === 'string') suite = code;
    else if (typeof status === 'number') suite = String(status);
  }
  const propre = suite.replace(/[^A-Za-z0-9_.-]/g, '').slice(0, 40);
  return propre ? `${erreur.etape}:${propre}` : erreur.etape;
}
