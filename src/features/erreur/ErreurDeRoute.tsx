// Repli d'expo-router quand un écran plante : message clair, « Réessayer », code pour le support.
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EcranErreur } from '@/ui/EcranErreur';

import { journaliser } from './journal';

export function ErreurDeRoute({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  // Journalisée une fois, au premier rendu de l'écran d'erreur.
  const [code] = useState(() => journaliser(error, 'ecran'));
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
