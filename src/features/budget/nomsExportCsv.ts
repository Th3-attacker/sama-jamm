// Noms des exports CSV du budget laissés dans le cache du téléphone : calcul pur, sans dépendance native.

/** Nombre de jours en arrière dont on cherche encore un export oublié. */
export const JOURS_RECHERCHES = 31;

const deux = (n: number) => String(n).padStart(2, '0');

/** Nom du fichier CSV d'un jour (jour local). À garder en phase avec `cleJour` de `@/lib/dates` (module pur, sans alias). */
export function nomExportCsv(date: Date): string {
  return `sama-jamm-budget-${date.getFullYear()}-${deux(date.getMonth() + 1)}-${deux(date.getDate())}.csv`;
}

/** Noms possibles des exports CSV d'aujourd'hui et des jours précédents. Jamais une sauvegarde `.samajamm`. */
export function nomsExportsCsvRecents(maintenant: Date, jours: number = JOURS_RECHERCHES): string[] {
  const noms: string[] = [];
  for (let i = 0; i < jours; i++) {
    const jour = new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate() - i);
    noms.push(nomExportCsv(jour));
  }
  return noms;
}
