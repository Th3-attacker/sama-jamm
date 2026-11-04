import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';

export type EtatCap =
  | { etat: 'attente' }
  /** Position jamais demandée : l'écran explique avant de la demander, puis relance avec `essai` + 1. */
  | { etat: 'autorisation' }
  | { etat: 'indisponible' }
  | { etat: 'actif'; cap: number; imprecis: boolean };

const LISSAGE_MS = 200;
// Sans mesure après ce délai, le téléphone est considéré sans boussole.
const DELAI_SANS_BOUSSOLE = 4000;

/** Écart le plus court d'un angle à l'autre, de −180 à 180. */
function ecart(de: number, vers: number): number {
  return ((((vers - de) % 360) + 540) % 360) - 180;
}

/**
 * Cap du téléphone, lissé sur 200 ms pour que l'étoile ne tremble pas.
 * Nord vrai quand il est disponible (trueHeading ≥ 0), sinon nord magnétique.
 */
export function useCap(essai = 0): EtatCap {
  const [etat, setEtat] = useState<EtatCap>({ etat: 'attente' });
  const lisse = useRef<{ cap: number; temps: number } | null>(null);

  useEffect(() => {
    let abonnement: Location.LocationSubscription | undefined;
    let fini = false;
    let delai: ReturnType<typeof setTimeout> | undefined;

    (async () => {
      // La demande elle-même se fait depuis l'écran, après l'explication (voir `useAvantAutorisation`).
      const permission = await Location.getForegroundPermissionsAsync();
      if (fini) return;
      if (!permission.granted) {
        setEtat({ etat: permission.canAskAgain ? 'autorisation' : 'indisponible' });
        return;
      }
      setEtat({ etat: 'attente' });
      delai = setTimeout(() => {
        if (!lisse.current && !fini) setEtat({ etat: 'indisponible' });
      }, DELAI_SANS_BOUSSOLE);
      abonnement = await Location.watchHeadingAsync(
        (mesure) => {
          const brut = mesure.trueHeading >= 0 ? mesure.trueHeading : mesure.magHeading;
          const maintenant = Date.now();
          const precedent = lisse.current;
          const cap = precedent
            ? (precedent.cap + ecart(precedent.cap, brut) * Math.min(1, (maintenant - precedent.temps) / LISSAGE_MS) + 360) % 360
            : brut;
          lisse.current = { cap, temps: maintenant };
          setEtat({ etat: 'actif', cap, imprecis: mesure.accuracy <= 1 });
        },
        (raison) => {
          console.warn('Boussole indisponible', raison);
          setEtat({ etat: 'indisponible' });
        }
      );
      if (fini) abonnement.remove();
    })().catch((erreur: unknown) => {
      console.warn('Boussole indisponible', erreur);
      setEtat({ etat: 'indisponible' });
    });

    return () => {
      fini = true;
      clearTimeout(delai);
      abonnement?.remove();
    };
  }, [essai]);

  return etat;
}
