// Envoi d'un nom dédié à un proche décédé. Seul appel réseau de la dédicace : la fonction serveur `dedier_nom` (migration 015)
// contrôle tout et ne croit rien de ce qu'envoie le client. Réservé aux comptes connectés (décision du 23 nov 2026) : sans
// session, rien n'est envoyé et l'écran propose de se connecter. Le nom n'est jamais écrit dans les journaux.
import { supabase } from '@/services/supabase/client';

import { classerErreurDedicace, type IssueDedicace } from './erreurs';
import { controlerNom, type Formule } from './validation';

/** Propose un nom. Ne lève jamais : renvoie l'issue pour que l'écran choisisse son message. */
export async function dedierNom(brut: string, formule: Formule): Promise<IssueDedicace> {
  const controle = controlerNom(brut);
  if (!controle.valide) return 'invalide';
  try {
    const { data } = await supabase.auth.getSession();
    if (!data.session) return 'connexion';
    const { error } = await supabase.rpc('dedier_nom', { p_nom: controle.nom, p_formule: formule });
    if (error) throw error;
    return 'ok';
  } catch (erreur: unknown) {
    const issue = classerErreurDedicace(erreur);
    // Aucun nom dans le journal : seulement le genre d'échec.
    console.warn('Dédicace non envoyée', issue);
    return issue;
  }
}
