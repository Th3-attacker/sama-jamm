import * as Haptics from 'expo-haptics';

import { useReglages } from '@/stores/reglages';

// Retour haptique léger : bouton principal ou précieux, grain du dhikr. Respecte le réglage « Vibrations légères ».
export function vibrerLeger(): void {
  if (!useReglages.getState().haptique) return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((erreur: unknown) => {
    console.warn('Retour haptique indisponible', erreur);
  });
}
