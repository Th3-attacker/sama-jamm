import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, StyleSheet, View } from 'react-native';

import { ecouter } from '@/features/ecouter/lecteur';
import { recitateur } from '@/features/ecouter/recitateurs';
import { CarteSourate } from '@/features/lire/CarteSourate';
import { sourates } from '@/features/lire/coran';
import { useParametre } from '@/hooks/useParametre';
import { useTheme } from '@/theme/useTheme';
import { Banner } from '@/ui/Banner';
import { TopBar } from '@/ui/TopBar';

/** Les 114 sourates d'un récitateur : toucher une sourate lance son écoute depuis le premier verset. */
export default function EcranRecitateur() {
  const { t } = useTranslation();
  const { couleurs, espace } = useTheme();
  const r = recitateur(useParametre('recitateur'));

  return (
    <View style={[styles.ecran, { backgroundColor: couleurs.fond }]}>
      <TopBar retour titre={r?.nom ?? t('ecouter.recitateur')} sousTitre={t('ecouter.sourates114')} />
      {r ? (
        <FlatList
          data={sourates}
          keyExtractor={(s) => String(s.n)}
          contentContainerStyle={{
            paddingHorizontal: espace.espace5,
            paddingBottom: espace.espace8,
            gap: espace.espace3,
          }}
          initialNumToRender={12}
          renderItem={({ item }) => (
            <CarteSourate
              sourate={item}
              onPress={() => {
                ecouter({ sourate: item.n, verset: 1 }, r.id);
                router.push('/ecouter/lecteur');
              }}
            />
          )}
        />
      ) : (
        <View style={{ padding: espace.espace5 }}>
          <Banner ton="erreur">{t('ecouter.recitateurInconnu')}</Banner>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  ecran: { flex: 1 },
});
