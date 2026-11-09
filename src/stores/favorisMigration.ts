// Règles pures du store des favoris : migration des anciennes versions et bascule d'une clé dans une liste.

/** Version 1 : seulement des versets. Version 2 : s'y ajoutent les chapitres de la Citadelle (invocations). */
export type DonneesFavoris = { versets: string[]; invocations: string[] };

const textes = (valeur: unknown): string[] =>
  Array.isArray(valeur) ? valeur.filter((x): x is string => typeof x === 'string') : [];

/** Lit un état enregistré, quelle que soit sa version ; ce qui est illisible devient une liste vide. */
export function migrerFavoris(etat: unknown): DonneesFavoris {
  const brut = typeof etat === 'object' && etat !== null ? (etat as Record<string, unknown>) : {};
  return { versets: textes(brut.versets), invocations: textes(brut.invocations) };
}

/** Ajoute la clé en tête, ou la retire si elle y est ; renvoie la nouvelle liste et si la clé est présente. */
export function basculerCle(liste: string[], cle: string): { liste: string[]; present: boolean } {
  const present = liste.includes(cle);
  return { liste: present ? liste.filter((x) => x !== cle) : [cle, ...liste], present: !present };
}
