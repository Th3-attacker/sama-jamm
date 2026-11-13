// Pont vers les widgets : l'app calcule les horaires et les passe aux widgets, qui ne calculent rien.
// iPhone : une frise d'entrées (une par prière à venir). Android : un seul état (`updateSnapshot`, « Asr 16:35 »),
// rafraîchi à chaque replanification. Chaque widget a un fichier par plateforme (`X.tsx`, `X.android.tsx`).
// Rien du budget ici, jamais.
import { Platform } from 'react-native';

import { sourate } from '@/features/lire/coran';
import { calculerHoraires, prochainePriere } from '@/features/priere/horaires';
import { fuseauDuLieu } from '@/features/priere/villes';
import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { useLecture } from '@/stores/lecture';
import { useReglages, type NomPriere } from '@/stores/reglages';

type Widgets = {
  CinqPrieres: (typeof import('@/widgets/CinqPrieres'))['default'];
  ProchainePriere: (typeof import('@/widgets/ProchainePriere'))['default'];
  Reprendre: (typeof import('@/widgets/Reprendre'))['default'];
};

let widgets: Promise<Widgets | null> | null = null;

/**
 * Charge les widgets à la demande. `expo-widgets` est du code natif : Expo Go et les clients de développement
 * construits avant son ajout ne l'ont pas, et l'importer au démarrage ferait planter l'app. Absent : on le signale
 * une fois et les mises à jour de widgets sont ignorées.
 */
function chargerWidgets(): Promise<Widgets | null> {
  widgets ??= Promise.all([
    import('@/widgets/CinqPrieres'),
    import('@/widgets/ProchainePriere'),
    import('@/widgets/Reprendre'),
  ])
    .then(([cinq, prochaine, reprendre]) => ({
      CinqPrieres: cinq.default,
      ProchainePriere: prochaine.default,
      Reprendre: reprendre.default,
    }))
    .catch((erreur: unknown) => {
      console.warn('Widgets indisponibles : module natif absent (Expo Go ou ancien client de développement)', erreur);
      return null;
    });
  return widgets;
}

/** Nombre de prières à venir mises dans la frise (environ deux jours). */
const ENTREES = 10;
const ORDRE: readonly NomPriere[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

/**
 * Met à jour les widgets de prière (« Prochaine prière » et « Les cinq prières »). À appeler après chaque
 * replanification des notifications. Sans lieu choisi, rien n'est écrit : les widgets gardent leur état d'attente.
 */
export async function mettreAJourWidgets(): Promise<void> {
  const { lieu, methode, ecoleAsr, ajustements } = useReglages.getState();
  if (!lieu) return;
  const w = await chargerWidgets();
  if (!w) return;
  const options = { methode, ecoleAsr, ajustements };
  const t = i18n.t.bind(i18n);
  const fuseau = fuseauDuLieu(lieu);
  const titre = t('priere.prochaine');
  const prochaines: { date: Date; props: { titre: string; nom: string; heure: string } }[] = [];
  const cinq: { date: Date; props: { titre: string; lignes: { nom: string; heure: string; prochaine: boolean }[] } }[] = [];
  let instant = new Date();
  for (let i = 0; i < ENTREES; i++) {
    const prochaine = prochainePriere(lieu, instant, options);
    prochaines.push({
      date: instant,
      props: { titre, nom: t(`priere.noms.${prochaine.nom}`), heure: formatHeure(prochaine.heure, fuseau) },
    });
    // Les cinq heures du jour de la prochaine prière, avec elle en évidence.
    const horaires = calculerHoraires(lieu, prochaine.heure, options);
    cinq.push({
      date: instant,
      props: {
        titre: t('priere.cinqPrieres'),
        lignes: ORDRE.map((nom) => ({ nom: t(`priere.noms.${nom}`), heure: formatHeure(horaires[nom], fuseau), prochaine: nom === prochaine.nom })),
      },
    });
    // L'entrée suivante prend effet une seconde après l'heure de cette prière.
    instant = new Date(prochaine.heure.getTime() + 1000);
  }
  if (Platform.OS === 'ios') {
    w.ProchainePriere.updateTimeline(prochaines);
    w.CinqPrieres.updateTimeline(cinq);
  } else {
    // Android : l'état de maintenant seulement ; il est refait à chaque replanification (ouverture, retour, fond).
    w.ProchainePriere.updateSnapshot(prochaines[0].props);
    w.CinqPrieres.updateSnapshot(cinq[0].props);
  }
}

/** Met à jour le widget « Reprendre » : sourate et verset de la dernière lecture (Al-Fâtiha sans lecture). */
export async function mettreAJourReprendre(): Promise<void> {
  const w = await chargerWidgets();
  if (!w) return;
  const t = i18n.t.bind(i18n);
  const position = useLecture.getState().position;
  const meta = sourate(position?.sourate ?? 1);
  if (!meta) return;
  w.Reprendre.updateSnapshot({
    titre: t('accueil.reprendreLibelle'),
    sourate: meta.nom,
    detail: t('accueil.versetSur', { n: position?.verset ?? 1, total: meta.versets }),
  });
}
