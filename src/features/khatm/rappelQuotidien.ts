// Rappel quotidien du khatm : décision pure, sans dépendance native (testée par node:test).
import type { HeureRappelKhatm } from '@/stores/reglages';

/** Identifiant stable : un seul rappel pour tous les khatms (1 place sur les 5 libres d'iOS). */
export const ID_RAPPEL_QUOTIDIEN = 'khatm-quotidien';

export type EntreeRappel = {
  actif: boolean;
  heure: HeureRappelKhatm;
  /** Dernier nombre connu de khatms avec un juz non lu ; null : inconnu, donc rien n'est programmé. */
  enCours: number | null;
  permission: boolean;
};

export type DecisionRappel = { programmer: false } | { programmer: true; heure: HeureRappelKhatm; minute: 0 };

/** Programmer seulement si le réglage est actif, la permission accordée et au moins un khatm en cours. */
export function decisionRappel({ actif, heure, enCours, permission }: EntreeRappel): DecisionRappel {
  if (!actif || !permission || enCours === null || enCours < 1) return { programmer: false };
  return { programmer: true, heure, minute: 0 };
}
