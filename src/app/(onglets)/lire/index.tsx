import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourates, type Sourate } from '@/features/lire/coran';
import { useMenuPlus } from '@/features/plus/MenuPlus';
import { echelleMax } from '@/theme/typographie';
import { useTheme } from '@/theme/useTheme';
import { ListGroup } from '@/ui/ListGroup';
import { ListItem } from '@/ui/ListItem';
import { TopBar } from '@/ui/TopBar';

function Separateur() {
  const { espace } = useTheme();
  return <View style={{ height: espace.espace2 }} />;
}

function ouvrirSourate(n: number) {
  router.push({ pathname: '/lire/coran/[sourate]', params: { sourate: n } });
}

export default function Lire() {
  const { t } = useTranslation();
  const { couleurs, espace, typographie } = useTheme();
  const menu = useMenuPlus();

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar
        grand
        titre={t('lire.titre')}
        sousTitre={t('lire.sousTitre')}
        actions={[
          { icone: 'search', label: t('menuPlus.rechercher'), onPress: () => router.push('/plus/recherche') },
          menu.action,
        ]}
      />

      {/* Un seul défilement jusqu'à la barre des onglets : en-tête (xassaïdes, invocations), puis les 114 sourates. */}
      <FlatList
        data={sourates}
        keyExtractor={(s: Sourate) => String(s.n)}
        renderItem={({ item }) => <CarteSourate sourate={item} onPress={() => ouvrirSourate(item.n)} />}
        ItemSeparatorComponent={Separateur}
        ListHeaderComponent={
          <View style={{ gap: espace.espace4, paddingBottom: espace.espace4 }}>
            {/* Xassaïdes et invocations : les catégories sont annoncées, leur contenu arrive plus tard. */}
            <ListGroup>
              <ListItem titre={t('lire.xassaides')} valeur={t('lire.aVenir')} />
              <ListItem
                titre={t('lire.invocations')}
                sousTitre={t('lire.invocationsSousTitre')}
                valeur={t('lire.aVenir')}
              />
            </ListGroup>
            <Text
              accessibilityRole="header"
              maxFontSizeMultiplier={echelleMax.courant}
              style={[typographie.libelle, { color: couleurs.encre2, paddingHorizontal: espace.espace1 }]}>
              {t('lire.coran')}
            </Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: espace.espace5, paddingBottom: espace.espace8 }}
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews
      />
      {menu.feuille}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
