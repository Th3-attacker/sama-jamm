// Membres bloqués d'un khatm : leur prénom est masqué sur ce téléphone (App Review, guideline 1.2). Le blocage ne
// quitte pas le téléphone et ne retire personne du groupe ; seul le créateur peut retirer un membre.

/** Ajoute l'identifiant s'il est absent, le retire sinon. Ne modifie pas la liste reçue. */
export function basculerBloque(liste: readonly string[], identifiant: string): string[] {
  return liste.includes(identifiant) ? liste.filter((i) => i !== identifiant) : [...liste, identifiant];
}

/** Lecture sûre d'une liste enregistrée : seuls les textes sont gardés, sans doublon. */
export function lireBloques(brut: unknown): string[] {
  if (!Array.isArray(brut)) return [];
  const textes = brut.filter((i): i is string => typeof i === 'string' && i.length > 0);
  return [...new Set(textes)];
}
