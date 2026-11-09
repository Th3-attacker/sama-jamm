// Verrou du budget et masquage des montants. L'état « déverrouillé » ne vit qu'en mémoire, jamais sur le disque.
import * as LocalAuthentication from 'expo-local-authentication';
import * as ScreenCapture from 'expo-screen-capture';
import { useCallback, useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';

import { chiffresAffiches } from '@/lib/chiffres';
import { formatMontant, type Devise } from '@/lib/montant';
import { useReglages } from '@/stores/reglages';

import { doitReverrouiller, montantAffiche } from './verrouLogique';

type EtatVerrou = {
  deverrouille: boolean;
  /** Heure du passage en arrière-plan (ms), pour faire retomber le verrou après 5 minutes. */
  quitteA: number | null;
  /** Montants remplacés par « ••• » ; au démarrage, selon le réglage « Masquer les montants au démarrage ». */
  montantsMasques: boolean;
};

export const useEtatVerrou = create<EtatVerrou>()(() => ({
  deverrouille: false,
  quitteA: null,
  montantsMasques: useReglages.getState().masquerMontants,
}));

/** Le téléphone a-t-il un moyen de déverrouillage (code, schéma, empreinte, visage) ? */
export async function verrouPossible(): Promise<boolean> {
  return (await LocalAuthentication.getEnrolledLevelAsync()) !== LocalAuthentication.SecurityLevel.NONE;
}

/** Demande l'empreinte, le visage ou, à défaut, le code du téléphone. Vrai si l'utilisateur est reconnu. */
export async function authentifier(message: string): Promise<boolean> {
  const resultat = await LocalAuthentication.authenticateAsync({
    promptMessage: message,
    disableDeviceFallback: false,
  });
  return resultat.success;
}

/** Bascule « ••• » / montants, depuis l'icône œil de l'écran Budget. */
export function basculerMontants(): void {
  useEtatVerrou.setState((s) => ({ montantsMasques: !s.montantsMasques }));
}

/** État du verrou pour les écrans du budget : verrouillé seulement si le réglage est actif. */
export function useVerrouBudget(message: string): { verrouille: boolean; deverrouiller: () => Promise<boolean> } {
  const actif = useReglages((s) => s.verrouBudget);
  const deverrouille = useEtatVerrou((s) => s.deverrouille);
  const deverrouiller = useCallback(async () => {
    const ok = await authentifier(message);
    if (ok) useEtatVerrou.setState({ deverrouille: true, quitteA: null });
    return ok;
  }, [message]);
  return { verrouille: actif && !deverrouille, deverrouiller };
}

/** `formatMontant` qui respecte le masquage ; le composant se redessine quand on bascule l'œil. */
export function useFormatMontant(): (minimes: number, devise: Devise) => string {
  const masques = useEtatVerrou((s) => s.montantsMasques);
  return useCallback(
    (minimes: number, devise: Devise) => chiffresAffiches(montantAffiche(formatMontant(minimes, devise), masques)),
    [masques],
  );
}

/**
 * À monter une fois à la racine : fait retomber le verrou après 5 minutes en arrière-plan, et masque l'aperçu de
 * l'app dans le sélecteur d'apps quand le verrou est actif (flou sur iOS ; écran vide et captures bloquées sur Android).
 */
export function useSurveillanceVerrou(): void {
  const actif = useReglages((s) => s.verrouBudget);

  useEffect(() => {
    const abonnement = AppState.addEventListener('change', (etat) => {
      const { quitteA } = useEtatVerrou.getState();
      if (etat === 'background') useEtatVerrou.setState({ quitteA: Date.now() });
      else if (etat === 'active') {
        if (doitReverrouiller(quitteA, Date.now())) useEtatVerrou.setState({ deverrouille: false });
        useEtatVerrou.setState({ quitteA: null });
      }
    });
    return () => abonnement.remove();
  }, []);

  useEffect(() => {
    const appliquer = async () => {
      if (Platform.OS === 'ios') {
        if (actif) await ScreenCapture.enableAppSwitcherProtectionAsync(0.9);
        else await ScreenCapture.disableAppSwitcherProtectionAsync();
      } else if (actif) await ScreenCapture.preventScreenCaptureAsync('verrou-budget');
      else await ScreenCapture.allowScreenCaptureAsync('verrou-budget');
    };
    appliquer().catch((erreur: unknown) => console.warn('Protection de l’aperçu indisponible', erreur));
    // Désactiver le verrou le redemande à la prochaine activation.
    if (!actif) useEtatVerrou.setState({ deverrouille: false });
  }, [actif]);
}
