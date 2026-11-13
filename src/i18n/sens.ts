// Sens de lecture de l'interface, déduit de la langue (i18n) : droite à gauche pour l'arabe seulement.
export type Sens = 'ltr' | 'rtl';

/** `rtl` pour l'arabe, `ltr` pour toute autre langue (français, wolof) ou langue inconnue. */
export function sensDeLangue(langue: string | undefined): Sens {
  return langue === 'ar' || langue?.startsWith('ar-') ? 'rtl' : 'ltr';
}
