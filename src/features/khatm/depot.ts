// Khatm collectif sur Supabase : lectures (RLS : membres seulement), écritures par fonctions serveur,
// grille des juz en temps réel, rappel local avant la date de fin.
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useEffect, useState } from 'react';

import { useSession } from '@/features/compte/compte';
import { CANAL_RAPPELS, creerCanaux } from '@/features/priere/notifications';
import i18n from '@/i18n';
import { supabase } from '@/services/supabase/client';

import type { Part } from './logique';

export type Khatm = {
  id: string;
  nom: string;
  intention: string | null;
  echeance: string | null;
  createur: string;
  code: string;
};
export type Membre = { user_id: string; prenom: string | null };
export type Apercu = {
  id: string;
  nom: string;
  intention: string | null;
  echeance: string | null;
  invite_par: string | null;
  libres: number;
};

/** Khatms dont je suis membre, du plus récent au plus ancien. */
export async function mesKhatms(): Promise<Khatm[]> {
  const { data, error } = await supabase
    .from('khatms')
    .select('id, nom, intention, echeance, createur, code')
    .order('cree_le', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Khatm[];
}

export async function creerKhatm(nom: string, intention: string | null, echeance: string | null): Promise<string> {
  const { data, error } = await supabase.rpc('creer_khatm', {
    p_nom: nom,
    p_intention: intention,
    p_echeance: echeance,
  });
  if (error) throw error;
  return String(data);
}

export async function apercuKhatm(code: string): Promise<Apercu | null> {
  const { data, error } = await supabase.rpc('apercu_khatm', { p_code: code });
  if (error) throw error;
  const ligne = (data as Apercu[] | null)?.[0];
  return ligne ?? null;
}

export async function rejoindreKhatm(code: string): Promise<string> {
  const { data, error } = await supabase.rpc('rejoindre_khatm', { p_code: code });
  if (error) throw error;
  return String(data);
}

async function action(
  nom: 'prendre_juz' | 'rendre_juz' | 'marquer_juz_lu',
  khatm: string,
  juz: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc(nom, { p_khatm: khatm, p_juz: juz });
  if (error) throw error;
  return data === true;
}
/** Vrai si le juz était encore libre (un autre membre a pu le prendre juste avant). */
export const prendreJuz = (khatm: string, juz: number) => action('prendre_juz', khatm, juz);
export const rendreJuz = (khatm: string, juz: number) => action('rendre_juz', khatm, juz);
export const marquerJuzLu = (khatm: string, juz: number) => action('marquer_juz_lu', khatm, juz);

export async function quitterKhatm(khatm: string): Promise<void> {
  const { error } = await supabase.rpc('quitter_khatm', { p_khatm: khatm });
  if (error) throw error;
}

export type EtatKhatm =
  { etat: 'chargement' } | { etat: 'erreur' } | { etat: 'pret'; khatm: Khatm; parts: Part[]; membres: Membre[] };

/** Khatm, ses 30 juz et ses membres ; les juz se relisent à chaque changement (temps réel). */
export function useKhatm(id: string): { etat: EtatKhatm; relire: () => void } {
  const [etat, setEtat] = useState<EtatKhatm>({ etat: 'chargement' });
  const [version, setVersion] = useState(0);
  const connecte = useSession((s) => s.session !== null);

  useEffect(() => {
    if (!connecte || !id) return;
    let actif = true;
    Promise.all([
      supabase.from('khatms').select('id, nom, intention, echeance, createur, code').eq('id', id).single(),
      supabase.from('khatm_parts').select('juz, user_id, etat').eq('khatm_id', id).order('juz'),
      supabase.from('khatm_membres').select('user_id, prenom').eq('khatm_id', id),
    ])
      .then(([k, p, m]) => {
        if (!actif) return;
        if (k.error || p.error || m.error || !k.data) throw k.error ?? p.error ?? m.error ?? new Error('Khatm absent');
        setEtat({
          etat: 'pret',
          khatm: k.data as Khatm,
          parts: (p.data ?? []) as Part[],
          membres: (m.data ?? []) as Membre[],
        });
      })
      .catch((erreur: unknown) => {
        console.warn('Khatm illisible', erreur);
        if (actif) setEtat({ etat: 'erreur' });
      });
    return () => {
      actif = false;
    };
  }, [id, connecte, version]);

  useEffect(() => {
    if (!connecte || !id) return;
    const canal = supabase
      .channel(`khatm-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'khatm_parts', filter: `khatm_id=eq.${id}` }, () =>
        setVersion((v) => v + 1),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(canal);
    };
  }, [id, connecte]);

  return { etat, relire: () => setVersion((v) => v + 1) };
}

const idRappel = (khatm: string) => `khatm-${khatm}`;

/**
 * Rappel local à 9 h, deux jours avant la date de fin, si mon juz n'est pas lu. Identifiant « khatm-… » :
 * la replanification des prières ne le touche pas.
 */
export async function programmerRappelKhatm(khatm: Khatm, juzEnCours: number | null): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(idRappel(khatm.id));
  if (juzEnCours === null || !khatm.echeance) return;
  const [a, m, j] = khatm.echeance.split('-').map(Number);
  const date = new Date(a ?? 1970, (m ?? 1) - 1, (j ?? 1) - 2, 9, 0);
  if (date.getTime() <= Date.now()) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;
  await creerCanaux();
  const fin = new Date(a ?? 1970, (m ?? 1) - 1, j ?? 1).toLocaleDateString(i18n.language);
  await Notifications.scheduleNotificationAsync({
    identifier: idRappel(khatm.id),
    content: {
      title: i18n.t('notifications.khatmTitre'),
      body: i18n.t('notifications.khatmTexte', { nom: khatm.nom, date: fin }),
      data: { url: `samajamm://plus/khatm/${khatm.id}` },
    },
    trigger: { type: SchedulableTriggerInputTypes.DATE, date, channelId: CANAL_RAPPELS },
  });
}
