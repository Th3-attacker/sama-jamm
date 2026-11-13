import { useTranslation } from 'react-i18next';

import { sensDeLangue, type Sens } from './sens';

/** Sens de lecture de la langue en cours ; l'écran se met à jour dès que la langue change. */
export function useSens(): Sens {
  const { i18n } = useTranslation();
  return sensDeLangue(i18n.language);
}
