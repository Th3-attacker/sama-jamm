// Règles du verrou du budget, sans dépendance native : testées à part (section Budget du foyer du design).

/** Le verrou retombe après 5 minutes en arrière-plan. */
export const DELAI_VERROU_MS = 5 * 60 * 1000;

/** Au retour au premier plan : faut-il redemander l'empreinte, le visage ou le code ? */
export function doitReverrouiller(quitteA: number | null, maintenant: number): boolean {
  if (quitteA === null) return false;
  return maintenant - quitteA >= DELAI_VERROU_MS;
}

/** Montant affiché : le vrai montant, ou « ••• » quand l'utilisateur a masqué les montants. */
export function montantAffiche(texte: string, masques: boolean): string {
  return masques ? '•••' : texte;
}
