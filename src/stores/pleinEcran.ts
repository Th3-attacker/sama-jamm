// Écran en plein écran (page mushaf) : la barre des onglets et le mini-lecteur se retirent. Non persisté.
import { create } from 'zustand';

export const usePleinEcran = create<{ actif: boolean }>()(() => ({ actif: false }));
