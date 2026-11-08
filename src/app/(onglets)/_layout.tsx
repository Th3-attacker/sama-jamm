import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { ErreurDeRoute } from '@/features/erreur/ErreurDeRoute';
import { MiniLecteur } from '@/features/ecouter/MiniLecteur';
import {
  ACCESSOIRE_NATIF,
  useDecalageBandeau,
  useMiniLecteurVisible,
} from '@/features/ecouter/placeMiniLecteur';
import { usePleinEcran } from '@/stores/pleinEcran';
import { useTheme } from '@/theme/useTheme';

/** Un onglet qui plante affiche l'écran d'erreur à sa place, sans fermer l'app. */
export const ErrorBoundary = ErreurDeRoute;

/**
 * Cinq onglets natifs (barre en verre sur iOS 26, barre Material sur Android) : le système dessine la barre,
 * l'onglet actif prend la teinte émeraude. Écouter est un mode de Lire. Le mini-lecteur est l'accessoire du bas.
 */
export default function OngletsLayout() {
  const { t } = useTranslation();
  const { couleurs } = useTheme();
  const pleinEcran = usePleinEcran((s) => s.actif);
  const miniVisible = useMiniLecteurVisible();
  const decalageBandeau = useDecalageBandeau();
  // Plein écran : le contenu défile derrière la barre ; chaque écran garde sa marge basse (`useMargeBasse`).
  const contentStyle = { backgroundColor: couleurs.fond };
  const manuel = Platform.OS === 'ios';

  return (
    <View style={{ flex: 1 }}>
      <NativeTabs tintColor={couleurs.emeraude} hidden={pleinEcran} labelStyle={{ fontSize: 10 }}>
        <NativeTabs.Trigger name='accueil' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'house', selected: 'house.fill' }}
            md='home'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.accueil')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='lire' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'book', selected: 'book.fill' }}
            md='menu_book'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.lire')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='priere' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon sf='clock' md='schedule' />
          <NativeTabs.Trigger.Label>
            {t('onglets.priere')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='budget' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf={{ default: 'wallet.pass', selected: 'wallet.pass.fill' }}
            md='account_balance_wallet'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.budget')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='plus' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon sf='square.grid.2x2' md='apps' />
          <NativeTabs.Trigger.Label>
            {t('onglets.plus')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        {ACCESSOIRE_NATIF && miniVisible ? (
          <NativeTabs.BottomAccessory>
            <MiniLecteur />
          </NativeTabs.BottomAccessory>
        ) : null}
      </NativeTabs>
      {!ACCESSOIRE_NATIF && miniVisible ? (
        <View
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: decalageBandeau,
          }}
        >
          <MiniLecteur />
        </View>
      ) : null}
    </View>
  );
}
