// Parcours de bienvenue : décisions pures autour des autorisations du téléphone (position, notifications).

export type StatutPermission = { granted: boolean; canAskAgain: boolean };
export type Decision = 'accordee' | 'refusee' | 'a-demander';

/** Où en est une autorisation : accordée, refusée pour de bon (le téléphone ne redemande plus) ou à demander. */
export function decisionPermission(statut: StatutPermission): Decision {
  if (statut.granted) return 'accordee';
  return statut.canAskAgain ? 'a-demander' : 'refusee';
}

/**
 * Après « Autoriser la position » : utiliser la position tout de suite si elle est déjà accordée, passer au choix
 * d'une ville si elle est refusée pour de bon, sinon ouvrir l'explication avant la demande du téléphone.
 */
export function etapePosition(decision: Decision): 'utiliser' | 'ville' | 'expliquer' {
  if (decision === 'accordee') return 'utiliser';
  return decision === 'refusee' ? 'ville' : 'expliquer';
}

/**
 * Après « Commencer » : terminer sans rien demander quand aucun rappel n'est actif ou que l'autorisation est
 * déjà accordée ; refusée pour de bon → rappels désactivés puis fin ; sinon ouvrir l'explication.
 */
export function etapeRappels(rappelsActifs: boolean, decision: Decision): 'terminer' | 'desactiver-puis-terminer' | 'expliquer' {
  if (!rappelsActifs || decision === 'accordee') return 'terminer';
  return decision === 'refusee' ? 'desactiver-puis-terminer' : 'expliquer';
}
