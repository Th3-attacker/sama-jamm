// Place mesurée en bas de l'écran : barre d'onglets (sonde iOS) et mini-lecteur. 0 = pas encore mesuré, les
// valeurs de secours de `placeMiniLecteur.ts` s'appliquent alors. Non persisté.
import { create } from 'zustand';

export const usePlaceBas = create<{ hauteurBarre: number; hauteurMini: number }>()(() => ({
  hauteurBarre: 0,
  hauteurMini: 0,
}));
