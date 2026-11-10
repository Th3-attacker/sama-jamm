// Repli d'expo-router quand un écran plante : message clair, « Réessayer », code pour le support.
import type { ErrorBoundaryProps } from 'expo-router';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { EcranErreur } from '@/ui/EcranErreur';

import { journaliser } from './journal';

const LONGUEUR_MAX = 400;

/** En développement seulement : nom et message de l'erreur sous le code. Jamais dans l'app publiée. */
function messageTechnique(erreur: Error): string {
  if (!__DEV__) return '';
  return `\n${erreur.name} : ${erreur.message}`.slice(0, LONGUEUR_MAX);
}

export function ErreurDeRoute({ error, retry }: ErrorBoundaryProps) {
  const { t } = useTranslation();
  // Journalisée une fois, au premier rendu de l'écran d'erreur.
  const [code] = useState(() => journaliser(error, 'ecran'));
  useEffect(() => {
    console.error('Écran interrompu par une erreur', error);
  }, [error]);
  return (
    <EcranErreur
      titre={t('etats.erreurTitreWo')}
      sousTitre={t('etats.erreurBloque')}
      texte={t('etats.erreurTexte')}
      detail={`${t('etats.erreurCode', { code })}${messageTechnique(error)}`}
      action={{ libelle: t('commun.reessayer'), icone: 'reset', onPress: () => void retry() }}
    />
  );
}
