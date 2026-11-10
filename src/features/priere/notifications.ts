// Notifications locales de prière : canaux Android, programmation de la fenêtre, tâche quotidienne.
import * as BackgroundTask from 'expo-background-task';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { AndroidImportance, SchedulableTriggerInputTypes } from 'expo-notifications';
import * as TaskManager from 'expo-task-manager';
import { Platform } from 'react-native';

import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { useReglages, type NomPriere, type Son } from '@/stores/reglages';

import { stockage } from '@/stores/stockage';

import { comparerFenetre } from './comparaison';
import { construireFenetre, type Planifiee } from './fenetre';

export const URL_PRIERE = 'samajamm://priere';
/** Rappel de zakat (programmé par features/budget/rappelZakat). */
export const URL_ZAKAT = 'samajamm://budget/zakat';
const TACHE = 'replanifier-prieres';

// Le son d'un canal ne change plus après sa création : identifiants versionnés pour pouvoir les remplacer.
// v3 : deux appels, Fajr et Makkah (Dhuhr, Asr, Maghrib, Isha), chacun en version complète et courte.
type Appel = 'fajr' | 'makkah';
const APPELS: readonly Appel[] = ['fajr', 'makkah'];
const appelDe = (priere: NomPriere): Appel => (priere === 'fajr' ? 'fajr' : 'makkah');
const avecAdhan = (son: Son): son is 'complet' | 'court' => son === 'complet' || son === 'court';

/** Identifiant du canal Android : un canal par appel pour l'adhan, un seul pour les autres sons. */
function canal(son: Son, priere: NomPriere): string {
  return avecAdhan(son) ? `priere-v3-${son}-${appelDe(priere)}` : `priere-v3-${son}`;
}
/** Fichiers de `assets/sons`, copiés dans les ressources Android par le plugin (nom avec l'extension). */
const SONS_ANDROID: Record<'complet' | 'court', Record<Appel, string>> = {
  complet: { fajr: 'adhan_fajr.mp3', makkah: 'adhan_makkah.mp3' },
  court: { fajr: 'adhan_fajr_court.mp3', makkah: 'adhan_makkah_court.mp3' },
};
/** iOS : pas de canaux, le son se désigne dans la notification. Extraits de 30 secondes au plus (limite d'iOS), en WAV. */
const SONS_IOS: Record<'complet' | 'court', Record<Appel, string>> = {
  complet: { fajr: 'adhan_fajr_complet_ios.wav', makkah: 'adhan_makkah_complet_ios.wav' },
  court: { fajr: 'adhan_fajr_court_ios.wav', makkah: 'adhan_makkah_court_ios.wav' },
};

/**
 * Expo Go n'embarque pas les sons déclarés dans le plugin (adhan) : il ne connaît que le son par défaut.
 * Les builds (développement, preview, production) les contiennent.
 */
const DANS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

/**
 * Expo Go n'accepte pas `sound: null` dans les options d'un canal : le pont natif lève une NullPointerException,
 * qui interrompt la création du canal et de tous les suivants. Les canaux muets y gardent le son par défaut.
 * Les builds (développement, preview, production) conservent un vrai canal silencieux.
 */
const SON_MUET = DANS_EXPO_GO ? 'default' : null;

/** Son d'une notification d'appel : l'extrait d'adhan sur iOS, le son du canal (booléen) sur Android. */
export function sonDeNotification(son: Son, priere: NomPriere): boolean | string {
  const avecSon = son === 'complet' || son === 'court' || son === 'doux';
  if (Platform.OS === 'ios' && !DANS_EXPO_GO && avecAdhan(son)) return SONS_IOS[son][appelDe(priere)];
  return avecSon;
}

/** Canal Android des rappels doux (avant la prière, zakat). */
export const CANAL_RAPPELS = 'rappels-v1';
const ANCIENS_CANAUX = [
  'priere-defaut',
  ...['v1', 'v2'].flatMap((v) => ['complet', 'court', 'doux', 'vibration', 'silencieux'].map((son) => `priere-${v}-${son}`)),
];

/** Crée les canaux Android (nécessaires avant la demande d'autorisation sur Android 13 et plus). */
export async function creerCanaux(): Promise<void> {
  if (Platform.OS !== 'android') return;
  const t = i18n.t.bind(i18n);
  // Complet et court : l'adhan de Fajr et celui de Makkah ; doux : le son par défaut du téléphone.
  for (const son of ['complet', 'court'] as const) {
    for (const appel of APPELS) {
      await Notifications.setNotificationChannelAsync(`priere-v3-${son}-${appel}`, {
        name: `${t(`notifications.canaux.${son}`)} · ${t(`notifications.canaux.${appel}`)}`,
        importance: AndroidImportance.HIGH,
        // Dans Expo Go, un fichier inconnu fait échouer la création du canal : son par défaut.
        sound: DANS_EXPO_GO ? 'default' : SONS_ANDROID[son][appel],
      });
    }
  }
  await Notifications.setNotificationChannelAsync('priere-v3-doux', {
    name: t('notifications.canaux.doux'),
    importance: AndroidImportance.HIGH,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('priere-v3-vibration', {
    name: t('notifications.canaux.vibration'),
    importance: AndroidImportance.HIGH,
    sound: SON_MUET,
    enableVibrate: true,
  });
  await Notifications.setNotificationChannelAsync('priere-v3-silencieux', {
    name: t('notifications.canaux.silencieux'),
    importance: AndroidImportance.DEFAULT,
    sound: SON_MUET,
    enableVibrate: false,
  });
  await Notifications.setNotificationChannelAsync(CANAL_RAPPELS, {
    name: t('notifications.canaux.rappels'),
    importance: AndroidImportance.DEFAULT,
  });
  for (const ancien of ANCIENS_CANAUX) await Notifications.deleteNotificationChannelAsync(ancien);
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
    sound: sonDeNotification(n.son, n.priere),
    data: { url: URL_PRIERE },
  };
}

const estDePriere = (id: string) => id.startsWith('priere-') || id.startsWith('rappel-');

const CLE_EMPREINTES = 'notifications.empreintes';

function lireEmpreintes(): Record<string, string> {
  try {
    const brut = stockage.getItem(CLE_EMPREINTES);
    const valeur: unknown = typeof brut === 'string' ? JSON.parse(brut) : null;
    const empreintes: Record<string, string> = {};
    if (valeur && typeof valeur === 'object') {
      for (const [cle, empreinte] of Object.entries(valeur)) {
        if (typeof empreinte === 'string') empreintes[cle] = empreinte;
      }
    }
    return empreintes;
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
    const channelId = n.type === 'rappel' ? CANAL_RAPPELS : canal(n.son, n.priere);
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
