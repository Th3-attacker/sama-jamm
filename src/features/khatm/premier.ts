// Premier khatm de la liste de l'utilisateur et son avancée (bande de la bibliothèque).
import { useEffect, useState } from 'react';

import { useSession } from '@/features/compte/compte';

import { mesKhatms, useKhatm } from './depot';
import { resumeKhatm } from './logique';

export type PremierKhatm = { id: string; nom: string; lus: number };

/** `null` hors connexion, sans khatm, ou tant que la réponse manque : la bande reste masquée. */
export function usePremierKhatm(): PremierKhatm | null {
  const connecte = useSession((s) => s.session !== null);
  const moi = useSession((s) => s.session?.user.id ?? null);
  const [id, setId] = useState<string | null>(null);
  useEffect(() => {
    if (!connecte) return;
    let actif = true;
    mesKhatms()
      .then((l) => actif && setId(l[0]?.id ?? null))
      .catch((erreur: unknown) => console.warn('Khatms illisibles', erreur));
    return () => {
      actif = false;
    };
  }, [connecte]);
  const { etat } = useKhatm(connecte && id ? id : '');
  if (!connecte || !id || etat.etat !== 'pret') return null;
  return { id, nom: etat.khatm.nom, lus: resumeKhatm(etat.parts, moi).lus };
}
