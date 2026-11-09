// Règles pures du store des favoris : migration des versions enregistrées.

/** Favoris enregistrés : les versets (clés « 18:46 »). Un champ `invocations` d'une version précédente est ignoré. */
export type DonneesFavoris = { versets: string[] };

/** Lit un état enregistré, quelle que soit sa version ; ce qui est illisible devient une liste vide. */
export function migrerFavoris(etat: unknown): DonneesFavoris {
  const brut = typeof etat === 'object' && etat !== null ? (etat as Record<string, unknown>) : {};
  const versets = Array.isArray(brut.versets) ? brut.versets.filter((x): x is string => typeof x === 'string') : [];
  return { versets };
}
