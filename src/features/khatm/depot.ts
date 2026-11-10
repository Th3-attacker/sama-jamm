// Khatm collectif sur Supabase : lectures (RLS : membres seulement), écritures par fonctions serveur,
// grille des juz en temps réel, rappel local avant la date de fin.
import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { useEffect, useState } from 'react';

import { useSession } from '@/features/compte/compte';
import { CANAL_RAPPELS, creerCanaux } from '@/features/priere/notifications';
import i18n from '@/i18n';
import { supabase } from '@/services/supabase/client';

import { creerRegistreCanaux } from './canaux';
import type { Part } from './logique';
import { estApercu, estKhatm, estMembre, estPart, lireListe, type Apercu, type Khatm, type Membre } from './lignes';

export type { Apercu, Khatm, Membre } from './lignes';

/**
 * Un seul canal temps réel par khatm, partagé par tous les écrans qui le lisent : en rouvrir un sous le même nom
 * fait planter le second écran (Supabase refuse d'ajouter un écouteur à un canal déjà abonné).
 */
const canaux = creerRegistreCanaux((id, surChangement) => {
  const canal = supabase
    .channel(`khatm-${id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'khatm_parts', filter: `khatm_id=eq.${id}` }, surChangement)
    .subscribe();
  return () => {
    void supabase.removeChannel(canal);
  };
});

/** Khatms dont je suis membre, du plus récent au plus ancien. */
export async function mesKhatms(): Promise<Khatm[]> {
  const { data, error } = await supabase
    .from('khatms')
    .select('id, nom, intention, echeance, createur, code')
    .order('cree_le', { ascending: false });
  if (error) throw error;
  return lireListe(data ?? [], estKhatm);
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
  const lignes = lireListe(data ?? [], estApercu);
  return lignes[0] ?? null;
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

/** Signale un autre membre pour examen (enregistré côté serveur, sans retrait automatique). */
export async function signalerMembre(khatm: string, cible: string): Promise<void> {
  const { error } = await supabase.rpc('signaler_membre', { p_khatm: khatm, p_cible: cible });
  if (error) throw error;
}

/** Retire un membre ; réservé au créateur du khatm (contrôlé côté serveur). */
export async function retirerMembre(khatm: string, cible: string): Promise<void> {
  const { error } = await supabase.rpc('retirer_membre', { p_khatm: khatm, p_cible: cible });
  if (error) throw error;
}

/** `introuvable` : khatm supprimé, ou je n'en suis plus membre (RLS ne le renvoie plus). */
export type EtatKhatm =
  | { etat: 'chargement' }
  | { etat: 'erreur' }
  | { etat: 'introuvable' }
  | { etat: 'pret'; khatm: Khatm; parts: Part[]; membres: Membre[] };

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
        // `.single()` sans ligne (code PGRST116) : le khatm n'est plus visible pour moi.
        if (k.error?.code === 'PGRST116') {
          setEtat({ etat: 'introuvable' });
          return;
        }
        if (k.error || p.error || m.error) throw k.error ?? p.error ?? m.error;
        if (!estKhatm(k.data)) throw new Error('Réponse Supabase inattendue : khatm.');
        setEtat({
          etat: 'pret',
          khatm: k.data,
          parts: lireListe(p.data ?? [], estPart),
          membres: lireListe(m.data ?? [], estMembre),
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
    return canaux.abonner(id, () => setVersion((v) => v + 1));
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
