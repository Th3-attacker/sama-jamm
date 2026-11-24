import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

// Dernière valeur connue, lue dès le chargement du module : un composant monté après (un Toast, une feuille) part
// avec la bonne valeur au lieu de jouer une animation avant que la lecture asynchrone ne réponde.
let derniere = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((v) => {
    derniere = v;
  })
  .catch((e: unknown) => console.warn('Préférence de mouvement illisible', e));

/** Vrai quand « Réduire les animations » est actif sur le téléphone ; suit les changements pendant la session. */
export function useMouvementReduit(): boolean {
  const [reduit, setReduit] = useState(derniere);

  useEffect(() => {
    const appliquer = (v: boolean) => {
      derniere = v;
      setReduit(v);
    };
    AccessibilityInfo.isReduceMotionEnabled()
      .then(appliquer)
      .catch((e: unknown) => console.warn('Préférence de mouvement illisible', e));
    const abonnement = AccessibilityInfo.addEventListener('reduceMotionChanged', appliquer);
    return () => abonnement.remove();
  }, []);

  return reduit;
}
