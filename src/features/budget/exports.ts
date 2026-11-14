// Export CSV du budget : copie en clair, donc effacée dès que possible.
import { File, Paths } from 'expo-file-system';

import { nomsExportsCsvRecents } from './nomsExportCsv';

/** Efface un fichier du cache ; un échec est signalé sans bloquer (le système vide aussi le cache). */
export function effacerFichierCache(f: File): void {
  try {
    if (f.exists) f.delete();
  } catch (erreur: unknown) {
    console.warn('Fichier du cache non effacé', erreur);
  }
}

/** Même chose à partir du nom : la création du `File` est dans le `try`, un nettoyage raté ne bloque rien. */
function effacerNomDansCache(nom: string): void {
  try {
    effacerFichierCache(new File(Paths.cache, nom));
  } catch (erreur: unknown) {
    console.warn('Fichier du cache non retrouvé', erreur);
  }
}

/** Efface les exports CSV restés dans le cache (sur Android, le fichier doit survivre au partage). */
export function nettoyerExportsCsv(maintenant: Date = new Date()): void {
  for (const nom of nomsExportsCsvRecents(maintenant)) effacerNomDansCache(nom);
}
