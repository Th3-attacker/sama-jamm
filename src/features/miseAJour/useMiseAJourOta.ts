// Mise à jour OTA (expo-updates) : vérification au premier plan, téléchargement en arrière-plan, puis une
// bannière propose de redémarrer. Jamais bloquant ; sans réseau, en développement ou en cas d'erreur, rien ne change.
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { doitVerifier } from './ota';

export type MiseAJourOta = { prete: boolean; redemarrer: () => void; ignorer: () => void };

let derniereVerification: number | null = null;
let enCours = false;

/** Vrai si une mise à jour vient d'être téléchargée. Faux dans tous les autres cas, erreurs comprises. */
async function chercherMiseAJour(): Promise<boolean> {
  // `isEnabled` est faux en développement et dans Expo Go : aucune vérification.
  if (!Updates.isEnabled || enCours || !doitVerifier(derniereVerification, Date.now())) return false;
  enCours = true;
  derniereVerification = Date.now();
  try {
    const verification = await Updates.checkForUpdateAsync();
    if (!verification.isAvailable) return false;
    const resultat = await Updates.fetchUpdateAsync();
    return resultat.isNew;
  } catch (erreur: unknown) {
    console.warn('Mise à jour OTA non vérifiée (hors ligne ?)', erreur);
    return false;
  } finally {
    enCours = false;
  }
}

export function useMiseAJourOta(): MiseAJourOta {
  const [prete, setPrete] = useState(false);

  useEffect(() => {
    let actif = true;
    const verifier = () => {
      void chercherMiseAJour().then((nouvelle) => {
        if (actif && nouvelle) setPrete(true);
      });
    };
    verifier();
    const abonnement = AppState.addEventListener('change', (etat) => {
      if (etat === 'active') verifier();
    });
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, []);

  const redemarrer = useCallback(() => {
    Updates.reloadAsync().catch((erreur: unknown) => console.error('Redémarrage impossible', erreur));
  }, []);
  const ignorer = useCallback(() => setPrete(false), []);

  return { prete, redemarrer, ignorer };
}
