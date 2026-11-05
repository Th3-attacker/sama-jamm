// Compte Sama Jàmm : connexion par code reçu par e-mail, profil (prénom), déconnexion, suppression.
import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { supabase } from '@/services/supabase/client';

/** Session courante, tenue à jour par Supabase (connexion, rafraîchissement, déconnexion). */
export const useSession = create<{ session: Session | null; pret: boolean }>()(() => ({ session: null, pret: false }));

supabase.auth
  .getSession()
  .then(({ data }) => useSession.setState({ session: data.session, pret: true }))
  .catch((erreur: unknown) => {
    console.warn('Session illisible', erreur);
    useSession.setState({ pret: true });
  });
supabase.auth.onAuthStateChange((_evenement, session) => useSession.setState({ session, pret: true }));

/** Envoie le code de connexion (crée le compte à la première connexion). */
export async function envoyerCode(email: string): Promise<void> {
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) throw error;
}

export async function verifierCode(email: string, code: string): Promise<void> {
  const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
  if (error) throw error;
}

export async function seDeconnecter(): Promise<void> {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/** Efface le compte sur le serveur (fonction `supprimer_mon_compte`), puis la session sur ce téléphone. */
export async function supprimerCompte(): Promise<void> {
  const { error } = await supabase.rpc('supprimer_mon_compte');
  if (error) throw error;
  await supabase.auth.signOut({ scope: 'local' });
}

export async function lirePrenom(): Promise<string | null> {
  const id = useSession.getState().session?.user.id;
  if (!id) return null;
  const { data, error } = await supabase.from('profils').select('prenom').eq('id', id).maybeSingle();
  if (error) throw error;
  const prenom: unknown = data?.prenom;
  return typeof prenom === 'string' ? prenom : null;
}

export async function enregistrerPrenom(prenom: string | null): Promise<void> {
  const id = useSession.getState().session?.user.id;
  if (!id) throw new Error('Non connecté.');
  const { error } = await supabase.from('profils').upsert({ id, prenom });
  if (error) throw error;
}
