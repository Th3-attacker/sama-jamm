// Client Supabase : comptes et, plus tard, khatm collectif. Clé publique (publishable) seulement : chaque table
// est protégée par RLS côté serveur. Jamais de clé service_role dans l'app. Le budget n'est jamais envoyé.
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { stockage } from '@/stores/stockage';

export const SUPABASE_URL = 'https://jpevulpndavbwclfjfvf.supabase.co';
export const SUPABASE_CLE_PUBLIQUE = 'sb_publishable_SLeOYcR16PR2YhgggeQHxQ_b5Zt_3o5';

export const supabase = createClient(SUPABASE_URL, SUPABASE_CLE_PUBLIQUE, {
  auth: {
    // Session gardée dans le stockage local de l'app (même mécanisme que les réglages).
    storage: {
      getItem: (cle) => stockage.getItem(cle) as string | null,
      setItem: (cle, valeur) => void stockage.setItem(cle, valeur),
      removeItem: (cle) => void stockage.removeItem(cle),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // Connexion Google par le navigateur : le code reçu au retour est échangé contre la session (PKCE).
    flowType: 'pkce',
  },
});

// Recommandation de Supabase pour les apps mobiles : rafraîchir la session seulement app au premier plan.
AppState.addEventListener('change', (etat) => {
  if (etat === 'active') supabase.auth.startAutoRefresh();
  else supabase.auth.stopAutoRefresh();
});
