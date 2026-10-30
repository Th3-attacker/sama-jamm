import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';

import { useReglages } from '@/stores/reglages';
import { EcranProvisoire } from '@/ui/EcranProvisoire';

export default function Rappels() {
  const { t } = useTranslation();
  const terminerBienvenue = useReglages((s) => s.terminerBienvenue);
  return (
    <EcranProvisoire
      titre={t('bienvenue.rappelsTitre')}
      texte={t('bienvenue.rappelsTexte')}
      action={{
        libelle: t('bienvenue.commencer'),
        onPress: () => {
          terminerBienvenue();
          router.replace('/accueil');
        },
      }}
    />
  );
}
