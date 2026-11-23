// Pont vers la notification persistante « Prochaine prière » (Android seulement, désactivée par défaut) : posée quand
// l'app est ouverte dans les 30 minutes avant la prière, mise à jour à chaque replanification, retirée par le système à
// l'heure de la prière. Pas de module natif ni d'alarme : si l'app n'est pas ouverte dans ces 30 minutes, elle
// n'apparaît pas. Le minuteur natif et la « Mise à jour en direct » d'Android 16 ne sont pas faits (Kotlin).
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { prochainePriere } from '@/features/priere/horaires';
import { fuseauDuLieu } from '@/features/priere/villes';
import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { useReglages } from '@/stores/reglages';

import { activiteAttendue } from './fenetreActivite';

const ID = 'compte-priere';
const URL_PRIERE = 'samajamm://priere';

type Compte = (typeof import('@/widgets/CompteNotification'))['default'];
let compte: Promise<Compte | null> | null = null;

/** Charge la notification à la demande : `expo-widgets` est du code natif, absent d'Expo Go et des anciens clients. */
function charger(): Promise<Compte | null> {
  if (Platform.OS !== 'android' || !requireOptionalNativeModule('ExpoWidgets')) return Promise.resolve(null);
  compte ??= import('@/widgets/CompteNotification')
    .then((m) => m.default ?? null)
    .catch((erreur: unknown) => {
      console.warn('Notification du compte à rebours indisponible', erreur);
      return null;
    });
  return compte;
}

/**
 * Pose, met à jour ou retire la notification selon l'heure et le réglage. À appeler après chaque replanification et au
 * retour au premier plan. Jamais d'erreur à l'extérieur : c'est un confort.
 */
export async function synchroniserCompte(): Promise<void> {
  try {
    const n = await charger();
    if (!n) return;
    const { lieu, methode, ecoleAsr, ajustements, compteNotification } = useReglages.getState();
    const maintenant = new Date();
    const prochaine = lieu ? prochainePriere(lieu, maintenant, { methode, ecoleAsr, ajustements }) : null;
    if (!lieu || !prochaine || !activiteAttendue(prochaine.heure.getTime(), maintenant.getTime(), compteNotification)) {
      await n.cancelAll();
      return;
    }
    const t = i18n.t.bind(i18n);
    const priere = `${t(`priere.noms.${prochaine.nom}`)} ${formatHeure(prochaine.heure, fuseauDuLieu(lieu))}`;
    const ville = lieu.type === 'ville' ? lieu.nom : t('priere.maPosition');
    const props = { titre: t('priere.prochaine'), priere, ville };
    // Le système la retire tout seul à l'heure de la prière.
    const options = { ongoing: true, timeoutAfter: prochaine.heure.getTime() - maintenant.getTime(), title: props.titre, text: priere };
    const existante = await n.get(ID);
    if (existante) {
      try {
        await existante.update(props, options);
        return;
      } catch (erreur: unknown) {
        // Fermée entre-temps : on la repose.
        console.warn('Notification du compte à rebours à reposer', erreur);
      }
    }
    await n.post(props, { id: ID, url: URL_PRIERE, ...options });
  } catch (erreur: unknown) {
    console.warn('Notification du compte à rebours non synchronisée', erreur);
  }
}
