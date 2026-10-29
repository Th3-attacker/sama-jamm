import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Position() {
  const { t } = useTranslation();
  return (
    <EcranProvisoire
      titre={t('bienvenue.positionTitre')}
      texte={t('bienvenue.positionTexte')}
      action={{ libelle: t('commun.continuer'), onPress: () => router.push('/rappels') }}
    />
  );
}
