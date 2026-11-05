// Déclarations de dons : envoyées à Supabase (écriture seule), gardées sur le téléphone pour le statut.
// Sans réseau, la déclaration attend et repart à la prochaine ouverture de l'écran Soutenir.
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { supabase } from '@/services/supabase/client';
import { stockage } from '@/stores/stockage';

import type { Declaration } from './declaration';

export type DeclarationLocale = Declaration & { id: string; le: string; envoyee: boolean };

export const useDons = create<{ declarations: DeclarationLocale[] }>()(
  persist(() => ({ declarations: [] as DeclarationLocale[] }), {
    name: 'dons',
    version: 1,
    storage: createJSONStorage(() => stockage),
    onRehydrateStorage: () => (_etat, erreur) => {
      if (erreur) console.error('Déclarations de dons illisibles', erreur);
    },
  }),
);

export const dejaDeclaree = (wallet: string, reference: string) =>
  useDons.getState().declarations.some((d) => d.wallet === wallet && d.reference === reference);

async function envoyer(d: Declaration): Promise<void> {
  const { error } = await supabase.from('declarations_dons').insert({
    wallet: d.wallet,
    montant: d.montant,
    reference: d.reference,
    prenom: d.prenom,
    message: d.message,
  });
  // Déjà reçue (même wallet, même référence) : rien à renvoyer.
  if (error && error.code !== '23505') throw error;
}

/** Garde la déclaration, puis l'envoie ; renvoie son identifiant local et si l'envoi a réussi. */
export async function declarer(d: Declaration): Promise<{ id: string; envoyee: boolean }> {
  const id = `${Date.now()}-${d.reference}`;
  const locale: DeclarationLocale = { ...d, id, le: new Date().toISOString(), envoyee: false };
  useDons.setState((s) => ({ declarations: [locale, ...s.declarations] }));
  try {
    await envoyer(d);
    useDons.setState((s) => ({ declarations: s.declarations.map((x) => (x.id === id ? { ...x, envoyee: true } : x)) }));
    return { id, envoyee: true };
  } catch (e: unknown) {
    console.warn('Déclaration non envoyée (sera renvoyée)', e);
    return { id, envoyee: false };
  }
}

/** Renvoie les déclarations restées sur le téléphone faute de réseau. */
export async function renvoyerEnAttente(): Promise<void> {
  for (const d of useDons.getState().declarations.filter((x) => !x.envoyee)) {
    try {
      await envoyer(d);
      useDons.setState((s) => ({
        declarations: s.declarations.map((x) => (x.id === d.id ? { ...x, envoyee: true } : x)),
      }));
    } catch (e: unknown) {
      console.warn('Déclaration toujours en attente', e);
      return;
    }
  }
}
