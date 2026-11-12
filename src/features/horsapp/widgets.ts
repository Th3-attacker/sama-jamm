// Pont vers les widgets : l'app calcule les horaires et passe au widget une frise d'entrées (une par prière à venir).
// iPhone seulement pour l'instant ; Android reste à faire (`updateSnapshot`, « Asr 16:35 »).
import { Platform } from 'react-native';

import i18n from '@/i18n';
import { formatHeure } from '@/lib/dates';
import { prochainePriere } from '@/features/priere/horaires';
import { fuseauDuLieu } from '@/features/priere/villes';
import { useReglages } from '@/stores/reglages';
import ProchainePriere from '@/widgets/ProchainePriere';

/** Nombre de prières à venir mises dans la frise (environ deux jours). */
const ENTREES = 10;

/**
 * Met à jour le widget « Prochaine prière ». À appeler après chaque replanification des notifications.
 * Sans lieu choisi, la frise est vide : le widget garde son état d'attente.
 */
export async function mettreAJourWidgets(): Promise<void> {
  if (Platform.OS !== 'ios') return;
  const { lieu, methode, ecoleAsr, ajustements } = useReglages.getState();
  if (!lieu) return;
  const t = i18n.t.bind(i18n);
  const fuseau = fuseauDuLieu(lieu);
  const entrees: { date: Date; props: { titre: string; nom: string; heure: string } }[] = [];
  let instant = new Date();
  for (let i = 0; i < ENTREES; i++) {
    const prochaine = prochainePriere(lieu, instant, { methode, ecoleAsr, ajustements });
    entrees.push({
      date: instant,
      props: { titre: t('priere.prochaine'), nom: t(`priere.noms.${prochaine.nom}`), heure: formatHeure(prochaine.heure, fuseau) },
    });
    // L'entrée suivante prend effet une seconde après l'heure de cette prière.
    instant = new Date(prochaine.heure.getTime() + 1000);
  }
  ProchainePriere.updateTimeline(entrees);
}
