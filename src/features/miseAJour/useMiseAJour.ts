// Contrôle de version au démarrage : la dernière consigne connue s'applique tout de suite (même hors ligne),
// puis `version.json` est relu en arrière-plan. Sans réseau ou en cas d'erreur, rien n'est bloqué de plus.
import Constants from 'expo-constants';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { URL_VERSION } from '@/constants/liens';
import { stockage } from '@/stores/stockage';

import { lireFichierVersion, miseAJourExigee, type ConsigneVersion, type FichierVersion } from './version';

const CLE_CACHE = 'miseAJour.version';
const DELAI_MS = 5000;

export const versionInstallee: string | null = Constants.expoConfig?.version ?? null;
const plateforme = Platform.OS === 'ios' ? 'ios' : 'android';

function lireCache(): FichierVersion {
  try {
    const brut = stockage.getItem(CLE_CACHE);
    return typeof brut === 'string' ? lireFichierVersion(JSON.parse(brut)) : {};
  } catch (erreur: unknown) {
    console.warn('Consigne de version en cache illisible', erreur);
    return {};
  }
}

async function telecharger(): Promise<FichierVersion> {
  const controle = new AbortController();
  const minuteur = setTimeout(() => controle.abort(), DELAI_MS);
  try {
    const reponse = await fetch(URL_VERSION, { signal: controle.signal, cache: 'no-store' });
    if (!reponse.ok) throw new Error(`version.json : HTTP ${reponse.status}`);
    return lireFichierVersion(await reponse.json());
  } finally {
    clearTimeout(minuteur);
  }
}

/** Consigne qui bloque cette version de l'app, ou null. */
export function useMiseAJour(): ConsigneVersion | null {
  const [fichier, setFichier] = useState<FichierVersion>(lireCache);
  useEffect(() => {
    let actif = true;
    telecharger()
      .then((f) => {
        if (!actif) return;
        void stockage.setItem(CLE_CACHE, JSON.stringify(f));
        setFichier(f);
      })
      .catch((erreur: unknown) => console.warn('Consigne de version non lue (hors ligne ?)', erreur));
    return () => {
      actif = false;
    };
  }, []);
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  return miseAJourExigee(versionInstallee, fichier, plateforme);
}
