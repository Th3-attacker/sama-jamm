import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import { NativeTabs } from 'expo-router/native-tabs';
import { useTranslation } from 'react-i18next';
import { Platform, View } from 'react-native';

import { ErreurDeRoute } from '@/features/erreur/ErreurDeRoute';
import { MiniLecteur, MiniLecteurAccessoire } from '@/features/ecouter/MiniLecteur';
import {
  ACCESSOIRE_NATIF,
  useDecalageBandeau,
  useMiniLecteurVisible,
} from '@/features/ecouter/placeMiniLecteur';
import { useKhatmsEnCours } from '@/features/khatm/enCours';
import { usePleinEcran } from '@/stores/pleinEcran';
import { miseEnPage } from '@/theme/tokens.generated';
import { useTheme } from '@/theme/useTheme';
import { useWindowClass } from '@/theme/useWindowClass';

/** Un onglet qui plante affiche l'écran d'erreur à sa place, sans fermer l'app. */
export const ErrorBoundary = ErreurDeRoute;

/**
 * Cinq onglets natifs (barre en verre sur iOS 26, barre Material sur Android) : le système dessine la barre,
 * l'onglet actif prend la teinte émeraude. Écouter est un mode de Lire. Le mini-lecteur est l'accessoire du bas.
 */
export default function OngletsLayout() {
  const { t } = useTranslation();
  const { couleurs, nom } = useTheme();
  // Badge de Plus : khatms en cours (masqué hors connexion ou sans khatm).
  const khatmsEnCours = useKhatmsEnCours();
  const pleinEcran = usePleinEcran((s) => s.actif);
  const miniVisible = useMiniLecteurVisible();
  const decalageBandeau = useDecalageBandeau();
  // Plein écran : le contenu défile derrière la barre ; chaque écran garde sa marge basse (`useMargeBasse`).
  const contentStyle = { backgroundColor: couleurs.fond };
  const manuel = Platform.OS === 'ios';
  const { largeur } = useWindowClass();
  // iPad : barre en haut convertible en barre latérale dès que la largeur n'est plus compacte (design 18).
  const barreLaterale = Platform.OS === 'ios' && largeur !== 'compacte';
  const tailleLibelle = Platform.OS === 'ios' ? miseEnPage.libelleOngletIos : miseEnPage.libelleOngletAndroid;

  // iOS 26 : le verre de la barre prend son fond du thème de navigation (et non de backgroundColor). Sans
  // ce thème sombre, la barre reste claire en mode Nuit puis devient transparente.
  return (
    <ThemeProvider value={nom === 'jour' ? DefaultTheme : DarkTheme}>
    <View style={{ flex: 1 }}>
      <NativeTabs
        tintColor={couleurs.emeraude}
        // Android : fond de la planche. Sur iOS 26 le verre du système n'est pas remplacé par un aplat.
        backgroundColor={Platform.OS === 'android' ? couleurs.surface : undefined}
        badgeBackgroundColor={couleurs.or}
        badgeTextColor={couleurs.surOr}
        hidden={pleinEcran}
        // Jamais réduite : la marge basse des écrans suit toujours la hauteur réelle de la barre (écart au design 18).
        minimizeBehavior="never"
        sidebarAdaptable={barreLaterale}
        indicatorColor={couleurs.emeraudeDoux}
        // Android : onde tactile aux couleurs de la pastille, à la place du violet par défaut de Material.
        rippleColor={couleurs.emeraudeDoux}
        iconColor={{ default: couleurs.encre2, selected: couleurs.emeraude }}
        labelStyle={{
          default: { fontSize: tailleLibelle, fontWeight: '400', color: couleurs.encre2 },
          selected: { fontSize: tailleLibelle, fontWeight: '600', color: couleurs.emeraude },
        }}>
        <NativeTabs.Trigger name='accueil' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf='house.fill'
            md='home'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.accueil')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='lire' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf='book.fill'
            md='menu_book'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.lire')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='priere' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon sf='clock.fill' md='schedule' />
          <NativeTabs.Trigger.Label>
            {t('onglets.priere')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='budget' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon
            sf='creditcard.fill'
            md='account_balance_wallet'
          />
          <NativeTabs.Trigger.Label>
            {t('onglets.budget')}
          </NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name='plus' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
          <NativeTabs.Trigger.Icon sf='square.grid.2x2.fill' md='apps' />
          <NativeTabs.Trigger.Label>
            {t('onglets.plus')}
          </NativeTabs.Trigger.Label>
          <NativeTabs.Trigger.Badge hidden={!khatmsEnCours}>{String(khatmsEnCours ?? 0)}</NativeTabs.Trigger.Badge>
        </NativeTabs.Trigger>
        {ACCESSOIRE_NATIF && miniVisible ? (
          <NativeTabs.BottomAccessory>
            <MiniLecteurAccessoire />
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
    </ThemeProvider>
  );
}
