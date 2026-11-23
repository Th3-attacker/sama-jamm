// Feuille « Écoute » maison (Android) ; sur iOS le lecteur ouvre l'écran en feuille native `ecoute-reglages`.
import { useTranslation } from 'react-i18next';

import { BottomSheet } from '@/ui/BottomSheet';

import { ContenuEcoute } from './ContenuEcoute';

export function ReglagesEcoute({ ouvert, onFermer, onArreter }: { ouvert: boolean; onFermer: () => void; onArreter: () => void }) {
  const { t } = useTranslation();
  return (
    <BottomSheet ouvert={ouvert} titre={t('ecouter.titreFeuille')} onFermer={onFermer}>
      <ContenuEcoute onArreter={onArreter} />
    </BottomSheet>
  );
}
