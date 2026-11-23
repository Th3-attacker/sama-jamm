// Lecture des erreurs de `dedier_nom` (migration 015) et du réseau. Pur : testable sans Supabase.
// Les messages renvoyés au client ne contiennent jamais le nom saisi : rien de personnel n'est lu ni journalisé ici.

/** Message exact levé par `dedier_nom` au-delà de 5 noms par jour ou de 20 par personne. */
export const MESSAGE_TROP_DE_NOMS = 'trop de noms, réessayez plus tard';

export type IssueDedicace = 'ok' | 'trop' | 'invalide' | 'hors-ligne' | 'erreur';

function champ(erreur: unknown, nom: string): unknown {
  return typeof erreur === 'object' && erreur !== null && nom in erreur ? (erreur as Record<string, unknown>)[nom] : undefined;
}

/** Classe une erreur : limite atteinte, nom refusé par le serveur, pas de réseau, ou autre. */
export function classerErreurDedicace(erreur: unknown): Exclude<IssueDedicace, 'ok'> {
  const code = champ(erreur, 'code');
  const message = champ(erreur, 'message');
  const texte = typeof message === 'string' ? message.trim() : '';
  if (code === 'P0001' && texte === MESSAGE_TROP_DE_NOMS) return 'trop';
  if (code === 'P0001' && (texte === 'nom invalide' || texte === 'formule invalide')) return 'invalide';
  // Pas de réseau : `fetch` échoue avant toute réponse du serveur (pas de code SQL).
  if (code === undefined && /network|fetch|internet|connexion|offline|timeout/i.test(texte)) return 'hors-ligne';
  const nom = champ(erreur, 'name');
  if (typeof nom === 'string' && /AuthRetryableFetchError|TypeError/.test(nom) && /network|fetch/i.test(texte)) return 'hors-ligne';
  return 'erreur';
}
