// Notifications locales de prière : canaux Android, programmation de la fenêtre, tâche quotidienne.
import * as BackgroundTask from 'expo-background-task';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { useReglages, type Son } from '@/stores/reglages';

import { stockage } from '@/stores/stockage';

import { comparerFenetre } from './comparaison';
import { construireFenetre, type Planifiee } from './fenetre';

export const URL_PRIERE = 'samajamm://priere';
/** Rappel de zakat (programmé par features/budget/rappelZakat). */
export const URL_ZAKAT = 'samajamm://budget/zakat';
const TACHE = 'replanifier-prieres';

// Le son d'un canal ne change plus après sa création : identifiants versionnés pour pouvoir les remplacer.
// v2 : l'adhan (fichiers CC0 de Wikimedia Commons, intégrés par le plugin expo-notifications) remplace le son par défaut.
const CANAUX: Record<Son, string> = {
  complet: 'priere-v2-complet',
  court: 'priere-v2-court',
  doux: 'priere-v2-doux',
  vibration: 'priere-v2-vibration',
  silencieux: 'priere-v2-silencieux',
};
/** Fichiers de `assets/sons`, copiés dans les ressources Android par le plugin (nom avec l'extension). */
const SONS_ADHAN: Partial<Record<Son, string>> = { complet: 'adhan_complet.ogg', court: 'adhan_court.ogg' };
/** Canal Android des rappels doux (avant la prière, zakat). */
export const CANAL_RAPPELS = 'rappels-v1';
const ANCIENS_CANAUX = [
  'priere-defaut',
  ...['complet', 'court', 'doux', 'vibration', 'silencieux'].map((son) => `priere-v1-${son}`),
];

/** Crée les canaux Android (nécessaires avant la demande d'autorisation sur Android 13 et plus). */
export async function creerCanaux(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const t = i18n.t.bind(i18n);
  // Complet et court : l'adhan ; doux : le son par défaut du téléphone.
  for (const son of ['complet', 'court', 'doux'] as const) {
    await Notifications.setNotificationChannelAsync(CANAUX[son], {
      name: t(`notifications.canaux.${son}`),
      importance: AndroidImportance.HIGH,
      sound: SONS_ADHAN[son] ?? 'default',
    });
  }
  await Notifications.setNotificationChannelAsync(CANAUX.vibration, {
    name: t('notifications.canaux.vibration'),
    importance: AndroidImportance.HIGH,
    sound: null,
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync(CANAUX.silencieux, {
    name: t('notifications.canaux.silencieux'),
    importance: AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
  });
  await Notifications.setNotificationChannelAsync(CANAL_RAPPELS, {
    name: t('notifications.canaux.rappels'),
    importance: AndroidImportance.DEFAULT,
  });
  for (const ancien of ANCIENS_CANAUX) await Notifications.deleteNotificationChannelAsync(ancien);
}

/**
 * Notification d'essai dans 2 secondes, sur le canal du son choisi (on entend l'adhan sans attendre la prière).
 * Faux si les notifications ne sont pas autorisées.
 */
export async function essayerSon(son: Son): Promise<boolean> {
  if (!(await Notifications.getPermissionsAsync()).granted) return false;
  await creerCanaux();
  const t = i18n.t.bind(i18n);
  await Notifications.scheduleNotificationAsync({
    identifier: 'essai-son',
    content: {
      title: t('notifications.essaiTitre'),
      body: t('notifications.appelTexte'),
      sound: son === 'complet' || son === 'court' || son === 'doux',
    },
    trigger: { type: SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: 2, channelId: CANAUX[son] },
  });
  return true;
}

function contenu(n: Planifiee): Notifications.NotificationContentInput {
  const t = i18n.t.bind(i18n);
  const priere = t(`priere.noms.${n.priere}`);
  const avecSon = n.son === 'complet' || n.son === 'court' || n.son === 'doux';
  if (n.type === 'rappel') {
    return {
      title: t('notifications.rappelTitre', { priere, minutes: n.minutes }),
      body: t('notifications.rappelTexte'),
      sound: avecSon,
      data: { url: URL_PRIERE },
    };
  }
  return {
    title: t('notifications.appelTitre', { priere, heure: formatHeure(n.date) }),
    body: n.priere === 'fajr' ? t('notifications.fajrTexte') : t('notifications.appelTexte'),
    sound: avecSon,
    data: { url: URL_PRIERE },
  };
}

const estDePriere = (id: string) => id.startsWith('priere-') || id.startsWith('rappel-');

const CLE_EMPREINTES = 'notifications.empreintes';

function lireEmpreintes(): Record<string, string> {
  try {
    const brut = stockage.getItem(CLE_EMPREINTES);
    const valeur: unknown = typeof brut === 'string' ? JSON.parse(brut) : null;
    return valeur && typeof valeur === 'object' ? (valeur as Record<string, string>) : {};
  } catch (erreur: unknown) {
    // Empreintes illisibles : tout sera reprogrammé, comme avant.
    console.warn('Empreintes des notifications illisibles', erreur);
    return {};
  }
}

function ecrireEmpreintes(empreintes: Record<string, string>): void {
  try {
    void stockage.setItem(CLE_EMPREINTES, JSON.stringify(empreintes));
  } catch (erreur: unknown) {
    console.warn('Empreintes des notifications non enregistrées', erreur);
  }
}

async function executerReplanification(): Promise<number> {
  const permission = await Notifications.getPermissionsAsync();
  const existantes = await Notifications.getAllScheduledNotificationsAsync();
  const programmees = new Set(existantes.map((n) => n.identifier).filter(estDePriere));

  const { lieu, rappels, sons, rappelAvant, methode, ecoleAsr, ajustements } = useReglages.getState();
  const fenetre =
    permission.granted && lieu
      ? construireFenetre({
          lieu,
          options: { methode, ecoleAsr, ajustements },
          rappels,
          sons,
          rappelAvant,
          depuis: new Date(),
        })
      : [];
  const aProgrammer = fenetre.map((n) => {
    const channelId = n.type === 'rappel' ? CANAL_RAPPELS : CANAUX[n.son];
    const content = contenu(n);
    // Empreinte : jour et heure, canal (son), texte (langue) ; une différence entraîne le remplacement.
    const empreinte = [n.date.getTime(), channelId, content.title, content.body, String(content.sound)].join('|');
    return { n, channelId, content, empreinte };
  });

  const anciennes = lireEmpreintes();
  const { annuler, programmer } = comparerFenetre(
    programmees,
    anciennes,
    aProgrammer.map((x) => ({ id: x.n.id, empreinte: x.empreinte })),
  );
  await Promise.all(annuler.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
  const aFaire = new Set(programmer);
  for (const x of aProgrammer) {
    if (!aFaire.has(x.n.id)) continue;
    await Notifications.scheduleNotificationAsync({
      identifier: x.n.id,
      content: x.content,
      trigger: { type: SchedulableTriggerInputTypes.DATE, date: x.n.date, channelId: x.channelId },
    });
  }
  ecrireEmpreintes(Object.fromEntries(aProgrammer.map((x) => [x.n.id, x.empreinte])));
  return aProgrammer.length;
}

let derniere: Promise<unknown> = Promise.resolve();

/**
 * Met la fenêtre glissante à jour en ne touchant qu'à ce qui change (voir `comparerFenetre`).
 * Une seule mise à jour à la fois (premier plan, réglages, tâche de fond). Ne demande jamais l'autorisation.
 */
export function replanifier(): Promise<number> {
  const resultat = derniere.then(executerReplanification);
  derniere = resultat.catch(() => undefined);
  return resultat;
}

// Tâche de fond quotidienne : reprogramme la fenêtre même si l'app n'est pas ouverte.
// Définie au chargement du module, comme l'exige expo-task-manager.
TaskManager.defineTask(TACHE, async () => {
  try {
    await replanifier();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch (erreur: unknown) {
    console.error('Replanification en arrière-plan impossible', erreur);
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

/** Enregistre la tâche quotidienne. Indisponible dans Expo Go : l'erreur est signalée, sans bloquer. */
export async function enregistrerTacheQuotidienne(): Promise<void> {
  const statut = await BackgroundTask.getStatusAsync();
  if (statut !== BackgroundTask.BackgroundTaskStatus.Available) return;
  if (await TaskManager.isTaskRegisteredAsync(TACHE)) return;
  await BackgroundTask.registerTaskAsync(TACHE, { minimumInterval: 24 * 60 });
}
