// Nombre de khatms dont je suis membre et dont tous les juz ne sont pas lus (badge de l'onglet Plus).
import { useEffect, useState } from 'react';

import { useSession } from '@/features/compte/compte';
import { supabase } from '@/services/supabase/client';

type LignePart = { khatm_id: string; etat: string };

/** Khatms distincts qui ont encore au moins un juz non lu. */
export function compterKhatmsEnCours(parts: readonly LignePart[]): number {
  return new Set(parts.filter((p) => p.etat !== 'lu').map((p) => p.khatm_id)).size;
}

/** `null` tant que la réponse manque (hors connexion, chargement, erreur) : le badge reste masqué. */
export function useKhatmsEnCours(): number | null {
  const connecte = useSession((s) => s.session !== null);
  const [nombre, setNombre] = useState<number | null>(null);

  useEffect(() => {
    if (!connecte) return;
    let actif = true;
    // Lecture seule : les règles d'accès ne renvoient que les khatms dont je suis membre.
    supabase
      .from('khatm_parts')
      .select('khatm_id, etat')
      .then(({ data, error }) => {
        if (!actif) return;
        if (error) {
          console.warn('Khatms en cours illisibles', error);
          setNombre(null);
          return;
        }
        setNombre(compterKhatmsEnCours((data ?? []) as LignePart[]));
      });
    return () => {
      actif = false;
    };
  }, [connecte]);

  // Déconnecté : jamais de badge, même si un ancien compte était en mémoire.
  return connecte ? nombre : null;
}
