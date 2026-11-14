// Illustration de la lecture hors de l'app (écran verrouillé, centre de contrôle, notification Android) : le logo
// de l'app, lu depuis un fichier du téléphone pour s'afficher aussi sans réseau.
import { Asset } from 'expo-asset';

import logo from '../../../assets/images/icon.png';

let adresse: string | undefined;
let chargement: Promise<string | undefined> | undefined;

/** Adresse du fichier du logo, ou `undefined` tant qu'il n'est pas prêt. */
export const pochette = (): string | undefined => adresse;

/**
 * Prépare le fichier du logo, une seule fois. Ne rejette jamais : sans fichier, la lecture continue sans image
 * et le prochain appel réessaie.
 */
export function chargerPochette(): Promise<string | undefined> {
  chargement ??= Asset.fromModule(logo)
    .downloadAsync()
    .then((fichier) => {
      adresse = fichier.localUri ?? undefined;
      if (adresse === undefined) chargement = undefined;
      return adresse;
    })
    .catch((erreur: unknown) => {
      console.warn('Illustration du lecteur non chargée', erreur);
      chargement = undefined;
      return undefined;
    });
  return chargement;
}
