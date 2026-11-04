import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, Text, View } from 'react-native';

import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourates, type Sourate } from '@/features/lire/coran';
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

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar grand titre={t('lire.titre')} sousTitre={t('lire.sousTitre')} />

      <View style={[styles.contenu, { paddingHorizontal: espace.espace5, paddingBottom: espace.espace8, gap: espace.espace4 }]}>
        {/* Xassaïdes et invocations : les catégories sont annoncées, leur contenu arrive plus tard. */}
        <ListGroup>
          <ListItem titre={t('lire.xassaides')} valeur={t('lire.aVenir')} />
          <ListItem titre={t('lire.invocations')} sousTitre={t('lire.invocationsSousTitre')} valeur={t('lire.aVenir')} />
        </ListGroup>

        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={echelleMax.courant}
          style={[typographie.libelle, { color: couleurs.encre2, paddingHorizontal: espace.espace1 }]}>
          {t('lire.coran')}
        </Text>

        {/* 114 sourates : une carte par sourate, dans une FlatList. */}
        <FlatList
          data={sourates}
          keyExtractor={(s: Sourate) => String(s.n)}
          renderItem={({ item }) => <CarteSourate sourate={item} onPress={() => ouvrirSourate(item.n)} />}
          ItemSeparatorComponent={Separateur}
          contentContainerStyle={{ paddingBottom: espace.espace2 }}
          initialNumToRender={12}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
  contenu: { flex: 1 },
});
