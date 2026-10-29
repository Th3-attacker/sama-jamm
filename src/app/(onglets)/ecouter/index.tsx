import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Ecouter() {
  const { t } = useTranslation();
  return <EcranProvisoire titre={t('onglets.ecouter')} />;
}
