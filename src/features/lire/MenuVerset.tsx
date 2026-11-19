import { useTranslation } from 'react-i18next';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';

import type { VersetACopier } from './texteVerset';

type Props = {
  /** Verset touché longuement ; null : menu fermé. */
  verset: VersetACopier | null;
  /** Le verset est déjà dans les favoris : l'action devient « Retirer des favoris ». */
  favori: boolean;
  onFermer: () => void;
  onEcouter: () => void;
  onFavori: () => void;
  onCopier: () => void;
  onPartager: () => void;
};

/**
 * Menu d'un verset (appui long ; planche « 1.1 iOS · F1 · Appui long sur un verset ») : le verset en arabe seul sur un
 * voile, puis quatre actions. Le texte sacré n'est ni traduit ni tronqué (la carte défile s'il est long). Chaque
 * action ferme d'abord le menu.
 */
export function MenuVerset({ verset, favori, onFermer, onEcouter, onFavori, onCopier, onPartager }: Props) {
  const { t } = useTranslation();
  const { couleurs, espace, rayon, typographie } = useTheme();
  const insets = useSafeAreaInsets();
  const agir = (action: () => void) => () => {
    onFermer();
    action();
  };

  return (
    <Modal visible={verset !== null} transparent animationType="fade" onRequestClose={onFermer} statusBarTranslucent>
      {/* Voile : un toucher ferme le menu. */}
      <Pressable accessibilityRole="button" accessibilityLabel={t('commun.fermer')} onPress={onFermer} style={[styles.voile, { backgroundColor: couleurs.voile }]} />
      {verset ? (
        <View
          pointerEvents="box-none"
          style={[styles.contenu, { paddingTop: insets.top + espace.espace4, paddingBottom: insets.bottom + espace.espace4, paddingHorizontal: espace.espace5, gap: espace.espace3 }]}>
          <View
            style={[styles.carte, { backgroundColor: couleurs.surface, borderColor: couleurs.ligne, borderRadius: rayon.rayonFeuille, padding: espace.espace4, gap: espace.espace2 }]}>
            <Text maxFontSizeMultiplier={echelleMax.courant} style={[typographie.libelle, { color: couleurs.encre3 }]}>
              {`${verset.nomSourate} · ${verset.sourate}:${verset.n}`}
            </Text>
            <ScrollView>
              <Text
                accessibilityLanguage="ar"
                maxFontSizeMultiplier={echelleMax.grand}
                style={[typographie.coran, { color: couleurs.encre, textAlign: 'right', writingDirection: 'rtl', paddingHorizontal: espace.espace1 }]}>
                {verset.texte}
              </Text>
            </ScrollView>
          </View>
          <ListGroup>
            <ListItem icone="headphones" titre={t('ecouter.ecouterVerset')} onPress={agir(onEcouter)} />
            <ListItem icone="bookmark" titre={t(favori ? 'lire.favoriRetirer' : 'lire.favoriAjouter')} onPress={agir(onFavori)} />
            <ListItem icone="copy" titre={t('partage.copierTexte')} onPress={agir(onCopier)} />
            <ListItem icone="share" titre={t('partage.partagerImage')} onPress={agir(onPartager)} />
          </ListGroup>
        </View>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  voile: StyleSheet.absoluteFill,
  contenu: { flex: 1, justifyContent: 'center' },
  // La carte garde au plus la moitié de l'écran ; au-delà (verset très long), son texte défile.
  carte: { borderWidth: 1, maxHeight: '50%' },
});
