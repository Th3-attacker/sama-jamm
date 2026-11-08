// Place mesurée en bas de l'écran : barre d'onglets (sonde iOS) et mini-lecteur. 0 = pas encore mesuré, les
// repères de secours de `theme/layout.ts` s'appliquent alors. `outil` : compteur ou pilule actuellement affiché
// (un seul à la fois). Non persisté.
import { create } from 'zustand';

import type { OutilBas } from '@/theme/pileBas';

export const usePlaceBas = create<{ hauteurBarre: number; hauteurMini: number; outil: OutilBas }>()(() => ({
  hauteurBarre: 0,
  hauteurMini: 0,
  outil: 'aucun',
}));
