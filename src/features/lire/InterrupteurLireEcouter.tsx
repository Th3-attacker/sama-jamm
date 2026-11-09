import { useTranslation } from 'react-i18next';

import { SegmentedControl } from '@/ui/SegmentedControl';

export type ModeLire = 'lire' | 'ecouter';

/** Interrupteur Lire | Écouter en tête de la bibliothèque : deux modes du même écran, sans changer de page. */
export function InterrupteurLireEcouter({ mode, onChange }: { mode: ModeLire; onChange: (mode: ModeLire) => void }) {
  const { t } = useTranslation();
  return (
    <SegmentedControl
      label={t('lire.lireOuEcouter')}
      pilule
      options={[
        { id: 'lire', label: t('lire.titre') },
        { id: 'ecouter', label: t('ecouter.titre') },
      ]}
      valeur={mode}
      onChange={(id) => onChange(id === 'ecouter' ? 'ecouter' : 'lire')}
    />
  );
}
