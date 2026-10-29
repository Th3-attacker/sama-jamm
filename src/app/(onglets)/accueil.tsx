import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Accueil() {
  const { t } = useTranslation();
  return <EcranProvisoire titre={t('onglets.accueil')} texte={t('formules.signature')} />;
}
