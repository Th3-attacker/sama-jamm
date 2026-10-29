import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Langue() {
  const { t } = useTranslation();
  return (
    <EcranProvisoire
      titre={t('bienvenue.langueTitre')}
      texte={t('bienvenue.langueSousTitre')}
      action={{ libelle: t('commun.continuer'), onPress: () => router.push('/position') }}
    />
  );
}
