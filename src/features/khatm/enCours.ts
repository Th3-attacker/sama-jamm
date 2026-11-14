// Nombre de khatms dont je suis membre et dont tous les juz ne sont pas lus (badge de l'onglet Plus).
import { useEffect, useState } from 'react';

import { useSession } from '@/features/compte/compte';
import { supabase } from '@/services/supabase/client';
import { useReglages } from '@/stores/reglages';

import { estLignePart, lireListe, type LignePart } from './lignes';

/** Khatms distincts qui ont encore au moins un juz non lu. */
export function compterKhatmsEnCours(parts: readonly LignePart[]): number {
  return new Set(parts.filter((p) => p.etat !== 'lu').map((p) => p.khatm_id)).size;
}

/**
 * Relit le nombre de khatms en cours et le garde sur le téléphone (le rappel quotidien se décide hors ligne avec
 * ce dernier nombre connu). `null` sans session ou en cas d'échec ; dans ce cas la valeur gardée n'est pas effacée.
 */
export async function actualiserKhatmsEnCours(): Promise<number | null> {
  if (useSession.getState().session === null) return null;
  // Lecture seule : les règles d'accès ne renvoient que les khatms dont je suis membre.
  const { data, error } = await supabase.from('khatm_parts').select('khatm_id, etat');
  if (error) {
    console.warn('Khatms en cours illisibles', error);
    return null;
  }
  try {
    const compte = compterKhatmsEnCours(lireListe(data ?? [], estLignePart));
    useReglages.getState().definirKhatmEnCours(compte);
    return compte;
  } catch (erreur: unknown) {
    console.warn('Khatms en cours inattendus', erreur);
    return null;
  }
}

/** `null` tant que la réponse manque (hors connexion, chargement, erreur) : le badge reste masqué. */
export function useKhatmsEnCours(): number | null {
  const connecte = useSession((s) => s.session !== null);
  const pret = useSession((s) => s.pret);
  const [nombre, setNombre] = useState<number | null>(null);

  useEffect(() => {
    if (!connecte) return;
    let actif = true;
    actualiserKhatmsEnCours()
      .then((compte) => {
        if (actif) setNombre(compte);
      })
      .catch((erreur: unknown) => console.warn('Khatms en cours inaccessibles', erreur));
    return () => {
      actif = false;
    };
  }, [connecte]);

  // Vraie déconnexion seulement : au démarrage la session est vide un instant (`pret` faux) et le rappel doit survivre.
  useEffect(() => {
    if (pret && !connecte) useReglages.getState().definirKhatmEnCours(null);
  }, [pret, connecte]);

  // Déconnecté : jamais de badge, même si un ancien compte était en mémoire.
  return connecte ? nombre : null;
}
