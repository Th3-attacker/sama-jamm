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
 * Onglets natifs : cinq sur Android et iOS 18 (Accueil, Lire, Prière, Budget, Plus) ; sur iOS 26 et plus, quatre
 * plus la Recherche séparée, Plus s'ouvrant en haut de l'Accueil. Le système dessine la barre,
 * l'onglet actif prend la teinte émeraude. Écouter est un mode de Lire. Le mini-lecteur est l'accessoire du bas.
 */
export default function OngletsLayout() {
  const { t } = useTranslation();
  const { couleurs, nom } = useTheme();
  // Badge de Plus : khatms en cours (masqué hors connexion ou sans khatm). Appelé sur toutes les plateformes : il
  // tient aussi à jour le nombre gardé pour le rappel quotidien et pour le badge du bouton Plus de l'Accueil (iOS 26).
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
        // Android : le nom de chaque onglet reste visible (le mode « auto » de Material ne garde que celui de l'onglet actif à 5 onglets).
        labelVisibilityMode="labeled"
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
        {/* iOS 26 et plus : pas d'onglet Plus, il s'ouvre par le bouton en haut de l'Accueil (/plus/menu, badge compris).
            Ni `hidden` ni une route sans déclencheur ne la laissent atteignable : expo-router redirige vers l'accueil. */}
        {ACCESSOIRE_NATIF ? null : (
          <NativeTabs.Trigger name='plus' contentStyle={contentStyle} disableAutomaticContentInsets={manuel}>
            <NativeTabs.Trigger.Icon sf='square.grid.2x2.fill' md='apps' />
            <NativeTabs.Trigger.Label>
              {t('onglets.plus')}
            </NativeTabs.Trigger.Label>
            <NativeTabs.Trigger.Badge hidden={!khatmsEnCours}>{String(khatmsEnCours ?? 0)}</NativeTabs.Trigger.Badge>
          </NativeTabs.Trigger>
        )}
        {/* iOS 26 et plus seulement : bouton de recherche séparé, à droite de la barre en verre. Android et iOS 18 restent à
            cinq onglets (limite de Material et de la barre compacte iOS, `role="search"` non documenté) et gardent la loupe
            vers /plus/recherche.
            Platform.OS ne change jamais en cours d'exécution : le rôle n'est pas modifié à chaud. Insets automatiques :
            l'écran a une barre de navigation native et une liste qui se décale seule. */}
        {ACCESSOIRE_NATIF ? (
          <NativeTabs.Trigger name='recherche' role='search' contentStyle={contentStyle}>
            <NativeTabs.Trigger.Icon sf='magnifyingglass' md='search' />
            <NativeTabs.Trigger.Label>
              {t('onglets.recherche')}
            </NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        ) : null}
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
            // Carte flottante : 8 au-dessus de la barre (écart déjà compté par la pile du bas).
            bottom: decalageBandeau + miseEnPage.ecartCouches,
          }}
        >
          <MiniLecteur flottant />
        </View>
      ) : null}
    </View>
    </ThemeProvider>
  );
}
