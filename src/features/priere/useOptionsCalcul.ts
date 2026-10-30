import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useReglages, type OptionsCalcul } from '@/stores/reglages';

/** Options de calcul enregistrées, stables d'un rendu à l'autre. */
export function useOptionsCalcul(): OptionsCalcul {
  const { methode, ecoleAsr, ajustements } = useReglages(
    useShallow((s) => ({ methode: s.methode, ecoleAsr: s.ecoleAsr, ajustements: s.ajustements }))
  );
  return useMemo(() => ({ methode, ecoleAsr, ajustements }), [methode, ecoleAsr, ajustements]);
}
