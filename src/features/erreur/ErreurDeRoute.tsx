// Repli d'expo-router quand un écran plante : message clair, « Réessayer », code pour le support.
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { codeErreur } from '@/lib/codeErreur';
import { EcranErreur } from '@/ui/EcranErreur';

export function ErreurDeRoute({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  const [code] = useState(() => codeErreur(error, new Date()));
  useEffect(() => {
    console.error('Écran interrompu par une erreur', error);
  }, [error]);
  return (
    <EcranErreur
      titre={t('etats.erreurTitre')}
      texte={t('etats.erreurTexte')}
      detail={t('etats.erreurCode', { code })}
      action={{ libelle: t('commun.reessayer'), onPress: () => void retry() }}
    />
  );
}
