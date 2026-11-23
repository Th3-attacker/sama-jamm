// Pont vers l'activité en direct « Prochaine prière » (iPhone seulement) : démarrée quand l'app est ouverte dans les
// 30 minutes avant la prière, mise à jour à chaque replanification, terminée dès qu'aucune prière n'est proche.
// Option 1 de la fiche technique : pas de serveur, pas de notification push ; si l'app n'est pas ouverte dans ces 30
// minutes, l'activité n'apparaît pas.
import { requireOptionalNativeModule } from 'expo';
import { Platform } from 'react-native';

import { prochainePriere } from '@/features/priere/horaires';
import { fuseauDuLieu } from '@/features/priere/villes';
import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { useReglages } from '@/stores/reglages';

import { activiteAttendue } from './fenetreActivite';

const URL_PRIERE = 'samajamm://priere';

type Activite = (typeof import('@/widgets/ActivitePriere'))['default'];
let activite: Promise<Activite | null> | null = null;

/** Charge l'activité à la demande : `expo-widgets` est du code natif, absent d'Expo Go et des anciens clients de développement. */
function chargerActivite(): Promise<Activite | null> {
  if (Platform.OS !== 'ios' || !requireOptionalNativeModule('ExpoWidgets')) return Promise.resolve(null);
  activite ??= import('@/widgets/ActivitePriere')
    .then((m) => m.default ?? null)
    .catch((erreur: unknown) => {
      console.warn('Activité en direct indisponible', erreur);
      return null;
    });
  return activite;
}

/**
 * Démarre, met à jour ou termine l'activité selon l'heure et le réglage. À appeler après chaque replanification et au
 * retour au premier plan. Jamais d'erreur à l'extérieur : l'activité est un confort.
 */
export async function synchroniserActivite(): Promise<void> {
  try {
    const a = await chargerActivite();
    if (!a) return;
    const { lieu, methode, ecoleAsr, ajustements, activiteDirecte } = useReglages.getState();
    const maintenant = new Date();
    const prochaine = lieu ? prochainePriere(lieu, maintenant, { methode, ecoleAsr, ajustements }) : null;
    const instances = a.getInstances();
    if (!lieu || !prochaine || !activiteAttendue(prochaine.heure.getTime(), maintenant.getTime(), activiteDirecte)) {
      await Promise.all(instances.map((i) => i.end('immediate')));
      return;
    }
    const t = i18n.t.bind(i18n);
    const props = {
      titre: t('priere.prochaine'),
      nom: t(`priere.noms.${prochaine.nom}`),
      heure: formatHeure(prochaine.heure, fuseauDuLieu(lieu)),
      ville: lieu.type === 'ville' ? lieu.nom : t('priere.maPosition'),
    };
    const [premiere, ...autres] = instances;
    if (!premiere) a.start(props, URL_PRIERE, prochaine.heure);
    else await premiere.update(props, prochaine.heure);
    await Promise.all(autres.map((i) => i.end('immediate')));
  } catch (erreur: unknown) {
    console.warn('Activité en direct non synchronisée', erreur);
  }
}
