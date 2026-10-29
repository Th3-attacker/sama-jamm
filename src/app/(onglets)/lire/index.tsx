import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Lire() {
  const { t } = useTranslation();
  return <EcranProvisoire titre={t('onglets.lire')} />;
}
