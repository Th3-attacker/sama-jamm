import { estRetourConnexion } from '@/features/compte/validation';

/**
 * Le retour de la connexion Google (samajamm://auth?code=…) est lu par l'écran de connexion lui-même :
 * le routeur ne doit pas ouvrir de page « auth ». Les autres liens (khatm, notifications) passent tels quels.
 */
export function redirectSystemPath({ path, initial }: { path: string; initial: boolean }): string | null {
  try {
    if (!estRetourConnexion(path)) return path;
    return initial ? '/' : null;
  } catch (erreur: unknown) {
    console.warn('Lien entrant illisible', erreur);
    return initial ? '/' : null;
  }
}
