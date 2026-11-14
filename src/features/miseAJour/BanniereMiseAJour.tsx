import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';

import { useMiseAJourOta } from './useMiseAJourOta';

/** Bannière discrète « mise à jour prête » : l'utilisateur redémarre quand il veut, ou ignore (appliquée au prochain lancement). */
export function BanniereMiseAJour() {
  const { t } = useTranslation();
  const { espace } = useTheme();
  const insets = useSafeAreaInsets();
  const { prete, redemarrer, ignorer } = useMiseAJourOta();
  if (!prete) return null;
  return (
    <View
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: Math.max(insets.top, espace.espace2),
        start: espace.espace4,
        end: espace.espace4,
      }}>
      <Banner
        ton="info"
        icone="download"
        titre={t('etats.otaTitre')}
        action={{ label: t('etats.otaRedemarrer'), onPress: redemarrer }}
        onFermer={ignorer}>
        {t('etats.otaTexte')}
      </Banner>
    </View>
  );
}
