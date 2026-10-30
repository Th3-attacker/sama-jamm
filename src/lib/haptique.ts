import * as Haptics from 'expo-haptics';

// Retour haptique léger : bouton principal ou précieux, grain du dhikr, objectif atteint.
export function vibrerLeger(): void {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch((erreur: unknown) => {
    console.warn('Retour haptique indisponible', erreur);
  });
}
