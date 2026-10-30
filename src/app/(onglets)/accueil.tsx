import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Accueil() {
  const { t } = useTranslation();
  return (
    <EcranProvisoire
      titre={t('onglets.accueil')}
      texte={t('formules.signature')}
      // Accès à la galerie des composants, en développement seulement.
      action={__DEV__ ? { libelle: 'Galerie des composants', onPress: () => router.push('/dev/composants') } : undefined}
    />
  );
}
