import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Budget() {
  const { t } = useTranslation();
  return <EcranProvisoire titre={t('onglets.budget')} />;
}
