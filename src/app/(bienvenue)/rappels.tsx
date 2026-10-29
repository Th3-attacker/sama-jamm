import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Rappels() {
  const { t } = useTranslation();
  return (
    <EcranProvisoire
      titre={t('bienvenue.rappelsTitre')}
      texte={t('bienvenue.rappelsTexte')}
      action={{ libelle: t('bienvenue.commencer'), onPress: () => router.replace('/accueil') }}
    />
  );
}
