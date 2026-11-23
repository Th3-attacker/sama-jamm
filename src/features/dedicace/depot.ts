// Envoi d'un nom dédié à un proche décédé. Seul appel réseau de la dédicace : la fonction serveur `dedier_nom` (migration 015)
// contrôle tout et ne croit rien de ce qu'envoie le client. Sans compte, l'app ouvre une session anonyme de Supabase
// (à activer côté serveur). Le nom n'est jamais écrit dans les journaux.
import { supabase } from '@/services/supabase/client';

import { classerErreurDedicace, type IssueDedicace } from './erreurs';
import { controlerNom, type Formule } from './validation';

/** Une session existe déjà, ou une session anonyme est ouverte. Lève si Supabase refuse (connexion anonyme désactivée, réseau). */
async function assurerSession(): Promise<void> {
  const { data } = await supabase.auth.getSession();
  if (data.session) return;
  const { error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
}

/** Propose un nom. Ne lève jamais : renvoie l'issue pour que l'écran choisisse son message. */
export async function dedierNom(brut: string, formule: Formule): Promise<IssueDedicace> {
  const controle = controlerNom(brut);
  if (!controle.valide) return 'invalide';
  try {
    await assurerSession();
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
