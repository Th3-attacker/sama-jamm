import { Linking } from 'react-native';
import { useTranslation } from 'react-i18next';

import { EcranErreur } from '@/ui/EcranErreur';

import { versionInstallee } from './useMiseAJour';
import type { ConsigneVersion } from './version';

/** Écran bloquant « Mise à jour nécessaire » : le seul geste possible est d'ouvrir le store. */
export function EcranMiseAJour({ consigne }: { consigne: ConsigneVersion }) {
  const { t } = useTranslation();
  return (
    <EcranErreur
      logo
      titre={t('etats.miseAJourTitre')}
      texte={t('etats.miseAJourTexte')}
      note={t('etats.miseAJourNote')}
      detail={t('etats.miseAJourVersions', { installee: versionInstallee ?? '?', minimum: consigne.minimum })}
      action={{
        libelle: t('etats.miseAJour'),
        icone: 'download',
        onPress: () => {
          Linking.openURL(consigne.magasin).catch((erreur: unknown) =>
            console.error('Store impossible à ouvrir', erreur),
          );
        },
      }}
    />
  );
}
