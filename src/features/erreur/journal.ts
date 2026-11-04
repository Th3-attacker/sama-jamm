// Journal local des erreurs sur le téléphone : rien n'est envoyé, l'utilisateur le partage lui-même (À propos).
import { Platform } from 'react-native';

import { versionInstallee } from '@/features/miseAJour/useMiseAJour';
import { codeErreur } from '@/lib/codeErreur';
import { ajouterAuJournal, lireJournal, type EntreeJournal } from '@/lib/journalErreurs';
import { stockage } from '@/stores/stockage';

const CLE = 'erreurs.journal';

export function journalDesErreurs(): EntreeJournal[] {
  try {
    const brut = stockage.getItem(CLE);
    return typeof brut === 'string' ? lireJournal(JSON.parse(brut)) : [];
  } catch (erreur: unknown) {
    console.warn('Journal des erreurs illisible', erreur);
    return [];
  }
}

/** Ajoute l'erreur au journal ; un échec d'écriture n'est jamais une nouvelle erreur pour l'utilisateur. */
export function journaliser(erreur: unknown, source: EntreeJournal['source'], date = new Date()): string {
  const code = codeErreur(erreur, date);
  try {
    const entree: EntreeJournal = {
      quand: date.toISOString(),
      code,
      type: erreur instanceof Error ? erreur.name : typeof erreur,
      source,
      version: versionInstallee ?? '?',
      plateforme: `${Platform.OS} ${String(Platform.Version)}`,
    };
    void stockage.setItem(CLE, JSON.stringify(ajouterAuJournal(journalDesErreurs(), entree)));
  } catch (e: unknown) {
    console.warn('Erreur non journalisée', e);
  }
  return code;
}

let installe = false;

/** Note les erreurs JavaScript fatales avant de laisser React Native les traiter comme d'habitude. */
export function installerJournalGlobal(): void {
  if (installe) return;
  installe = true;
  const precedent = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((erreur, fatale) => {
    if (fatale) journaliser(erreur, 'fatale');
    precedent(erreur, fatale);
  });
}
